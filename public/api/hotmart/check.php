<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);
header('Content-Type: application/json');

$email = strtolower($_GET['email'] ?? 'teste@teste.com');

// TENTA CONECTAR
$mysqli = new mysqli('localhost', 'u790959747_clube_user', '1*GrGAbVdv', 'u790959747_clube');

if ($mysqli->connect_error) {
    echo json_encode(['erro_conexao' => $mysqli->connect_error, 'user' => 'u790959747_clube_user', 'banco' => 'u790959747_clube']);
    exit;
}

$result = $mysqli->query("SHOW TABLES LIKE 'alunos'");
if ($result->num_rows == 0) {
    echo json_encode(['erro' => 'tabela alunos nao existe ainda, cria ela no phpMyAdmin']);
    exit;
}

$email_safe = $mysqli->real_escape_string($email);
$res = $mysqli->query("SELECT * FROM alunos WHERE email='$email_safe' AND status='ativo' LIMIT 1");

if (!$res) {
    echo json_encode(['erro_sql' => $mysqli->error]);
    exit;
}

echo json_encode(['tem_acesso' => $res->num_rows > 0, 'email' => $email, 'ok' => true]);