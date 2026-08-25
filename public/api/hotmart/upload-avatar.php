<?php
// Upload de foto de perfil (Configuracoes.jsx, campo "Foto de perfil").
// POST multipart/form-data, campos "email" + "foto" -> recorta pra quadrado
// 1:1, redimensiona pra 200x200, converte pra WebP (~<=30KB) e salva em
// public/uploads/avatars/. Diferente de upload-imagem-comentario.php: este
// endpoint já grava o caminho em alunos.avatar_url na mesma chamada (não
// depende de um 2º POST separado), porque foto de perfil não tem um "dono"
// (linha de comentário) pra anexar depois.
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit; }

require __DIR__ . '/_conexao.php';
garantirEstruturaClube($mysqli); // garante alunos.avatar_url em ambientes onde ainda não existe

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['erro' => 'Método não permitido']);
    exit;
}

// Mesmo modelo de confiança do resto desta API (ver comentarios.php DELETE):
// sem sessão de servidor, o e-mail vem no próprio corpo da requisição.
$email = strtolower(trim($_POST['email'] ?? ''));
if (!$email) {
    http_response_code(400);
    echo json_encode(['erro' => 'email obrigatório']);
    exit;
}

$check = $mysqli->prepare("SELECT avatar_url FROM alunos WHERE email = ? LIMIT 1");
$check->bind_param('s', $email);
$check->execute();
$aluno = $check->get_result()->fetch_assoc();
$check->close();

if (!$aluno) {
    http_response_code(404);
    echo json_encode(['erro' => 'Email não encontrado']);
    exit;
}

if (!isset($_FILES['foto']) || $_FILES['foto']['error'] === UPLOAD_ERR_NO_FILE) {
    http_response_code(400);
    echo json_encode(['erro' => 'Nenhuma foto enviada']);
    exit;
}

$arquivo = $_FILES['foto'];

if ($arquivo['error'] !== UPLOAD_ERR_OK) {
    http_response_code(400);
    echo json_encode(['erro' => 'Falha no upload da foto']);
    exit;
}

$limiteBytes = 5 * 1024 * 1024; // 5MB — mesmo limite validado no front (Configuracoes.jsx)
if ($arquivo['size'] > $limiteBytes) {
    http_response_code(400);
    echo json_encode(['erro' => 'A foto deve ter no máximo 5MB']);
    exit;
}

// Nunca confia no Content-Type/extensão que o navegador manda — detecta o
// tipo real lendo os bytes do arquivo (finfo), mesmo padrão de
// upload-imagem-comentario.php.
$tiposAceitos = ['image/jpeg', 'image/png', 'image/webp'];
$finfo = finfo_open(FILEINFO_MIME_TYPE);
$mime = finfo_file($finfo, $arquivo['tmp_name']);
finfo_close($finfo);

if (!in_array($mime, $tiposAceitos, true)) {
    http_response_code(400);
    echo json_encode(['erro' => 'Formato de imagem inválido. Use JPG, PNG ou WEBP.']);
    exit;
}

// Primeira vez que este repo usa GD (upload-imagem-comentario.php só copia
// o arquivo original, sem processar) — checagem explícita em vez de deixar
// estourar um fatal error genérico se a hospedagem não tiver a extensão ou
// o suporte a WebP nela.
if (!function_exists('imagewebp') || !function_exists('imagecreatetruecolor')) {
    http_response_code(500);
    echo json_encode(['erro' => 'Servidor sem suporte a processamento de imagem (GD/WebP ausente)']);
    exit;
}

switch ($mime) {
    case 'image/jpeg':
        $origem = @imagecreatefromjpeg($arquivo['tmp_name']);
        break;
    case 'image/png':
        $origem = @imagecreatefrompng($arquivo['tmp_name']);
        break;
    case 'image/webp':
        if (!function_exists('imagecreatefromwebp')) {
            http_response_code(500);
            echo json_encode(['erro' => 'Servidor sem suporte a leitura de WEBP']);
            exit;
        }
        $origem = @imagecreatefromwebp($arquivo['tmp_name']);
        break;
    default:
        $origem = false;
}

