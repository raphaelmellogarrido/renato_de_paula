<?php
// Conexão compartilhada com o MySQL da Hostinger (banco u790959747_clube).
// Lê credenciais de config.php (arquivo fora do Git, subido manualmente no
// servidor — ver config.example.php) e cai pra variáveis de ambiente
// (getenv) se config.php não existir. Nunca hardcoda senha aqui.
//
// Uso: require __DIR__ . '/_conexao.php'; (ou '../_conexao.php' de uma
// subpasta) e use $mysqli. Este arquivo não é acessível direto via URL
// (bloqueado no .htaccess desta pasta).

if (file_exists(__DIR__ . '/config.php')) {
    require __DIR__ . '/config.php';
} else {
    if (!defined('DB_HOST')) define('DB_HOST', getenv('DB_HOST') ?: 'localhost');
    if (!defined('DB_USER')) define('DB_USER', getenv('DB_USER') ?: '');
    if (!defined('DB_PASS')) define('DB_PASS', getenv('DB_PASS') ?: '');
    if (!defined('DB_NAME')) define('DB_NAME', getenv('DB_NAME') ?: 'u790959747_clube');
}

$mysqli = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);
if ($mysqli->connect_error) {
    http_response_code(500);
    header('Content-Type: application/json');
    echo json_encode(['erro' => 'Erro banco: ' . $mysqli->connect_error]);
    exit;
}
$mysqli->set_charset('utf8mb4');

// Cria/ajusta o que os endpoints novos precisam, sem exigir SQL manual no
// phpMyAdmin — mesmo padrão de auto-provisionamento que webhook.php e
// live/reservas.php já usam neste repo. Idempotente: seguro chamar em
// toda requisição.
function garantirEstruturaClube(mysqli $mysqli): void
{
    $mysqli->query(
        "CREATE TABLE IF NOT EXISTS progresso_aulas_raiz (
            email VARCHAR(255) NOT NULL,
            arquivo VARCHAR(50) NOT NULL,
            dia TINYINT NOT NULL DEFAULT 0,
            progresso_percent TINYINT NOT NULL DEFAULT 0,
            ultima_posicao INT NOT NULL DEFAULT 0,
            assistida TINYINT(1) NOT NULL DEFAULT 0,
            completada_em DATETIME NULL,
            PRIMARY KEY (email, arquivo)
        )"
    );

    $temApelido = $mysqli->query(
        "SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'alunos' AND COLUMN_NAME = 'apelido'"
    );
    if ($temApelido && $temApelido->num_rows === 0) {
        $mysqli->query("ALTER TABLE alunos ADD COLUMN apelido VARCHAR(30) NULL AFTER nome");
    }
}

// Streak real (dias consecutivos até hoje/ontem) calculado a partir das
// datas em `presencas` — mesmo algoritmo que useSequenciaMeditacao.js já
// faz no front: conta pra trás a partir de hoje; se hoje ainda não tem
// presença, a contagem começa em ontem; qualquer buraco quebra a sequência.
function calcularStreakEmail(mysqli $mysqli, string $email): int
{
    $stmt = $mysqli->prepare("SELECT data FROM presencas WHERE email = ? ORDER BY data DESC");
    $stmt->bind_param('s', $email);
    $stmt->execute();
    $res = $stmt->get_result();
    $datas = [];
    while ($row = $res->fetch_assoc()) {
        $datas[$row['data']] = true;
    }
    $stmt->close();

    if (!$datas) return 0;

    $cursor = new DateTime('today');
    if (!isset($datas[$cursor->format('Y-m-d')])) {
        $cursor->modify('-1 day');
    }
    $streak = 0;
    while (isset($datas[$cursor->format('Y-m-d')])) {
        $streak++;
        $cursor->modify('-1 day');
    }
    return $streak;
}
