<?php
// Lista o thread de mensagens privadas de UM aluno (Tarefa 2), ou só a
// contagem de não lidas (pro badge vermelho na sidebar).
//
// GET ?email=&apenas_contagem=1  -> { ok, naoLidas }
// GET ?email=                    -> { ok, itens:[{id,de_email,para_email,mensagem,lida,created_at}] }
//
// Thread = toda mensagem em que este e-mail é remetente OU destinatário
// (hoje sempre entre o aluno e um dos 2 admins/orientador, mas a query não
// assume isso — funciona igual se um dia houver mais de um "atendente").
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit; }

require __DIR__ . '/../hotmart/_conexao.php';
garantirEstruturaClube($mysqli); // cria mensagens_privadas se ainda não existir

$email = strtolower(trim($_GET['email'] ?? ''));
if (!$email || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['erro' => 'email inválido']);
    exit;
}

if (!empty($_GET['apenas_contagem'])) {
    $stmt = $mysqli->prepare("SELECT COUNT(*) AS total FROM mensagens_privadas WHERE para_email = ? AND lida = 0");
    $stmt->bind_param('s', $email);
    $stmt->execute();
    $naoLidas = (int) $stmt->get_result()->fetch_assoc()['total'];
    $stmt->close();

    echo json_encode(['ok' => true, 'naoLidas' => $naoLidas]);
    exit;
}

$stmt = $mysqli->prepare(
    "SELECT id, de_email, para_email, mensagem, lida, created_at
     FROM mensagens_privadas
     WHERE de_email = ? OR para_email = ?
     ORDER BY created_at ASC"
);
$stmt->bind_param('ss', $email, $email);
$stmt->execute();
$res = $stmt->get_result();
$itens = [];
while ($row = $res->fetch_assoc()) {
    $itens[] = [
        'id' => (int) $row['id'],
        'de_email' => $row['de_email'],
        'para_email' => $row['para_email'],
        'mensagem' => $row['mensagem'],
        'lida' => (bool) $row['lida'],
        'created_at' => $row['created_at'], // já em horário de Brasília (SET time_zone em _conexao.php)
    ];
}
$stmt->close();

echo json_encode(['ok' => true, 'itens' => $itens]);
