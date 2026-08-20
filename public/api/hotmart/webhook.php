<?php
header('Content-Type: application/json');
$HOTTOK = 'COLOQUE_SEU_HOTTOK_AQUI'; // pega na Hotmart em Autenticação

$recebido = $_SERVER['HTTP_X_HOTTOK'] ?? $_SERVER['HTTP_HOTTOK'] ?? '';
// Comenta essa verificação só pro primeiro teste se quiser
if (!empty($HOTTOK) && $HOTTOK !== 'COLOQUE_SEU_HOTTOK_AQUI' && $recebido !== $HOTTOK) {
    http_response_code(401);
    echo json_encode(['erro' => 'hottok invalido']);
    exit;
}

$input = file_get_contents('php://input');
$payload = json_decode($input, true);
$event = $payload['event'] ?? 'TESTE';
$data = $payload['data'] ?? [];

$mysqli = new mysqli('localhost', 'u790959747_clube_user', '1*GrGAbVdv', 'u790959747_clube');
if ($mysqli->connect_error) {
    http_response_code(500);
    echo json_encode(['erro' => $mysqli->connect_error]);
    exit;
}

// Cria tabela se não existir
$mysqli->query("CREATE TABLE IF NOT EXISTS alunos (
  email VARCHAR(255) PRIMARY KEY,
  nome VARCHAR(255),
  product_id VARCHAR(100),
  status VARCHAR(20),
  compra_id VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)");

if (in_array($event, ['PURCHASE_APPROVED', 'PURCHASE_COMPLETED', 'TESTE'])) {
    $email = strtolower($data['buyer']['email'] ?? 'teste@renatodepaula.com');
    $nome = $data['buyer']['name'] ?? 'Teste';
    $product_id = $data['product']['id'] ?? 'teste';
    $compra_id = $data['purchase']['transaction'] ?? 'teste123';

    $stmt = $mysqli->prepare("INSERT INTO alunos (email, nome, product_id, status, compra_id) VALUES (?, ?, ?, 'ativo', ?) ON DUPLICATE KEY UPDATE nome=VALUES(nome), status='ativo'");
    $stmt->bind_param('ssss', $email, $nome, $product_id, $compra_id);
    $stmt->execute();
    echo json_encode(['ok' => true, 'email_salvo' => $email]);
    exit;
}

echo json_encode(['ok' => true, 'event' => $event]);