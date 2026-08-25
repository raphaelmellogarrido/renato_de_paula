<?php
// Frase Motivacional da Semana — leitura pública (sem auth), consumida pelo
// card FraseMotivacionalSemana.jsx (dashboard da comunidade) e também usada
// pelo /admin (AdminMeditacao.jsx) pra pré-carregar o form. Quem edita é
// update_frase_semana.php (protegido por X-Admin-Secret). Mesmo padrão de
// public/api/desafios-semana.php: só leitura, público, sem provisionar
// tabela (frase_motivacional_semana já existe no banco, criada manualmente).
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') exit;

require __DIR__ . '/hotmart/_conexao.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['erro' => 'Método não permitido']);
    exit;
}

// ORDER BY id DESC LIMIT 1: update_frase_semana.php faz INSERT (não UPDATE)
// a cada salvamento do admin, pra manter histórico — a última linha
// inserida é sempre a frase vigente.
$res = $mysqli->query("SELECT frase, subfrase FROM frase_motivacional_semana ORDER BY id DESC LIMIT 1");
$linha = $res ? $res->fetch_assoc() : null;

// Defensivo: tabela vazia (nenhuma frase salva ainda) devolve null em vez
// de 500 — o front cai pro texto padrão dele mesmo (mesmo padrão de
// public/api/encontro.php).
echo json_encode([
    'ok' => true,
    'frase' => $linha['frase'] ?? null,
    'subfrase' => $linha['subfrase'] ?? null,
]);
