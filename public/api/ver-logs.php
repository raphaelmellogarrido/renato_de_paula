<?php
// Visualizador manual do video-log.txt (gravado por video-log.php) — pra
// não precisar abrir o Gerenciador de Arquivos da Hostinger toda vez só
// pra ver quem tá assistindo o quê. O .txt em si continua bloqueado por
// URL direta (ver <Files "video-log.txt"> em public/api/.htaccess); esta
// página é a única forma de olhar o conteúdo sem SFTP/painel.
//
// Senha simples via ?senha=, não o X-Admin-Secret do painel /admin — essa
// página é pra abrir direto no navegador (link + senha na URL), não
// chamada via fetch/JS.
define('SENHA', 'renRAP123321'); // troca aqui quando quiser

if (($_GET['senha'] ?? '') !== SENHA) {
    http_response_code(401);
    die('Senha incorreta ou ausente. Use ?senha=SUASENHA na URL.');
}

$arquivoTxt = __DIR__ . '/video-log.txt';

// Limpeza só em POST (form abaixo, nunca um link) — assim um crawler ou
// link pré-carregado não apaga o log sozinho. Redirect depois (POST-then-
// GET) pra um F5 na página não tentar apagar de novo.
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['limpar'])) {
    if (file_exists($arquivoTxt)) {
        unlink($arquivoTxt);
    }
    header('Location: ?senha=' . rawurlencode(SENHA));
    exit;
}

// Lê o .txt, mais recente primeiro. Formato gravado por video-log.php:
// "Y-m-d H:i:s | ip | video | percent% | page" — trim() em cada coluna
// tira os espaços ao redor do "|".
$linhasTxt = [];
if (file_exists($arquivoTxt)) {
    $linhasBrutas = file($arquivoTxt, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach (array_reverse($linhasBrutas) as $linha) {
        $colunas = array_map('trim', explode('|', $linha));
        if (count($colunas) === 5) {
            $linhasTxt[] = $colunas;
        }
    }
}

// Fallback MySQL, só se a tabela video_log existir: video-log.php hoje só
// grava no .txt (ver comentário lá — a Hostinger apaga o .txt a cada
// `git push`+deploy), mas se algum dia passar a gravar também no banco,
// essa tabela sobrevive ao deploy. Tudo em try/catch pra rodar local sem
// config.php (sem banco configurado) não derrubar a página inteira — nesse
// caso a gente só mostra o .txt e segue.
$linhasMysql = [];
$temTabelaMysql = false;
try {
    require __DIR__ . '/hotmart/_conexao.php';
    $check = $mysqli->query(
        "SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'video_log'"
    );
    if ($check && $check->num_rows > 0) {
        $temTabelaMysql = true;
        $res = $mysqli->query("SELECT * FROM video_log ORDER BY id DESC LIMIT 500");
        if ($res) {
            $linhasMysql = $res->fetch_all(MYSQLI_ASSOC);
        }
    }
} catch (\Throwable $e) {
    // Sem banco disponível — segue só com o .txt.
}
?>
<!doctype html>
<html lang="pt-BR">
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>Logs de vídeo</title>
<style>
  :root { color-scheme: dark; }
  * { box-sizing: border-box; }
  body { background:#111; color:#eee; font-family: system-ui, -apple-system, "Segoe UI", sans-serif; margin:0; padding:16px; }
  h1 { font-size:18px; margin:0 0 4px; }
  h2 { font-size:15px; margin:28px 0 8px; color:#9ad; }
  p.meta { color:#999; font-size:13px; margin:0 0 16px; }
  .tabela-wrap { overflow-x:auto; border:1px solid #333; border-radius:8px; }
  table { width:100%; border-collapse:collapse; font-size:13px; white-space:nowrap; }
  th, td { border-bottom:1px solid #333; padding:8px 10px; text-align:left; }
  th { background:#1a1a1a; }
  tr:hover td { background:#181818; }
  .vazio { color:#888; padding:14px 0; font-size:14px; }
  form.limpar { margin:12px 0 0; }
  button { background:#7f1d1d; color:#fff; border:none; padding:8px 14px; border-radius:6px; font-size:13px; cursor:pointer; }
  button:hover { background:#991b1b; }
  @media (max-width: 480px) { th, td { padding:6px 8px; font-size:12px; } }
</style>
<body>
  <h1>Logs de vídeo — Clube Presença</h1>
  <p class="meta">
    <?= count($linhasTxt) ?> linha(s) no .txt<?= $temTabelaMysql ? ' · ' . count($linhasMysql) . ' linha(s) no MySQL' : '' ?>
  </p>

  <h2>video-log.txt (mais recente primeiro)</h2>
  <?php if ($linhasTxt): ?>
    <div class="tabela-wrap">
      <table>
        <tr><th>Data</th><th>IP</th><th>Vídeo</th><th>%</th><th>Página</th></tr>
        <?php foreach ($linhasTxt as $colunas): ?>
          <tr><?php foreach ($colunas as $col): ?><td><?= htmlspecialchars($col) ?></td><?php endforeach; ?></tr>
        <?php endforeach; ?>
      </table>
    </div>
    <form class="limpar" method="post" onsubmit="return confirm('Apagar o log .txt? Não dá pra desfazer.');">
      <input type="hidden" name="limpar" value="1">
      <button type="submit">Limpar log .txt</button>
    </form>
  <?php else: ?>
    <p class="vazio">Nenhum log ainda. Dê play num vídeo pra gerar a primeira linha.</p>
  <?php endif; ?>

  <?php if ($temTabelaMysql): ?>
    <h2>MySQL — tabela video_log (fallback persistente, últimas 500)</h2>
    <?php if ($linhasMysql): ?>
      <div class="tabela-wrap">
        <table>
          <tr><?php foreach (array_keys($linhasMysql[0]) as $col): ?><th><?= htmlspecialchars($col) ?></th><?php endforeach; ?></tr>
          <?php foreach ($linhasMysql as $linha): ?>
            <tr><?php foreach ($linha as $val): ?><td><?= htmlspecialchars((string) $val) ?></td><?php endforeach; ?></tr>
          <?php endforeach; ?>
        </table>
      </div>
    <?php else: ?>
      <p class="vazio">Tabela video_log existe mas está vazia.</p>
    <?php endif; ?>
  <?php endif; ?>
</body>
</html>
