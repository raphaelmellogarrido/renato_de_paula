<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, PATCH, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit; }

require __DIR__ . '/_conexao.php';
garantirEstruturaClube($mysqli); // cria alunos.apelido se ainda não existir

// GET ?email=... -> revalida o perfil (hoje só avatar_url) com o banco,
// fonte única da verdade. Existe porque comunidade_session (localStorage)
// só é escrita no login e logo após um upload feito NO PRÓPRIO aparelho —
// bug reportado 26/08: trocar a foto no computador e depois subir outra no
// celular fazia cada aparelho continuar mostrando sua própria cópia
// desatualizada, já que nenhum dos dois nunca mais consultava o servidor.
// useComunidadeAuth.js chama isso uma vez por carregamento do app pra
// resincronizar sem precisar de reload nem logout/login.
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $email = strtolower(trim($_GET['email'] ?? ''));
    if (!$email) {
        http_response_code(400);
        echo json_encode(['erro' => 'email obrigatório']);
        exit;
    }

    $stmt = $mysqli->prepare("SELECT avatar_versao FROM alunos WHERE email = ? LIMIT 1");
    $stmt->bind_param('s', $email);
    $stmt->execute();
    $aluno = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    if (!$aluno) {
        http_response_code(404);
        echo json_encode(['erro' => 'Email não encontrado']);
        exit;
    }

    echo json_encode(['ok' => true, 'avatar_url' => avatarUrlPublica($email, $aluno['avatar_versao'] ?? 0)]);
    exit;
}

// Contrato já usado por Configuracoes.jsx (card Perfil):
// PATCH { email, name, display_name }.
if ($_SERVER['REQUEST_METHOD'] !== 'PATCH') {
    http_response_code(405);
    echo json_encode(['erro' => 'Método não permitido']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);
$email = strtolower(trim($input['email'] ?? ''));
$nome = trim($input['name'] ?? '');
$apelido = trim($input['display_name'] ?? '');

if (!$email || mb_strlen($nome) < 3 || $apelido === '') {
    http_response_code(400);
    echo json_encode(['erro' => 'email, name (mín. 3) e display_name obrigatórios']);
    exit;
}

$check = $mysqli->prepare("SELECT 1 FROM alunos WHERE email = ? LIMIT 1");
$check->bind_param('s', $email);
$check->execute();
$existe = $check->get_result()->num_rows > 0;
$check->close();

if (!$existe) {
    http_response_code(404);
    echo json_encode(['erro' => 'Email não encontrado']);
    exit;
}

$stmt = $mysqli->prepare("UPDATE alunos SET nome = ?, apelido = ? WHERE email = ?");
$stmt->bind_param('sss', $nome, $apelido, $email);
$stmt->execute();
$stmt->close();

echo json_encode(['ok' => true]);
