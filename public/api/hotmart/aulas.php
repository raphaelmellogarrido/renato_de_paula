<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') exit;

$mysqli = new mysqli('localhost', 'u790959747_clube_user', '1*GrGAbVdv', 'u790959747_clube');
if ($mysqli->connect_error) {
    http_response_code(500);
    echo json_encode(['erro' => $mysqli->connect_error]);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];
$email = $_GET['email'] ?? $_POST['email'] ?? '';

if ($method === 'GET') {
    // Lista aulas + progresso do usuario se email vier
    $aulas = [];
    $res = $mysqli->query("SELECT * FROM aulas_raiz WHERE liberada=1 ORDER BY ordem ASC, id ASC");
    while($row = $res->fetch_assoc()) {
        $row['progresso'] = 0;
        $row['assistida'] = false;
        if ($email) {
            $stmt = $mysqli->prepare("SELECT progresso_percent, assistida FROM progresso_aulas WHERE email=? AND aula_id=?");
            $stmt->bind_param('si', $email, $row['id']);
            $stmt->execute();
            $pr = $stmt->get_result()->fetch_assoc();
            if ($pr) {
                $row['progresso'] = (int)$pr['progresso_percent'];
                $row['assistida'] = (bool)$pr['assistida'];
            }
            $stmt->close();
        }
        $aulas[] = $row;
    }
    echo json_encode(['ok'=>true, 'aulas'=>$aulas]);
    exit;
}

if ($method === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    $email = strtolower(trim($input['email'] ?? ''));
    $aula_id = intval($input['aula_id'] ?? 0);
    $progresso = intval($input['progresso'] ?? 0);
    $posicao = intval($input['posicao'] ?? 0);
    $completou = $input['completou'] ?? false;

    if (!$email || !$aula_id) {
        http_response_code(400);
        echo json_encode(['erro'=>'email e aula_id obrigatorios']);
        exit;
    }

    $stmt = $mysqli->prepare("INSERT INTO progresso_aulas (email, aula_id, progresso_percent, ultima_posicao, assistida, completada_em) VALUES (?, ?, ?, ?, ?, ".($completou ? "NOW()" : "NULL").") ON DUPLICATE KEY UPDATE progresso_percent=GREATEST(progresso_percent, VALUES(progresso_percent)), ultima_posicao=VALUES(ultima_posicao), assistida=IF(VALUES(assistida)=1,1,assistida), completada_em=IF(VALUES(assistida)=1,NOW(),completada_em)");
    $assistida_int = $completou ? 1 : 0;
    $stmt->bind_param('siiii', $email, $aula_id, $progresso, $posicao, $assistida_int);
    $stmt->execute();
    $stmt->close();

    // Se completou, registra presenca do dia
    if ($completou) {
        $stmt2 = $mysqli->prepare("INSERT INTO presencas (email, data, minutos) VALUES (?, CURDATE(), 10) ON DUPLICATE KEY UPDATE minutos = minutos + 10");
        $stmt2->bind_param('s', $email);
        $stmt2->execute();
        $stmt2->close();
    }

    echo json_encode(['ok'=>true]);
    exit;
}
