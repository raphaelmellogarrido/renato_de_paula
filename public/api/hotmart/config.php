<?php
// Caminho real confirmado pelos seus vídeos
$secret = '/home/u790959747/domains/renatodepaula.com/private/db_config.php';

if (!file_exists($secret)) {
    http_response_code(500);
    error_log("CONFIG: Arquivo nao encontrado em $secret");
    die(json_encode(['erro' => 'config privado nao encontrado em ' . $secret]));
}

require_once $secret;

function getConexao() {
    $conn = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);
    if ($conn->connect_error) {
        error_log("MYSQL: " . $conn->connect_error);
        http_response_code(500);
        die(json_encode(['erro' => 'Falha conexao DB: ' . $conn->connect_error]));
    }
    $conn->set_charset("utf8mb4");
    return $conn;
}