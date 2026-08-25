<?php
// Marca como lidas todas as mensagens RECEBIDAS por um e-mail (Tarefa 2) —
// chamado ao abrir /comunidade/mensagens (Mensagens.jsx), pra o badge
// vermelho da sidebar sumir na próxima leitura de listar.php?apenas_contagem=1.
//
// POST { email } -> UPDATE mensagens_privadas SET lida=1 WHERE para_email=? AND lida=0
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
$email = strtolower(trim($input['email'] ?? ''));
if (!$email || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['erro' => 'email inválido']);
    exit;
}

$stmt = $mysqli->prepare("UPDATE mensagens_privadas SET lida = 1 WHERE para_email = ? AND lida = 0");
$stmt->bind_param('s', $email);
$stmt->execute();
$marcadas = $stmt->affected_rows;
$stmt->close();

echo json_encode(['ok' => true, 'marcadas' => $marcadas]);
