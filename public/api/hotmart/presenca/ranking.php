<?php
header('Content-Type: application/json');

// Cache de arquivo: ranking é global (não muda por usuário), então um único
// arquivo compartilhado serve pra todo mundo. Evita bater no MySQL (GROUP BY
// pesado em cima de presencas/alunos) a cada carregamento de página.
$cacheFile = sys_get_temp_dir() . '/ranking_cache.json';
if (file_exists($cacheFile) && time() - filemtime($cacheFile) < 300) {
    echo file_get_contents($cacheFile);
    exit;
}

require_once __DIR__ . '/../_conexao.php'; // define $mysqli (mysqli), não $pdo

try {
    // Ranking GLOBAL - todo mundo, não só o logado
    $sql = "SELECT
                a.nome,
                p.email,
                COUNT(DISTINCT DATE(p.created_at)) as dias,
                MAX(p.created_at) as ultimo
            FROM presencas p
            JOIN alunos a ON a.email = p.email
            GROUP BY p.email, a.nome
            ORDER BY dias DESC, ultimo DESC
            LIMIT 20";

    $resultado = $mysqli->query($sql);
    if ($resultado === false) {
        throw new Exception($mysqli->error);
    }
    $ranking = $resultado->fetch_all(MYSQLI_ASSOC);

    $json = json_encode($ranking);
    file_put_contents($cacheFile, $json);
    echo $json;

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['erro' => $e->getMessage()]);
}