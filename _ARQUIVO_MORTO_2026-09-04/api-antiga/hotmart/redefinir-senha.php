<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit; }

require __DIR__ . '/_conexao.php';
garantirEstruturaClube($mysqli);

// POST { token, nova_senha } -> valida token (existe e não expirou), grava
// o novo hash em alunos e apaga o(s) token(s) daquele email — de uso único.
$input = json_decode(file_get_contents('php://input'), true);
$token = trim($input['token'] ?? '');
$novaSenha = $input['nova_senha'] ?? '';

if (!$token || !$novaSenha) {
    http_response_code(400);
    echo json_encode(['erro' => 'Token e nova senha obrigatórios']);
    exit;
}
if (strlen($novaSenha) < 8) {
    http_response_code(400);
    echo json_encode(['erro' => 'A senha deve ter no mínimo 8 caracteres']);
    exit;
}

$stmt = $mysqli->prepare("SELECT email FROM password_resets WHERE token = ? AND expires_at > NOW() LIMIT 1");
$stmt->bind_param('s', $token);
$stmt->execute();
$linha = $stmt->get_result()->fetch_assoc();
$stmt->close();

if (!$linha) {
    http_response_code(400);
    echo json_encode(['erro' => 'Link inválido ou expirado. Peça um novo.']);
    exit;
}

$email = $linha['email'];
$hash = password_hash($novaSenha, PASSWORD_BCRYPT);

$upd = $mysqli->prepare("UPDATE alunos SET senha_hash = ? WHERE email = ?");
$upd->bind_param('ss', $hash, $email);
$ok = $upd->execute();
$upd->close();

// Apaga todos os tokens desse email (não só o usado) — de uso único de
// verdade, sem deixar outro link antigo ainda válido pra mesma conta.
$del = $mysqli->prepare("DELETE FROM password_resets WHERE email = ?");
$del->bind_param('s', $email);
$del->execute();
$del->close();

if ($ok) {
    echo json_encode(['ok' => true]);
} else {
    http_response_code(500);
    echo json_encode(['erro' => 'Erro ao salvar nova senha']);
}
