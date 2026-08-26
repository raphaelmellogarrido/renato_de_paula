# Handoff — site do Dr. Renato de Paula (renatodepaula.com)

Contexto pra continuar o trabalho num novo chat. Projeto: React (Vite) + backend Express em `server/index.js`, hospedado na Hostinger (plano Business, deploy via Git). Repositório: `raphaelmellogarrido/renato_de_paula`, branch `main`.

**Preferência do usuário**: não commitar/dar push automaticamente a cada mudança — só quando ele pedir explicitamente.

## Estrutura geral do projeto
- Frontend: React Router com páginas em `src/pages/` (Home, Cursos, Consulta, Sobre, Contato, Triagem "Triagem do Saber", Meditacao).
- Backend: `server/index.js` (Express) — serve o build (`dist/`), APIs de contato, triagem, meditação, e agora vídeos.
- Banco de dados: MySQL da Hostinger (`DB_HOST=127.0.0.1` — só acessível de dentro da infra deles), usado em `server/db.js` pra guardar inscrições da página de Meditação (tabela `inscricoes_meditacao`).
- Página `/meditacao`: tem formulário de cadastro de email (libera vídeos) + player customizado (`src/components/GuardedVideo.jsx`) que impede pular o vídeo. 3 vídeos: `mito1.mp4` (~113MB), `mito2.mp4` (~81MB), `mito3.mp4` (~110MB) — grandes demais pro GitHub (limite 100MB), por isso ficam fora do Git.

---

## PROBLEMA 1 (prioridade): vídeos da Meditação não carregam em produção

### O que já foi tentado e descartado
1. Vídeos inicialmente foram commitados sem querer (`public/mito*.mp4`) — causaram falha no `git push` (>100MB). Foram removidos do commit via `git commit --amend` (nunca chegaram a ser enviados ao GitHub, então não há problema de histórico).
2. Vídeos movidos para `server/videos/` (fora do `public/`), adicionados ao `.gitignore` (`server/videos/*` com exceção de `server/videos/.gitkeep`).
3. Backend serve os vídeos via rota dedicada: `app.use('/videos', express.static(VIDEOS_DIR))` em `server/index.js`, onde `VIDEOS_DIR = process.env.VIDEOS_DIR || path.join(__dirname, 'videos')` (permite sobrescrever via variável de ambiente).
4. **Descoberta**: a cada novo `git push` + deploy, a Hostinger **recria a pasta do app do zero**, apagando qualquer arquivo enviado manualmente por FTP/Gerenciador de Arquivos que não veio do Git. Ou seja, upload manual em `nodejs/server/videos/` (dentro da pasta do app) sempre some no próximo deploy.
5. Tentativa de mover vídeos pra fora da pasta do app, direto na raiz da conta: `/home/u790959747/meditacao-videos`, configurando `VIDEOS_DIR=/home/u790959747/meditacao-videos` nas variáveis de ambiente da Hostinger.
6. **Resultado**: adicionei diagnóstico no código (já commitado) que na subida do servidor tenta `fs.readdirSync(VIDEOS_DIR)` e loga o resultado. Erro obtido:
   ```
   VIDEOS_DIR (env): "/home/u790959747/meditacao-videos"
   VIDEOS_DIR (resolvido): /home/u790959747/meditacao-videos
   Não foi possível ler VIDEOS_DIR: ENOENT: no such file or directory, scandir '/home/u790959747/meditacao-videos'
   ```
   Isso apesar de o Gerenciador de Arquivos da Hostinger mostrar essa pasta existindo, com os 3 vídeos dentro, na raiz da conta (confirmado visualmente pelo usuário, ao lado das pastas `nodejs` e `public_html`).

### Hipótese atual (não confirmada)
O processo Node.js na Hostinger provavelmente roda dentro de um ambiente isolado/sandboxed (comum em hospedagem compartilhada com "Node.js Selector"/Passenger) que só enxerga a própria pasta do app (`/home/u790959747/domains/renatodepaula.com/nodejs/`), sem acesso a outras pastas da conta — mesmo sendo do mesmo usuário Linux. Isso explicaria o ENOENT mesmo com o caminho certo.

