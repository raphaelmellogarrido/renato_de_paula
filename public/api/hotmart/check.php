<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: https://renatodepaula.com');
header('Access-Control-Allow-Methods: GET');

$email = strtolower($_GET['email'] ?? '');
$mysqli = new mysqli('localhost', 'u790959747_clube_user', '1*GrGAbVdv', 'u790959747_clube');
$result = $mysqli->query("SELECT * FROM alunos WHERE email='".$mysqli->real_escape_string($email)."' AND status='ativo' LIMIT 1");
echo json_encode(['tem_acesso' => $result->num_rows > 0, 'email' => $email]);