if (!$origem) {
    http_response_code(400);
    echo json_encode(['erro' => 'Não foi possível ler a imagem enviada']);
    exit;
}

// Crop quadrado 1:1 SEMPRE no servidor (defensivo, independente do que o
// front já mandar recortado) — pega o menor lado, centralizado.
$larguraOrigem = imagesx($origem);
$alturaOrigem = imagesy($origem);
$lado = min($larguraOrigem, $alturaOrigem);
$origemX = intdiv($larguraOrigem - $lado, 2);
$origemY = intdiv($alturaOrigem - $lado, 2);

$tamanhoFinal = 200;
$destino = imagecreatetruecolor($tamanhoFinal, $tamanhoFinal);
// Preserva transparência de PNG (senão vira preto no lugar do canal alpha).
imagealphablending($destino, false);
imagesavealpha($destino, true);
$transparente = imagecolorallocatealpha($destino, 0, 0, 0, 127);
imagefill($destino, 0, 0, $transparente);

imagecopyresampled($destino, $origem, 0, 0, $origemX, $origemY, $tamanhoFinal, $tamanhoFinal, $lado, $lado);
imagedestroy($origem);

// Codifica em WebP mirando <=30KB: começa em qualidade 80 e vai reduzindo
// até caber (ou até a qualidade mínima 40 — 200x200 raramente chega lá).
$limiteBytesSaida = 30 * 1024;
$qualidade = 80;
$bytesWebp = null;
while ($qualidade >= 40) {
    ob_start();
    imagewebp($destino, null, $qualidade);
    $tentativa = ob_get_clean();
    if ($tentativa !== false && strlen($tentativa) <= $limiteBytesSaida) {
        $bytesWebp = $tentativa;
        break;
    }
    $bytesWebp = $tentativa; // guarda a última tentativa como fallback
    $qualidade -= 10;
}
imagedestroy($destino);

if (!$bytesWebp) {
    http_response_code(500);
    echo json_encode(['erro' => 'Não foi possível processar a imagem']);
    exit;
}

$pastaDestino = __DIR__ . '/../../uploads/avatars';
if (!is_dir($pastaDestino)) {
    mkdir($pastaDestino, 0755, true);
}

// Nome único a partir do e-mail (sanitizado) + timestamp — nunca usa nome
// original vindo do cliente (evita path traversal/colisão).
$emailSanitizado = preg_replace('/[^a-z0-9]+/', '_', $email);
$nomeUnico = trim($emailSanitizado, '_') . '_' . time() . '.webp';
$caminhoDestino = $pastaDestino . '/' . $nomeUnico;

if (file_put_contents($caminhoDestino, $bytesWebp) === false) {
    http_response_code(500);
    echo json_encode(['erro' => 'Não foi possível salvar a foto']);
    exit;
}

$urlPublica = '/uploads/avatars/' . $nomeUnico;

$stmt = $mysqli->prepare("UPDATE alunos SET avatar_url = ? WHERE email = ?");
$stmt->bind_param('ss', $urlPublica, $email);
$stmt->execute();
$stmt->close();

// Limpeza da foto anterior (se houver) só depois do UPDATE confirmar —
// evita apagar o arquivo antigo e ficar sem nenhum se o UPDATE falhasse
// antes. Só apaga se apontar pra dentro de uploads/avatars (nunca confia
// em avatar_url pra apagar arquivo arbitrário fora dessa pasta).
$avatarAntigo = $aluno['avatar_url'] ?? '';
if ($avatarAntigo && preg_match('#^/uploads/avatars/[A-Za-z0-9_.-]+$#', $avatarAntigo)) {
    $caminhoAntigo = __DIR__ . '/../../' . ltrim($avatarAntigo, '/');
    if (is_file($caminhoAntigo)) {
        @unlink($caminhoAntigo);
    }
}

echo json_encode(['ok' => true, 'url' => $urlPublica]);
