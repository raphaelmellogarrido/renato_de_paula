<?php
// Lista todos os alunos (Tarefa 2 - busca de usuários pra admin/orientador
// em Mensagens.jsx via BuscaUsuarios.jsx) — deixa a equipe abrir o thread
// de QUALQUER aluno a partir de /comunidade/mensagens, sem precisar que o
// aluno tenha comentado antes (única forma de achar o nome dele hoje era o
// modal "Enviar mensagem para @Nome" dentro de um comentário existente).
//
// GET (sem parâmetro) -> { ok, itens:[{nome,email,avatar_url}] } ORDER BY nome ASC
//
// Sem $_SESSION/cookie, mesmo modelo "permissão como pedido, não cofre" já
// documentado em enviar.php: quem decide mostrar a barra de busca é o FRONT
// (souAdmin/souOrientador em Mensagens.jsx) — este endpoint só devolve dados
// públicos de perfil (nome/foto), nada sensível.
//
// Exclui os 2 e-mails de equipe (EMAIL_ADMINISTRADOR/EMAIL_ORIENTADOR, ver
// ComentarioCard.jsx) da lista: não faz sentido a barra sugerir "conversar
// consigo mesmo" ou com o outro membro da equipe.
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit; }

require __DIR__ . '/../hotmart/_conexao.php';
garantirEstruturaClube($mysqli); // cria mensagens_privadas se ainda não existir (mesmo padrão de listar.php)

$emailsEquipe = ['raphaelmellogarrido@gmail.com', 'rsp.ren@gmail.com']; // EMAIL_ADMINISTRADOR / EMAIL_ORIENTADOR

$stmt = $mysqli->prepare(
    "SELECT nome, email, avatar_versao FROM alunos
     WHERE LOWER(TRIM(email)) NOT IN (?, ?)
     ORDER BY nome ASC"
);
$stmt->bind_param('ss', $emailsEquipe[0], $emailsEquipe[1]);
$stmt->execute();
$res = $stmt->get_result();
$itens = [];
while ($row = $res->fetch_assoc()) {
    $itens[] = [
        'nome' => $row['nome'],
        'email' => $row['email'],
        'avatar_url' => avatarUrlPublica($row['email'], $row['avatar_versao']),
    ];
}
$stmt->close();

echo json_encode(['ok' => true, 'itens' => $itens]);
