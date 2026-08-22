<?php
// Script de USO ÚNICO (não é chamado pelo front): unifica comentários
// antigos, gravados sob outro aula_id (de antes do mural virar global —
// ver ComentariosFeed.jsx), jogando tudo pra aula_id = 'geral'.
//
// NÃO mexe em 'dificuldade_do_dia' (DificuldadeDoDia.jsx usa a mesma
// tabela `comentarios` só que como um mural separado, de propósito).
//
// Como usar (visite pelo navegador, é protegido por ADMIN_SECRET):
//   1) https://renatodepaula.com/api/admin/migrar-comentarios-geral.php?secret=SUA_CHAVE
//      -> só mostra uma prévia (quantos comentários, de quais aula_id),
//         não muda nada no banco.
//   2) Se a prévia estiver certa, adiciona &confirmar=1 na mesma URL pra
//      executar o UPDATE de verdade.
// Depois de rodar uma vez com sucesso, pode apagar este arquivo do servidor.

header('Content-Type: application/json');
require __DIR__ . '/../hotmart/_conexao.php';

$chaveFornecida = $_GET['secret'] ?? '';
if (ADMIN_SECRET === '' || !hash_equals(ADMIN_SECRET, $chaveFornecida)) {
    http_response_code(401);
    echo json_encode(['erro' => 'Não autorizado. Use ?secret=SUA_CHAVE_ADMIN na URL.']);
    exit;
}

// aula_id que NUNCA devem ser tocados por essa migração.
$preservar = ['geral', 'dificuldade_do_dia'];
$placeholders = implode(',', array_fill(0, count($preservar), '?'));
$tipos = str_repeat('s', count($preservar));

// Prévia: agrupa por aula_id tudo que seria movido pra 'geral'.
$stmtPreview = $mysqli->prepare(
    "SELECT aula_id, COUNT(*) AS qtd FROM comentarios WHERE aula_id NOT IN ($placeholders) GROUP BY aula_id ORDER BY qtd DESC"
);
$stmtPreview->bind_param($tipos, ...$preservar);
$stmtPreview->execute();
$afetados = $stmtPreview->get_result()->fetch_all(MYSQLI_ASSOC);
$stmtPreview->close();

$totalAfetado = array_sum(array_column($afetados, 'qtd'));

$confirmar = ($_GET['confirmar'] ?? '') === '1';

if (!$confirmar) {
    echo json_encode([
        'ok' => true,
        'modo' => 'previa (nada foi alterado)',
        'total_que_seria_movido_para_geral' => $totalAfetado,
        'detalhe_por_aula_id' => $afetados,
        'proximo_passo' => $totalAfetado > 0
            ? 'Adicione &confirmar=1 na URL pra executar de verdade.'
            : 'Nada pra migrar — todos os comentários já estão em geral ou dificuldade_do_dia.',
    ]);
    exit;
}

if ($totalAfetado === 0) {
    echo json_encode(['ok' => true, 'linhas_atualizadas' => 0, 'mensagem' => 'Nada pra migrar.']);
    exit;
}

$stmtUpdate = $mysqli->prepare(
    "UPDATE comentarios SET aula_id = 'geral' WHERE aula_id NOT IN ($placeholders)"
);
$stmtUpdate->bind_param($tipos, ...$preservar);
$stmtUpdate->execute();
$linhas = $stmtUpdate->affected_rows;
$stmtUpdate->close();

echo json_encode([
    'ok' => true,
    'linhas_atualizadas' => $linhas,
    'mensagem' => 'Pronto. Esses comentários antigos agora aparecem no mural global em /comunidade. Pode apagar este arquivo do servidor.',
]);
