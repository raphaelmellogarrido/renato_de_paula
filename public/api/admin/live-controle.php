<?php
// Liga/desliga manualmente o botão "Entrar na live" que o aluno vê em
// /comunidade (seção "Controle da Live" em AdminMeditacao.jsx) —
// independente de link_live já estar preenchido (ver
// public/api/admin/encontro.php). Protegido por X-Admin-Secret, mesmo
// padrão de admin/encontro.php. Público (sem auth) é
// public/api/live/status.php.
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-Admin-Secret');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') exit;

require __DIR__ . '/../hotmart/_conexao.php';
garantirEstruturaClube($mysqli); // garante a coluna live_liberada em config_encontro

$chaveFornecida = $_SERVER['HTTP_X_ADMIN_SECRET'] ?? '';
// ADMIN_SECRET vazio (não configurado no servidor) nunca autentica, mesmo
// que o front mande header vazio também.
if (ADMIN_SECRET === '' || !hash_equals(ADMIN_SECRET, $chaveFornecida)) {
    http_response_code(401);
    echo json_encode(['erro' => 'Não autorizado']);
    exit;
}

function statusLiveAtual(mysqli $mysqli): array
{
    $res = $mysqli->query("SELECT live_liberada FROM config_encontro WHERE id = 1");
    $linha = $res ? $res->fetch_assoc() : null;
    return ['liberada' => $linha ? (int) $linha['live_liberada'] : 0];
}

$metodo = $_SERVER['REQUEST_METHOD'];

if ($metodo === 'GET') {
    echo json_encode(array_merge(['ok' => true], statusLiveAtual($mysqli)));
    exit;
}

if ($metodo === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true) ?? [];
    $liberada = !empty($input['liberada']) ? 1 : 0;

    $stmt = $mysqli->prepare("UPDATE config_encontro SET live_liberada = ? WHERE id = 1");
    $stmt->bind_param('i', $liberada);
    $stmt->execute();
    $stmt->close();

    echo json_encode(array_merge(['ok' => true], statusLiveAtual($mysqli)));
    exit;
}

http_response_code(405);
echo json_encode(['erro' => 'Método não permitido']);
