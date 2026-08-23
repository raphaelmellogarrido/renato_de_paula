<?php
// Gestão de "Acesso de Teste" (/admin, seção "Acesso de Teste 🔑") — deixa
// o admin liberar amigos na comunidade sem compra Hotmart e sem mexer no
// SQL manualmente. Protegido por X-Admin-Secret, mesmo padrão de
// public/api/admin/desafios-semana.php.
//
// A tabela comunidade_teste_emails (ver garantirEstruturaClube em
// _conexao.php) é só convite/auditoria. Quem realmente controla login é
// `alunos.status` — aqui a gente espelha pra lá com status='teste', que
// login.php/register.php/check.php já tratam igual a 'ativo'. Isso evita
// duplicar toda a lógica de senha/login só pra conta de teste.
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-Admin-Secret');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') exit;

require __DIR__ . '/../hotmart/_conexao.php';
garantirEstruturaClube($mysqli); // garante a tabela comunidade_teste_emails

$chaveFornecida = $_SERVER['HTTP_X_ADMIN_SECRET'] ?? '';
// ADMIN_SECRET vazio (não configurado no servidor) nunca autentica, mesmo
// que o front mande header vazio também.
if (ADMIN_SECRET === '' || !hash_equals(ADMIN_SECRET, $chaveFornecida)) {
    http_response_code(401);
    echo json_encode(['erro' => 'Não autorizado']);
    exit;
}

function listarTesteEmails(mysqli $mysqli): array
{
    $res = $mysqli->query("SELECT id, email, nome, criado_em FROM comunidade_teste_emails ORDER BY criado_em DESC");
    return $res ? $res->fetch_all(MYSQLI_ASSOC) : [];
}

// Libera o e-mail pra logar/criar senha igual a um comprador ativo, sem
// nunca rebaixar quem já é comprador de verdade (status='ativo').
function liberarAcessoAlunos(mysqli $mysqli, string $email, string $nome): void
{
    $stmt = $mysqli->prepare(
        "INSERT INTO alunos (email, nome, status) VALUES (?, ?, 'teste')
         ON DUPLICATE KEY UPDATE
            nome = IF(status = 'ativo', nome, VALUES(nome)),
            status = IF(status = 'ativo', status, 'teste')"
    );
    $stmt->bind_param('ss', $email, $nome);
    $stmt->execute();
    $stmt->close();
}

// Revoga o acesso de teste. Só mexe em `alunos` se o status ainda for
// 'teste' — nunca apaga/derruba um comprador real que por acaso tenha
// esse e-mail cadastrado como teste também.
function revogarAcessoAlunos(mysqli $mysqli, string $email): void
{
    $stmt = $mysqli->prepare("DELETE FROM alunos WHERE email = ? AND status = 'teste'");
    $stmt->bind_param('s', $email);
    $stmt->execute();
    $stmt->close();
}

