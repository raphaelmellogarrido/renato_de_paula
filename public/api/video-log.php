<?php
// Log de progresso de vídeo (25/50/75/95%) — chamado por
// registrarProgressoVideo() em src/utils/loadThirdParty.js via
// fetch(..., { keepalive: true }). Grava IP + vídeo + % + página num
// arquivo texto pra consulta manual no Gerenciador de Arquivos da
// Hostinger (a Meta não devolve IP no evento do Pixel).
//
// POST JSON, não GET (trocado em 01/09): o front chamava GET
// /api/video-log SEM ".php" — funcionava só se o Apache tivesse
// MultiViews ligado pra resolver a extensão sozinho. Isso parou de
// resolver em algum momento (sem mudança de código) e o log ficou
// travado, sem nenhum erro visível pro usuário (fetch keepalive, ninguém
// olha a resposta). Agora chama /api/video-log.php direto — mesmo arquivo
// que o rewrite em public/.htaccess já reforça explicitamente (regra 0) —
// então não depende mais de negociação de extensão nenhuma.
// $_GET continua aceito como fallback só pra não quebrar uma aba antiga
// com o bundle anterior ainda em cache até o próximo load.
//
// ATENÇÃO (ver HANDOFF.md, "Vídeos" / .gitignore): a Hostinger recreia a
// pasta do app (public_html) do zero a cada `git push` + deploy, apagando
// qualquer arquivo gerado em runtime que não veio do Git — mesmo motivo
// que fez avatar/foto de comentário deste projeto migrarem pra dentro do
// MySQL (avatar_blob/image_blob). Por isso video-log.txt NÃO fica dentro
// de public_html: vive em caminho absoluto irmão de meditacao-videos e
// private, fora da árvore que a Hostinger recria no deploy — sobrevive a
// pushes futuros. Diferente da tentativa que falhou com VIDEOS_DIR (ver
// HANDOFF.md, Problema 1): aquele era o processo Node.js sandboxed
// (Node.js Selector/Passenger) sem acesso a pastas fora da própria app;
// aqui é PHP rodando dentro do public_html via Apache/suexec, que enxerga
// o restante do home do usuário normalmente.
$logFile = '/home/u790959747/domains/renatodepaula.com/video-logs-data/video-log.txt';
@mkdir(dirname($logFile), 0755, true);
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// IP real do visitante, em ordem de confiança:
// 1. CF-Connecting-IP — só existe se a requisição passar pela Cloudflare
//    na frente da Hostinger; é a própria Cloudflare quem preenche esse
//    header com o IP do client, não dá pra falsificar vindo de fora.
// 2. X-Forwarded-For — pode vir como cadeia "client, proxy1, proxy2"; o
//    primeiro item é o mais próximo do visitante original. Diferente do
//    CF-Connecting-IP, um client pode forjar esse header direto (sem
//    passar por proxy nenhum), por isso só é usado se o de cima não
//    resolveu.
// 3. REMOTE_ADDR — fallback de sempre: é a conexão TCP direta (sem proxy
//    na frente, já é o IP do visitante; com proxy/Cloudflare, é o IP
//    deles, não do visitante — daí a prioridade dos dois acima).
function ipRealDoVisitante(): string
{
    if (!empty($_SERVER['HTTP_CF_CONNECTING_IP'])) {
        $ip = trim($_SERVER['HTTP_CF_CONNECTING_IP']);
        if (filter_var($ip, FILTER_VALIDATE_IP)) return $ip;
    }

    if (!empty($_SERVER['HTTP_X_FORWARDED_FOR'])) {
        $primeiroIp = trim(explode(',', $_SERVER['HTTP_X_FORWARDED_FOR'])[0]);
        if (filter_var($primeiroIp, FILTER_VALIDATE_IP)) return $primeiroIp;
    }

    return $_SERVER['REMOTE_ADDR'] ?? 'desconhecido';
}

// Tira quebra de linha de um valor recebido antes de gravar no log — sem
// isso, video="x\n\nlinha-forjada" permitiria injetar linha falsa no
// arquivo. Corta em 200 chars só pra um parâmetro absurdamente longo não
// inflar o arquivo à toa.
function limparParaLog(string $valor): string
{
    return substr(str_replace(["\r", "\n"], ' ', trim($valor)), 0, 200);
}

// Corpo JSON de {video, pct, page} (ver comentário no topo). php://input
// vem vazio em GET, então json_decode devolve null e o ?: [] cobre isso
// sem esquentar — cai direto pro fallback em $_GET logo abaixo.
$corpo = json_decode(file_get_contents('php://input'), true) ?: [];

$video = limparParaLog((string) ($corpo['video'] ?? $_GET['video'] ?? ''));
$percent = trim((string) ($corpo['pct'] ?? $_GET['percent'] ?? ''));
$page = limparParaLog((string) ($corpo['page'] ?? $_GET['page'] ?? ''));

// Validação mínima antes de gravar — mas nunca responde 4xx: quem chama
// isso é um fetch(keepalive) disparado no timeupdate do vídeo, sem
// ninguém olhando a resposta; erro aqui não pode aparecer pro usuário.
$gravou = false;
if ($video !== '' && preg_match('/^\d{1,3}$/', $percent) && $page !== '') {
    $linha = sprintf(
        "%s | %s | %s | %s%% | %s\n",
        date('Y-m-d H:i:s'),
        ipRealDoVisitante(),
        $video,
        $percent,
        $page
    );

    // FILE_APPEND + LOCK_EX: vários alunos assistindo ao mesmo tempo não
    // corrompem/misturam linha um do outro no arquivo.
    $gravou = (bool) @file_put_contents($logFile, $linha, FILE_APPEND | LOCK_EX);
}

// Sempre 200 (nunca 4xx/5xx): quem chama isso é um fetch(keepalive)
// disparado no timeupdate do vídeo, sem ninguém olhando a resposta; um
// corpo de erro aqui não pode quebrar nada no front. $gravou no JSON serve
// só pra debug manual via curl/DevTools.
http_response_code(200);
echo json_encode(['ok' => $gravou]);
