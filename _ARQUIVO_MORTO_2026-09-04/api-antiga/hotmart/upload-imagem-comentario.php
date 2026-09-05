<?php
// Upload de foto anexada em "Sua prática hoje" (DificuldadeDoDia.jsx).
// POST multipart/form-data, campo "imagem" -> grava os bytes em staging
// (comentario_imagens_pendentes, ver _conexao.php) e devolve um token
// ({ok:true, token}). Não grava em comentarios ainda — quem migra o blob de
// staging pra image_blob/image_mime é o POST de comentarios.php, chamado
// pelo front logo em seguida com esse token (campo image_token).
//
// v2 (bug reportado 26/08, mesmo problema já resolvido pro avatar em
// upload-avatar.php/avatar.php): antes salvava o arquivo em
// public/uploads/posts/ com move_uploaded_file — a Hostinger recria a pasta
// do app do zero a cada `git push`/deploy, apagando qualquer arquivo que não
// veio do Git, então a foto sumia pra QUALQUER pessoa que olhasse depois do
// próximo deploy (não era filtro por admin/usuário). Banco não sofre disso.
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit; }

require __DIR__ . '/_conexao.php';
garantirEstruturaClube($mysqli); // cria comentario_imagens_pendentes se ainda não existir

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['erro' => 'Método não permitido']);
    exit;
}

if (!isset($_FILES['imagem']) || $_FILES['imagem']['error'] === UPLOAD_ERR_NO_FILE) {
    http_response_code(400);
    echo json_encode(['erro' => 'Nenhuma imagem enviada']);
    exit;
}

$arquivo = $_FILES['imagem'];

if ($arquivo['error'] !== UPLOAD_ERR_OK) {
    http_response_code(400);
    echo json_encode(['erro' => 'Falha no upload da imagem']);
    exit;
}

$limiteBytes = 5 * 1024 * 1024; // 5MB — mesmo limite validado no front (DificuldadeDoDia.jsx)
if ($arquivo['size'] > $limiteBytes) {
    http_response_code(400);
    echo json_encode(['erro' => 'A imagem deve ter no máximo 5MB']);
    exit;
}

// Nunca confia no Content-Type/extensão que o navegador manda — detecta o
// tipo real lendo os bytes do arquivo (finfo). Só 1 foto por post: o front
// já limita a 1 <input> sem multiple, aqui é a garantia do lado servidor.
$tiposAceitos = ['image/jpeg' => 'jpg', 'image/png' => 'png', 'image/webp' => 'webp'];
$finfo = finfo_open(FILEINFO_MIME_TYPE);
$mime = finfo_file($finfo, $arquivo['tmp_name']);
finfo_close($finfo);

if (!isset($tiposAceitos[$mime])) {
    http_response_code(400);
    echo json_encode(['erro' => 'Formato de imagem inválido. Use JPG, PNG ou WEBP.']);
    exit;
}

$bytes = file_get_contents($arquivo['tmp_name']);
if ($bytes === false) {
    http_response_code(500);
    echo json_encode(['erro' => 'Não foi possível ler a imagem enviada']);
    exit;
}

// Token efêmero (não é segredo de autenticação, só identifica a linha de
// staging até comentarios.php POST migrar ela pra image_blob) — 32 chars
// hex, mesmo tamanho da coluna CHAR(32) em comentario_imagens_pendentes.
$token = bin2hex(random_bytes(16));

$stmt = $mysqli->prepare(
    "INSERT INTO comentario_imagens_pendentes (token, image_blob, image_mime) VALUES (?, ?, ?)"
);
$stmt->bind_param('sss', $token, $bytes, $mime);
$stmt->execute();
$stmt->close();

echo json_encode(['ok' => true, 'token' => $token]);
