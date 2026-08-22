<?php
// Leitura/edição do card "Próximo encontro ao vivo" pelo admin
// (/admin-meditacao, seção "Encontro ao Vivo"). Protegido por
// X-Admin-Secret — ver ADMIN_SECRET em _conexao.php e o comentário sobre
// "mesma auth do admin" em config.example.php. Público (sem auth) é
// public/api/encontro.php.
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-Admin-Secret');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') exit;

require __DIR__ . '/../hotmart/_conexao.php';

$chaveFornecida = $_SERVER['HTTP_X_ADMIN_SECRET'] ?? '';
// ADMIN_SECRET vazio (não configurado no servidor) nunca autentica, mesmo
// que o front mande header vazio também.
if (ADMIN_SECRET === '' || !hash_equals(ADMIN_SECRET, $chaveFornecida)) {
    http_response_code(401);
    echo json_encode(['erro' => 'Não autorizado']);
    exit;
}

function buscarConfigEncontro(mysqli $mysqli): array
{
    $res = $mysqli->query("SELECT data_texto, horario, linha1, linha2, linha3, link_live FROM config_encontro WHERE id = 1");
    $linha = $res ? $res->fetch_assoc() : null;
    return $linha ?: ['data_texto' => '', 'horario' => '', 'linha1' => '', 'linha2' => '', 'linha3' => '', 'link_live' => ''];
}

$metodo = $_SERVER['REQUEST_METHOD'];

if ($metodo === 'GET') {
    echo json_encode(array_merge(['ok' => true], buscarConfigEncontro($mysqli)));
    exit;
}

if ($metodo === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true) ?? [];
    $data_texto = trim($input['data_texto'] ?? '');
    $horario = trim($input['horario'] ?? '');
    $linha1 = trim($input['linha1'] ?? '');
    $linha2 = trim($input['linha2'] ?? '');
    $linha3 = trim($input['linha3'] ?? '');
    $link_live = trim($input['link_live'] ?? '');

    $stmt = $mysqli->prepare(
        "UPDATE config_encontro SET data_texto = ?, horario = ?, linha1 = ?, linha2 = ?, linha3 = ?, link_live = ? WHERE id = 1"
    );
    $stmt->bind_param('ssssss', $data_texto, $horario, $linha1, $linha2, $linha3, $link_live);
    $stmt->execute();
    $stmt->close();

    echo json_encode(array_merge(['ok' => true], buscarConfigEncontro($mysqli)));
    exit;
}

http_response_code(405);
echo json_encode(['erro' => 'Método não permitido']);
