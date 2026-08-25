<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') exit;

require __DIR__ . '/_conexao.php'; // já tem SET time_zone = '-03:00'

$email = strtolower(trim($_GET['email'] ?? $_POST['email'] ?? ''));
$body = json_decode(file_get_contents('php://input'), true);
if (!$email && isset($body['email'])) $email = strtolower(trim($body['email']));

if (!$email) { echo json_encode(['itens'=>[]]); exit; }

// semana ISO começando segunda, no horário de Brasília
$res = $mysqli->query("SELECT YEARWEEK(CURDATE(), 1) as sem");
$sem = $res->fetch_assoc()['sem']; // ex: 202620

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $stmt = $mysqli->prepare("SELECT item_id, concluido FROM desafio_semana WHERE email=? AND semana=?");
    $stmt->bind_param('si', $email, $sem);
    $stmt->execute();
    $r = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);

    // resetadoEm: timestamp do último "Resetar desafios da semana" em /admin
    // pra esta semana (ver public/api/admin/resetar_desafios.php), null se
    // nunca resetou. DesafioSemana.jsx compara isso com o que guardou da
    // última vez que sincronizou; se mudou, descarta o progresso salvo em
    // localStorage antes de mesclar com $r acima (senão um check marcado
    // antes do reset nunca some do navegador do aluno, já que a linha dele
    // aqui simplesmente não existe mais pra corrigir isso).
    $resetadoEm = null;
    $existeTabelaReset = $mysqli->query("SHOW TABLES LIKE 'desafio_semana_reset'");
    if ($existeTabelaReset && $existeTabelaReset->num_rows > 0) {
        $stmtReset = $mysqli->prepare("SELECT resetado_em FROM desafio_semana_reset WHERE semana = ?");
        $stmtReset->bind_param('i', $sem);
        $stmtReset->execute();
        $resetadoEm = $stmtReset->get_result()->fetch_assoc()['resetado_em'] ?? null;
        $stmtReset->close();
    }

    echo json_encode(['itens'=>$r, 'semana'=>$sem, 'resetadoEm'=>$resetadoEm]);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $item_id = $body['item_id'] ?? '';
    $concluido = !empty($body['concluido']) ? 1 : 0;
    if (!$item_id) { http_response_code(400); echo json_encode(['erro'=>'item_id obrigatório']); exit; }

    $stmt = $mysqli->prepare("INSERT INTO desafio_semana (email, item_id, semana, concluido) VALUES (?,?,?,?) ON DUPLICATE KEY UPDATE concluido=VALUES(concluido), atualizado_em=NOW()");
    $stmt->bind_param('ssii', $email, $item_id, $sem, $concluido);
    $stmt->execute();
    echo json_encode(['ok'=>true, 'semana'=>$sem]);
    exit;
}