# Relatório de Limpeza — 2026-09-04

**FASE 1 (auditoria), FASE 2 (quarentena) e FASE 3 (validação) concluídas em 05/09/2026.** Ver "Achado crítico" abaixo pro contexto e "Execução (Fase 2 + Fase 3)" no fim do documento pro resultado final — a decisão tomada foi **aposentar `comunidade/` de verdade**, o que muda o veredito de várias linhas das tabelas abaixo (elas registram o estado da auditoria original, antes da decisão; não foram reescritas linha a linha pra não perder o histórico da Fase 1).

Build de baseline (`npm run build`) rodou limpo: 2290 módulos, sem erro. `dist/` gerou chunks separados pra `Dashboard`, `Login`, `Mensagens`, `Configuracoes`, `AulasMeditacaoRaiz`, `ComunidadeLayout`, `Aula`, `AdminMeditacao`, `EsqueceuSenha`, `RedefinirSenha`, `AdminComunidadePage` — ou seja, toda a área de membros está de fato compilada e servida no bundle de produção hoje.

---

## ⚠️ Achado crítico — contradiz a premissa do pedido

O pedido descreve a "comunidade" (login, dashboard, aulas, mensagens, admin) como **"lixo da comunidade de teste antiga"**. A auditoria mostra o oposto:

- `src/App.jsx` roteia ativamente `/comunidade`, `/comunidade/login`, `/comunidade/aulas-raiz`, `/comunidade/aula/:id`, `/comunidade/configuracoes`, `/comunidade/mensagens`, `/comunidade/admin`, `/esqueceu-senha`, `/redefinir-senha` e `/admin` — todas com `lazy(() => import(...))` de verdade, carregadas pelo Suspense.
- Isso puxa **~90 arquivos** em `src/pages/comunidade/` (login/cadastro, recuperação de senha, dashboard, sequência de meditação, ranking de presença, comentários com foto, sistema de mensagens entre aluno/orientador, admin de desafios da semana e de encontros ao vivo) e **~30 endpoints PHP** em `public/api/hotmart/`, `public/api/mensagens/`, `public/api/admin/`, `public/api/live/`, `public/api/comunidade/`.
- `git log` mostra commits nessa árvore até **25/08/2026** ("mudançaa 2", "nao hibernar mais", "card meditando junto" etc.) — 10 dias atrás, não algo abandonado.
- `.gitignore` e comentários no próprio código (`avatar.php`, `DificuldadeDoDia.jsx`) descrevem bugs relatados **em produção por alunos reais** em 25/08 (foto de perfil sumindo, foto de comentário sumindo) — linguagem de sistema com usuários pagantes ativos, não de ambiente de teste.
- `public/.htaccess` deixa `/api/*` passar direto pro PHP sem exceção — todos esses endpoints estão de fato acessíveis publicamente hoje, não só os dois citados (`video-log.php`, `ver-logs.php`).

**Se "comunidade" for mesmo pra aposentar**, isso envolve também editar `src/App.jsx` (tirar as rotas) — não só mover arquivos pra quarentena, senão o build quebra (imports quebrados dos próprios `lazy()`). **Se não for pra aposentar**, o escopo da limpeza deste pedido precisa mudar: praticamente tudo em `comunidade/` é "USADO" pela própria definição do pedido (importado por rota ativa).

Por segurança, **não movi nada em `comunidade/` nem nos APIs que ela chama**. Só seguem abaixo como candidatos reais e sem ambiguidade: os arquivos de páginas de site institucional antigo (Sobre/Triagem/Consulta/Cursos), cópias de desenvolvimento (`*copy*`, `*COPY*`), e dois scripts PHP de debug com problema de segurança próprio (ver nota no fim).

---

## Frontend

