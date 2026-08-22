<?php
header('Content-Type: application/json');
require_once __DIR__ . '/../_conexao.php';

try {
    // Ranking GLOBAL - todo mundo, não só o logado
    $sql = "SELECT 
                a.nome, 
                p.email, 
                COUNT(DISTINCT DATE(p.created_at)) as dias,
                MAX(p.created_at) as ultimo
            FROM presencas p
            JOIN alunos a ON a.email = p.email
            GROUP BY p.email, a.nome
            ORDER BY dias DESC, ultimo DESC
            LIMIT 20";
    
    $stmt = $pdo->query($sql);
    $ranking = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode($ranking);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['erro' => $e->getMessage()]);
}