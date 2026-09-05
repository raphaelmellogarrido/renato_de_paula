<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: https://renatodepaula.com');
header('Access-Control-Allow-Methods: GET');
header('Access-Control-Allow-Headers: Content-Type');

$email = strtolower(trim($_GET['email'] ?? ''));
if (!$email) { echo json_encode(['tem_acesso'=>false]); exit; }

// Nota: se a conexão falhar, _conexao.php responde 500 + {erro:...} em vez
// do antigo 200 + {tem_acesso:false} — mudança de contrato pequena e só no
// caso raro de banco fora do ar; mais correto (500 real em vez de mascarar
// como "sem acesso"), mas fique ciente se algo no front checar só
// `tem_acesso` sem olhar o status HTTP.
require __DIR__ . '/_conexao.php';

$email_safe = $mysqli->real_escape_string($email);
// 'teste' = acesso liberado manualmente pelo admin sem compra (ver
// public/api/admin/teste-emails.php), tratado igual a 'ativo' aqui.
$res = $mysqli->query("SELECT 1 FROM alunos WHERE email='$email_safe' AND status IN ('ativo','teste') LIMIT 1");
echo json_encode(['tem_acesso' => $res && $res->num_rows > 0]);