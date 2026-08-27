<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit; }

require __DIR__ . '/_conexao.php';
garantirEstruturaClube($mysqli); // cria a tabela comentarios se ainda não existir

// Mesma lista fixa usada no DELETE mais abaixo — extraída pra cá também pro
// filtro de visibilidade 'orientador' do GET (só quem está nesta lista
// enxerga partilhas marcadas como "só orientador").
$ADMINS_CLUBE = ['raphaelmellogarrido@gmail.com', 'rsp.ren@gmail.com'];

// Comentários por aula, paginados (10 mais recentes por página por padrão).
// GET  ?aula_id=&page=&per_page=  -> { itens:[{id,nome,comentario,created_at,respostas:[...]}], total, page, pages }
// POST { email, nome, aula_id, comentario, parent_id?, image_token? } -> INSERT
// image_token vem de upload-imagem-comentario.php (staging em
// comentario_imagens_pendentes, ver _conexao.php) — migra o blob pra
// comentarios.image_blob na hora do INSERT.
// Permanente: não é afetado por nenhum reset semanal (DesafioSemana etc.).
// `per_page` é opcional (default 10) — o widget "Dificuldade do dia"
// (DificuldadeDoDia.jsx) pede 7; ComentariosFeed.jsx não manda, fica em 10.
//
// Respostas (Tarefa 1, botão "Responder"): a paginação/total/hasMore contam
// só comentários RAIZ (parent_id IS NULL) — cada item raiz já vem com suas
// respostas embutidas em `respostas` (sem paginação própria, comentário não
// costuma ter tanta resposta a ponto de precisar). Uma resposta nunca
// aparece solta na lista principal.
$metodo = $_SERVER['REQUEST_METHOD'];

