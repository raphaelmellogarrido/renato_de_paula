<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: PATCH, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit; }

require __DIR__ . '/_conexao.php';
garantirEstruturaClube($mysqli); // cria alunos.apelido se ainda não existir

// Contrato já usado por Configuracoes.jsx (card Perfil):
// PATCH { email, name, display_name }.
if ($_SERVER['REQUEST_METHOD'] !== 'PATCH') {
    http_response_code(405);
    echo json_encode(['erro' => 'Método não permitido']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);
$email = strtolower(trim($input['email'] ?? ''));
$nome = trim($input['name'] ?? '');
$apelido = trim($input['display_name'] ?? '');

if (!$email || mb_strlen($nome) < 3 || $apelido === '') {
    http_response_code(400);
    echo json_encode(['erro' => 'email, name (mín. 3) e display_name obrigatórios']);
    exit;
}

$check = $mysqli->prepare("SELECT 1 FROM alunos WHERE email = ? LIMIT 1");
$check->bind_param('s', $email);
$check->execute();
$existe = $check->get_result()->num_rows > 0;
$check->close();

if (!$existe) {
    http_response_code(404);
    echo json_encode(['erro' => 'Email não encontrado']);
    exit;
}

$stmt = $mysqli->prepare("UPDATE alunos SET nome = ?, apelido = ? WHERE email = ?");
$stmt->bind_param('sss', $nome, $apelido, $email);
$stmt->execute();
$stmt->close();

echo json_encode(['ok' => true]);
