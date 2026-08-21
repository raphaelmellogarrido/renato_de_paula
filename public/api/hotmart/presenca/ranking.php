<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit; }

require __DIR__ . '/../_conexao.php';

// Contrato já lido por useSequenciaMeditacao.js (extrairStreaks): aceita
// { streaks: [...] } com números. Anônimo de propósito — só a lista de
// streaks pra calcular um percentil, nenhum email sai daqui.
$streaks = [];
$res = $mysqli->query("SELECT DISTINCT email FROM presencas");
while ($row = $res->fetch_assoc()) {
    $streaks[] = calcularStreakEmail($mysqli, $row['email']);
}

echo json_encode(['ok' => true, 'streaks' => $streaks]);
