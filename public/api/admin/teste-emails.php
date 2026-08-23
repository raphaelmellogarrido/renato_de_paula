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

    $adicionados = [];
    $jaExistiam = [];
    $invalidos = [];
    $vistos = [];

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
    }

    echo json_encode([
        'ok' => true,
        'adicionados' => $adicionados,
        'ja_existiam' => $jaExistiam,
        'invalidos' => $invalidos,
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
