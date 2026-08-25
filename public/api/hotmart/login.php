<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit; }

require __DIR__ . '/_conexao.php';

$input = json_decode(file_get_contents('php://input'), true);
$email = strtolower(trim($input['email'] ?? ''));
$senha = $input['senha'] ?? '';

if (!$email || !$senha) { http_response_code(400); echo json_encode(['erro'=>'Email e senha obrigatórios']); exit; }

$stmt = $mysqli->prepare("SELECT * FROM alunos WHERE email = ? LIMIT 1");
$stmt->bind_param('s', $email);
$stmt->execute();
$aluno = $stmt->get_result()->fetch_assoc();
$stmt->close();

if (!$aluno) { http_response_code(403); echo json_encode(['erro'=>'Email não encontrado']); exit; }
// 'teste' = acesso liberado manualmente pelo admin sem compra (ver
// public/api/admin/teste-emails.php), tratado igual a 'ativo' daqui pra
// frente.
if (isset($aluno['status']) && !in_array($aluno['status'], ['ativo', 'teste'], true)) { http_response_code(403); echo json_encode(['erro'=>'Compra não ativa']); exit; }

$hash = $aluno['senha_hash'] ?? $aluno['senha'] ?? '';
// precisa_criar_senha: front (Login.jsx) usa isso pra pular direto pra tela
// "Crie sua senha do Clube" (modo=criar) em vez de só mostrar um erro.
if (empty($hash)) { http_response_code(403); echo json_encode(['erro'=>'Você ainda não criou senha', 'precisa_criar_senha'=>true]); exit; }

if (!password_verify($senha, $hash) && $senha !== $hash) { http_response_code(401); echo json_encode(['erro'=>'Senha incorreta']); exit; }

// 'nome' e 'apelido' não podem se confundir: 'nome' é sempre o nome
// completo (é o que Configuracoes.jsx usa como "Nome e sobrenome" e o que
// aparece no Ranking/Comunidade). 'apelido' é o "Primeiro nome" — se o
// aluno nunca salvou um, cai pra primeira palavra do nome completo (sem
// gravar no banco, só pra não devolver vazio pro front).
$partes = explode(' ', trim($aluno['nome'] ?? ''));
$primeiroNomeFallback = mb_substr($partes[0], 0, 11);

echo json_encode([
  'ok'=>true,
  'email'=>$aluno['email'],
  'nome'=> $aluno['nome'],
  'apelido'=> $aluno['apelido'] ?: $primeiroNomeFallback,
  // null se o aluno nunca subiu foto de perfil (Configuracoes.jsx) — sem
  // isso a sidebar só mostraria a foto depois de uma visita a
  // Configurações, já que é lá que comunidade_session ganharia avatarUrl.
  // avatarUrlPublica (_conexao.php) monta a URL a partir de avatar_versao —
  // ver bug reportado 25/08 (foto em BLOB, não mais arquivo em avatar_url).
  'avatar_url'=> avatarUrlPublica($aluno['email'], $aluno['avatar_versao'] ?? 0)
]);