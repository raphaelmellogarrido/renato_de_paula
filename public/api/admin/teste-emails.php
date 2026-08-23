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

// PHPMailer vendorizado manualmente em public/api/lib/PHPMailer (sem
// composer/vendor neste projeto — ver histórico do HANDOFF.md). Usado só
// aqui pra mandar o convite via SMTP autenticado da Hostinger, em vez do
// mail() nativo — mail() sem autenticação SMTP é o motivo do Gmail mostrar
// "via srv..." no remetente.
require __DIR__ . '/../lib/PHPMailer/Exception.php';
require __DIR__ . '/../lib/PHPMailer/SMTP.php';
require __DIR__ . '/../lib/PHPMailer/PHPMailer.php';
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception as PHPMailerException;

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
// checkbox "Enviar e-mail de convite automaticamente"). Manda via SMTP
// autenticado (PHPMailer, comunidade@renatodepaula.com) em vez do mail()
// nativo — mail() sem autenticação SMTP é o motivo do Gmail mostrar "via
// srv..." no remetente. Credenciais SMTP ficam em config.php (fora do
// Git, mesmo padrão de DB_*/ADMIN_SECRET em _conexao.php) — de propósito
// NÃO usa getenv()/painel da Hostinger aqui: o painel deles tem um bug
// documentado que injeta um "\" espúrio em senha com caractere especial
// (ver HANDOFF.md, "Problema 2"), então config.php é a via mais segura.
// Best-effort (try/catch sem relançar) — mesmo padrão do resto do
// projeto: falha de envio não deve derrubar a liberação de acesso, que já
// foi salva no banco antes desta função ser chamada. O erro real do
// PHPMailer (ErrorInfo) é devolvido em $erroSaida pra quem chamou decidir
// o que mostrar pro admin — nunca escondido.
function enviarConviteComunidade(string $email, string $nome, ?string &$erroSaida = null): bool
{
    // Vai direto pra tela "Crie sua senha do Clube" (Login.jsx com
    // modo=criar) em vez de /comunidade puro — que caía em
    // /comunidade/login sem modo=criar, mostrando "Entrar" pra quem ainda
    // não tem senha nenhuma.
    $link = 'https://renatodepaula.com/comunidade/login?modo=criar';
    $saudacaoTexto = $nome !== '' ? "Olá, {$nome}," : 'Olá,';
    $saudacaoHtml = htmlspecialchars($saudacaoTexto, ENT_QUOTES, 'UTF-8');
    $emailHtml = htmlspecialchars($email, ENT_QUOTES, 'UTF-8');

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

    // SMTP_COMUNIDADE_USER/SENHA definidos em config.php (ver
    // config.example.php). Sem eles configurados, não dá pra autenticar —
    // falha limpo (retorna false) em vez de deixar o PHPMailer estourar
    // exception com a config vazia.
    if (!defined('SMTP_COMUNIDADE_USER') || !defined('SMTP_COMUNIDADE_SENHA') || SMTP_COMUNIDADE_SENHA === '') {
        $erroSaida = 'SMTP_COMUNIDADE_USER/SENHA não configurados em config.php';
        error_log('enviarConviteComunidade: ' . $erroSaida);
        return false;
    }

    $mail = new PHPMailer(true);
    try {
        $mail->isSMTP();
        $mail->Host = 'smtp.hostinger.com';
        $mail->SMTPAuth = true;
        $mail->Username = SMTP_COMUNIDADE_USER;
        $mail->Password = SMTP_COMUNIDADE_SENHA;
        $mail->SMTPSecure = PHPMailer::ENCRYPTION_SMTPS;
        $mail->Port = 465;
        $mail->CharSet = 'UTF-8';

        $mail->setFrom(SMTP_COMUNIDADE_USER, 'Comunidade Meditação Raiz');
        $mail->Sender = SMTP_COMUNIDADE_USER; // envelope sender = From, evita SPF softfail
        $mail->addReplyTo('contato@renatodepaula.com', 'Renato de Paula');
        $mail->addAddress($email, $nome ?: '');

        $mail->Subject = 'Você foi convidado para a Comunidade Meditação Raiz 🧘';
        $mail->isHTML(true);
        $mail->Body = $html;
        $mail->AltBody = $textoPlano;

        $mail->send();
        return true;
    } catch (PHPMailerException $e) {
        $erroSaida = $mail->ErrorInfo ?: $e->getMessage();
        error_log("SMTP ERRO: " . $erroSaida);
        return false;
    }
}

