<?php
// Lista o thread de mensagens privadas de UM aluno (Tarefa 2), ou só a
// contagem de não lidas (pro badge vermelho na sidebar).
//
// GET ?email=&apenas_contagem=1  -> { ok, naoLidas }
// GET ?email=                    -> { ok, itens:[{id,de_email,de_nome,de_avatar_url,para_email,mensagem,lida,created_at}] }
//
// Thread = toda mensagem em que este e-mail é remetente OU destinatário
// (hoje sempre entre o aluno e um dos 2 admins/orientador, mas a query não
// assume isso — funciona igual se um dia houver mais de um "atendente").
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit; }

require __DIR__ . '/../hotmart/_conexao.php';
garantirEstruturaClube($mysqli); // cria mensagens_privadas se ainda não existir

$email = strtolower(trim($_GET['email'] ?? ''));
if (!$email || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['erro' => 'email inválido']);
    exit;
}

if (!empty($_GET['apenas_contagem'])) {
    $stmt = $mysqli->prepare("SELECT COUNT(*) AS total FROM mensagens_privadas WHERE para_email = ? AND lida = 0");
    $stmt->bind_param('s', $email);
    $stmt->execute();
    $naoLidas = (int) $stmt->get_result()->fetch_assoc()['total'];
    $stmt->close();

    echo json_encode(['ok' => true, 'naoLidas' => $naoLidas]);
    exit;
}

// LEFT JOIN alunos pelo de_email pra trazer nome/foto ATUAIS do remetente —
// mesmo padrão de comentarios.php (avatar_versao) e mesma razão: se o
// remetente (admin, orientador ou aluno) trocar o nome/foto em
// /configurações depois, o thread já mostra o valor novo, sem precisar
// gravar nada congelado em mensagens_privadas. LEFT (não INNER) porque o
// remetente pode ter sido removido de `alunos` — nesse caso de_nome cai no
// fallback 'Equipe' abaixo. Nunca hardcoda "Administrador": os dois emails
// de equipe (EMAIL_ADMINISTRADOR/EMAIL_ORIENTADOR, ver ComentarioCard.jsx)
// têm registro em `alunos` como qualquer aluno, então o nome real (ex:
// "Raphael", "reN") já sai direto da coluna alunos.nome.
$stmt = $mysqli->prepare(
    "SELECT mp.id, mp.de_email, mp.para_email, mp.mensagem, mp.lida, mp.created_at,
            a.nome AS de_nome, a.avatar_versao AS de_avatar_versao
     FROM mensagens_privadas mp
     LEFT JOIN alunos a ON a.email = mp.de_email
     WHERE mp.de_email = ? OR mp.para_email = ?
     ORDER BY mp.created_at ASC"
);
$stmt->bind_param('ss', $email, $email);
$stmt->execute();
$res = $stmt->get_result();
$itens = [];
while ($row = $res->fetch_assoc()) {
    $itens[] = [
        'id' => (int) $row['id'],
        'de_email' => $row['de_email'],
        'de_nome' => $row['de_nome'] !== null && $row['de_nome'] !== '' ? $row['de_nome'] : 'Equipe',
        // avatarUrlPublica (_conexao.php) monta a URL a partir de
        // avatar_versao — null quando o remetente nunca subiu foto (front
        // cai nas iniciais do nome real, não mais num avatar genérico).
        'de_avatar_url' => avatarUrlPublica($row['de_email'], $row['de_avatar_versao']),
        'para_email' => $row['para_email'],
        'mensagem' => $row['mensagem'],
        'lida' => (bool) $row['lida'],
        'created_at' => $row['created_at'], // já em horário de Brasília (SET time_zone em _conexao.php)
    ];
}
$stmt->close();

echo json_encode(['ok' => true, 'itens' => $itens]);
