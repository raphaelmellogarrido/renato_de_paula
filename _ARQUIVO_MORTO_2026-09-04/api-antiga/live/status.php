<?php
// Status da liberação manual da live (seção "Controle da Live" em
// AdminMeditacao.jsx) — consumido por ColunaEncontros.jsx a cada 30s pra
// travar/destravar o botão "Entrar na live", independente de link_live já
// estar preenchido em config_encontro (ver public/api/encontro.php). Só
// leitura, público — quem libera/trava é
// public/api/admin/live-controle.php.
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') exit;

require __DIR__ . '/../hotmart/_conexao.php';
garantirEstruturaClube($mysqli); // garante a coluna live_liberada em config_encontro

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['erro' => 'Método não permitido']);
    exit;
}

$res = $mysqli->query("SELECT live_liberada, titulo FROM config_encontro WHERE id = 1");
$linha = $res ? $res->fetch_assoc() : null;

// Defensivo: se a linha sumir, devolve travado em vez de 500 — mesmo
// espírito de public/api/encontro.php.
echo json_encode([
    'ok' => true,
    'liberada' => $linha ? (int) $linha['live_liberada'] : 0,
    'encontro' => $linha ? $linha['titulo'] : '',
]);