// Convite por e-mail disparado ao adicionar um acesso (front:
// checkbox "Enviar e-mail de convite automaticamente"). Usa mail() nativo
// do PHP, mesmo mecanismo já comprovado em esqueceu-senha.php — este
// projeto não tem PHPMailer/composer instalado do lado PHP. O SMTP via
// nodemailer (server/index.js, app Node separado) tem um bug de
// autenticação ainda não resolvido (ver HANDOFF.md, Problema 2) e nem
// entra em jogo aqui: mail() usa o MTA local da Hostinger, sem
// autenticação SMTP, então não é afetado por aquele problema.
// Best-effort (@mail, sem lançar exceção) — mesmo padrão do resto do
// projeto: falha de envio não deve derrubar a liberação de acesso, que já
// foi salva no banco antes desta função ser chamada.
function enviarConviteComunidade(string $email, string $nome): bool
{
    $link = 'https://renatodepaula.com/comunidade';
    $saudacaoTexto = $nome !== '' ? "Olá, {$nome}," : 'Olá,';
    $saudacaoHtml = htmlspecialchars($saudacaoTexto, ENT_QUOTES, 'UTF-8');
    $emailHtml = htmlspecialchars($email, ENT_QUOTES, 'UTF-8');

    $assunto = '=?UTF-8?B?' . base64_encode('Você foi convidado para a Comunidade Meditação Raiz 🧘') . '?=';

    $textoPlano = "{$saudacaoTexto}\n\n"
        . "Você foi convidado para fazer parte da Comunidade Meditação Raiz, do Dr. Renato de Paula.\n\n"
        . "Um espaço diário para voltar pra si, com práticas guiadas, encontros ao vivo e uma comunidade que medita junto com você.\n\n"
        . "É só entrar no link abaixo e seguir os passos para começar:\n{$link}\n\n"
        . "Seu acesso foi liberado com o e-mail {$email}. Use ele para entrar.\n\n"
        . "Nos vemos lá dentro,\nEquipe Dr. Renato de Paula\n";

    $html = <<<HTML
<div style="font-family: Arial, Helvetica, sans-serif; max-width: 480px; margin: 0 auto; color: #222; line-height: 1.5;">
  <p>{$saudacaoHtml}</p>
  <p>Você foi convidado para fazer parte da <strong>Comunidade Meditação Raiz</strong>, do Dr. Renato de Paula.</p>
  <p>Um espaço diário para voltar pra si, com práticas guiadas, encontros ao vivo e uma comunidade que medita junto com você.</p>
  <p>É só entrar no link abaixo e seguir os passos para começar:</p>
  <p style="text-align:center; margin: 28px 0;">
    <a href="{$link}" style="background:#111; color:#fff; text-decoration:none; padding:14px 28px; border-radius:8px; display:inline-block; font-weight:bold;">Entrar na comunidade</a>
  </p>
  <p>Seu acesso foi liberado com o e-mail <strong>{$emailHtml}</strong>. Use ele para entrar.</p>
  <p>Nos vemos lá dentro,<br>Equipe Dr. Renato de Paula</p>
</div>
HTML;

    $boundary = 'raiz-convite-' . bin2hex(random_bytes(8));
    $headers = "From: Comunidade Meditação Raiz <contato@renatodepaula.com>\r\n"
        . "MIME-Version: 1.0\r\n"
        . "Content-Type: multipart/alternative; boundary=\"{$boundary}\"\r\n";

    $corpo = "--{$boundary}\r\n"
        . "Content-Type: text/plain; charset=UTF-8\r\n"
        . "Content-Transfer-Encoding: 8bit\r\n\r\n"
        . $textoPlano . "\r\n\r\n"
        . "--{$boundary}\r\n"
        . "Content-Type: text/html; charset=UTF-8\r\n"
        . "Content-Transfer-Encoding: 8bit\r\n\r\n"
        . $html . "\r\n\r\n"
        . "--{$boundary}--";

    return @mail($email, $assunto, $corpo, $headers);
}

$metodo = $_SERVER['REQUEST_METHOD'];

if ($metodo === 'GET') {
    echo json_encode(['ok' => true, 'itens' => listarTesteEmails($mysqli)]);
    exit;
}

