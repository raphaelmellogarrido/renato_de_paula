<?php
// "Pulso" da comunidade (Clube Presença) — GET /api/comunidade/pulso.php.
// Alimenta o card "Meditando junto" (MeditandoJunto.jsx), coluna do meio
// do dashboard, logo abaixo de "Sua Jornada". 3 números 100% reais, nada
// mockado:
//   meditaram_hoje    -> alunos distintos com presença hoje (presencas.data)
//   partilhas_hoje    -> comentários hoje (comentarios.created_at) — ANTES
//     contava posts_comunidade, mas esse mural saiu do ar (FeedComunidade
//     não é mais montado em Dashboard.jsx) e nada grava lá desde então, por
//     isso sempre mostrava 0 mesmo com gente comentando. A única forma real
//     de "partilhar" hoje é comentar em algum mural (comentarios.php),
//     então conta a tabela `comentarios` inteira (todos os aula_id: "Sua
//     prática hoje" e o mural "geral" das Aulas), não só um.
//   total_dias_somados -> soma do total de dias de presença de CADA aluno
//     (não streak consecutivo — total de dias distintos que já meditou,
//     igual à coluna "dias" do Ranking de Presença em
//     hotmart/presenca/ranking.php). TINHA que ser essa mesma definição:
//     é a mesma soma que aparece na direita da tela (Ranking), só que
//     somada num card só — usar streak consecutivo aqui fazia esse total
//     divergir do Ranking sempre que alguém tinha dias de presença só que
//     não emendados (ex: Pedro com 2 dias mas sem meditar hoje/ontem caía
//     pra streak 0 e sumia da soma, mesmo aparecendo com 2 no Ranking).
//     Não precisa de CONVERT_TZ em nenhuma dessas queries: a sessão MySQL já
//     roda fixa em -03:00 (ver `SET time_zone` em _conexao.php), então
//     CURDATE()/created_at já resolvem em horário de Brasília.
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
    "SELECT COUNT(*) AS n FROM comentarios WHERE DATE(created_at) = CURDATE()"
)->fetch_assoc()['n'];

// Uma query só (não 1 por aluno): lê email+data de todas as presenças e
// agrupa em PHP pra contar dias distintos por aluno — mesma fonte
// (`presencas`) e mesma unidade ("dias distintos por email") que
// hotmart/presenca/ranking.php usa pro Ranking, só que sem o JOIN com
// `alunos` (não precisa de nome aqui, só da soma).
$res = $mysqli->query("SELECT email, data FROM presencas ORDER BY email, data DESC");
$datasPorEmail = [];
while ($row = $res->fetch_assoc()) {
    $datasPorEmail[$row['email']][$row['data']] = true;
}

// Soma do total de dias de presença de todo mundo (não streak consecutivo
// — ver comentário no topo do arquivo). Cada array em $datasPorEmail já
// tem só datas distintas (chave do array), então count() é exatamente o
// mesmo "dias" que o Ranking mostra pra esse aluno.
$totalDiasSomados = array_sum(array_map('count', $datasPorEmail));

$json = json_encode([
    'ok' => true,
    'meditaram_hoje' => $meditaramHoje,
    'partilhas_hoje' => $partilhasHoje,
    'total_dias_somados' => $totalDiasSomados,
]);

file_put_contents($cacheFile, $json);
echo $json;
