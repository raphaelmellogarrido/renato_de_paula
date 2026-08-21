<?php
// Reservas do card "Próximo encontro ao vivo" (Clube Presença).
// Mesmo padrão de conexão/CORS dos outros endpoints em /api/hotmart/*.php
// deste projeto — self-provisiona a tabela na primeira chamada, igual
// webhook.php já faz com `alunos`.
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') exit;

$mysqli = new mysqli('localhost', 'u790959747_clube_user', 'yB8=~FE1$', 'u790959747_clube');
if ($mysqli->connect_error) {
    http_response_code(500);
    echo json_encode(['erro' => $mysqli->connect_error]);
    exit;
}

$mysqli->query("CREATE TABLE IF NOT EXISTS live_reservas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  event_id VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL,
  display_name VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_evento_email (event_id, email)
)");

function inicial_de($nome) {
    $nome = trim((string)$nome);
    if ($nome === '') return '?';
    // mb_* pra não quebrar acento/emoji na primeira letra.
    return mb_strtoupper(mb_substr($nome, 0, 1));
}

// Devolve o total de reservas + até 3 nomes pra mostrar os avatares + se
// $email (quando informado) já está entre os que reservaram.
function montar_snapshot($mysqli, $event_id, $email) {
    $stmt = $mysqli->prepare("SELECT COUNT(*) AS total FROM live_reservas WHERE event_id = ?");
    $stmt->bind_param('s', $event_id);
    $stmt->execute();
    $total = (int) $stmt->get_result()->fetch_assoc()['total'];
    $stmt->close();

    $usuarios = [];
    $stmt = $mysqli->prepare("SELECT display_name FROM live_reservas WHERE event_id = ? ORDER BY created_at ASC LIMIT 3");
    $stmt->bind_param('s', $event_id);
    $stmt->execute();
    $res = $stmt->get_result();
    while ($row = $res->fetch_assoc()) {
        $usuarios[] = ['display_name' => $row['display_name'], 'inicial' => inicial_de($row['display_name'])];
    }
    $stmt->close();

    $euReservei = false;
    if ($email) {
        $stmt = $mysqli->prepare("SELECT 1 FROM live_reservas WHERE event_id = ? AND email = ? LIMIT 1");
        $stmt->bind_param('ss', $event_id, $email);
        $stmt->execute();
        $euReservei = $stmt->get_result()->num_rows > 0;
        $stmt->close();
    }

    return ['total' => $total, 'usuarios' => $usuarios, 'euReservei' => $euReservei];
}

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $event_id = trim($_GET['event_id'] ?? '');
    $email = strtolower(trim($_GET['email'] ?? ''));
    if (!$event_id) {
        http_response_code(400);
        echo json_encode(['erro' => 'event_id obrigatorio']);
        exit;
    }
    echo json_encode(array_merge(['ok' => true], montar_snapshot($mysqli, $event_id, $email)));
    exit;
}

$input = json_decode(file_get_contents('php://input'), true) ?? [];
$event_id = trim($input['event_id'] ?? '');
$email = strtolower(trim($input['user_email'] ?? ''));

if ($method === 'POST') {
    $display_name = trim($input['display_name'] ?? '');
    if (!$event_id || !$email || !$display_name) {
        http_response_code(400);
        echo json_encode(['erro' => 'event_id, user_email e display_name obrigatorios']);
        exit;
    }
    // ON DUPLICATE KEY: se essa pessoa já reservou esse evento, não duplica
    // — só atualiza o nome (caso ela tenha mudado "como quer ser chamado").
    $stmt = $mysqli->prepare("INSERT INTO live_reservas (event_id, email, display_name) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE display_name = VALUES(display_name)");
    $stmt->bind_param('sss', $event_id, $email, $display_name);
    $stmt->execute();
    $stmt->close();

    echo json_encode(array_merge(['ok' => true], montar_snapshot($mysqli, $event_id, $email)));
    exit;
}

if ($method === 'DELETE') {
    if (!$event_id || !$email) {
        http_response_code(400);
        echo json_encode(['erro' => 'event_id e user_email obrigatorios']);
        exit;
    }
    $stmt = $mysqli->prepare("DELETE FROM live_reservas WHERE event_id = ? AND email = ?");
    $stmt->bind_param('ss', $event_id, $email);
    $stmt->execute();
    $stmt->close();

    echo json_encode(array_merge(['ok' => true], montar_snapshot($mysqli, $event_id, $email)));
    exit;
}

http_response_code(405);
echo json_encode(['erro' => 'metodo nao suportado']);
