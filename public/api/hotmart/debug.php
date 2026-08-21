<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);
echo "Testando config secreto...<br>";
require_once '/home/u790959747/domains/renatodepaula.com/private/db_config.php';
echo "Constantes OK: " . DB_USER . " / " . DB_NAME . "<br>";

echo "Tentando conectar...<br>";
$conn = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);
if ($conn->connect_error) {
    die("ERRO DE CONEXAO: " . $conn->connect_error);
}
echo "CONECTOU COM SUCESSO!";