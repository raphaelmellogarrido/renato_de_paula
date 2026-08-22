<?php
// Conteúdo (título/descrição) dos 3 itens do card "Desafio da Semana"
// (DesafioSemana.jsx, dashboard da comunidade). Só leitura, público — quem
// edita é public/api/admin/desafios-semana.php. Tabela desafio_config já
// existe no banco (3 linhas), não provisiona nada aqui.
//
// Não confundir com public/api/hotmart/desafio-semana.php: aquele é o
// progresso de CHECK do aluno (tabela desafio_semana, por email/semana);
// este aqui é só o conteúdo/texto dos itens (tabela desafio_config).
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') exit;

require __DIR__ . '/hotmart/_conexao.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['erro' => 'Método não permitido']);
    exit;
}

$res = $mysqli->query("SELECT id, ordem, titulo, descricao FROM desafio_config ORDER BY ordem");
// Defensivo: se a tabela ficar vazia por algum motivo, devolve array vazio
// em vez de 500 — o front sempre recebe um shape previsível e cai pro
// conteúdo padrão dele mesmo (mesmo padrão de public/api/encontro.php).
$itens = $res ? $res->fetch_all(MYSQLI_ASSOC) : [];

echo json_encode(['ok' => true, 'itens' => $itens]);
