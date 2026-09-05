<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit; }

require __DIR__ . '/../_conexao.php';

// Contrato já usado por Configuracoes.jsx (card Conta):
// POST { email, senha_atual, nova_senha }.
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['erro' => 'Método não permitido']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);
$email = strtolower(trim($input['email'] ?? ''));
$senhaAtual = $input['senha_atual'] ?? '';
$novaSenha = $input['nova_senha'] ?? '';

if (!$email || !$senhaAtual || strlen($novaSenha) < 8) {
    http_response_code(400);
    echo json_encode(['erro' => 'email, senha_atual e nova_senha (mín. 8) obrigatórios']);
    exit;
}

$stmt = $mysqli->prepare("SELECT senha_hash FROM alunos WHERE email = ? LIMIT 1");
$stmt->bind_param('s', $email);
$stmt->execute();
$aluno = $stmt->get_result()->fetch_assoc();
$stmt->close();

if (!$aluno || empty($aluno['senha_hash']) || !password_verify($senhaAtual, $aluno['senha_hash'])) {
    http_response_code(401);
    echo json_encode(['erro' => 'Senha atual incorreta']);
    exit;
}

$hash = password_hash($novaSenha, PASSWORD_DEFAULT);
$stmt = $mysqli->prepare("UPDATE alunos SET senha_hash = ? WHERE email = ?");
$stmt->bind_param('ss', $hash, $email);
$stmt->execute();
$stmt->close();

echo json_encode(['ok' => true]);
