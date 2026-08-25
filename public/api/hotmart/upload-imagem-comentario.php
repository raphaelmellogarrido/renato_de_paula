<?php
// Upload de foto anexada em "Sua prática hoje" (DificuldadeDoDia.jsx).
// POST multipart/form-data, campo "imagem" -> salva em public/uploads/posts/
// com nome único e devolve o caminho público ({ok:true, url}). Não grava
// nada no banco — quem grava o caminho na coluna comentarios.image_url é o
// POST de comentarios.php, chamado pelo front logo em seguida com essa url.
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit; }

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

$pastaDestino = __DIR__ . '/../../uploads/posts';
if (!is_dir($pastaDestino)) {
    mkdir($pastaDestino, 0755, true);
}

// Nome único: nunca confia em nenhuma parte do nome original enviado pelo
// cliente (evita path traversal/colisão), extensão vem do mime real acima.
$nomeUnico = bin2hex(random_bytes(12)) . '.' . $tiposAceitos[$mime];
$caminhoDestino = $pastaDestino . '/' . $nomeUnico;

if (!move_uploaded_file($arquivo['tmp_name'], $caminhoDestino)) {
    http_response_code(500);
    echo json_encode(['erro' => 'Não foi possível salvar a imagem']);
    exit;
}

echo json_encode(['ok' => true, 'url' => '/uploads/posts/' . $nomeUnico]);
