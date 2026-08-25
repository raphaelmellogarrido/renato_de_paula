<?php
// Reseta o progresso de "Desafio da Semana" de TODOS os alunos pra semana
// atual — botão vermelho "Resetar desafios da semana" em /admin (seção
// "Desafio da Semana", AdminMeditacao.jsx). Protegido por X-Admin-Secret,
// mesmo padrão de public/api/admin/desafios-semana.php.
//
// Não confundir com desafio_config (título/descrição dos 3 itens, editado
// por desafios-semana.php): aqui é o progresso de CHECK de cada aluno
// (tabela desafio_semana, ver public/api/hotmart/desafio-semana.php),
// chaveado por email + semana ISO (YEARWEEK(CURDATE(),1), mesmo cálculo que
// desafio-semana.php já usa pra ler/gravar). Só apaga a linha da semana
// ATUAL — semanas passadas continuam intactas (é histórico, não faz parte
// do reset).
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-Admin-Secret');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit; }

require __DIR__ . '/../hotmart/_conexao.php';

$chaveFornecida = $_SERVER['HTTP_X_ADMIN_SECRET'] ?? '';
if (ADMIN_SECRET === '' || !hash_equals(ADMIN_SECRET, $chaveFornecida)) {
    http_response_code(401);
    echo json_encode(['erro' => 'Não autorizado']);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['erro' => 'Método não permitido']);
    exit;
}

$res = $mysqli->query("SELECT YEARWEEK(CURDATE(), 1) as sem");
$semana = (int) $res->fetch_assoc()['sem'];

// A tabela desafio_semana só existe depois do primeiro check de algum
// aluno (criada por desafio-semana.php, não por garantirEstruturaClube) —
// se ainda não existir, não há nada pra resetar, mas isso não é erro.
$existeTabela = $mysqli->query("SHOW TABLES LIKE 'desafio_semana'");
if (!$existeTabela || $existeTabela->num_rows === 0) {
    echo json_encode(['ok' => true, 'linhasApagadas' => 0, 'semana' => $semana]);
    exit;
}

$stmt = $mysqli->prepare("DELETE FROM desafio_semana WHERE semana = ?");
$stmt->bind_param('i', $semana);
$stmt->execute();
$linhasApagadas = $stmt->affected_rows;
$stmt->close();

echo json_encode(['ok' => true, 'linhasApagadas' => $linhasApagadas, 'semana' => $semana]);
