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

// SMTP da caixa comunidade@ (ver public/api/admin/teste-emails.php,
// enviarConviteComunidade). Fallback pra getenv() só por consistência com
// o resto deste arquivo — mas o painel Hostinger tem um bug documentado
// que corrompe senha com caractere especial (HANDOFF.md, "Problema 2"),
// então RECOMENDADO configurar direto em config.php, nunca só no painel.
if (!defined('SMTP_COMUNIDADE_USER')) {
    define('SMTP_COMUNIDADE_USER', getenv('SMTP_COMUNIDADE_USER') ?: 'comunidade@renatodepaula.com');
}
if (!defined('SMTP_COMUNIDADE_SENHA')) {
    define('SMTP_COMUNIDADE_SENHA', getenv('SMTP_COMUNIDADE_SENHA') ?: '');
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
//
// Perf: essa função sozinha é ~7 round-trips de rede pro MySQL (4x CREATE
// TABLE IF NOT EXISTS, 2x SELECT em INFORMATION_SCHEMA.COLUMNS, 1x DELETE)
// — em hospedagem compartilhada isso pesava em TODA request de
// comentarios.php e aulas-raiz/progresso.php, mesmo sem nenhuma mudança de
// schema pra fazer (era o gargalo real por trás dos ~10s de carregamento
// de "Sua prática hoje"/comentários, não falta de índice). Por isso, abaixo
// de $estruturaClubeVersao: escreve um arquivo-marcador na primeira vez que
// roda com sucesso e, enquanto ele existir, pula a função inteira com um
// único file_exists() (1 stat, não bate no banco). Corrida entre requests
// concorrentes logo após um deploy é inofensiva — todo CREATE/ALTER aqui já
// é condicional/idempotente. Pra forçar rerun depois de mudar o schema
// nesta função, basta subir o arquivo com $estruturaClubeVersao
// incrementada (não depende de lembrar de apagar o marcador no servidor).
function garantirEstruturaClube(mysqli $mysqli): void
{
    // (não pode ser `const` aqui dentro — PHP só aceita const no nível do
    // arquivo/classe, não dentro do corpo de uma função)
    $estruturaClubeVersao = 1;
    $marcador = sys_get_temp_dir() . '/comunidade_estrutura_v' . $estruturaClubeVersao . '.ok';
    if (file_exists($marcador)) {
        return;
    }

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

    // Feed da Comunidade (Clube Presença) — mural real, consumido por
    // FeedComunidade.jsx via public/api/comunidade/posts.php. Substitui o
    // mock fixo (FEED_COMUNIDADE em mockData.js, removido) que mostrava
    // sempre os mesmos 4 posts fake pra todo mundo — agora tabela vazia =
    // feed vazio de verdade, sem inventar autor nenhum.
    $mysqli->query(
        "CREATE TABLE IF NOT EXISTS posts_comunidade (
            id INT AUTO_INCREMENT PRIMARY KEY,
            email VARCHAR(255) NOT NULL,
            nome VARCHAR(255) NOT NULL DEFAULT 'Aluno',
            texto TEXT NOT NULL,
            curtidas INT NOT NULL DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
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

    // Controle manual da live (seção "Controle da Live" em AdminMeditacao.jsx,
    // consumida por public/api/live/status.php + public/api/admin/live-controle.php).
    // Trava o botão "Entrar na live" em ColunaEncontros.jsx até o professor
    // liberar, independente de link_live já estar preenchido. Mesmo padrão de
    // ALTER condicional do apelido acima. Default 0 (travado): a coluna nunca
    // libera sozinha na primeira vez que é criada.
    $temLiveLiberada = $mysqli->query(
        "SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'config_encontro' AND COLUMN_NAME = 'live_liberada'"
    );
    if ($temLiveLiberada && $temLiveLiberada->num_rows === 0) {
        $mysqli->query("ALTER TABLE config_encontro ADD COLUMN live_liberada TINYINT(1) NOT NULL DEFAULT 0");
    }

    // Acesso de Teste (painel /admin, seção "Acesso de Teste") — lista de
    // convite/auditoria dos e-mails liberados manualmente sem compra na
    // Hotmart. A liberação de fato acontece em `alunos` (status='teste'),
    // lida por login.php/register.php/check.php igual a um comprador
    // normal (status='ativo') — ver public/api/admin/teste-emails.php.
    $mysqli->query(
        "CREATE TABLE IF NOT EXISTS comunidade_teste_emails (
            id INT AUTO_INCREMENT PRIMARY KEY,
            email VARCHAR(255) NOT NULL UNIQUE,
            nome VARCHAR(255) NULL,
            criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
            criado_por VARCHAR(100)
        )"
    );

    // Grava o marcador por último — se alguma query acima falhar/lançar, a
    // função roda de novo na próxima request em vez de "esquecer" que faltou
    // algo. @ silencia só erro de permissão/disco no temp dir: nesse caso
    // raro, cai de novo em file_exists()===false na próxima request e
    // repete o setup (pior caso = sem cache, não quebra nada).
    @file_put_contents($marcador, (string) time());
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
