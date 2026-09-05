<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit; }

require __DIR__ . '/_conexao.php';
garantirEstruturaClube($mysqli); // cria a tabela comentario_reacoes se ainda não existir

// Reação rápida (🙏 ❤️ 🔥) num comentário/resposta de "Sua prática hoje" —
// endpoint separado de comentarios.php (mesmo espírito de sibling-endpoint de
// upload-imagem-comentario.php) pra não engordar o arquivo principal.
// POST { comentario_id, email, emoji } -> alterna a reação:
//   - já tinha ESSE emoji nesse comentário -> remove (toggle off)
//   - tinha outro emoji, ou nenhum -> grava/troca pra este
// Sempre 1 reação por pessoa por comentário (UNIQUE comentario_id+email na
// tabela, ver _conexao.php) — nunca "empilha" mais de um emoji da mesma
// pessoa no mesmo comentário.
// Mesmo "sem autenticação real" já documentado em comentarios.php: email vem
// do corpo da requisição, não de sessão/cookie — não é uma barreira de
// segurança forte, é permissão de usuário como pedido.
// Resposta sempre devolve o estado agregado ATUAL do comentário (contagens +
// minhaReacao), nunca "adivinhado" no front — cobre a corrida de duas abas/
// dispositivos reagindo quase ao mesmo tempo.
$metodo = $_SERVER['REQUEST_METHOD'];

if ($metodo !== 'POST') {
    http_response_code(405);
    echo json_encode(['erro' => 'Método não permitido']);
    exit;
}

// Mesma lista fixa que ComentarioCard.jsx oferece — qualquer outro valor
// mandado direto no body (fora da UI) é rejeitado, nunca gravado cru.
$EMOJIS_VALIDOS = ['🙏', '❤️', '🔥'];

$input = json_decode(file_get_contents('php://input'), true) ?: [];
$comentarioId = intval($input['comentario_id'] ?? 0);
$email = strtolower(trim($input['email'] ?? ''));
$emoji = trim($input['emoji'] ?? '');

if ($comentarioId <= 0 || $email === '' || !in_array($emoji, $EMOJIS_VALIDOS, true)) {
    http_response_code(400);
    echo json_encode(['erro' => 'comentario_id, email e emoji (🙏, ❤️ ou 🔥) obrigatórios']);
    exit;
}

$stmtAtual = $mysqli->prepare("SELECT emoji FROM comentario_reacoes WHERE comentario_id = ? AND email = ?");
$stmtAtual->bind_param('is', $comentarioId, $email);
$stmtAtual->execute();
$atual = $stmtAtual->get_result()->fetch_assoc();
$stmtAtual->close();

if ($atual && $atual['emoji'] === $emoji) {
    // Mesmo emoji de novo -> remove.
    $stmt = $mysqli->prepare("DELETE FROM comentario_reacoes WHERE comentario_id = ? AND email = ?");
    $stmt->bind_param('is', $comentarioId, $email);
    $stmt->execute();
    $stmt->close();
} else {
    // Nenhuma reação ainda, ou trocando de emoji -> cria/atualiza a linha.
    $stmt = $mysqli->prepare(
        "INSERT INTO comentario_reacoes (comentario_id, email, emoji) VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE emoji = VALUES(emoji)"
    );
    $stmt->bind_param('iss', $comentarioId, $email, $emoji);
    $stmt->execute();
    $stmt->close();
}

// Contagem agregada atual (sempre as 3 chaves, mesmo zeradas — front não
// precisa checar undefined, mesmo espírito do payload de comentarios.php GET).
$contagens = ['🙏' => 0, '❤️' => 0, '🔥' => 0];
$stmtContagens = $mysqli->prepare("SELECT emoji, COUNT(*) AS n FROM comentario_reacoes WHERE comentario_id = ? GROUP BY emoji");
$stmtContagens->bind_param('i', $comentarioId);
$stmtContagens->execute();
$resContagens = $stmtContagens->get_result();
while ($row = $resContagens->fetch_assoc()) {
    if (isset($contagens[$row['emoji']])) $contagens[$row['emoji']] = (int) $row['n'];
}
$stmtContagens->close();

$stmtMinha = $mysqli->prepare("SELECT emoji FROM comentario_reacoes WHERE comentario_id = ? AND email = ?");
$stmtMinha->bind_param('is', $comentarioId, $email);
$stmtMinha->execute();
$minha = $stmtMinha->get_result()->fetch_assoc();
$stmtMinha->close();

echo json_encode(['ok' => true, 'contagens' => $contagens, 'minhaReacao' => $minha ? $minha['emoji'] : null]);
