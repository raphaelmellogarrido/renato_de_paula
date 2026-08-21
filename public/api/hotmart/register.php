<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit; }

$mysqli = new mysqli('localhost', 'u790959747_clube_user', '1*GrGAbVdv', 'u790959747_clube');
if ($mysqli->connect_error) {
    http_response_code(500);
    echo json_encode(['erro' => 'Erro banco: ' . $mysqli->connect_error]);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);
$email = strtolower(trim($input['email'] ?? ''));
$senha = $input['senha'] ?? '';

if (!$email || !$senha) {
    http_response_code(400);
    echo json_encode(['erro' => 'Email e senha obrigatórios']);
    exit;
}
if (strlen($senha) < 6) {
    http_response_code(400);
    echo json_encode(['erro' => 'Senha deve ter no mínimo 6 caracteres']);
    exit;
}

$stmt = $mysqli->prepare("SELECT email, nome, status, senha_hash FROM alunos WHERE email = ? LIMIT 1");
$stmt->bind_param('s', $email);
$stmt->execute();
$res = $stmt->get_result();
$aluno = $res->fetch_assoc();
$stmt->close();

if (!$aluno) {
    http_response_code(403);
    echo json_encode(['erro' => 'Este email não tem compra ativa. Use o mesmo email da Hotmart.']);
    exit;
}
if ($aluno['status'] !== 'ativo') {
    http_response_code(403);
    echo json_encode(['erro' => 'Sua compra não está ativa']);
    exit;
}
if (!empty($aluno['senha_hash'])) {
    http_response_code(409);
    echo json_encode(['erro' => 'Você já criou senha. Faça login.']);
    exit;
}

$hash = password_hash($senha, PASSWORD_BCRYPT);
$stmt = $mysqli->prepare("UPDATE alunos SET senha_hash = ? WHERE email = ?");
$stmt->bind_param('ss', $hash, $email);
$ok = $stmt->execute();
$stmt->close();
$mysqli->close();

if ($ok) {
    echo json_encode(['ok' => true, 'email' => $email, 'nome' => $aluno['nome']]);
} else {
    http_response_code(500);
    echo json_encode(['erro' => 'Erro ao salvar senha']);
}
