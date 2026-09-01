<?php
// Log de progresso de vídeo (25/50/75/95%) — chamado por
// iniciarTrackingDeVideo() em src/utils/loadThirdParty.js via
// fetch(..., { keepalive: true }). Grava IP + vídeo + % + página num
// arquivo texto pra consulta manual no Gerenciador de Arquivos da
// Hostinger (a Meta não devolve IP no evento do Pixel).
//
// ATENÇÃO (ver HANDOFF.md, "Vídeos" / .gitignore): a Hostinger recreia a
// pasta do app do zero a cada `git push` + deploy, apagando qualquer
// arquivo gerado em runtime que não veio do Git — mesmo motivo que fez
// avatar/foto de comentário deste projeto migrarem pra dentro do MySQL
// (avatar_blob/image_blob). video-log.txt tem o mesmo problema: some no
// próximo deploy. Aceito por enquanto porque foi pedido assim; se isso
// incomodar, o caminho é o mesmo já usado pro resto do projeto (tabela no
// MySQL via _conexao.php) em vez de arquivo.
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
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

// Tira quebra de linha de um valor vindo de GET antes de gravar no log —
// sem isso, video=x%0A%0Alinha-forjada permitiria injetar linha falsa no
// arquivo. Corta em 200 chars só pra um parâmetro absurdamente longo não
// inflar o arquivo à toa.
function limparParaLog(string $valor): string
{
    return substr(str_replace(["\r", "\n"], ' ', trim($valor)), 0, 200);
}

$video = limparParaLog($_GET['video'] ?? '');
$percent = trim($_GET['percent'] ?? '');
$page = limparParaLog($_GET['page'] ?? '');

// Validação mínima antes de gravar — mas nunca responde 4xx: quem chama
// isso é um fetch(keepalive) disparado no timeupdate do vídeo, sem
// ninguém olhando a resposta; erro aqui não pode aparecer pro usuário.
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
    @file_put_contents(__DIR__ . '/video-log.txt', $linha, FILE_APPEND | LOCK_EX);
}

// 204 sempre, sem corpo: o fetch(keepalive) do front não lê a resposta.
http_response_code(204);
