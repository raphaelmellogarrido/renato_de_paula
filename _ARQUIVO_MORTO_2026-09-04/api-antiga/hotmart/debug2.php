<?php
require __DIR__ . '/_conexao.php';
$email = 'raphaelmellogarrido@gmail.com';
$r = $mysqli->query("SELECT email, nome, apelido FROM alunos WHERE email = '$email' LIMIT 1");
echo "<pre>";
print_r($r->fetch_assoc());
echo "</pre>";