| Arquivo | Quem chama | Status | Ação sugerida |
|---|---|---|---|
| `src/pages/Home.jsx` | `App.jsx` rota `/` | USADO | manter |
| `src/pages/Meditacao.jsx` | `App.jsx` rotas `/meditacao` e `/mitos` | USADO | manter |
| `src/pages/Contato.jsx` | `App.jsx` rota `/contato` | USADO | manter |
| `src/pages/AdminMeditacao.jsx` | `App.jsx` rota `/admin` + `comunidade/AdminComunidadePage.jsx` | USADO¹ | manter |
| `src/pages/comunidade/**` (~90 arquivos: `ComunidadeLayout`, `Login`, `Dashboard`, `Aula`, `AulasMeditacaoRaiz`, `Configuracoes`, `Mensagens`, `AdminComunidadePage`, `EsqueceuSenha`, `RedefinirSenha`, todo `components/`, `data/mockData.js`) | `App.jsx` rotas `/comunidade/*`, `/esqueceu-senha`, `/redefinir-senha` | USADO | manter — ver achado crítico acima |
| `src/pages/comunidade/components/FeedComunidade.jsx` | ninguém — comentário em `Dashboard.jsx` diz "não é mais montado" | ÓRFÃO | quarentena |
| `src/pages/comunidade/featureFlags.js` | ninguém (só citado em comentários) | ÓRFÃO | quarentena |
| `src/pages/comunidade/components/RankingPresenca.jsx` | ninguém — comentário no próprio arquivo (via `ColunaEncontros.jsx`) diz "arquivo mantido no disco mas sem uso" | ÓRFÃO (mesmo padrão do FeedComunidade — parqueado, não montado) | quarentena |
| `src/pages/comunidade/components/CardBiblioteca.jsx` | ninguém — CSS (`ComunidadeApp.css`) documenta "não usado no [print/tela atual]" | ÓRFÃO (mesmo padrão do FeedComunidade — parqueado, não montado) | quarentena |
| `src/pages/comunidade/ComunidadeLayoutCOPY.jsx` | ninguém | ÓRFÃO (cópia de dev) | quarentena |
| `src/pages/comunidade/components/sidebarCOPY.jsx` | ninguém | ÓRFÃO (cópia de dev) | quarentena |
| `src/pages/appcopy.jsx` | ninguém — é uma cópia inteira de `App.jsx` | ÓRFÃO (cópia de dev) | quarentena |
| `src/pages/Meditacao-copy.jsx` | ninguém | ÓRFÃO (cópia de dev, versão antiga de `Meditacao.jsx`) | quarentena |
| `src/pages/Sobre.jsx` | ninguém — link comentado no `Navbar.jsx`/`Footer.jsx` | ÓRFÃO | quarentena |
| `src/pages/Triagem.jsx` | ninguém | ÓRFÃO | quarentena |
| `src/pages/Consulta.jsx` | ninguém | ÓRFÃO | quarentena |
| `src/pages/Cursos.jsx` | ninguém | ÓRFÃO | quarentena |
| `src/config/triagemContent.js` | só `Triagem.jsx` (órfão) | ÓRFÃO (cadeia) | quarentena junto com Triagem |
| `src/config/triagem_do_saber_arvore.yaml` | só `triagemEngine.js` (órfão) | ÓRFÃO (cadeia) | quarentena junto com Triagem |
| `src/lib/triagemEngine.js` | só `Triagem.jsx` (órfão) | ÓRFÃO (cadeia) | quarentena junto com Triagem |
| `src/config/links.js` | só `Cursos.jsx` e `triagemContent.js` (ambos órfãos) | ÓRFÃO (cadeia) | quarentena junto com Cursos |
| `src/config/countries.js` | `Contato.jsx` (usado) | USADO | manter |
| `src/components/Navbar.jsx`, `Footer.jsx`, `ScrollToTop.jsx`, `MetaPixelTracker.jsx`, `GuardedVideo.jsx`, `PhoneLeadInput.jsx` | `App.jsx` / `Meditacao.jsx` | USADO | manter |
| `src/utils/loadThirdParty.js` | `main.jsx` | USADO | manter |
| `src/lib/titulosAulasRaiz.js` | `comunidade/components/JornadaProgress.jsx` | USADO | manter |

¹ `AdminMeditacao.jsx` é **USADO** pela rota, mas chama `${API_URL}/api/meditacao/*` — um backend Express em `server/index.js` (existe no repo), não os PHPs de `public/api/`. Não achei evidência de que esse Express ainda está no ar em produção (o `.htaccess` só sabe de PHP). **DUVIDOSO** se essa tela funciona hoje — não mexi, só sinalizo.

---

## API (`public/api/`)

