<?php
// Serve a foto de perfil de um aluno a partir de alunos.avatar_blob (ver
// _conexao.php, garantirEstruturaClube v5, e upload-avatar.php). Guardar em
// BLOB no banco em vez de arquivo em disco é proposital (bug reportado
// 25/08): a Hostinger recria a pasta do app do zero a cada `git push` +
// deploy, apagando qualquer arquivo que não veio do Git (mesmo problema já
// documentado no HANDOFF.md pros vídeos) — o banco não é afetado por isso.
//
// GET ?email=... -> bytes WEBP direto (Content-Type: image/webp), 404 se o
// aluno não existe ou nunca subiu foto. Sempre webp porque upload-avatar.php
// só grava nesse formato.
header('Access-Control-Allow-Origin: *');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit; }

require __DIR__ . '/_conexao.php';
garantirEstruturaClube($mysqli); // garante alunos.avatar_blob em ambientes onde ainda não existe

$email = strtolower(trim($_GET['email'] ?? ''));
if (!$email) {
    http_response_code(400);
    exit;
}

$stmt = $mysqli->prepare("SELECT avatar_blob FROM alunos WHERE email = ? LIMIT 1");
$stmt->bind_param('s', $email);
$stmt->execute();
$stmt->bind_result($blob);
$temLinha = $stmt->fetch();
$stmt->close();

if (!$temLinha || $blob === null || $blob === '') {
    http_response_code(404);
    exit;
}

header('Content-Type: image/webp');
// Cache longo e imutável é seguro aqui: a URL sempre vem com ?v=avatar_versao
// (avatarUrlPublica em _conexao.php) e esse número muda a cada upload novo —
// uma URL com um v= específico nunca aponta pra bytes diferentes.
header('Cache-Control: public, max-age=31536000, immutable');
echo $blob;