if ($metodo === 'GET') {
    $inicio = microtime(true);
    $aulaId = trim($_GET['aula_id'] ?? '') ?: 'geral';
    // Opcional — só usado pra "minhaReacao" abaixo (ver bloco de reações),
    // nunca pra checagem de permissão. Ausente = todo mundo vê minhaReacao
    // sempre null (mesmo comportamento de antes desta feature).
    $emailAtual = strtolower(trim($_GET['email'] ?? ''));
    // Toggle "Público/Privado/Orientador" (DificuldadeDoDia.jsx) — decide
    // aqui, uma vez, se quem está pedindo enxerga partilhas marcadas
    // 'orientador'; usado nas duas queries abaixo (COUNT e SELECT). Vazio
    // (sessão ainda não resolveu email) nunca é admin/orientador.
    $souAdminOuOrientador = $emailAtual !== '' && in_array($emailAtual, $ADMINS_CLUBE, true) ? 1 : 0;
    // Aplicado só nos comentários RAIZ (parent_id IS NULL) — respostas não
    // têm visibilidade própria (sempre 'publico'), a privacidade delas vem
    // de tabela pai: só são buscadas pra ids que já passaram por este
    // mesmo filtro (ver query de respostas mais abaixo, `WHERE parent_id IN
    // ($idsRaiz)`), então uma resposta a um comentário privado/orientador
    // já fica escondida de quem não devia ver o pai, sem precisar filtrar
    // ela também. 'publico'/NULL cobre tanto partilha nova quanto qualquer
    // linha antiga de antes desta coluna existir (DEFAULT 'publico' cobre
    // isso também, o NULL aqui é só defensivo).
    // 'orientador' é visível pro AUTOR também, não só pra quem está na lista
    // de admins/orientadores (pedido do cliente, 27/08: "quero que apareça
    // pra pessoa que postou e também pro orientador, não somente pro
    // orientador") — daí o `OR email = ?` extra dentro do último grupo.
    $condVisibilidade = "(visibilidade = 'publico' OR visibilidade IS NULL OR (visibilidade = 'privado' AND email = ?) OR (visibilidade = 'orientador' AND (? = 1 OR email = ?)))";
    // Mesma condição, só com o alias `c.` do JOIN — usada no SELECT logo
    // abaixo (o COUNT acima não tem alias, é direto na tabela).
    $condVisibilidadeC = "(c.visibilidade = 'publico' OR c.visibilidade IS NULL OR (c.visibilidade = 'privado' AND c.email = ?) OR (c.visibilidade = 'orientador' AND (? = 1 OR c.email = ?)))";

    // Dois jeitos de pedir página no mesmo endpoint: `page`/`per_page` (usado
    // por ComentariosFeed.jsx, mural "Comentários" em Aulas, paginação 1/3
    // de verdade) e `limit`/`offset` (usado por DificuldadeDoDia.jsx desde
    // que virou scroll infinito estilo Instagram — 20 comentários iniciais,
    // +10 a cada vez que o sentinel entra na tela). Detecta pelo que veio na
    // query; os dois só precisam chegar em $limite/$offset no fim.
    $modoOffset = isset($_GET['limit']) || isset($_GET['offset']);
    if ($modoOffset) {
        // Mesmo clamp de 1-50 do per_page abaixo — ninguém pede a tabela
        // inteira de uma vez só trocando o limit da query string.
        $limite = min(50, max(1, intval($_GET['limit'] ?? 10)));
        $offset = max(0, intval($_GET['offset'] ?? 0));
    } else {
        $page = max(1, intval($_GET['page'] ?? 1));
        // Clampa entre 1 e 50 pra ninguém pedir a tabela inteira numa página só.
        $limite = min(50, max(1, intval($_GET['per_page'] ?? 10)));
        $offset = ($page - 1) * $limite;
    }

    $stmtTotal = $mysqli->prepare("SELECT COUNT(*) AS total FROM comentarios WHERE aula_id = ? AND parent_id IS NULL AND $condVisibilidade");
    $stmtTotal->bind_param('ssis', $aulaId, $emailAtual, $souAdminOuOrientador, $emailAtual);
    $stmtTotal->execute();
    $total = (int) $stmtTotal->get_result()->fetch_assoc()['total'];
    $stmtTotal->close();

    $pages = max(1, (int) ceil($total / $limite));
    $page = (int) floor($offset / $limite) + 1;
    // page pedida além do fim (ex: comentário apagado direto no banco
    // reduziu o total) — devolve a última página válida em vez de vazio.
    // Só se aplica no modo page/per_page: no modo limit/offset (scroll
    // infinito) quem decide quando parar é o `hasMore` da resposta, um
    // offset "no vazio" só devolve itens=[] sem erro nenhum.
    if (!$modoOffset && $page > $pages) {
        $page = $pages;
        $offset = ($page - 1) * $limite;
    }

    // LEFT JOIN alunos pelo email pra trazer o avatar_url ATUAL do autor
    // (não o congelado no momento do comentário) — se o aluno trocar de
    // foto depois, comentários antigos também mostram a foto nova. LEFT (não
    // INNER) porque o autor pode ter sido removido de `alunos` e o
    // comentário continua existindo; nesse caso avatar_url só vem null.
    // ORDER BY c.created_at DESC, c.id DESC — created_at é DATETIME (granularidade
    // de segundo, ver _conexao.php); dois comentários no mesmo segundo empatam e o
    // MySQL não garante ordem estável entre empates. Sem o `id DESC` como
    // desempate, um refetch (ex: logo após um admin excluir um comentário, ver
    // handleExcluir em DificuldadeDoDia.jsx) podia devolver os empatados em ordem
    // diferente do fetch anterior — parecia "apareceu um comentário aleatório no
    // lugar do que eu excluí", quando na real era só reordenação do mesmo lote.
    // `id` é auto-increment e único, então desempata sempre igual (mais recente
    // primeiro = id maior primeiro, mesmo sentido do created_at DESC).
    $stmt = $mysqli->prepare(
        "SELECT c.id, c.email, c.nome, c.comentario, c.image_url, c.image_mime, c.visibilidade, c.created_at, a.avatar_versao
         FROM comentarios c
         LEFT JOIN alunos a ON a.email = c.email
         WHERE c.aula_id = ? AND c.parent_id IS NULL AND $condVisibilidadeC
         ORDER BY c.created_at DESC, c.id DESC LIMIT ? OFFSET ?"
    );
    $stmt->bind_param('ssisii', $aulaId, $emailAtual, $souAdminOuOrientador, $emailAtual, $limite, $offset);
    $stmt->execute();
    $res = $stmt->get_result();
    $itens = [];
    $idsRaiz = [];
    while ($row = $res->fetch_assoc()) {
        $idsRaiz[] = (int) $row['id'];
        $itens[(int) $row['id']] = [
            'id' => (int) $row['id'],
            // email vai no payload só pro front decidir o badge/borda de
            // admin ou orientador (ComentariosFeed.jsx) — não é exibido cru.
            'email' => $row['email'],
            'nome' => $row['nome'] !== null && $row['nome'] !== '' ? $row['nome'] : 'Aluno',
            'comentario' => $row['comentario'],
            // null quando o comentário não tem foto — front (ComentarioCard.jsx)
            // só mostra o quadradinho/lightbox se isso vier truthy.
            // Prioriza image_mime (foto nova, guardada em BLOB no banco —
            // ver comentarios image_blob/imagem-comentario.php, bug 26/08:
            // arquivo em disco sumia a cada deploy). image_url legado só
            // sobra pra comentários antigos, de antes dessa migração (já
            // quebrado hoje mesmo — sem regressão, o front já esconde foto
            // quebrada via onError em ComentarioCard.jsx).
            'image_url' => $row['image_mime'] ? ('/api/hotmart/imagem-comentario.php?id=' . $row['id']) : ($row['image_url'] ?: null),
            // null quando o autor não tem foto de perfil — front mostra as
            // iniciais nesse caso (mesmo fallback de image_url acima).
            // avatarUrlPublica (_conexao.php) monta a URL a partir de
            // avatar_versao — ver bug reportado 25/08 (foto em BLOB).
            'avatar_url' => avatarUrlPublica($row['email'], $row['avatar_versao']),
            // 'publico' (default)/'privado'/'orientador' — front (ComentarioCard.jsx)
            // usa isso só pra mostrar um selinho discreto pro AUTOR lembrar que
            // aquela partilha não é pública; já chega filtrada certo daqui
            // (só quem pode ver um item o recebe nesta resposta).
            'visibilidade' => $row['visibilidade'] ?: 'publico',
            'created_at' => $row['created_at'], // já em horário de Brasília (SET time_zone em _conexao.php)
            // Preenchido no bloco de reações abaixo (agregado em lote junto
            // com o dos ids de resposta) — placeholder aqui só garante a
            // chave existir mesmo se a query de reações falhar por algum motivo.
            'reacoes' => ['🙏' => 0, '❤️' => 0, '🔥' => 0],
            'minhaReacao' => null,
            'respostas' => [],
        ];
    }
    $stmt->close();

    // Busca as respostas de todos os comentários raiz desta página numa
    // query só (evita N+1) — ASC pra já vir em ordem cronológica de leitura,
    // diferente da lista raiz (DESC, mais recente primeiro).
    // Junta raiz + respostas (respostas entram no loop abaixo) — usado pelo
    // bloco de reações mais abaixo pra agregar tudo numa query só (evita N+1
    // de novo, mesmo espírito da busca de respostas em lote acima).
    $todosIds = $idsRaiz;

    if ($idsRaiz) {
        $placeholders = implode(',', array_fill(0, count($idsRaiz), '?'));
        $tipos = str_repeat('i', count($idsRaiz));
        // Mesmo desempate por `id` do SELECT raiz acima, aqui em ASC (ordem
        // cronológica de leitura das respostas).
        $stmtResp = $mysqli->prepare(
            "SELECT c.id, c.parent_id, c.email, c.nome, c.comentario, c.image_url, c.image_mime, c.created_at, a.avatar_versao
             FROM comentarios c
             LEFT JOIN alunos a ON a.email = c.email
             WHERE c.parent_id IN ($placeholders) ORDER BY c.created_at ASC, c.id ASC"
        );
        $stmtResp->bind_param($tipos, ...$idsRaiz);
        $stmtResp->execute();
        $resResp = $stmtResp->get_result();
        while ($row = $resResp->fetch_assoc()) {
            $paiId = (int) $row['parent_id'];
            if (!isset($itens[$paiId])) continue;
            $respostaId = (int) $row['id'];
            $todosIds[] = $respostaId;
            $itens[$paiId]['respostas'][] = [
                'id' => $respostaId,
                'parent_id' => $paiId,
                'email' => $row['email'],
                'nome' => $row['nome'] !== null && $row['nome'] !== '' ? $row['nome'] : 'Aluno',
                'comentario' => $row['comentario'],
                // Mesma lógica image_mime > image_url legado do bloco raiz acima.
                'image_url' => $row['image_mime'] ? ('/api/hotmart/imagem-comentario.php?id=' . $row['id']) : ($row['image_url'] ?: null),
                'avatar_url' => avatarUrlPublica($row['email'], $row['avatar_versao']),
                'created_at' => $row['created_at'],
                // Mesmo placeholder do item raiz acima — preenchido no bloco
                // de reações logo abaixo.
                'reacoes' => ['🙏' => 0, '❤️' => 0, '🔥' => 0],
                'minhaReacao' => null,
            ];
        }
        $stmtResp->close();
    }

    // Reações (🙏 ❤️ 🔥) de TODOS os itens desta página (raiz + respostas)
    // numa query só (evita N+1, mesmo espírito da busca de respostas acima).
    if ($todosIds) {
        $placeholdersReacoes = implode(',', array_fill(0, count($todosIds), '?'));
        $tiposReacoes = str_repeat('i', count($todosIds));

        $stmtContagens = $mysqli->prepare(
            "SELECT comentario_id, emoji, COUNT(*) AS n FROM comentario_reacoes
             WHERE comentario_id IN ($placeholdersReacoes) GROUP BY comentario_id, emoji"
        );
        $stmtContagens->bind_param($tiposReacoes, ...$todosIds);
        $stmtContagens->execute();
        $resContagens = $stmtContagens->get_result();
        $contagensPorId = [];
        while ($row = $resContagens->fetch_assoc()) {
            $contagensPorId[(int) $row['comentario_id']][$row['emoji']] = (int) $row['n'];
        }
        $stmtContagens->close();

        $minhaPorId = [];
        if ($emailAtual !== '') {
            $stmtMinhas = $mysqli->prepare(
                "SELECT comentario_id, emoji FROM comentario_reacoes
                 WHERE comentario_id IN ($placeholdersReacoes) AND email = ?"
            );
            $tiposMinhas = $tiposReacoes . 's';
            $paramsMinhas = $todosIds;
            $paramsMinhas[] = $emailAtual;
            $stmtMinhas->bind_param($tiposMinhas, ...$paramsMinhas);
            $stmtMinhas->execute();
            $resMinhas = $stmtMinhas->get_result();
            while ($row = $resMinhas->fetch_assoc()) {
                $minhaPorId[(int) $row['comentario_id']] = $row['emoji'];
            }
            $stmtMinhas->close();
        }

        // Aplica em $itens (raiz) e dentro de cada respostas[] — dois lugares
        // porque respostas não são um array plano separado, ver estrutura
        // montada acima.
        foreach ($itens as &$raiz) {
            if (isset($contagensPorId[$raiz['id']])) {
                $raiz['reacoes'] = array_merge($raiz['reacoes'], $contagensPorId[$raiz['id']]);
            }
            if (isset($minhaPorId[$raiz['id']])) $raiz['minhaReacao'] = $minhaPorId[$raiz['id']];
            foreach ($raiz['respostas'] as &$resposta) {
                if (isset($contagensPorId[$resposta['id']])) {
                    $resposta['reacoes'] = array_merge($resposta['reacoes'], $contagensPorId[$resposta['id']]);
                }
                if (isset($minhaPorId[$resposta['id']])) $resposta['minhaReacao'] = $minhaPorId[$resposta['id']];
            }
            unset($resposta);
        }
        unset($raiz);
    }

    // Reordena de volta pra DESC (a chave por id em $itens acima não
    // preserva a ordem de inserção depois de misturar com o array_fill) e
    // descarta as chaves numéricas (json_encode precisa de lista, não de
    // objeto, senão vira {"5":{...}} no JSON em vez de [...]).
    $itens = array_values(array_map(fn($id) => $itens[$id], $idsRaiz));

    // hasMore: ainda existe algo depois deste lote — é o que o front do
    // scroll infinito usa pra saber se continua observando o sentinel ou
    // mostra "Você chegou ao fim" (ComentariosFeed.jsx com page/pages
    // continua ignorando esse campo, não quebra nada pra ele).
    $hasMore = ($offset + count($itens)) < $total;

    $duracaoMs = round((microtime(true) - $inicio) * 1000);
    if ($duracaoMs > 300) {
        error_log("[timing] comentarios.php GET (aula_id={$aulaId}): {$duracaoMs}ms");
    }

    echo json_encode(['ok' => true, 'itens' => $itens, 'total' => $total, 'page' => $page, 'pages' => $pages, 'hasMore' => $hasMore]);
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

    // Foto opcional (upload já feito antes por upload-imagem-comentario.php,
    // que devolve um token — bytes ficam em staging, comentario_imagens_pendentes,
    // até aqui). image_token só é aceito no formato exato que aquele endpoint
    // gera (32 chars hex) — qualquer outra coisa é ignorada, nunca faz SELECT
    // com valor arbitrário mandado no corpo do POST. Token que não bate com
    // nenhuma linha de staging (expirado pela limpeza de 1h, ou reenvio do
    // mesmo token) simplesmente vira comentário sem foto, sem erro.
    $imageBlobParam = null;
    $imageMimeParam = null;
    $imageToken = trim($input['image_token'] ?? '');
    if ($imageToken !== '' && preg_match('#^[a-f0-9]{32}$#', $imageToken)) {
        $stmtStaging = $mysqli->prepare("SELECT image_blob, image_mime FROM comentario_imagens_pendentes WHERE token = ?");
        $stmtStaging->bind_param('s', $imageToken);
        $stmtStaging->execute();
        $stmtStaging->bind_result($imageBlobParam, $imageMimeParam);
        $stmtStaging->fetch();
        $stmtStaging->close();
    }

    // parent_id opcional (botão "Responder", Tarefa 1) — resposta a um
    // comentário existente. 0/negativo/ausente = comentário raiz normal.
    // Não valida se o pai existe de verdade (mesmo espírito "leve" do resto
    // desta API, sem FK): um id inválido só resulta numa resposta que nunca
    // aparece aninhada em lugar nenhum (comentarios.php GET só busca
    // respostas dos ids raiz que ele mesmo devolveu).
    $parentId = intval($input['parent_id'] ?? 0);
    $parentIdParam = $parentId > 0 ? $parentId : null;

    // Toggle "Público/Privado/Orientador" (DificuldadeDoDia.jsx) — qualquer
    // valor fora da lista (campo ausente, adulterado, resposta que não manda
    // o campo) cai no default seguro 'publico', mesmo comportamento de
    // sempre. Nunca confia só no <select> do front pra travar isso.
    $visibilidadesValidas = ['publico', 'privado', 'orientador'];
    $visibilidade = trim($input['visibilidade'] ?? 'publico');
    if (!in_array($visibilidade, $visibilidadesValidas, true)) $visibilidade = 'publico';

    $stmt = $mysqli->prepare(
        "INSERT INTO comentarios (email, nome, aula_id, comentario, image_blob, image_mime, parent_id, visibilidade) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
    );
    $stmt->bind_param('ssssssis', $email, $nome, $aulaId, $comentario, $imageBlobParam, $imageMimeParam, $parentIdParam, $visibilidade);
    $stmt->execute();
    $novoId = $stmt->insert_id;
    $stmt->close();

    // Migração pra image_blob acima já copiou os bytes — apaga a linha de
    // staging (se existia) pra não acumular lixo esperando a limpeza de 1h.
    if ($imageToken !== '' && $imageBlobParam !== null) {
        $stmtLimpa = $mysqli->prepare("DELETE FROM comentario_imagens_pendentes WHERE token = ?");
        $stmtLimpa->bind_param('s', $imageToken);
        $stmtLimpa->execute();
        $stmtLimpa->close();
    }

    // Invalida o cache em disco do "Meditando junto" (pulso.php, cache de
    // 60s) — mesmo padrão de presenca.php pro ranking/pulso ao marcar
    // presença. Sem isso "partilhas hoje" só subiria depois do cache
    // expirar sozinho (até 60s), mesmo com o front pedindo refetch na hora.
    @unlink(sys_get_temp_dir() . '/comunidade_pulso_cache.json');

    echo json_encode(['ok' => true, 'id' => $novoId]);
    exit;
}