| Arquivo | Quem chama | Status | Ação sugerida |
|---|---|---|---|
| `video-log.php` | `loadThirdParty.js` (sendBeacon/fetch), `Meditacao.jsx` | USADO — protegido, não mexer | manter |
| `ver-logs.php` | painel de leitura de log (uso manual/admin) | USADO — protegido, não mexer | manter |
| `stream.php` | `Meditacao.jsx` (`<video src="/api/stream.php?f=...">`, `GuardedVideo`) | USADO | manter |
| `desafios-semana.php` | `comunidade/components/DesafioSemana.jsx` | USADO | manter |
| `get_frase_semana.php` | `AdminMeditacao.jsx`, `comunidade/components/FraseMotivacionalSemana.jsx` | USADO | manter |
| `update_frase_semana.php` | `AdminMeditacao.jsx` | USADO | manter |
| `encontro.php` | `comunidade/components/ColunaEncontros.jsx` | USADO | manter |
| `admin/encontro.php`, `admin/live-controle.php`, `admin/desafios-semana.php`, `admin/resetar_desafios.php`, `admin/teste-emails.php` | `AdminMeditacao.jsx` | USADO | manter |
| `admin/migrar-comentarios-geral.php` | ninguém no front — script de uso único, o próprio comentário no arquivo diz "depois de rodar uma vez com sucesso, pode apagar este arquivo" | ÓRFÃO (auto-declarado descartável) | confirmar com você se já rodou; se sim, quarentena |
| `comunidade/posts.php` | só `FeedComunidade.jsx`, que está órfão (não montado) | ÓRFÃO (cadeia) | quarentena junto com FeedComunidade |
| `comunidade/pulso.php` | `comunidade/components/MeditandoJunto.jsx` (usado) | USADO | manter |
| `hotmart/login.php`, `register.php`, `esqueceu-senha.php`, `redefinir-senha.php`, `user.php`, `user/change-password.php`, `upload-avatar.php`, `presenca.php`, `presenca/ranking.php`, `comentarios.php`, `comentario-reacao.php`, `upload-imagem-comentario.php`, `desafio-semana.php`, `aulas-raiz/progresso.php`, `webhook.php` | telas de `comunidade/` (login/cadastro/perfil/comentários/presença) + `webhook.php` chamado externamente pela Hotmart | USADO | manter |
| `hotmart/avatar.php` | não é chamado direto do front por string — a URL é montada no servidor (`avatarUrlPublica()` em `_conexao.php`) e devolvida em `login.php`/`user.php` como `avatar_url` | USADO (indireto) | manter |
| `hotmart/aulas.php` | não achei chamada em `src/` — pode ter sido substituído por `aulas-raiz/progresso.php` | DUVIDOSO | não mexer, confirmar antes |
| `hotmart/check.php` | não é chamado por `src/` nem por `require` de outro PHP — só citado em comentários | DUVIDOSO | não mexer, confirmar se é usado por algo externo (ex.: automação Hotmart) |
| `hotmart/config.example.php` | ninguém chama via URL — é template comitado do `config.php` real (gitignorado) | referência intencional, não é órfão | manter |
| `hotmart/config.php`, `hotmart/_conexao.php`, `lib/PHPMailer/*` | `require`ados por quase todos os PHPs acima | USADO (infraestrutura interna) | manter |
| `mensagens/enviar.php`, `listar.php`, `listar_alunos.php`, `marcar_lida.php` | `comunidade/Mensagens.jsx`, `BuscaUsuarios.jsx`, `DificuldadeDoDia.jsx` | USADO | manter |
| `live/reservas.php`, `live/status.php` | `comunidade/components/ColunaEncontros.jsx`, `reservasLive.js` | USADO | manter |
| `hotmart/debug2.php` | ninguém — dump de dados de um e-mail fixo (`raphaelmellogarrido@gmail.com`), **sem nenhuma checagem de senha/secret** | ÓRFÃO — **e vazamento de dado pessoal exposto por URL pública** | quarentena/apagar — prioridade de segurança |
| `hotmart/debug3.php` | ninguém — mesmo padrão, dump de presenças/progresso do mesmo e-mail, **sem autenticação** | ÓRFÃO — **mesmo problema de segurança** | quarentena/apagar — prioridade de segurança |

---

## Notas

