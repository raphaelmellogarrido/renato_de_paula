<?php
// /api/hotmart/register.php - CRIA SENHA NA PRIMEIRA VEZ
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit; }

require_once __DIR__ . '/../db.php'; // ajuste se seu db.php estiver em outro lugar

$data = json_decode(file_get_contents("php://input"), true);
$email = strtolower(trim($data['email'] ?? ''));
$senha = $data['senha'] ?? '';

if (!filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($senha) < 6) {
    http_response_code(400);
    echo json_encode(["erro" => "Email inválido ou senha muito curta (min 6)"]);
    exit;
}

// Verifica se tem compra ativa
$stmt = $pdo->prepare("SELECT id, senha_hash FROM alunos WHERE email = ? AND status = 'ativo' LIMIT 1");
$stmt->execute([$email]);
$aluno = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$aluno) {
    http_response_code(403);
    echo json_encode(["erro" => "Email sem compra ativa. Use o email da Hotmart."]);
    exit;
}

if (!empty($aluno['senha_hash'])) {
    http_response_code(409);
    echo json_encode(["erro" => "Você já tem senha. Faça login.", "ja_tem_senha" => true]);
    exit;
}

$hash = password_hash($senha, PASSWORD_DEFAULT);
$pdo->prepare("UPDATE alunos SET senha_hash = ? WHERE id = ?")->execute([$hash, $aluno['id']]);

echo json_encode(["ok" => true, "msg" => "Senha criada! Faça login agora."]);
