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
// Nome completo digitado na tela "Crie sua senha do Clube" (Login.jsx,
// modo=criar). Antes desse fix o campo era só validado no front e nunca
// chegava a ser salvo — o nome que sobrava era o bruto do webhook da
// Hotmart (buyer.name), às vezes só o primeiro nome.
$nome = trim($input['nome'] ?? '');

if (!$email || !$senha) {
    http_response_code(400);
    echo json_encode(['erro' => 'Email e senha obrigatórios']);
    exit;
}
if (strlen($senha) < 6) {
    http_response_code(400);
    echo json_encode(['erro' => 'Senha deve ter no mínimo 6 caracteres']);
    exit;
}

$stmt = $mysqli->prepare("SELECT email, nome, status, senha_hash FROM alunos WHERE email = ? LIMIT 1");
$stmt->bind_param('s', $email);
$stmt->execute();
$res = $stmt->get_result();
$aluno = $res->fetch_assoc();
$stmt->close();

if (!$aluno) {
    http_response_code(403);
    echo json_encode(['erro' => 'Este email não tem compra ativa. Use o mesmo email da Hotmart.']);
    exit;
}
// 'teste' = acesso liberado manualmente pelo admin sem compra (ver
// public/api/admin/teste-emails.php), tratado igual a 'ativo' daqui pra
// frente.
if (!in_array($aluno['status'], ['ativo', 'teste'], true)) {
    http_response_code(403);
    echo json_encode(['erro' => 'Sua compra não está ativa']);
    exit;
}
if (!empty($aluno['senha_hash'])) {
    http_response_code(409);
    echo json_encode(['erro' => 'Você já criou senha. Faça login.']);
    exit;
}

$hash = password_hash($senha, PASSWORD_BCRYPT);
$stmt = $mysqli->prepare("UPDATE alunos SET senha_hash = ? WHERE email = ?");
$stmt->bind_param('ss', $hash, $email);
$ok = $stmt->execute();
$stmt->close();

// Primeiro nome = primeira palavra do nome completo, capado em 11 chars pra
// bater com o maxLength do campo "Primeiro nome" em Configuracoes.jsx. Se
// for uma palavra só ("Renato"), primeiro_nome fica igual ao nome completo.
$nomeFinal = $nome !== '' ? $nome : $aluno['nome'];
$partes = explode(' ', trim($nomeFinal));
$primeiroNome = mb_substr($partes[0], 0, 11);

if ($ok && $nome !== '') {
    $stmtNome = $mysqli->prepare("UPDATE alunos SET nome = ?, apelido = ? WHERE email = ?");
    $stmtNome->bind_param('sss', $nome, $primeiroNome, $email);
    $stmtNome->execute();
    $stmtNome->close();
}
$mysqli->close();

if ($ok) {
    echo json_encode(['ok' => true, 'email' => $email, 'nome' => $nomeFinal, 'apelido' => $primeiroNome]);
} else {
    http_response_code(500);
    echo json_encode(['erro' => 'Erro ao salvar senha']);
}
