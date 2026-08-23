<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit; }

require __DIR__ . '/_conexao.php';
garantirEstruturaClube($mysqli); // cria a tabela comentarios se ainda não existir

// Comentários por aula, paginados (10 mais recentes por página por padrão).
// GET  ?aula_id=&page=&per_page=  -> { itens:[{id,nome,comentario,created_at}], total, page, pages }
// POST { email, nome, aula_id, comentario } -> INSERT
// Permanente: não é afetado por nenhum reset semanal (DesafioSemana etc.).
// `per_page` é opcional (default 10) — o widget "Dificuldade do dia"
// (DificuldadeDoDia.jsx) pede 7; ComentariosFeed.jsx não manda, fica em 10.
$metodo = $_SERVER['REQUEST_METHOD'];

if ($metodo === 'GET') {
    $aulaId = trim($_GET['aula_id'] ?? '') ?: 'geral';
    $page = max(1, intval($_GET['page'] ?? 1));
    // Clampa entre 1 e 50 pra ninguém pedir a tabela inteira numa página só.
    $porPagina = min(50, max(1, intval($_GET['per_page'] ?? 10)));
    $offset = ($page - 1) * $porPagina;

    $stmtTotal = $mysqli->prepare("SELECT COUNT(*) AS total FROM comentarios WHERE aula_id = ?");
    $stmtTotal->bind_param('s', $aulaId);
    $stmtTotal->execute();
    $total = (int) $stmtTotal->get_result()->fetch_assoc()['total'];
    $stmtTotal->close();

    $pages = max(1, (int) ceil($total / $porPagina));
    // page pedida além do fim (ex: comentário apagado direto no banco
    // reduziu o total) — devolve a última página válida em vez de vazio.
    if ($page > $pages) {
        $page = $pages;
        $offset = ($page - 1) * $porPagina;
    }

    $stmt = $mysqli->prepare(
        "SELECT id, email, nome, comentario, created_at FROM comentarios
         WHERE aula_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?"
    );
    $stmt->bind_param('sii', $aulaId, $porPagina, $offset);
    $stmt->execute();
    $res = $stmt->get_result();
    $itens = [];
    while ($row = $res->fetch_assoc()) {
        $itens[] = [
            'id' => (int) $row['id'],
            // email vai no payload só pro front decidir o badge/borda de
            // admin ou orientador (ComentariosFeed.jsx) — não é exibido cru.
            'email' => $row['email'],
            'nome' => $row['nome'] !== null && $row['nome'] !== '' ? $row['nome'] : 'Aluno',
            'comentario' => $row['comentario'],
            'created_at' => $row['created_at'], // já em horário de Brasília (SET time_zone em _conexao.php)
        ];
    }
    $stmt->close();

    echo json_encode(['ok' => true, 'itens' => $itens, 'total' => $total, 'page' => $page, 'pages' => $pages]);
    exit;
}

if ($metodo === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    $email = strtolower(trim($input['email'] ?? ''));
    $nome = trim($input['nome'] ?? '') ?: 'Aluno';
    $aulaId = trim($input['aula_id'] ?? '') ?: 'geral';
    $comentario = trim($input['comentario'] ?? '');

    if (!$email || $comentario === '') {
        http_response_code(400);
        echo json_encode(['erro' => 'email e comentario obrigatórios']);
        exit;
    }
    // Guarda-chuva contra abuso/erro de cliente — sem limite nenhum um POST
    // mal-formado poderia gravar um TEXT gigante sem aviso nenhum pro usuário.
    if (mb_strlen($comentario) > 2000) {
        $comentario = mb_substr($comentario, 0, 2000);
    }

    $stmt = $mysqli->prepare(
        "INSERT INTO comentarios (email, nome, aula_id, comentario) VALUES (?, ?, ?, ?)"
    );
    $stmt->bind_param('ssss', $email, $nome, $aulaId, $comentario);
    $stmt->execute();
    $novoId = $stmt->insert_id;
    $stmt->close();

    // Invalida o cache em disco do "Meditando junto" (pulso.php, cache de
    // 60s) — mesmo padrão de presenca.php pro ranking/pulso ao marcar
    // presença. Sem isso "partilhas hoje" só subiria depois do cache
    // expirar sozinho (até 60s), mesmo com o front pedindo refetch na hora.
    @unlink(sys_get_temp_dir() . '/comunidade_pulso_cache.json');

    echo json_encode(['ok' => true, 'id' => $novoId]);
    exit;
}

if ($metodo === 'DELETE') {
    // Excluir comentário — só admins/orientadores (lista fixa abaixo).
    // Esta API não tem $_SESSION nem cookie nenhum: o "login" da /comunidade
    // é 100% client-side (email salvo em localStorage, ver usuarioStorage.js),
    // não existe autenticação de verdade no servidor em nenhuma outra rota
    // aqui além do header X-Admin-Secret (que é só pro painel /admin, outro
    // caso de uso). Então o e-mail de quem está pedindo o DELETE vem do
    // próprio corpo da requisição, igual ao POST acima já faz — é permissão
    // de usuário como pedido, não um cofre: quem souber o endpoint e mandar
    // um desses e-mails no body consegue apagar comentário. Risco aceitável
    // pro que está em jogo (comentário de comunidade), mas não é uma
    // barreira de segurança forte — sinalizando aqui pra não confundir com
    // proteção real tipo ADMIN_SECRET.
    $admins = ['raphaelmellogarrido@gmail.com', 'rsp.ren@gmail.com'];

    $input = json_decode(file_get_contents('php://input'), true) ?: [];
    $id = intval($_GET['id'] ?? $input['id'] ?? 0);
    $emailSolicitante = strtolower(trim($input['email'] ?? $_GET['email'] ?? ''));

    if (!in_array($emailSolicitante, $admins, true)) {
        http_response_code(403);
        echo json_encode(['erro' => 'Sem permissão para excluir comentários']);
        exit;
    }

    if ($id <= 0) {
        http_response_code(400);
        echo json_encode(['erro' => 'id inválido']);
        exit;
    }

    $stmt = $mysqli->prepare("DELETE FROM comentarios WHERE id = ?");
    $stmt->bind_param('i', $id);
    $stmt->execute();
    $apagou = $stmt->affected_rows > 0;
    $stmt->close();

    echo json_encode(['ok' => true, 'apagado' => $apagou]);
    exit;
}

http_response_code(405);
echo json_encode(['erro' => 'Método não permitido']);
