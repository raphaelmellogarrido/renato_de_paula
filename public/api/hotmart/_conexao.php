<?php
// Conexão compartilhada com o MySQL da Hostinger (banco u790959747_clube).
// Lê credenciais de config.php (arquivo fora do Git, subido manualmente no
// servidor — ver config.example.php) e cai pra variáveis de ambiente
// (getenv) se config.php não existir. Nunca hardcoda senha aqui.
//
// Uso: require __DIR__ . '/_conexao.php'; (ou '../_conexao.php' de uma
// subpasta) e use $mysqli. Este arquivo não é acessível direto via URL
// (bloqueado no .htaccess desta pasta).

// Fuso fixo em Brasília — o servidor da Hostinger normalmente roda em UTC,
// então sem isso `new DateTime('today')` (usado em calcularStreakEmail) e
// qualquer CURDATE()/NOW() em SQL (aulas.php, aulas-raiz/progresso.php)
// calculam "hoje" adiantado em relação ao usuário entre ~21h e meia-noite
// BRT, criando/lendo linha de presença com a data errada.
date_default_timezone_set('America/Sao_Paulo');

if (file_exists(__DIR__ . '/config.php')) {
    require __DIR__ . '/config.php';
} else {
    if (!defined('DB_HOST')) define('DB_HOST', getenv('DB_HOST') ?: 'localhost');
    if (!defined('DB_USER')) define('DB_USER', getenv('DB_USER') ?: '');
    if (!defined('DB_PASS')) define('DB_PASS', getenv('DB_PASS') ?: '');
    if (!defined('DB_NAME')) define('DB_NAME', getenv('DB_NAME') ?: 'u790959747_clube');
}

// Chave da área administrativa (ver public/api/admin/encontro.php) — mesmo
// padrão de fallback getenv() acima, mas FORA do if/else de config.php:
// precisa valer tanto quando config.php existe (produção normalmente
// define ADMIN_SECRET lá, junto de DB_*) quanto quando não existe. Se não
// for configurada em lugar nenhum, fica '' e o endpoint admin recusa tudo
// (nunca autentica com chave vazia).
if (!defined('ADMIN_SECRET')) {
    define('ADMIN_SECRET', getenv('ADMIN_SECRET') ?: '');
}

$mysqli = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);
if ($mysqli->connect_error) {
    http_response_code(500);
    header('Content-Type: application/json');
    echo json_encode(['erro' => 'Erro banco: ' . $mysqli->connect_error]);
    exit;
}
$mysqli->set_charset('utf8mb4');
// Mesmo motivo do date_default_timezone_set acima, só que pro lado do
// MySQL: garante que CURDATE()/NOW() dentro de SQL (não só em PHP) também
// resolvem pra data de Brasília, não UTC.
$mysqli->query("SET time_zone = '-03:00'");

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

    // Comentários por aula (ComentariosFeed.jsx) — permanente, não faz parte
    // de nenhum reset semanal (DesafioSemana etc.). aula_id sem FK de
    // propósito: aceita tanto id de vídeo do curso mock (Aula.jsx, ex:
    // "boas-vindas") quanto arquivo do curso real (AulasMeditacaoRaiz.jsx,
    // ex: "dia1.2.mp4"), sem exigir uma tabela de aulas unificada.
    $mysqli->query(
        "CREATE TABLE IF NOT EXISTS comentarios (
            id INT AUTO_INCREMENT PRIMARY KEY,
            email VARCHAR(255) NOT NULL,
            nome VARCHAR(255),
            aula_id VARCHAR(100) NOT NULL DEFAULT 'geral',
            comentario TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            INDEX(aula_id),
            INDEX(created_at)
        )"
    );

    // Recuperação de senha (esqueceu-senha.php / redefinir-senha.php).
    // Token é a própria PK (bin2hex(random_bytes(32)) — 64 chars hex, cabe
    // em 128 mas deixamos folga). expires_at: 1h a partir da geração.
    $mysqli->query(
        "CREATE TABLE IF NOT EXISTS password_resets (
            email VARCHAR(255) NOT NULL,
            token VARCHAR(128) NOT NULL PRIMARY KEY,
            expires_at DATETIME NOT NULL,
            INDEX(email)
        )"
    );
    // Limpeza oportunista de tokens vencidos — sem cron, só aproveita que
    // toda request já passa por aqui (mesmo espírito idempotente do resto
    // desta função).
    $mysqli->query("DELETE FROM password_resets WHERE expires_at < NOW()");

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