if ($metodo === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true) ?? [];

    // Aceita lote ({emails: [...]}) ou single ({email, nome}) — o front
    // manda lote sempre, mas single continua funcionando pra quem chamar
    // o endpoint direto.
    $brutos = [];
    if (is_array($input['emails'] ?? null)) {
        $brutos = $input['emails'];
    } elseif (!empty($input['email'])) {
        $brutos = [$input['email']];
    }
    $nomeUnico = trim($input['nome'] ?? '');
    // Checkbox "Enviar e-mail de convite automaticamente" do front — vem
    // marcado por padrão; só não envia se o admin desmarcar explicitamente.
    $enviarEmail = (bool) ($input['enviar_email'] ?? true);

    $adicionados = [];
    $jaExistiam = [];
    $invalidos = [];
    $vistos = [];
    $emailsParaConvite = []; // email => nome, preenchido abaixo pra disparar convite depois do loop

    foreach ($brutos as $bruto) {
        $email = strtolower(trim((string) $bruto));
        if ($email === '' || isset($vistos[$email])) continue;
        $vistos[$email] = true;

        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            $invalidos[] = $bruto;
            continue;
        }

        // Nome só se aplica quando é um único e-mail (campo "nome
        // opcional" do form) — em lote fica sem nome.
        $nome = count($brutos) === 1 ? $nomeUnico : '';

        $stmt = $mysqli->prepare("INSERT IGNORE INTO comunidade_teste_emails (email, nome, criado_por) VALUES (?, ?, 'admin')");
        $stmt->bind_param('ss', $email, $nome);
        $stmt->execute();
        $inseriu = $stmt->affected_rows > 0;
        $stmt->close();

        liberarAcessoAlunos($mysqli, $email, $nome ?: $email);

        if ($inseriu) {
            $adicionados[] = $email;
        } else {
            $jaExistiam[] = $email;
        }
        $emailsParaConvite[$email] = $nome;
    }

    // Convite por e-mail: dispara pra todo e-mail válido do pedido (novo ou
    // já existente — reenviar é útil se o convidado perdeu o primeiro
    // e-mail), só quando o admin não desmarcou o checkbox. Em lote, 1s de
    // intervalo entre envios pra não cair em spam — em host compartilhado
    // isso soma ao tempo da requisição, então lotes muito grandes podem
    // esbarrar no limite de execução do PHP; ok pro volume esperado aqui
    // (convite manual, não disparo em massa).
    $convitesEnviados = [];
    $convitesFalharam = [];
    if ($enviarEmail && $emailsParaConvite) {
        $primeiro = true;
        foreach ($emailsParaConvite as $emailConvite => $nomeConvite) {
            if (!$primeiro) sleep(1);
            $primeiro = false;
            if (enviarConviteComunidade($emailConvite, $nomeConvite)) {
                $convitesEnviados[] = $emailConvite;
            } else {
                $convitesFalharam[] = $emailConvite;
            }
        }
    }

    echo json_encode([
        'ok' => true,
        'adicionados' => $adicionados,
        'ja_existiam' => $jaExistiam,
        'invalidos' => $invalidos,
        'convites_enviados' => count($convitesEnviados),
        'convites_falharam' => $convitesFalharam,
        'itens' => listarTesteEmails($mysqli),
    ]);
    exit;
}

if ($metodo === 'DELETE') {
    $input = json_decode(file_get_contents('php://input'), true) ?? [];
    $id = isset($_GET['id']) ? (int) $_GET['id'] : 0;
    $emailBody = strtolower(trim($input['email'] ?? ''));

    $email = null;
    if ($id > 0) {
        $stmt = $mysqli->prepare("SELECT email FROM comunidade_teste_emails WHERE id = ?");
        $stmt->bind_param('i', $id);
        $stmt->execute();
        $row = $stmt->get_result()->fetch_assoc();
        $stmt->close();
        $email = $row['email'] ?? null;
    } elseif ($emailBody !== '') {
        $email = $emailBody;
    }

    if (!$email) {
        http_response_code(400);
        echo json_encode(['erro' => 'Informe id ou email']);
        exit;
    }

    if ($id > 0) {
        $stmt = $mysqli->prepare("DELETE FROM comunidade_teste_emails WHERE id = ?");
        $stmt->bind_param('i', $id);
    } else {
        $stmt = $mysqli->prepare("DELETE FROM comunidade_teste_emails WHERE email = ?");
        $stmt->bind_param('s', $email);
    }
    $stmt->execute();
    $stmt->close();

    revogarAcessoAlunos($mysqli, $email);

    echo json_encode(['ok' => true, 'itens' => listarTesteEmails($mysqli)]);
    exit;
}

http_response_code(405);
echo json_encode(['erro' => 'Método não permitido']);
