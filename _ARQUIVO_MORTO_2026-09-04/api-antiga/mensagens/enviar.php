<?php
// Envia uma mensagem privada (Tarefa 2) — usado tanto pelo admin/orientador
// (modal "Enviar mensagem para @Nome" em ComentarioCard.jsx/DificuldadeDoDia.jsx)
// quanto pelo aluno respondendo dentro do próprio thread (Mensagens.jsx).
//
// POST { de_email, para_email, mensagem } -> INSERT em mensagens_privadas.
//
// Mesmo modelo de "permissão como pedido, não cofre" já documentado em
// comentarios.php (DELETE): esta API não tem $_SESSION nem cookie — o
// e-mail de quem envia vem do próprio corpo da requisição, igual o resto da
// /comunidade. Não trava de_email numa lista de admins porque o aluno
// também usa este mesmo endpoint pra RESPONDER dentro do seu próprio
// thread — só o clique que abre o modal (Tarefa 2) já é restrito no front a
// admin/orientador.
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit; }

require __DIR__ . '/../hotmart/_conexao.php';
garantirEstruturaClube($mysqli); // cria mensagens_privadas se ainda não existir

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['erro' => 'Método não permitido']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true) ?: [];
$deEmail = strtolower(trim($input['de_email'] ?? ''));
$paraEmail = strtolower(trim($input['para_email'] ?? ''));
$mensagem = trim($input['mensagem'] ?? '');

if (!$deEmail || !filter_var($deEmail, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['erro' => 'de_email inválido']);
    exit;
}
if (!$paraEmail || !filter_var($paraEmail, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['erro' => 'para_email inválido']);
    exit;
}
if ($mensagem === '') {
    http_response_code(400);
    echo json_encode(['erro' => 'mensagem obrigatória']);
    exit;
}
// Mesmo teto de comentarios.php — guarda-chuva contra abuso/erro de cliente.
if (mb_strlen($mensagem) > 2000) {
    $mensagem = mb_substr($mensagem, 0, 2000);
}

$stmt = $mysqli->prepare(
    "INSERT INTO mensagens_privadas (de_email, para_email, mensagem) VALUES (?, ?, ?)"
);
$stmt->bind_param('sss', $deEmail, $paraEmail, $mensagem);
$stmt->execute();
$novoId = $stmt->insert_id;
$stmt->close();

echo json_encode(['ok' => true, 'id' => $novoId]);