### Próximo passo sugerido (ainda não testado)
Tentar uma pasta **dentro** de `domains/renatodepaula.com/` mas **fora** de `nodejs/` (ou seja, ao lado, não dentro):
```
/home/u790959747/domains/renatodepaula.com/meditacao-videos
```
Criar essa pasta, subir os 3 vídeos, mudar `VIDEOS_DIR` pra esse caminho, reimplantar, e checar os logs de novo (procurar por "--- Diagnóstico VIDEOS_DIR ---").

Se isso **também** falhar com ENOENT, a conclusão é que o app Node só enxerga a própria pasta `nodejs/` mesmo, e nesse caso a próxima ação é abrir chamado com o suporte da Hostinger perguntando especificamente: *"Onde posso guardar arquivos que meu app Node.js precisa ler, que não sejam apagados a cada novo deploy via Git? Preciso de um caminho de armazenamento persistente acessível pelo processo Node."* — pergunta direcionada, deve ser fácil pra eles responderem (provavelmente existe uma pasta "storage" ou "persistent" documentada e específica da plataforma deles).

### Arquivos relevantes
- `server/index.js` — rota `/videos`, `VIDEOS_DIR`, diagnóstico de boot (`--- Diagnóstico VIDEOS_DIR ---`).
- `src/pages/Meditacao.jsx` — usa `src={`${API_URL}/videos/mito1.mp4`}` etc.
- `src/components/GuardedVideo.jsx` — player customizado, mostra mensagem de erro visível (`"Não foi possível reproduzir o vídeo..."`) quando o `<video>` falha ao carregar — foi assim que percebemos que o vídeo não estava sendo encontrado (retorna HTML do SPA fallback em vez do arquivo, causando erro de decodificação no navegador).

---

## PROBLEMA 2: autenticação SMTP falhando (erro 535) — quase resolvido, falta 1 caractere

### Sintoma
Dois recursos dependem de enviar email pelo backend:
- `POST /api/contact` (formulário de contato) — usa caixa `contato@renatodepaula.com`.
- `POST /api/meditacao/inscrever` (email de boas-vindas) e `POST /api/meditacao/enviar` (disparo em massa pra quem se cadastrou) — usam caixa `marketing@renatodepaula.com` (transportador separado, `marketingTransporter` em `server/index.js`).

Ambos falham com:
```
Invalid login: 535 5.7.8 Error: authentication failed: (reason unavailable)
```

### O que já foi descartado
- Senha errada: **não é isso**. Login funciona no webmail com a mesma senha. Também testei essas credenciais (host `smtp.hostinger.com`, porta 465, usuário `contato@renatodepaula.com`, senha) a partir de fora da infraestrutura da Hostinger (do meu próprio ambiente) e funcionou perfeitamente (enviei um email de teste real com sucesso).
- Porta errada: testamos 465 (SSL) e 587 (TLS/STARTTLS) — as duas falham igual.
- Bloqueio de infraestrutura da Hostinger: perguntei pro chatbot de suporte deles ("Kodee"), que confirmou que as duas caixas (`contato@` e `marketing@`) estão com "SMTP Out" habilitado, sem bloqueio, e DNS (MX/SPF/DKIM) corretos. Ou seja, não é algo pra "liberar" do lado deles.
- `127.0.0.1` como SMTP_HOST: tentei (por analogia ao banco de dados, que usa `127.0.0.1`), mas deu `ECONNREFUSED` — não tem servidor SMTP escutando em localhost, só o público `smtp.hostinger.com` mesmo.

### A causa raiz foi encontrada, mas ainda não corrigida
Adicionei um diagnóstico no código (`server/index.js`, já commitado) que loga a senha via `JSON.stringify` + os códigos de caractere de cada posição (nunca loga em texto puro sem contexto, mas tecnicamente aparece nos logs privados da Hostinger — remover esse diagnóstico depois de resolver, por boa prática). O log revelou:

```
SMTP_PASS: "***REMOVIDO***\\#" — tamanho: 11 — códigos: [redigido, 92, 35]
```

