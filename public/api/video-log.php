<?php
// Log de progresso de vídeo (marcos de 5 em 5%, +1% no play — ver
// registrarProgressoVideo() em src/utils/loadThirdParty.js) via
// navigator.sendBeacon (fallback fetch keepalive). Grava IP + vídeo + %
// máximo alcançado num arquivo texto pra consulta manual (ver-logs.php) —
// a Meta não devolve IP no evento do Pixel.
//
// UPSERT, não APPEND (mudado em 04/09): o front agora manda até 21
// chamadas por pessoa/vídeo (1%, 5%, 10%, ..., 100% — granularidade fina
// pra ver em que % exato a galera desiste, incluindo bounce logo no play).
// Se cada chamada virasse uma linha nova, o .txt cresceria ~5x mais rápido
// e ver-logs.php ficaria uma lista de eventos em vez de "quem assistiu o
// quê". Em vez disso: cada request procura a linha já existente da mesma
// pessoa+vídeo (mesmo IP+vídeo+WhatsApp — ou só IP+vídeo enquanto ainda não
// tem WhatsApp, agrupando visitantes anônimos do mesmo IP) e atualiza
// max_percent (maior valor já visto) + mescla o marco novo em
// all_milestones, em vez de acrescentar linha. Resultado: 1 linha por
// pessoa/vídeo no disco, não 1 linha por marco.
//
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

// Tira quebra de linha e "|" de um valor recebido antes de gravar no log —
// sem isso, video="x\n\nlinha-forjada" ou um campo com "|" descolaria as
// colunas na hora de reler o arquivo (parseLinhaLog abaixo conta colunas
// por "|"). Corta em 200 chars só pra um parâmetro absurdamente longo não
// inflar o arquivo à toa.
function limparParaLog(string $valor): string
{
    return substr(str_replace(["\r", "\n", "|"], ' ', trim($valor)), 0, 200);
}

// Lê 1 linha do .txt e devolve como array associativo, migrando formatos
// antigos pro layout atual (9 colunas) na hora — assim a primeira reescrita
// do arquivo depois do deploy já normaliza tudo, sem precisar de script de
// migração separado. Formatos aceitos:
//   9 colunas (atual):  last_seen | ip | video | max_percent% | page | whatsapp | country | all_milestones | user_agent
//   7 colunas (legado):  timestamp | ip | video | percent%     | page | whatsapp | country   (1 linha por evento, sem consolidação)
//   5 colunas (bem antigo): timestamp | ip | video | percent% | page   (sem whatsapp/country)
// Linha ilegível (contagem de coluna diferente) é descartada na reescrita.
function parseLinhaLog(string $linha): ?array
{
    $colunas = array_map('trim', explode('|', $linha));

    if (count($colunas) === 9) {
        return [
            'timestamp'   => $colunas[0],
            'ip'          => $colunas[1],
            'video'       => $colunas[2],
            'max_percent' => (int) rtrim($colunas[3], '%'),
            'page'        => $colunas[4],
            'whatsapp'    => $colunas[5],
            'country'     => $colunas[6],
            'milestones'  => $colunas[7],
            'user_agent'  => $colunas[8],
        ];
    }

    if (count($colunas) === 7 || count($colunas) === 5) {
        $percent = (int) rtrim($colunas[3], '%');
        return [
            'timestamp'   => $colunas[0],
            'ip'          => $colunas[1],
            'video'       => $colunas[2],
            'max_percent' => $percent,
            'page'        => $colunas[4],
            'whatsapp'    => $colunas[5] ?? '',
            'country'     => $colunas[6] ?? '',
            'milestones'  => (string) $percent,
            'user_agent'  => '',
        ];
    }

    return null;
}

function formatarLinhaLog(array $linha): string
{
    return sprintf(
        "%s | %s | %s | %d%% | %s | %s | %s | %s | %s\n",
        $linha['timestamp'],
        $linha['ip'],
        $linha['video'],
        $linha['max_percent'],
        $linha['page'],
        $linha['whatsapp'],
        $linha['country'],
        $linha['milestones'],
        $linha['user_agent']
    );
}

// Mescla um marco novo na lista de all_milestones (string "1,5,10,...") sem
// duplicar, mantendo ordenado — é o que vira a coluna "Marcos" em
// ver-logs.php, pra enxergar visualmente até onde cada pessoa avançou.
function mesclarMarcos(string $existentes, int $novoMarco): string
{
    $lista = $existentes === '' ? [] : array_map('intval', explode(',', $existentes));
    if (!in_array($novoMarco, $lista, true)) {
        $lista[] = $novoMarco;
    }
    sort($lista, SORT_NUMERIC);
    return implode(',', $lista);
}

// Corpo JSON de {video, pct, page, whatsapp, country} (ver comentário no
// topo). whatsapp/country vêm da gate "Desbloqueio Consciente" de /mitos —
// opcionais, gravados vazios até o lead preencher o WhatsApp. php://input
// vem vazio em GET, então json_decode devolve null e o ?: [] cobre isso
// sem esquentar — cai direto pro fallback em $_GET logo abaixo.
$corpo = json_decode(file_get_contents('php://input'), true) ?: [];

