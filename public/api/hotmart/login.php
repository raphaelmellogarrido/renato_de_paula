<?php
// /api/hotmart/login.php - LOGIN COM EMAIL + SENHA DO CLUBE
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit; }

require_once __DIR__ . '/../db.php';

$data = json_decode(file_get_contents("php://input"), true);
$email = strtolower(trim($data['email'] ?? ''));
$senha = $data['senha'] ?? '';

if (!filter_var($email, FILTER_VALIDATE_EMAIL) || !$senha) {
    http_response_code(400);
    echo json_encode(["erro" => "Preencha email e senha"]);
    exit;
}

$stmt = $pdo->prepare("SELECT email, nome, senha_hash FROM alunos WHERE email = ? AND status = 'ativo' LIMIT 1");
$stmt->execute([$email]);
$aluno = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$aluno) {
    http_response_code(403);
    echo json_encode(["erro" => "Acesso não encontrado ou inativo"]);
    exit;
}

if (empty($aluno['senha_hash'])) {
    http_response_code(401);
    echo json_encode(["erro" => "Você ainda não criou sua senha", "precisa_criar_senha" => true]);
    exit;
}

if (!password_verify($senha, $aluno['senha_hash'])) {
    http_response_code(401);
    echo json_encode(["erro" => "Senha incorreta"]);
    exit;
}

// OK
echo json_encode([
    "ok" => true,
    "session" => [
        "email" => $aluno['email'],
        "nome" => $aluno['nome'],
        "isAlunoCurso" => true
    ]
]);
