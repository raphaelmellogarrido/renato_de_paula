<?php
// Copie este arquivo pra "config.php" (mesma pasta) e preencha os valores
// reais. config.php fica FORA do Git (.gitignore) — sobe direto pro
// servidor por FTP/Gerenciador de Arquivos da Hostinger, uma vez só, e não
// precisa mexer de novo (mesmo padrão já usado pros vídeos do curso, ver
// HANDOFF.md). Evita depender das variáveis de ambiente do painel
// Hostinger, que já têm um bug documentado de auto-escape em caracteres
// especiais (ver HANDOFF.md, problema do SMTP_PASS).
define('DB_HOST', 'localhost');
define('DB_USER', 'u790959747_clube_user');
define('DB_PASS', 'coloque_a_senha_real_aqui');
define('DB_NAME', 'u790959747_clube');

// Chave da área administrativa (público/admin/*.php, ex: editar o card
// "Próximo encontro ao vivo"). Recomendado usar o MESMO valor do
// ADMIN_SECRET já configurado no .env do site (o painel /admin-meditacao
// usa essa outra cópia) — assim continua sendo uma senha só na prática,
// mesmo sendo checada por dois servidores diferentes (Node e PHP).
define('ADMIN_SECRET', 'coloque_a_mesma_chave_do_admin_aqui');

// Caixa comunidade@renatodepaula.com no SMTP da Hostinger (smtp.hostinger.com,
// porta 465/SSL), usada só pra mandar o convite de acesso de teste (ver
// public/api/admin/teste-emails.php). Crie essa caixa e a senha no hPanel
// antes de preencher aqui. NÃO usar o painel de variáveis de ambiente da
// Hostinger pra essa senha se ela tiver caractere especial (#, \, etc.) —
// tem um bug lá que corrompe o valor (ver HANDOFF.md, "Problema 2").
define('SMTP_COMUNIDADE_USER', 'comunidade@renatodepaula.com');
define('SMTP_COMUNIDADE_SENHA', 'coloque_a_senha_criada_no_hpanel_aqui');