if ($metodo === 'PUT') {
    // Editar comentário e/ou trocar a visibilidade (pedido do cliente,
    // 26/08: texto, "como em rede social"; 27/08: visibilidade, "se a
    // pessoa criou um post privado, ela pode mudar pra público quando ela
    // quiser") — hoje só chamado por DificuldadeDoDia.jsx / "Sua prática
    // hoje" (ver handleEditar/handleAlterarVisibilidade lá). Diferente do
    // DELETE acima, aqui NÃO existe exceção pra admin/orientador: as duas
    // edições são SEMPRE só do próprio dono, sem lista de admins envolvida.
    // Mesmo espírito "sem autenticação real" documentado no DELETE — o email
    // de quem pede vem do corpo da requisição, não de sessão/cookie.
    $input = json_decode(file_get_contents('php://input'), true) ?: [];
    $id = intval($_GET['id'] ?? $input['id'] ?? 0);
    $emailSolicitante = strtolower(trim($input['email'] ?? ''));
    // Os dois campos são opcionais e independentes — o front manda só um por
    // vez hoje (editar texto OU trocar visibilidade), mas o endpoint aceita
    // qualquer combinação sem exigir o outro junto.
    $temComentario = array_key_exists('comentario', $input);
    $temVisibilidade = array_key_exists('visibilidade', $input);
    $comentario = $temComentario ? trim($input['comentario']) : null;
    $visibilidade = $temVisibilidade ? trim($input['visibilidade']) : null;

    if ($id <= 0 || $emailSolicitante === '' || (!$temComentario && !$temVisibilidade) || ($temComentario && $comentario === '')) {
        http_response_code(400);
        echo json_encode(['erro' => 'id, email e ao menos um de comentario/visibilidade são obrigatórios']);
        exit;
    }
    // Mesma lista fixa aceita no POST acima — aqui um valor fora dela é
    // rejeitado (400) em vez de cair num default silencioso: um PUT com
    // visibilidade inválida é sinal de bug no cliente, não uma escolha
    // legítima de usuário como no POST.
    if ($temVisibilidade && !in_array($visibilidade, ['publico', 'privado', 'orientador'], true)) {
        http_response_code(400);
        echo json_encode(['erro' => 'visibilidade inválida']);
        exit;
    }
    // Limite de 140 chars — mesmo LIMITE_TEXTO do textarea em
    // DificuldadeDoDia.jsx, único lugar que hoje chama este endpoint. Nunca
    // confia só no maxLength do front: um PUT direto (sem passar pela UI)
    // ainda cairia aqui. Se um dia o mural "geral" (ComentariosFeed.jsx,
    // limite de 2000 no POST acima) ganhar edição também, este cap fixo
    // precisa virar condicional por aula_id.
    if ($temComentario && mb_strlen($comentario) > 140) {
        $comentario = mb_substr($comentario, 0, 140);
    }

    $stmtAutor = $mysqli->prepare("SELECT email FROM comentarios WHERE id = ?");
    $stmtAutor->bind_param('i', $id);
    $stmtAutor->execute();
    $autor = $stmtAutor->get_result()->fetch_assoc();
    $stmtAutor->close();

    if (!$autor) {
        http_response_code(404);
        echo json_encode(['erro' => 'Comentário não encontrado']);
        exit;
    }

    $emailAutor = strtolower(trim($autor['email']));
    if ($emailAutor !== $emailSolicitante) {
        http_response_code(403);
        echo json_encode(['erro' => 'Sem permissão para editar este comentário']);
        exit;
    }

    // Monta o SET dinamicamente — só os campos que vieram no corpo, pra um
    // PUT que só troca visibilidade não sobrescrever o texto (e vice-versa).
    $campos = [];
    $tipos = '';
    $valores = [];
    if ($temComentario) {
        $campos[] = 'comentario = ?';
        $tipos .= 's';
        $valores[] = $comentario;
    }
    if ($temVisibilidade) {
        $campos[] = 'visibilidade = ?';
        $tipos .= 's';
        $valores[] = $visibilidade;
    }
    $tipos .= 'i';
    $valores[] = $id;

    $stmt = $mysqli->prepare('UPDATE comentarios SET ' . implode(', ', $campos) . ' WHERE id = ?');
    $stmt->bind_param($tipos, ...$valores);
    $stmt->execute();
    $stmt->close();

    $resposta = ['ok' => true];
    if ($temComentario) $resposta['comentario'] = $comentario;
    if ($temVisibilidade) $resposta['visibilidade'] = $visibilidade;
    echo json_encode($resposta);
    exit;
}

