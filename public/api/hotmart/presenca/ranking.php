<?php
header('Content-Type: application/json');

// Cache de arquivo: ranking é global (não muda por usuário), então um único
// arquivo compartilhado serve pra todo mundo. Evita bater no MySQL (GROUP BY
// pesado em cima de presencas/alunos) a cada carregamento de página.
//
// Nome "_v2": versão anterior do JOIN (sem LOWER/TRIM, INNER JOIN) descartava
// silenciosamente qualquer email de presencas que não batesse EXATAMENTE
// (case/espaço) com alunos.email — o cache antigo ficou com esse ranking
// incompleto gravado em disco. Trocar o nome invalida esse cache velho sem
// precisar de acesso ao servidor pra apagar o arquivo na mão.
$cacheFile = sys_get_temp_dir() . '/ranking_cache_v2.json';
if (file_exists($cacheFile) && time() - filemtime($cacheFile) < 300) {
    echo file_get_contents($cacheFile);
    exit;
}

require_once __DIR__ . '/../_conexao.php'; // define $mysqli (mysqli), não $pdo

try {
    // Ranking GLOBAL - todo mundo, não só o logado. LEFT JOIN (não INNER) +
    // LOWER(TRIM()) dos dois lados: um email de presencas que não bate
    // EXATAMENTE (maiúscula/minúscula ou espaço) com alunos.email sumia do
    // ranking inteiro com o INNER JOIN antigo — era o bug real (3 emails
    // com presença no banco, só 1 aparecia no front).
    //
    // SEM LIMIT aqui de propósito: este endpoint tem dois consumidores —
    // ColunaEncontros.jsx (mostra só o Top 5, corta no frontend com
    // .slice(0,5)) e useSequenciaMeditacao.js (usa a lista INTEIRA pra
    // calcular o percentil "Você está entre os X% mais consistentes" em
    // Sequencia.jsx, comparando o streak do usuário contra todo mundo).
    // Um LIMIT 5 aqui corrigiria o widget de ranking mas quebraria
    // silenciosamente esse percentil, que passaria a comparar cada usuário
    // só contra o Top 5.
    $resultado = $mysqli->query("
        SELECT a.nome, p.email, COUNT(DISTINCT DATE(p.created_at)) as dias
        FROM presencas p
        LEFT JOIN alunos a ON LOWER(TRIM(a.email)) = LOWER(TRIM(p.email))
        GROUP BY p.email, a.nome
        ORDER BY dias DESC, a.nome ASC
    ");
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
