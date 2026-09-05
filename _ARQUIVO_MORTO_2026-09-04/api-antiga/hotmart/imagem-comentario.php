<?php
// Serve a foto anexada a um comentário de "Sua prática hoje" a partir de
// comentarios.image_blob (ver _conexao.php, garantirEstruturaClube v6, e
// upload-imagem-comentario.php + comentarios.php POST). Guardar em BLOB no
// banco em vez de arquivo em disco é proposital (bug reportado 26/08, mesmo
// problema já resolvido pro avatar em avatar.php): a Hostinger recria a
// pasta do app do zero a cada `git push` + deploy, apagando qualquer
// arquivo que não veio do Git (documentado também no HANDOFF.md pros
// vídeos) — o banco não é afetado por isso.
//
// GET ?id=<comentario_id> -> bytes direto (Content-Type real, JPG/PNG/WEBP),
// 404 se o comentário não existe ou não tem foto.
header('Access-Control-Allow-Origin: *');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit; }

require __DIR__ . '/_conexao.php';
garantirEstruturaClube($mysqli); // garante comentarios.image_blob em ambientes onde ainda não existe

$id = intval($_GET['id'] ?? 0);
if ($id <= 0) {
    http_response_code(400);
    exit;
}

$stmt = $mysqli->prepare("SELECT image_blob, image_mime FROM comentarios WHERE id = ? LIMIT 1");
$stmt->bind_param('i', $id);
$stmt->execute();
$stmt->bind_result($blob, $mime);
$temLinha = $stmt->fetch();
$stmt->close();

if (!$temLinha || $blob === null || $blob === '' || !$mime) {
    http_response_code(404);
    exit;
}

header('Content-Type: ' . $mime);
// Cache longo e imutável é seguro aqui: diferente do avatar (que pode ser
// trocado, por isso o ?v=avatar_versao), a foto de um comentário nunca muda
// depois de postada — não existe funcionalidade de editar/trocar foto de um
// comentário já enviado, então id fixo sempre aponta pros mesmos bytes.
header('Cache-Control: public, max-age=31536000, immutable');
echo $blob;