if ($metodo === 'DELETE') {
    // Excluir comentário — admins/orientadores (lista fixa abaixo) apagam
    // QUALQUER comentário; um aluno normal só apaga o PRÓPRIO (pedido do
    // cliente, 26/08: antes só a lista fixa podia excluir, ninguém mais —
    // agora compara o email de quem pede com o email do AUTOR do comentário
    // no banco, não confia em nada que o front mande além do id).
    // Esta API não tem $_SESSION nem cookie nenhum: o "login" da /comunidade
    // é 100% client-side (email salvo em localStorage, ver usuarioStorage.js),
    // não existe autenticação de verdade no servidor em nenhuma outra rota
    // aqui além do header X-Admin-Secret (que é só pro painel /admin, outro
    // caso de uso). Então o e-mail de quem está pedindo o DELETE vem do
    // próprio corpo da requisição, igual ao POST acima já faz — é permissão
    // de usuário como pedido, não um cofre: quem souber o endpoint e mandar
    // um e-mail alheio no body se passa por outro autor. Risco aceitável pro
    // que está em jogo (comentário de comunidade), mas não é uma barreira de
    // segurança forte — sinalizando aqui pra não confundir com proteção real
    // tipo ADMIN_SECRET.
    $input = json_decode(file_get_contents('php://input'), true) ?: [];
    $id = intval($_GET['id'] ?? $input['id'] ?? 0);
    $emailSolicitante = strtolower(trim($input['email'] ?? $_GET['email'] ?? ''));

    if ($id <= 0) {
        http_response_code(400);
        echo json_encode(['erro' => 'id inválido']);
        exit;
    }

    $souAdmin = in_array($emailSolicitante, $ADMINS_CLUBE, true);
    if (!$souAdmin) {
        // Não-admin: só pode se for o dono. Busca o autor no banco (nunca
        // confia num "sou o autor" que viesse do front) — id inexistente
        // aqui vira 404 mais abaixo, não 403.
        $stmtAutor = $mysqli->prepare("SELECT email FROM comentarios WHERE id = ?");
        $stmtAutor->bind_param('i', $id);
        $stmtAutor->execute();
        $autor = $stmtAutor->get_result()->fetch_assoc();
        $stmtAutor->close();

        $emailAutor = $autor ? strtolower(trim($autor['email'])) : null;
        $souAutor = $emailSolicitante !== '' && $emailAutor !== null && $emailAutor === $emailSolicitante;

        if (!$souAutor) {
            http_response_code(403);
            echo json_encode(['erro' => 'Sem permissão para excluir este comentário']);
            exit;
        }
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
