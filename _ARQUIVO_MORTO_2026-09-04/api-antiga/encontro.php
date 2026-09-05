<?php
// Dados do card "Próximo encontro ao vivo" (ColunaEncontros.jsx, dashboard
// da comunidade). Só leitura, público — quem edita é
// public/api/admin/encontro.php. Tabela config_encontro já existe no
// banco (linha id=1), não provisiona nada aqui.
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') exit;

require __DIR__ . '/hotmart/_conexao.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['erro' => 'Método não permitido']);
    exit;
}

$res = $mysqli->query("SELECT titulo, data_texto, horario, linha1, linha2, linha3, link_live FROM config_encontro WHERE id = 1");
$linha = $res ? $res->fetch_assoc() : null;

// Defensivo: se a linha sumir por algum motivo, devolve o mesmo formato
// com campos vazios em vez de 500 — o front sempre recebe um shape
// previsível e cai pro conteúdo padrão dele mesmo.
if (!$linha) {
    $linha = ['titulo' => '', 'data_texto' => '', 'horario' => '', 'linha1' => '', 'linha2' => '', 'linha3' => '', 'link_live' => ''];
}

echo json_encode(array_merge(['ok' => true], $linha));
