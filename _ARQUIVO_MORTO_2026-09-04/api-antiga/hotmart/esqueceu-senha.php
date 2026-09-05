<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit; }

require __DIR__ . '/_conexao.php';
garantirEstruturaClube($mysqli); // cria password_resets se ainda não existir

// POST { email } -> sempre {ok:true}, exista o email ou não (não vaza quem
// tem conta). Gera token de 1h, salva em password_resets e manda o link por
// e-mail via mail() nativo do PHP (Hostinger tem isso habilitado por
// padrão; não há PHPMailer/composer neste projeto — ver aviso abaixo).
$input = json_decode(file_get_contents('php://input'), true);
$email = strtolower(trim($input['email'] ?? ''));

if (!$email) {
    http_response_code(400);
    echo json_encode(['erro' => 'Email obrigatório']);
    exit;
}

$stmt = $mysqli->prepare("SELECT email, nome FROM alunos WHERE email = ? LIMIT 1");
$stmt->bind_param('s', $email);
$stmt->execute();
$aluno = $stmt->get_result()->fetch_assoc();
$stmt->close();

if ($aluno) {
    $token = bin2hex(random_bytes(32));
    $expiraEm = date('Y-m-d H:i:s', strtotime('+1 hour'));

    // Um pedido novo invalida pedidos antigos pendentes do mesmo email —
    // evita links velhos ainda válidos "flutuando" numa caixa de entrada.
    $del = $mysqli->prepare("DELETE FROM password_resets WHERE email = ?");
    $del->bind_param('s', $email);
    $del->execute();
    $del->close();

    $ins = $mysqli->prepare("INSERT INTO password_resets (email, token, expires_at) VALUES (?, ?, ?)");
    $ins->bind_param('sss', $email, $token, $expiraEm);
    $ins->execute();
    $ins->close();

    $link = 'https://renatodepaula.com/redefinir-senha?token=' . $token;
    $nome = $aluno['nome'] ?: 'Aluno';

    $assunto = 'Redefinir senha — Clube Presença';
    $corpo = "Olá, $nome!\n\n"
        . "Recebemos um pedido para redefinir sua senha do Clube Presença.\n\n"
        . "Clique no link abaixo para criar uma nova senha (válido por 1 hora):\n"
        . "$link\n\n"
        . "Se você não pediu isso, pode ignorar este email — sua senha continua a mesma.\n";
    $headers = "From: Clube Presença <nao-responda@renatodepaula.com>\r\n"
        . "Content-Type: text/plain; charset=UTF-8\r\n";

    // mail() é best-effort no shared hosting: se falhar (config de SMTP do
    // servidor, etc.) não muda a resposta — nunca revelamos por essa via se
    // o email existe ou se o envio deu certo.
    @mail($email, $assunto, $corpo, $headers);
}

echo json_encode(['ok' => true]);
