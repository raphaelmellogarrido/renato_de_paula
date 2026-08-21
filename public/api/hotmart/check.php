<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: https://renatodepaula.com');
header('Access-Control-Allow-Methods: GET');
header('Access-Control-Allow-Headers: Content-Type');

$email = strtolower(trim($_GET['email'] ?? ''));
if (!$email) { echo json_encode(['tem_acesso'=>false]); exit; }

$mysqli = new mysqli('localhost', 'u790959747_clube_user', 'yB8=~FE1$', 'u790959747_clube');
if ($mysqli->connect_error) { echo json_encode(['tem_acesso'=>false]); exit; }

$email_safe = $mysqli->real_escape_string($email);
$res = $mysqli->query("SELECT 1 FROM alunos WHERE email='$email_safe' AND status='ativo' LIMIT 1");
echo json_encode(['tem_acesso' => $res && $res->num_rows > 0]);