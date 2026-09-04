<?php
// Visualizador manual do video-log.txt (gravado por video-log.php) — pra
// não precisar abrir o Gerenciador de Arquivos da Hostinger toda vez só
// pra ver quem tá assistindo o quê. Como o .txt agora vive fora de
// public_html (ver comentário em video-log.php), nem precisa mais do
// bloqueio <Files "video-log.txt"> — ele já não é alcançável por URL;
// esta página continua sendo a forma mais simples de olhar o conteúdo
// sem SFTP/painel.
//
// Senha simples via ?senha=, não o X-Admin-Secret do painel /admin — essa
// página é pra abrir direto no navegador (link + senha na URL), não
// chamada via fetch/JS.
define('SENHA', 'renRAP123321'); // troca aqui quando quiser

if (($_GET['senha'] ?? '') !== SENHA) {
    http_response_code(401);
    die('Senha incorreta ou ausente. Use ?senha=SUASENHA na URL.');
}

$arquivoTxt = '/home/u790959747/domains/renatodepaula.com/video-logs-data/video-log.txt';

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

// Lê 1 linha do .txt e devolve como array associativo — mesma função (e
// mesma lógica de migração de formato antigo) que video-log.php usa pra
// reescrever o arquivo; duplicada aqui de propósito porque essa página só
// lê (nunca deveria puxar a lógica de escrita/lock por engano). Formatos:
//   9 colunas (atual, pós-UPSERT, 04/09): last_seen | ip | video | max_percent% | page | whatsapp | country | all_milestones | user_agent
//   7 colunas (legado): timestamp | ip | video | percent% | page | whatsapp | country
//   5 colunas (bem antigo): timestamp | ip | video | percent% | page
// Uma linha 7/5-colunas só aparece aqui se video-log.php ainda não rodou
// nem uma vez após o deploy dessa mudança (ele migra tudo pro formato novo
// na primeira reescrita) — o parse abaixo cobre isso sem quebrar a tabela.
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

// last_seen DESC — não depende da ordem física do arquivo (uma linha
// existente é atualizada no lugar, não movida pro fim, quando o UPSERT em
// video-log.php acha uma pessoa que já tinha linha), por isso o sort
// explícito aqui em vez de só inverter o array lido.
$linhasTxt = [];
if (file_exists($arquivoTxt)) {
    $linhasBrutas = file($arquivoTxt, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($linhasBrutas as $linhaBruta) {
        $parsed = parseLinhaLog($linhaBruta);
        if ($parsed !== null) $linhasTxt[] = $parsed;
    }
    usort($linhasTxt, fn($a, $b) => strcmp($b['timestamp'], $a['timestamp']));
}

// Evita telefone repetido na tela quando ainda sobra duplicata antiga no
// .txt (linhas gravadas antes do UPSERT de lead-capturado, 04/09, cada uma
// virando linha própria em vez de casar com o mito-1) — mesmo IP+telefone
// aparecendo em mais de uma linha. Mostra o telefone só na linha mais
// recente daquele IP+telefone (a primeira que aparece, já que $linhasTxt
// está ordenado por last_seen DESC) e deixa em branco nas demais — só
// afeta a exibição, não reescreve o arquivo.
$telefonesJaMostrados = [];
foreach ($linhasTxt as &$linha) {
    if ($linha['whatsapp'] === '') continue;
    $chave = $linha['ip'] . '|' . $linha['whatsapp'];
    if (isset($telefonesJaMostrados[$chave])) {
        $linha['whatsapp'] = '';
    } else {
        $telefonesJaMostrados[$chave] = true;
    }
}
unset($linha);

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
  .progresso-cel { display:flex; align-items:center; gap:8px; min-width:140px; }
  .progresso-barra { position:relative; width:90px; height:8px; border-radius:4px; background:#2a2a2a; overflow:hidden; flex:none; }
  .progresso-preenchido { position:absolute; inset:0 auto 0 0; height:100%; border-radius:4px; background:linear-gradient(90deg,#4ade80,#22c55e); }
  .progresso-preenchido.is-baixo { background:linear-gradient(90deg,#f87171,#ef4444); }
  .progresso-preenchido.is-medio { background:linear-gradient(90deg,#facc15,#f59e0b); }
  .progresso-num { font-variant-numeric: tabular-nums; color:#ccc; }
  .marcos { color:#888; font-size:12px; max-width:220px; overflow:hidden; text-overflow:ellipsis; }
  .ua { color:#777; font-size:11px; max-width:220px; overflow:hidden; text-overflow:ellipsis; }
  @media (max-width: 480px) { th, td { padding:6px 8px; font-size:12px; } }
</style>
<body>
  <h1>Logs de vídeo — Clube Presença</h1>
  <p class="meta">
    <?= count($linhasTxt) ?> pessoa(s)/vídeo no .txt · ordenado por última atividade<?= $temTabelaMysql ? ' · ' . count($linhasMysql) . ' linha(s) no MySQL' : '' ?>
  </p>

  <h2>video-log.txt (última atividade primeiro)</h2>
  <?php if ($linhasTxt): ?>
    <div class="tabela-wrap">
      <table>
        <tr><th>Última atividade</th><th>IP</th><th>Vídeo</th><th>Progresso máx.</th><th>Página</th><th>WhatsApp</th><th>País</th><th>Marcos</th><th>User-Agent</th></tr>
        <?php foreach ($linhasTxt as $linha): ?>
          <?php
            $pct = max(0, min(100, (int) $linha['max_percent']));
            $classeCor = $pct >= 75 ? '' : ($pct >= 25 ? 'is-medio' : 'is-baixo');
          ?>
          <tr>
            <td><?= htmlspecialchars($linha['timestamp']) ?></td>
            <td><?= htmlspecialchars($linha['ip']) ?></td>
            <td><?= htmlspecialchars($linha['video']) ?></td>
            <td>
              <div class="progresso-cel">
                <div class="progresso-barra">
                  <div class="progresso-preenchido <?= $classeCor ?>" style="width:<?= $pct ?>%"></div>
                </div>
                <span class="progresso-num"><?= $pct ?>%</span>
              </div>
            </td>
            <td><?= htmlspecialchars($linha['page']) ?></td>
            <td><?= htmlspecialchars($linha['whatsapp']) ?></td>
            <td><?= htmlspecialchars($linha['country']) ?></td>
            <td class="marcos" title="<?= htmlspecialchars($linha['milestones']) ?>"><?= htmlspecialchars($linha['milestones']) ?></td>
            <td class="ua" title="<?= htmlspecialchars($linha['user_agent']) ?>"><?= htmlspecialchars($linha['user_agent']) ?></td>
          </tr>
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
