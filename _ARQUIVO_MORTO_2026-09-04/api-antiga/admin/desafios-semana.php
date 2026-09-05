<?php
// Leitura/edição dos 3 itens do card "Desafio da Semana" pelo admin
// (/admin-meditacao, seção "Desafio da Semana"). Protegido por
// X-Admin-Secret, mesmo padrão de public/api/admin/encontro.php. Público
// (sem auth) é public/api/desafios-semana.php.
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

function buscarDesafios(mysqli $mysqli): array
{
    $res = $mysqli->query("SELECT id, ordem, titulo, descricao FROM desafio_config ORDER BY ordem");
    return $res ? $res->fetch_all(MYSQLI_ASSOC) : [];
}

$metodo = $_SERVER['REQUEST_METHOD'];

if ($metodo === 'GET') {
    echo json_encode(['ok' => true, 'itens' => buscarDesafios($mysqli)]);
    exit;
}

if ($metodo === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true) ?? [];
    $itens = is_array($input['itens'] ?? null) ? $input['itens'] : [];

    // UPDATE, nunca INSERT: as 3 linhas de desafio_config já existem
    // (ids fixos 1, 2, 3) — aqui só atualiza título/descrição de cada uma.
    $stmt = $mysqli->prepare("UPDATE desafio_config SET titulo = ?, descricao = ? WHERE id = ?");
    foreach ($itens as $item) {
        $id = (int) ($item['id'] ?? 0);
        if (!$id) continue;
        $titulo = trim($item['titulo'] ?? '');
        $descricao = trim($item['descricao'] ?? '');
        $stmt->bind_param('ssi', $titulo, $descricao, $id);
        $stmt->execute();
    }
    $stmt->close();

    echo json_encode(['ok' => true, 'itens' => buscarDesafios($mysqli)]);
    exit;
}

http_response_code(405);
echo json_encode(['erro' => 'Método não permitido']);
