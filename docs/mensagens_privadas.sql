-- Tabela: mensagens_privadas
-- Mensagem privada admin -> aluno (Tarefa 2). Nome do comentarista fica
-- clicável em ComentarioCard.jsx só quando quem está vendo é admin/orientador
-- (raphaelmellogarrido@gmail.com ou rsp.ren@gmail.com), abrindo o modal
-- "Enviar mensagem para @Nome".
--
-- Sem "para_user_id" numérico de propósito: este schema não tem id de
-- usuário em lugar nenhum (a PK de `alunos` já é o próprio email), então
-- para_email é o identificador do destinatário.
--
-- Esta tabela já é criada automaticamente por garantirEstruturaClube() em
-- public/api/hotmart/_conexao.php (versão de estrutura 4) na primeira
-- request depois do deploy — este arquivo é só a documentação/registro do
-- schema, não precisa ser rodado manualmente.
--
-- Consumida por:
--   public/api/mensagens/enviar.php       (POST — cria uma mensagem)
--   public/api/mensagens/listar.php       (GET  — thread por email + contagem de não lidas)
--   public/api/mensagens/marcar_lida.php  (POST — marca como lida ao abrir /comunidade/mensagens)

CREATE TABLE IF NOT EXISTS mensagens_privadas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    de_email VARCHAR(255) NOT NULL,
    para_email VARCHAR(255) NOT NULL,
    mensagem TEXT NOT NULL,
    lida TINYINT(1) NOT NULL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX(para_email),
    INDEX(de_email),
    INDEX(created_at)
);
