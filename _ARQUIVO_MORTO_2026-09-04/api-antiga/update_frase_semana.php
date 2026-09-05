<?php
// Salva uma nova "Frase Motivacional da Semana" (seção /admin,
// AdminMeditacao.jsx). Protegido por X-Admin-Secret, mesmo padrão de
// public/api/admin/desafios-semana.php. Leitura pública (sem auth) é
// public/api/get_frase_semana.php.
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-Admin-Secret');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') exit;

require __DIR__ . '/hotmart/_conexao.php';

$chaveFornecida = $_SERVER['HTTP_X_ADMIN_SECRET'] ?? '';
// ADMIN_SECRET vazio (não configurado no servidor) nunca autentica, mesmo
// que o front mande header vazio também.
if (ADMIN_SECRET === '' || !hash_equals(ADMIN_SECRET, $chaveFornecida)) {
    http_response_code(401);
    echo json_encode(['erro' => 'Não autorizado']);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['erro' => 'Método não permitido']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true) ?? [];
$frase = trim($input['frase'] ?? '');
$subfrase = trim($input['subfrase'] ?? '');

if ($frase === '') {
    http_response_code(400);
    echo json_encode(['erro' => 'Frase não pode ficar vazia']);
    exit;
}

// INSERT, não UPDATE: mantém histórico de frases já salvas (pedido
// explícito) — get_frase_semana.php sempre lê a última (ORDER BY id DESC).
$stmt = $mysqli->prepare("INSERT INTO frase_motivacional_semana (frase, subfrase) VALUES (?, ?)");
$stmt->bind_param('ss', $frase, $subfrase);
$stmt->execute();
$stmt->close();

echo json_encode(['ok' => true, 'frase' => $frase, 'subfrase' => $subfrase]);