$video = limparParaLog((string) ($corpo['video'] ?? $_GET['video'] ?? ''));
$percent = trim((string) ($corpo['pct'] ?? $_GET['percent'] ?? ''));
$page = limparParaLog((string) ($corpo['page'] ?? $_GET['page'] ?? ''));
$whatsapp = limparParaLog((string) ($corpo['whatsapp'] ?? $_GET['whatsapp'] ?? ''));
$country = limparParaLog((string) ($corpo['country'] ?? $_GET['country'] ?? ''));

// Validação mínima antes de gravar — mas nunca responde 4xx: quem chama
// isso é um sendBeacon/fetch(keepalive) disparado no play/timeupdate do
// vídeo, sem ninguém olhando a resposta; erro aqui não pode aparecer pro
// usuário. whatsapp/country não são obrigatórios (log de progresso normal,
// sem lead ainda, continua gravando igual a antes).
$gravou = false;
if ($video !== '' && preg_match('/^\d{1,3}$/', $percent) && $page !== '') {
    $percentInt = (int) $percent;
    $ip = ipRealDoVisitante();
    $userAgent = limparParaLog((string) ($_SERVER['HTTP_USER_AGENT'] ?? ''));
    $agora = date('Y-m-d H:i:s');

    // Chave de identidade de "pessoa assistindo este vídeo": ip+video+whatsapp
    // quando já tem lead capturado, ou só ip+video antes disso (agrupa
    // visitantes anônimos do mesmo IP no mesmo vídeo — normal antes da gate
    // de WhatsApp em /mitos). Depois que o WhatsApp aparece, os próximos
    // marcos casam numa linha nova (chave mudou) — a linha anônima anterior
    // fica como registro do que rolou antes do lead, sem ser reescrita.
    $whatsappChave = $whatsapp;

    // 'c+': abre (cria se não existir) sem truncar, permite ler e escrever
    // no mesmo handle. flock(LOCK_EX) travado durante TODO o
    // read-modify-write — sem isso, dois alunos assistindo ao mesmo tempo
    // poderiam ler o arquivo no mesmo instante e um sobrescrever a
    // atualização do outro ao salvar (o FILE_APPEND antigo não tinha esse
    // problema por ser append-only; UPSERT precisa do lock cobrindo a
    // operação inteira, não só a escrita).
    $handle = @fopen($logFile, 'c+');
    if ($handle && flock($handle, LOCK_EX)) {
        $conteudo = stream_get_contents($handle);
        $linhasBrutas = trim((string) $conteudo) === '' ? [] : preg_split('/\r\n|\r|\n/', trim($conteudo));

        $linhas = [];
        foreach ($linhasBrutas as $linhaBruta) {
            if (trim($linhaBruta) === '') continue;
            $parsed = parseLinhaLog($linhaBruta);
            if ($parsed !== null) $linhas[] = $parsed;
        }

        $encontrou = false;
        foreach ($linhas as &$linha) {
            $mesmaPessoa = $linha['ip'] === $ip
                && $linha['video'] === $video
                && $linha['whatsapp'] === $whatsappChave;
            if ($mesmaPessoa) {
                $linha['max_percent'] = max($linha['max_percent'], $percentInt);
                $linha['milestones'] = mesclarMarcos($linha['milestones'], $percentInt);
                $linha['timestamp'] = $agora; // last_seen
                $linha['page'] = $page;
                if ($country !== '') $linha['country'] = $country;
                if ($userAgent !== '') $linha['user_agent'] = $userAgent;
                $encontrou = true;
                break;
            }
        }
        unset($linha);

        if (!$encontrou) {
            $linhas[] = [
                'timestamp'   => $agora,
                'ip'          => $ip,
                'video'       => $video,
                'max_percent' => $percentInt,
                'page'        => $page,
                'whatsapp'    => $whatsapp,
                'country'     => $country,
                'milestones'  => (string) $percentInt,
                'user_agent'  => $userAgent,
            ];
        }

        $novoConteudo = '';
        foreach ($linhas as $linha) {
            $novoConteudo .= formatarLinhaLog($linha);
        }

        rewind($handle);
        ftruncate($handle, 0);
        fwrite($handle, $novoConteudo);
        fflush($handle);
        $gravou = true;

        flock($handle, LOCK_UN);
        fclose($handle);
    } elseif ($handle) {
        fclose($handle);
    }
}

// Sempre 200 (nunca 4xx/5xx): quem chama isso é um sendBeacon/fetch(keepalive)
// disparado no play/timeupdate do vídeo, sem ninguém olhando a resposta; um
// corpo de erro aqui não pode quebrar nada no front. $gravou no JSON serve
// só pra debug manual via curl/DevTools.
http_response_code(200);
echo json_encode(['ok' => $gravou]);
