<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit; }

require __DIR__ . '/_conexao.php';

// Contrato já usado por useMeditacaoHoje.js (botão "Meditei hoje"):
// POST { data: "AAAA-MM-DD", acao: "meditei", email, historico }.
// `historico` e `acao` só existem pra bater com o corpo que o front já
// manda — a fonte de verdade da presença/streak é só `presencas.data` no
// banco, não o array; ignoramos os dois campos com segurança.
//
// GET ?email= devolve o histórico completo de presenças do usuário — o
// front usa isso pra se recuperar se o localStorage tiver sido perdido
// (troca de aparelho/navegador, storage limpo, modo privado, eviction em
// celular), sempre fazendo merge com o que já está local, nunca
// sobrescrevendo.
$metodo = $_SERVER['REQUEST_METHOD'];

if ($metodo === 'GET') {
    $email = strtolower(trim($_GET['email'] ?? ''));
    if (!$email) {
        http_response_code(400);
        echo json_encode(['erro' => 'email obrigatório']);
        exit;
    }

    $stmt = $mysqli->prepare("SELECT data FROM presencas WHERE email = ? ORDER BY data ASC");
    $stmt->bind_param('s', $email);
    $stmt->execute();
    $res = $stmt->get_result();
    $historico = [];
    while ($row = $res->fetch_assoc()) {
        $historico[] = $row['data'];
    }
    $stmt->close();

    echo json_encode(['ok' => true, 'historico' => $historico, 'streak' => calcularStreakEmail($mysqli, $email)]);
    exit;
}

if ($metodo === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    $email = strtolower(trim($input['email'] ?? ''));
    $data = trim($input['data'] ?? '');

    if (!$email || !preg_match('/^\d{4}-\d{2}-\d{2}$/', $data)) {
        http_response_code(400);
        echo json_encode(['erro' => 'email e data (AAAA-MM-DD) obrigatórios']);
        exit;
    }

    // Upsert idempotente: clicar duas vezes no mesmo dia não duplica linha nem
    // zera `minutos` já acumulado por outra fonte (ex: aulas-raiz/progresso.php).
    $stmt = $mysqli->prepare(
        "INSERT INTO presencas (email, data, minutos) VALUES (?, ?, 0)
         ON DUPLICATE KEY UPDATE data = VALUES(data)"
    );
    $stmt->bind_param('ss', $email, $data);
    $stmt->execute();
    $stmt->close();

    // Invalida os caches em disco que dependem de `presencas` — sem isso o
    // Ranking de Presença (ranking.php, cache de 5min) e o "Meditando
    // junto" (pulso.php, cache de 60s) continuavam devolvendo a contagem
    // velha por até 5min mesmo com o front refazendo o fetch na hora
    // (era por isso que só um CTRL+F5 bem depois "resolvia": o cache já
    // tinha expirado sozinho até lá, não porque o F5 limpava algo).
    // @ silencia warning se o arquivo já não existir (race com outra
    // requisição invalidando ao mesmo tempo) — não é erro, é só best-effort.
    @unlink(sys_get_temp_dir() . '/ranking_cache_v2.json');
    @unlink(sys_get_temp_dir() . '/comunidade_pulso_cache.json');

    echo json_encode(['ok' => true, 'streak' => calcularStreakEmail($mysqli, $email)]);
    exit;
}

http_response_code(405);
echo json_encode(['erro' => 'Método não permitido']);
