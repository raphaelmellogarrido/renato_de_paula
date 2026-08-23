<?php
// "Pulso" da comunidade (Clube Presença) — GET /api/comunidade/pulso.php.
// Alimenta o card "Meditando junto" (MeditandoJunto.jsx), coluna do meio
// do dashboard, logo abaixo de "Sua Jornada". 3 números 100% reais, nada
// mockado:
//   meditaram_hoje  -> alunos distintos com presença hoje (presencas.data)
//   partilhas_hoje  -> posts no mural hoje (posts_comunidade.created_at)
//   total_sequencia / maior_sequencia / qtd_7_mais -> streak de CADA aluno
//     (mesmo algoritmo de calcularStreakEmail em _conexao.php: dias
//     consecutivos pra trás a partir de hoje/ontem, qualquer buraco
//     quebra), agregado pra não expor o "X em sequência de Y dias" que
//     quebra visualmente quando os alunos têm sequências de tamanhos
//     diferentes.
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit; }

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['erro' => 'Método não permitido']);
    exit;
}

require __DIR__ . '/../hotmart/_conexao.php';
garantirEstruturaClube($mysqli); // garante posts_comunidade (presencas já existe desde sempre)

// Cache de arquivo compartilhado por 60s (mesmo padrão de
// hotmart/presenca/ranking.php, TTL menor aqui porque o front repete o
// fetch a cada 60s) — evita rodar o loop de streak de todo mundo (uma
// query + O(n) em PHP) a cada carregamento de página.
header('Cache-Control: public, max-age=60');
$cacheFile = sys_get_temp_dir() . '/comunidade_pulso_cache.json';
if (file_exists($cacheFile) && time() - filemtime($cacheFile) < 60) {
    echo file_get_contents($cacheFile);
    exit;
}

$meditaramHoje = (int) $mysqli->query(
    "SELECT COUNT(DISTINCT email) AS n FROM presencas WHERE data = CURDATE()"
)->fetch_assoc()['n'];

$partilhasHoje = (int) $mysqli->query(
    "SELECT COUNT(*) AS n FROM posts_comunidade WHERE DATE(created_at) = CURDATE()"
)->fetch_assoc()['n'];

// Uma query só (não 1 por aluno) pra montar o streak de todo mundo: lê
// email+data de todas as presenças e agrupa em PHP, igual
// hotmart/presenca/ranking.php já faz pro ranking global.
$res = $mysqli->query("SELECT email, data FROM presencas ORDER BY email, data DESC");
$datasPorEmail = [];
while ($row = $res->fetch_assoc()) {
    $datasPorEmail[$row['email']][$row['data']] = true;
}

$totalSequencia = 0; // alunos com streak >= 2 (1 dia sozinho não é "sequência")
$maiorSequencia = 0;
$qtd7Mais = 0;
$hoje = new DateTime('today');

foreach ($datasPorEmail as $marcados) {
    $cursor = clone $hoje;
    if (!isset($marcados[$cursor->format('Y-m-d')])) {
        $cursor->modify('-1 day');
    }
    $streak = 0;
    while (isset($marcados[$cursor->format('Y-m-d')])) {
        $streak++;
        $cursor->modify('-1 day');
    }

    if ($streak >= 2) $totalSequencia++;
    if ($streak >= 7) $qtd7Mais++;
    if ($streak > $maiorSequencia) $maiorSequencia = $streak;
}

$json = json_encode([
    'ok' => true,
    'meditaram_hoje' => $meditaramHoje,
    'partilhas_hoje' => $partilhasHoje,
    'total_sequencia' => $totalSequencia,
    'maior_sequencia' => $maiorSequencia,
    'qtd_7_mais' => $qtd7Mais,
]);

file_put_contents($cacheFile, $json);
echo $json;
