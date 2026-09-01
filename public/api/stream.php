<?php
// Serve os vídeos da Meditação (meditacao.mp4, mito1/2/3.mp4) direto por
// PHP/Apache, com suporte a Range requests (necessário pro <video> dar
// seek e pro iOS/Safari tocar de verdade — sem Range, o navegador baixa o
// arquivo inteiro antes de conseguir pular).
//
// POR QUE NÃO é Express (server/index.js, rota /videos + VIDEOS_DIR): ver
// HANDOFF.md, "PROBLEMA 1". O processo Node.js da Hostinger roda sandboxed
// (Node.js Selector/Passenger) e não enxerga pastas fora da própria pasta
// do app — só chegava a ENOENT tentando ler VIDEOS_DIR, mesmo com o
// caminho certo. Este script roda como PHP dentro do public_html via
// Apache/suexec (mesmo mecanismo de video-log.php/ver-logs.php), que
// enxerga o resto do home do usuário normalmente.
//
// Os vídeos NÃO ficam dentro de public_html: assim como video-log.txt
// (ver video-log.php), ficam em pasta irmã, fora da árvore que a Hostinger
// recria a cada `git push`+deploy — sobrevivem a deploys futuros e nunca
// precisam ir pro Git (os arquivos passam de 100MB, acima do limite do
// GitHub). Upload é manual, uma vez, pelo Gerenciador de Arquivos da
// Hostinger.
$base = '/home/u790959747/domains/renatodepaula.com/meditacao-videos/';

// basename() corta qualquer "../" ou caminho absoluto no parâmetro — sem
// isso, ?f=../../etc/passwd tentaria escapar da pasta de vídeos.
$arquivo = basename($_GET['f'] ?? '');

// Só serve .mp4 — trava o endpoint pra não virar um leitor de arquivo
// genérico dentro dessa pasta, mesmo já limitado pelo basename() acima.
if ($arquivo === '' || !preg_match('/\.mp4$/i', $arquivo)) {
    http_response_code(400);
    exit;
}

$caminho = $base . $arquivo;

if (!is_file($caminho)) {
    http_response_code(404);
    exit;
}

$tamanho = filesize($caminho);

header('Content-Type: video/mp4');
header('Accept-Ranges: bytes');
// Vídeo é estático depois de enviado uma vez (não muda com o mesmo nome de
// arquivo) — cache longo no navegador evita rebaixar em cada replay.
header('Cache-Control: public, max-age=86400');

$inicio = 0;
$fim = $tamanho - 1;
$parcial = false;

// Range vem como "bytes=INICIO-FIM", FIM é opcional ("bytes=500000-" pede
// "do byte 500000 até o final"). Ignora silenciosamente qualquer header
// mal formado e cai pro arquivo inteiro, em vez de dar erro.
if (isset($_SERVER['HTTP_RANGE']) && preg_match('/bytes=(\d+)-(\d*)/', $_SERVER['HTTP_RANGE'], $m)) {
    $inicioPedido = (int) $m[1];
    $fimPedido = $m[2] !== '' ? (int) $m[2] : $fim;

    // Clampa dentro dos limites reais do arquivo — um Range forjado (ex:
    // início maior que o tamanho do arquivo) não pode virar leitura fora
    // dos limites nem Content-Length negativo.
    if ($inicioPedido >= 0 && $inicioPedido < $tamanho && $fimPedido >= $inicioPedido) {
        $inicio = $inicioPedido;
        $fim = min($fimPedido, $tamanho - 1);
        $parcial = true;
    }
}

if ($parcial) {
    http_response_code(206);
    header("Content-Range: bytes $inicio-$fim/$tamanho");
}
header('Content-Length: ' . ($fim - $inicio + 1));

$fp = fopen($caminho, 'rb');
if ($inicio > 0) {
    fseek($fp, $inicio);
}

// Manda em blocos de 8KB em vez de fpassthru/readfile direto — em vídeos
// de 80-110MB, ler tudo de uma vez pra memória do PHP-FPM podia estourar
// o limite de memory_limit da conta compartilhada da Hostinger.
$restante = $fim - $inicio + 1;
while ($restante > 0 && !feof($fp)) {
    $bloco = min(8192, $restante);
    echo fread($fp, $bloco);
    $restante -= $bloco;
    flush();
}
fclose($fp);
