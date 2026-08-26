<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') exit;

require __DIR__ . '/_conexao.php';

$method = $_SERVER['REQUEST_METHOD'];
$email = $_GET['email'] ?? $_POST['email'] ?? '';

if ($method === 'GET') {
    $inicio = microtime(true);

    // Lista aulas + progresso do usuario, numa query só (LEFT JOIN em vez do
    // SELECT por aula dentro do while de antes — N+1: com N aulas liberadas
    // e email preenchido eram 1 + N queries a cada carregamento da tela de
    // aulas). email='' quando não vier nenhum (visitante sem sessão) nunca
    // bate com pa.email de verdade, então o LEFT JOIN só resolve NULL e cai
    // no fallback 0/false abaixo — mesmo comportamento de antes.
    $stmt = $mysqli->prepare(
        "SELECT ar.*, pa.progresso_percent, pa.assistida
         FROM aulas_raiz ar
         LEFT JOIN progresso_aulas pa ON pa.aula_id = ar.id AND pa.email = ?
         WHERE ar.liberada = 1
         ORDER BY ar.ordem ASC, ar.id ASC"
    );
    $stmt->bind_param('s', $email);
    $stmt->execute();
    $res = $stmt->get_result();
    $aulas = [];
    while ($row = $res->fetch_assoc()) {
        $row['progresso'] = $row['progresso_percent'] !== null ? (int) $row['progresso_percent'] : 0;
        $row['assistida'] = (bool) $row['assistida'];
        unset($row['progresso_percent']);
        $aulas[] = $row;
    }
    $stmt->close();

    // Log de timing (Hostinger não dá acesso a slow query log) — só grava
    // quando passa de 300ms, pra não poluir o error_log em uso normal.
    $duracaoMs = round((microtime(true) - $inicio) * 1000);
    if ($duracaoMs > 300) {
        error_log("[timing] aulas.php GET: {$duracaoMs}ms");
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