- `sitemap.xml` só lista `/`, `/meditacao`, `/contato` — bate com o que você descreveu como "público", mas isso é esperado mesmo com `/comunidade` sendo uma área de membro (não deveria mesmo estar no sitemap). Não usei o sitemap como sinal de "órfão".
- Não achei rota `/agendar` em `App.jsx` nem regra correspondente no `.htaccess` — hoje "Agendar Consulta" é um link direto pro WhatsApp (`Navbar.jsx`/`Footer.jsx`), não uma rota React. Se você espera uma rota `/agendar` de verdade, ela não existe no código atual.
- Não classifiquei os assets soltos em `public/*.jpeg/.jpg/.png` (bandeiras, fotos de depoimento, etc.) nem `server/` (backend Express antigo) — fora do escopo pedido (`src/pages`, `src/components`, `public/api`), mas `server/` é outro candidato a "isso ainda roda?" pelo mesmo motivo do `AdminMeditacao.jsx` acima (nota ¹).
- Confirmação por grafo de import (script partindo de `main.jsx`, resolvendo cada `import` relativo): bate 100% com a tabela acima, e achou mais 2 arquivos em `src/assets/` sem uso (`react.svg`, `vite.svg` — sobra do template do Vite) e 5 fotos de depoimento antigas (`depo1.jpeg`…`depo5.jpeg`) + `hero.png`, `renato.png`, `renato_atendendo.png` não referenciadas por nenhum import — fora do escopo pedido (não é `src/pages`/`components`/`public/api`), só registrando aqui pra não perder o achado.

---

## Execução (Fase 2 + Fase 3) — 05/09/2026

Depois do achado crítico acima, você confirmou explicitamente (ciente do impacto em alunos ativos) a decisão de **aposentar `comunidade/` de verdade**, incluindo o webhook da Hotmart. Plano completo aprovado em plan mode antes de qualquer `git mv`.

### O que mudou em `src/App.jsx`

- Removidos os imports e rotas de `comunidade/*`, `/esqueceu-senha`, `/redefinir-senha` (11 imports `lazy()`, `useComunidadeAuth`, `AdminGuard`).
- Removidos `ROTAS_TELA_CHEIA_COMUNIDADE`, `RotaComunidade()` e a variável `isComunidade` — `Navbar`/`Footer` voltam a renderizar sempre, incondicional.
- `/admin` deixou de passar por `AdminGuard` (dependia da sessão de `comunidade/`, que não existe mais). Continua protegido pelo `ADMIN_SECRET` que `AdminMeditacao.jsx` já pedia por conta própria (header `X-Admin-Secret`, checado com `hash_equals` no PHP) — isso não mudou.
- Mantidas sem alteração: `/`, `/meditacao`, `/mitos`, `/admin-meditacao` (redirect), `/contato`, rota `*`.
- **Consequência aceita, não tratada nesta limpeza:** dentro de `/admin`, ~5 abas internas de `AdminMeditacao.jsx` (encontro ao vivo, desafios da semana, frase da semana, resetar desafios, teste de e-mails) vão passar a dar erro de fetch, porque os PHPs que elas chamam foram pra quarentena. O painel de inscrições do `/meditacao` (backend Express separado) não é afetado. Fica de fora deste pass por ser edição de dentro de um arquivo de ~1300 linhas — item de follow-up se você quiser.

### Arquivos movidos pra quarentena (`git mv`, nada de `rm` — 103 arquivos)

Todos dentro de `_ARQUIVO_MORTO_2026-09-04/`, espelhando a estrutura original (`src/...` e `api-antiga/...`).