A senha real do email (10 caracteres, ver nota de segurança acima — valor removido deste arquivo) tinha um `#` como último caractere. Mas o valor efetivamente armazenado nas variáveis de ambiente da Hostinger tinha **11 caracteres**, com o código `92` (barra invertida `\`) inserido antes do `#` (35) — ou seja, o valor real ficava com uma barra invertida indesejada logo antes do `#` final.

Isso provavelmente é algum comportamento de auto-escape do campo de variáveis de ambiente da Hostinger em relação ao caractere `#` (que em muitos contextos de shell/config inicia um comentário). Já tentamos apagar e redigitar o campo manualmente uma vez e o problema persistiu.

### Próximo passo sugerido
1. Tentar mais uma vez, digitando bem devagar caractere por caractere (sem colar), removendo o `\` que aparece sozinho.
2. Se persistir mesmo digitando manualmente, o jeito mais seguro é **trocar a senha das duas caixas de email** (`contato@` e `marketing@`) pra uma senha nova que não use o caractere `#` — evita de vez esse gatilho do painel, seja lá qual for a causa exata.
3. Depois de corrigir, os logs devem mostrar `SMTP_PASS length: 10` (sem o `\` nos códigos) e `Verificação SMTP (contato): OK` / `Verificação SMTP (marketing): OK` na subida do servidor (esse teste de conexão roda automaticamente a cada boot, não precisa fazer cadastro de teste).
4. **Depois que funcionar**: remover o bloco de diagnóstico do `server/index.js` (procurar por `--- Diagnóstico SMTP ---` e `--- Diagnóstico VIDEOS_DIR ---`) já que não é mais necessário e loga informação sensível nos logs.

### Variáveis de ambiente relevantes (painel Hostinger → Variáveis de ambiente)
```
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=465
SMTP_USER=contato@renatodepaula.com
SMTP_PASS=***REMOVIDO*** (trocada — ver nota de segurança abaixo)
MARKETING_SMTP_USER=marketing@renatodepaula.com
MARKETING_SMTP_PASS=***REMOVIDO*** (trocada — ver nota de segurança abaixo)
TO_EMAIL=contato@renatodepaula.com
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=u790959747_meditacao
DB_PASSWORD=|IBkRH!e6
DB_NAME=u790959747_meditacao
ADMIN_SECRET=0909199ad0e5a1949f57ecae6d9b7e3afbc86859dc0ff728  (autoriza POST /api/meditacao/enviar)
VIDEOS_DIR=/home/u790959747/meditacao-videos  <- ver Problema 1, provavelmente precisa mudar
```

---

## PROBLEMA 3 (26/08): fotos anexadas em "Sua prática hoje" somem em produção — RESOLVIDO

### Sintoma
Reportado pelo usuário com screenshots reais do Android/Chrome em produção: fotos que alunos anexam nos comentários de "Sua prática hoje" (`DificuldadeDoDia.jsx`, upload via `upload-imagem-comentario.php`) apareciam como ícone de imagem quebrada em vez de carregar — de forma inconsistente entre quem olhava (não era filtro por admin/usuário, era "olhou antes ou depois do próximo deploy").

### Causa confirmada (mesmo mecanismo do PROBLEMA 1)
`upload-imagem-comentario.php` salvava o arquivo em `public/uploads/posts/` (relativo ao próprio script) e devolvia a URL `/uploads/posts/<nome>`. Essa pasta está no `.gitignore` (com `.gitkeep` só pra existir no Git) — ou seja, os arquivos enviados por aluno em produção nunca vinham do Git. A Hostinger recria a pasta do app do zero a cada novo `git push` + deploy, apagando qualquer coisa que não veio do Git — toda foto enviada por aluno sumia no próximo deploy.

### Correção aplicada (26/08, mesma sessão que resolveu o bug de avatar sumindo — 25/08)
Migrado pro mesmo padrão já usado pra foto de perfil (`alunos.avatar_blob`/`avatar_versao`/`avatar.php`): a foto agora vive **dentro do MySQL**, não em arquivo:
- `upload-imagem-comentario.php` não grava mais em disco — grava os bytes em staging (`comentario_imagens_pendentes`, tabela efêmera com limpeza de 1h) e devolve um `token`.
- `comentarios.php` POST aceita `image_token` (em vez de `image_url`), migra o blob da staging pra `comentarios.image_blob`/`image_mime` no INSERT.
- Novo `public/api/hotmart/imagem-comentario.php` serve o blob por `GET ?id=<comentario_id>`, cache longo e imutável (foto de comentário não é editável depois de postada).
- `comentarios.php` GET agora devolve `image_url` computado: `/api/hotmart/imagem-comentario.php?id=...` quando a foto está em BLOB; cai pro valor legado da coluna antiga `image_url` só pra comentários muito antigos (esses continuam perdidos — arquivo já foi apagado por um deploy anterior, sem regressão em relação a hoje).
- Schema: `_conexao.php`, `garantirEstruturaClube()` v6.

O padrão "pasta persistente fora do Git" sugerido antes (igual à tentativa do PROBLEMA 1) foi descartado a favor do BLOB — mais simples, não depende de descobrir/confirmar caminho nenhum na Hostinger, e já é um padrão comprovado nesta base (avatar).

### Arquivos relevantes
- `public/api/hotmart/upload-imagem-comentario.php` — grava blob em staging, devolve token.
- `public/api/hotmart/comentarios.php` — POST migra blob pro comentário; GET computa a URL servida.
- `public/api/hotmart/imagem-comentario.php` — **novo**, serve o blob.
- `public/api/hotmart/_conexao.php` — schema (`image_blob`/`image_mime` em `comentarios`, tabela `comentario_imagens_pendentes`).
- `src/pages/comunidade/components/ComentarioCard.jsx` — `onError` no `<img>` continua como rede de segurança pros comentários antigos/legados, nada mudou aqui.
- `.gitignore` — comentário acima de `public/uploads/posts/*` ainda documenta a causa original (pasta não é mais usada por comentários novos, mas não foi removida do ignore).

---

## Outras notas úteis
- **Vídeos do curso Meditação Raiz (`/comunidade/aulas-raiz`)**: mesmo padrão do Problema 1 acima. O backend serve a pasta `CURSO_RAIZ_DIR` (env var) na rota `/curso-meditacao-raiz`, e monta o catálogo (dias/vídeos/títulos) lendo essa pasta com `fs.readdirSync` — sem cadastro manual em banco. Título de cada arquivo vem de `src/lib/titulosAulasRaiz.js`. **Para funcionar em produção**, crie a variável de ambiente `CURSO_RAIZ_DIR=/home/u790959747/domains/renatodepaula.com/curso-meditacao-raiz` no painel da Hostinger (a pasta com os 49 vídeos já foi enviada manualmente lá, fora do `public_html`) e reinicie o app. Sem essa env var, a rota cai no fallback local (`server/curso-meditacao-raiz/`, vazia) e a página mostra "Nenhum vídeo encontrado".

- Testar localmente com `npm run dev:all` (roda frontend Vite + backend Express juntos). O banco de dados e SMTP da Hostinger só funcionam de verdade quando publicados (banco só aceita conexão de dentro da rede deles; localmente há um MySQL diferente rodando na máquina do usuário que "responde" por engano no mesmo host/porta).
- Padrão de bug recorrente nesse projeto: usar `style={{ maxWidth: N, margin: '0 auto' }}` numa `<div className="container">` sem também incluir `width: '100%'` quebra o responsivo (a classe `.container` define `width: 1120px` fixo, e sem o `width:100%` o `maxWidth` vira um valor fixo que não encolhe no mobile). Sempre que adicionar uma nova seção com esse padrão, incluir os dois.
- Link direto pra âncoras dentro de página (ex: `/lives` redireciona pra `/meditacao#cadastro-live`) — funciona via `scrollIntoView` num `useEffect` que observa `location.hash`. O `ScrollToTop.jsx` (que força scroll ao topo em toda navegação) foi ajustado pra pular esse comportamento quando há hash na URL, senão brigam entre si.
