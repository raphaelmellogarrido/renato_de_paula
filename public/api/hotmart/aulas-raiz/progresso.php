<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit; }

require __DIR__ . '/../_conexao.php';
garantirEstruturaClube($mysqli); // cria progresso_aulas_raiz se ainda não existir

// Progresso do curso de 49 vídeos (aulas-raiz), chaveado por email + nome
// do arquivo (ex: "dia1.2.mp4"). Tabela própria, separada de
// aulas_raiz/progresso_aulas (curso antigo Hotmart, aula_id INTEIRO) — essa
// diferença de tipo é o motivo de este endpoint existir em vez de reusar
// aulas.php, que sempre rejeitava esse formato de id (intval("dia1.2.mp4")
// = 0, tratado como aula_id ausente).
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $email = strtolower(trim($_GET['email'] ?? ''));
    if (!$email) {
        http_response_code(400);
        echo json_encode(['erro' => 'email obrigatório']);
        exit;
    }

    $stmt = $mysqli->prepare(
        "SELECT arquivo, dia, progresso_percent, ultima_posicao, assistida, completada_em
         FROM progresso_aulas_raiz WHERE email = ?"
    );
    $stmt->bind_param('s', $email);
    $stmt->execute();
    $res = $stmt->get_result();
    $aulas = [];
    while ($row = $res->fetch_assoc()) {
        $aulas[] = [
            'arquivo' => $row['arquivo'],
            'dia' => (int)$row['dia'],
            'progresso' => (int)$row['progresso_percent'],
            'posicao' => (int)$row['ultima_posicao'],
            'assistida' => (bool)$row['assistida'],
            // Usado por progressoDias.js (bloqueio por dia/calendário) pra
            // calcular a data em que o último dia foi 100% concluído —
            // string "Y-m-d H:i:s" (mysqli devolve assim) ou null.
            'completado_em' => $row['completada_em'],
        ];
    }
    $stmt->close();

    // 'hoje': data do SERVIDOR (fuso Brasília, forçado em _conexao.php), não
    // do navegador do cliente — o front usa isso (não new Date() local) pra
    // decidir se "já é um novo dia" no bloqueio por calendário (ver
    // progressoDias.js/podeAssistir). Sem isso, um dispositivo com fuso
    // diferente de BRT podia destravar o próximo dia cedo/tarde demais.
    echo json_encode(['ok' => true, 'aulas' => $aulas, 'hoje' => date('Y-m-d')]);
    exit;
}

if ($method === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    $email = strtolower(trim($input['email'] ?? ''));
    $arquivo = trim($input['arquivo'] ?? '');
    $dia = intval($input['dia'] ?? 0);
    $progresso = intval($input['progresso'] ?? 0);
    $posicao = intval($input['posicao'] ?? 0);
    $completou = !empty($input['completou']);

    if (!$email || !$arquivo) {
        http_response_code(400);
        echo json_encode(['erro' => 'email e arquivo obrigatórios']);
        exit;
    }

    // SET direto (não GREATEST/preserva) de propósito: o checkbox de
    // "Marcar/Desmarcar como concluída" precisa poder VOLTAR assistida pra
    // 0, não só avançar — diferente do vídeo linear do curso antigo.
    $assistidaInt = $completou ? 1 : 0;
    $stmt = $mysqli->prepare(
        "INSERT INTO progresso_aulas_raiz (email, arquivo, dia, progresso_percent, ultima_posicao, assistida, completada_em)
         VALUES (?, ?, ?, ?, ?, ?, " . ($completou ? "NOW()" : "NULL") . ")
         ON DUPLICATE KEY UPDATE
           dia = VALUES(dia),
           progresso_percent = VALUES(progresso_percent),
           ultima_posicao = VALUES(ultima_posicao),
           assistida = VALUES(assistida),
           completada_em = VALUES(completada_em)"
    );
    $stmt->bind_param('ssiiii', $email, $arquivo, $dia, $progresso, $posicao, $assistidaInt);
    $stmt->execute();
    $stmt->close();

    // Completar uma aula também conta como presença do dia (mesmo
    // comportamento que aulas.php já tem pro curso antigo).
    if ($completou) {
        $stmt2 = $mysqli->prepare(
            "INSERT INTO presencas (email, data, minutos) VALUES (?, CURDATE(), 10)
             ON DUPLICATE KEY UPDATE minutos = minutos + 10"
        );
        $stmt2->bind_param('s', $email);
        $stmt2->execute();
        $stmt2->close();
    }

    echo json_encode(['ok' => true]);
    exit;
}

http_response_code(405);
echo json_encode(['erro' => 'Método não permitido']);
