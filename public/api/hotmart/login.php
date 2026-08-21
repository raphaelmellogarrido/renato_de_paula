<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit; }

$mysqli = new mysqli('localhost', 'u790959747_clube_user', 'yB8=~FE1$', 'u790959747_clube');
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

$stmt = $mysqli->prepare("SELECT email, nome, status, senha_hash FROM alunos WHERE email = ? LIMIT 1");
$stmt->bind_param('s', $email);
$stmt->execute();
$res = $stmt->get_result();
$aluno = $res->fetch_assoc();
$stmt->close();

if (!$aluno) {
    http_response_code(403);
    echo json_encode(['erro' => 'Email não encontrado']);
    exit;
}
if ($aluno['status'] !== 'ativo') {
    http_response_code(403);
    echo json_encode(['erro' => 'Compra não ativa']);
    exit;
}
if (empty($aluno['senha_hash'])) {
    http_response_code(403);
    echo json_encode(['erro' => 'Você ainda não criou senha. Clique em Criar senha.']);
    exit;
}

if (!password_verify($senha, $aluno['senha_hash'])) {
    http_response_code(401);
    echo json_encode(['erro' => 'Senha incorreta']);
    exit;
}

$mysqli->close();
echo json_encode(['ok' => true, 'email' => $aluno['email'], 'nome' => $aluno['nome']]);