$metodo = $_SERVER['REQUEST_METHOD'];

// Garante resposta JSON sempre, mesmo se algo (DB, PHPMailer, etc.) lançar
// um erro inesperado no meio do caminho — antes disso um erro aqui podia
// virar uma resposta 200 vazia/HTML, que o front não conseguia interpretar
// nem como sucesso nem como erro (ver bug "Adicionar não mostra nada").
try {
    despacharTesteEmails($metodo, $mysqli);
} catch (\Throwable $e) {
    error_log('teste-emails.php erro inesperado: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['ok' => false, 'success' => false, 'erro' => $e->getMessage(), 'error' => $e->getMessage()]);
}
exit;

function despacharTesteEmails(string $metodo, mysqli $mysqli): void
{

if ($metodo === 'GET') {
    echo json_encode(['ok' => true, 'itens' => listarTesteEmails($mysqli)]);
    return;
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
    $convitesFalharam = []; // [{email, erro}] — erro = ErrorInfo exato do PHPMailer, nunca escondido do admin
    if ($enviarEmail && $emailsParaConvite) {
        $primeiro = true;
        foreach ($emailsParaConvite as $emailConvite => $nomeConvite) {
            if (!$primeiro) sleep(1);
            $primeiro = false;
            $erroEnvio = null;
            if (enviarConviteComunidade($emailConvite, $nomeConvite, $erroEnvio)) {
                $convitesEnviados[] = $emailConvite;
            } else {
                $convitesFalharam[] = ['email' => $emailConvite, 'erro' => $erroEnvio ?: 'Falha desconhecida ao enviar e-mail'];
            }
        }
    }

    // Contrato simples pro front (botão "Adicionar" em AdminMeditacao.jsx):
    // success/message/sent_via no caminho feliz, success/error (texto exato
    // do PHPMailer) quando o convite falha. `ok`/demais campos continuam
    // aqui só por compatibilidade, o front atual usa os novos.
    $success = true;
    $message = null;
    $sentVia = null;
    $error = null;
    $liberados = count($adicionados) + count($jaExistiam);

    if ($enviarEmail && count($emailsParaConvite) > 0) {
        if (count($convitesFalharam) === 0) {
            $sentVia = SMTP_COMUNIDADE_USER;
            $message = count($convitesEnviados) === 1 ? 'E-mail enviado' : count($convitesEnviados) . ' e-mails enviados';
        } else {
            $detalheFalhas = implode('; ', array_map(fn($f) => "{$f['email']}: {$f['erro']}", $convitesFalharam));
            $success = false;
            $error = count($convitesEnviados) > 0
                ? "E-mail liberado, mas falha ao enviar convite para: {$detalheFalhas}"
                : $detalheFalhas;
        }
    } elseif ($liberados > 0) {
        $message = 'E-mail liberado';
    } elseif (count($invalidos) > 0) {
        $success = false;
        $error = 'Nenhum e-mail válido informado.';
    }

    echo json_encode([
        'ok' => $success,
        'success' => $success,
        'message' => $message,
        'sent_via' => $sentVia,
        'error' => $error,
        'adicionados' => $adicionados,
        'ja_existiam' => $jaExistiam,
        'invalidos' => $invalidos,
        'convites_enviados' => count($convitesEnviados),
        'convites_falharam' => $convitesFalharam,
        'itens' => listarTesteEmails($mysqli),
    ]);
    return;
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
        return;
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
    return;
}

http_response_code(405);
echo json_encode(['erro' => 'Método não permitido']);
}
