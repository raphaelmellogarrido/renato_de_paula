<?php
// Feed da Comunidade (Clube Presença) — GET /api/comunidade/posts
// Substitui o mock fixo (FEED_COMUNIDADE em mockData.js, removido) que
// sempre mostrava os mesmos 4 posts fake pra todo mundo. Tabela vazia
// -> resposta com itens:[] -> FeedComunidade.jsx mostra o empty state
// "Seja o primeiro a compartilhar sua presença hoje", nunca posts
// inventados no front. Mesmo padrão de conexão/CORS/self-provisionamento
// de public/api/hotmart/*.php.
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit; }

require __DIR__ . '/../hotmart/_conexao.php';
garantirEstruturaClube($mysqli); // cria a tabela posts_comunidade se ainda não existir

// GET ?page=&per_page=  -> { itens:[{id,nome,texto,curtidas,created_at}], total, page, pages }
$metodo = $_SERVER['REQUEST_METHOD'];

if ($metodo !== 'GET') {
    http_response_code(405);
    echo json_encode(['erro' => 'Método não permitido']);
    exit;
}

$page = max(1, intval($_GET['page'] ?? 1));
// Clampa entre 1 e 50 pra ninguém pedir a tabela inteira numa página só.
$porPagina = min(50, max(1, intval($_GET['per_page'] ?? 20)));
$offset = ($page - 1) * $porPagina;

$total = (int) $mysqli->query("SELECT COUNT(*) AS total FROM posts_comunidade")->fetch_assoc()['total'];
$pages = max(1, (int) ceil($total / $porPagina));
if ($page > $pages) {
    $page = $pages;
    $offset = ($page - 1) * $porPagina;
}

$stmt = $mysqli->prepare(
    "SELECT id, nome, texto, curtidas, created_at FROM posts_comunidade
     ORDER BY created_at DESC LIMIT ? OFFSET ?"
);
$stmt->bind_param('ii', $porPagina, $offset);
$stmt->execute();
$res = $stmt->get_result();
$itens = [];
while ($row = $res->fetch_assoc()) {
    $itens[] = [
        'id' => (int) $row['id'],
        'nome' => $row['nome'] !== null && $row['nome'] !== '' ? $row['nome'] : 'Aluno',
        'texto' => $row['texto'],
        'curtidas' => (int) $row['curtidas'],
        'created_at' => $row['created_at'], // já em horário de Brasília (SET time_zone em _conexao.php)
    ];
}
$stmt->close();

echo json_encode(['ok' => true, 'itens' => $itens, 'total' => $total, 'page' => $page, 'pages' => $pages]);