**Frontend (11 fora de `comunidade/` + `comunidade/` inteira, ~90 arquivos):**
- `src/pages/Sobre.jsx`, `Triagem.jsx`, `Consulta.jsx`, `Cursos.jsx`, `Meditacao-copy.jsx`, `appcopy.jsx`
- `src/lib/triagemEngine.js`, `titulosAulasRaiz.js`, `src/config/triagemContent.js`, `triagem_do_saber_arvore.yaml`, `links.js`
- `src/pages/comunidade/` inteira: `AdminComunidadePage.jsx`, `Aula.jsx`, `AulasMeditacaoRaiz.jsx`, `ComunidadeApp.css`, `ComunidadeLayout.jsx`, `ComunidadeLayoutCOPY.jsx`, `Configuracoes.jsx`, `Dashboard.jsx`, `EsqueceuSenha.jsx`, `Login.jsx`/`Login.css`, `Mensagens.jsx`, `RedefinirSenha.jsx`, `featureFlags.js`, `data/mockData.js`, e todo `components/` (`AdminGuard.jsx`, `isAdmin.js`, `AvatarCropModal.jsx`, `BotaoMediteiHoje.jsx`, `BuscaUsuarios.jsx`, `CardBiblioteca.jsx`, `ColunaEncontros.jsx`, `ColunaProgresso.jsx`, `ComentarioCard.jsx`, `ComentariosFeed.jsx`, `ComunidadeSidebar.jsx`, `DesafioSemana.jsx`, `DificuldadeDoDia.jsx`, `FeedComunidade.jsx`, `FraseMotivacionalSemana.jsx`, `HamburgerMenu.jsx`, `ImageLightbox.jsx`, `JornadaProgress.jsx`, `MeditandoJunto.jsx`, `MensagemModal.jsx`, `RankingPresenca.jsx`, `Sequencia.jsx`, `cacheComentarios.js`, `comentariosUtils.js`, `progressoDias.js`, `reservasLive.js`, `senhaForte.js`, `sidebarCOPY.jsx`, `useComunidadeAuth.js`, `useMeditacaoHoje.js`, `useMensagensNaoLidas.js`, `useProgressoAulasRaiz.js`, `useSequenciaMeditacao.js`, `usuarioStorage.js`)

**API (`api-antiga/`, ~40 arquivos):**
- `public/api/hotmart/` — tudo exceto `_conexao.php`, `config.php`, `config.example.php`, `.htaccess` (ficam, ver nota abaixo): `login.php`, `register.php`, `esqueceu-senha.php`, `redefinir-senha.php`, `user.php`, `user/change-password.php`, `upload-avatar.php`, `avatar.php`, `presenca.php`, `presenca/ranking.php`, `comentarios.php`, `comentario-reacao.php`, `upload-imagem-comentario.php`, `imagem-comentario.php`, `desafio-semana.php`, `aulas.php`, `aulas-raiz/progresso.php`, `check.php`, `debug2.php`, `debug3.php` (vazamento de dado pessoal sem auth — prioridade de segurança), `webhook.php` (webhook real da Hotmart — próxima compra aprovada vai bater 404 aqui até você desativar a integração no painel da Hotmart)
- `public/api/admin/` inteira (6 arquivos, incluindo `migrar-comentarios-geral.php` — confirmado que você já rodou)
- `public/api/comunidade/` (`posts.php`, `pulso.php`), `public/api/mensagens/` (4 arquivos), `public/api/live/` (`reservas.php`, `status.php`, `.htaccess`)
- `public/api/get_frase_semana.php`, `update_frase_semana.php`, `desafios-semana.php`, `encontro.php` (top-level)
- `public/api/lib/PHPMailer/` inteira (`PHPMailer.php`, `SMTP.php`, `Exception.php`)

**Ficou no lugar, intocado:** `public/api/video-log.php`, `ver-logs.php`, `public/api/.htaccess`, `stream.php`, e a infra do Hotmart que `ver-logs.php` opcionalmente usa (`hotmart/_conexao.php`, `config.php`, `config.example.php`, `hotmart/.htaccess`).

`.gitignore` recebeu uma entrada `_ARQUIVO_MORTO*` (pasta de quarentena não vai pro Git).

### Validação (Fase 3)

- **`npm run build`**: ✅ passou limpo — 2243 módulos, sem erro, `~654ms`. Bundle final não tem mais nenhum chunk de `comunidade/`/`Dashboard`/`Login`/`Mensagens` (comparado ao baseline da Fase 1, que tinha ~11 chunks a mais) — confirma que a remoção das rotas em `App.jsx` não deixou nenhum import quebrado.
- **`php -l`**: CLI do PHP não está instalado/no PATH nesta máquina Windows, então não rodei o lint direto. Validação alternativa: `git diff --cached --stat` nos 103 arquivos movidos mostra **0 inserções / 0 deleções** em todos — confirma que o `git mv` preservou o conteúdo byte a byte (rename puro, sem edição), então nenhum arquivo pode ter tido sintaxe corrompida pela quarentena em si. `video-log.php`, `ver-logs.php` e `public/api/.htaccess` não aparecem em `git status` — confirmado que não foram tocados.

### Estado final

Branch `chore/limpeza-segura`, nada commitado ainda (mudanças só staged via `git mv`/`git add`) — sem merge na main, como pedido.
