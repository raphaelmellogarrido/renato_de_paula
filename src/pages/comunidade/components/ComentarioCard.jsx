import { useState } from "react";
import { Star, Trash2, Pencil } from "lucide-react";
import { iniciais, formatarDataBr } from "./comentariosUtils";
import ImageLightbox from "./ImageLightbox";

// Escapa os 3 caracteres que importam antes de injetar via
// dangerouslySetInnerHTML abaixo — comentario.comentario é texto de
// aluno, nunca confiar nele cru. Feito ANTES de aplicar os marcadores de
// markdown (senão um "<" digitado pelo aluno vazaria como HTML de verdade).
function escaparHtml(texto) {
  return texto.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// Converte os marcadores **negrito**/*itálico* (inseridos pela toolbar B/I
// de DificuldadeDoDia.jsx, ver aplicarMarcador lá) em <strong>/<em> — sem
// isso os marcadores apareciam crus no feed ("**olá**") em vez de
// formatados. Negrito primeiro: consome os pares de ** antes do regex de
// itálico rodar, então um * sozinho nunca é confundido com metade de um **.
function renderizarMarkdown(texto) {
  const html = escaparHtml(texto || "")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>");
  return <span dangerouslySetInnerHTML={{ __html: html }} />;
}

// 2 contas fixas com destaque visual + poder de apagar qualquer comentário
// (pedido do cliente). Orientador tem destaque MAIOR que Administrador
// (borda dourada + brilho + estrela) — não é hierarquia de permissão, os
// dois podem excluir igual. Mesma lista que public/api/hotmart/comentarios.php
// usa no DELETE — comparação sempre em minúsculo/trim dos dois lados.
export const EMAIL_ADMINISTRADOR = "raphaelmellogarrido@gmail.com";
export const EMAIL_ORIENTADOR = "rsp.ren@gmail.com";

// Limite de edição (pedido do cliente, 26/08: "como em rede social", cada um
// só edita o PRÓPRIO comentário) — mesmo valor de LIMITE_TEXTO em
// DificuldadeDoDia.jsx (único lugar que hoje passa `onEditar`, ver prop
// abaixo). Não importa de lá pra cá pra não criar dependência circular
// (DificuldadeDoDia já importa ComentarioCard); mesmo cap de 140 do PUT em
// comentarios.php, que nunca confia só nisso.
const LIMITE_TEXTO_EDICAO = 140;

/**
 * Card de UM comentário — único lugar que decide como um comentário é
 * desenhado (avatar, nome, badge de Administrador/Orientador, data, texto,
 * lixeira, responder, mensagem privada). Usado por ComentariosFeed.jsx
 * (mural "geral", em Aulas e no player de vídeo) E DificuldadeDoDia.jsx
 * ("Sua prática hoje", no Dashboard) — antes cada um tinha sua própria cópia
 * do JSX + CSS pra isso, e um ajuste de contraste aplicado só num dos dois
 * ficava pra trás no outro sem ninguém perceber (foi exatamente o que
 * aconteceu). Qualquer mudança de visual de comentário entra AQUI, nunca
 * duplicada de novo.
 *
 * Props:
 *   comentario  { id, email, nome, comentario, image_url, avatar_url,
 *                 created_at, respostas? }
 *               image_url é opcional (null na maioria) — foto anexada só
 *               existe hoje no formulário de DificuldadeDoDia.jsx, mas o
 *               card é o mesmo pra ComentariosFeed.jsx, então qualquer
 *               comentario com image_url mostra o quadradinho.
 *               avatar_url é a foto de perfil do AUTOR (LEFT JOIN alunos em
 *               comentarios.php, sempre a mais atual) — null mostra iniciais.
 *               respostas é opcional (array, mesmo formato de comentario) —
 *               vem embutido do GET de comentarios.php pros comentários
 *               raiz, já renderizado aninhado/indentado abaixo do texto.
 *   podeExcluir bool — true quando quem está LOGADO é admin/orientador:
 *               nesse caso a lixeira aparece em QUALQUER comentário, não só
 *               no próprio (pedido do cliente). Um aluno normal também
 *               apaga o PRÓPRIO comentário — isso é decidido aqui dentro
 *               comparando `emailAtual` com o autor do comentário, não por
 *               este prop (que fica reservado pro "apaga tudo" do
 *               admin/orientador). Backend (comentarios.php DELETE) refaz a
 *               mesma checagem de dono no servidor — nunca confia só nisso.
 *   emailAtual  string — email de quem está vendo a tela (useEmailSessao),
 *               usado só pra decidir se ESTE comentário é do próprio autor.
 *   onExcluir   (id) => void
 *   podeResponder bool (default true) — mostra o botão "Responder". Passado
 *               como false ao renderizar uma RESPOSTA (recursão abaixo) pra
 *               não permitir resposta-de-resposta (só 1 nível de aninhamento).
 *   onResponder (parentId, texto) => Promise — chamado ao clicar "Enviar" no
 *               formulário inline de resposta. Se omitido, o botão
 *               "Responder" nem aparece (mesmo espírito de podeExcluir/
 *               onExcluir acima).
 *   podeEnviarMensagem bool (default false) — se true, o NOME do autor vira
 *               clicável (abre modal "Enviar mensagem para @Nome") — só
 *               true quando quem está vendo é admin/orientador (Tarefa 2).
 *   onIniciarMensagem (comentario) => void — chamado ao clicar no nome.
 *   onEditar    (id, novoTexto) => Promise — chamado ao salvar a edição
 *               inline. Se omitido, o lápis de editar nem aparece (mesmo
 *               espírito opt-in de onResponder acima) — hoje só
 *               DificuldadeDoDia.jsx passa isso (pedido do cliente 26/08:
 *               edição só em "Sua prática hoje", não no mural "geral" de
 *               ComentariosFeed.jsx). Diferente da lixeira (podeExcluir cobre
 *               admin/orientador também), editar é SEMPRE só do próprio
 *               autor — "como em rede social", nem admin edita texto alheio.
 */
function ComentarioCard({ comentario, podeExcluir, emailAtual, onExcluir, podeResponder = true, onResponder, podeEnviarMensagem = false, onIniciarMensagem, onEditar }) {
  const [lightboxAberto, setLightboxAberto] = useState(false);
  const [respondendoAberto, setRespondendoAberto] = useState(false);
  const [textoResposta, setTextoResposta] = useState("");
  const [enviandoResposta, setEnviandoResposta] = useState(false);
  const [editando, setEditando] = useState(false);
  const [textoEdicao, setTextoEdicao] = useState("");
  const [salvandoEdicao, setSalvandoEdicao] = useState(false);
  // 26/08 (bug reportado no celular): fotos antigas enviadas em
  // "Sua prática hoje" pararam de carregar em produção (ícone de imagem
  // quebrada). Causa provável: public/uploads/posts/ não sobrevive a um
  // novo deploy (mesmo problema já documentado em HANDOFF.md pra
  // server/videos/ e CURSO_RAIZ_DIR — ver nota no .gitignore). Isso é
  // infra/deploy, não dá pra "consertar" só no front, mas o front não
  // devia mostrar o ícone feio de imagem quebrada quando isso acontece —
  // se o <img> falhar ao carregar, simplesmente esconde o botão da foto
  // em vez de deixar o glyph quebrado visível pro aluno.
  const [fotoQuebrada, setFotoQuebrada] = useState(false);
  const emailAutor = (comentario.email || "").toLowerCase().trim();
  const autorOrientador = emailAutor === EMAIL_ORIENTADOR;
  const autorAdmin = !autorOrientador && emailAutor === EMAIL_ADMINISTRADOR;
  // Dono do comentário sempre pode excluir o próprio, mesmo sem ser
  // admin/orientador — só entra na conta quando emailAtual veio preenchido
  // (usuário deslogado nunca "é o autor" de nada).
  const emailAtualNormalizado = (emailAtual || "").toLowerCase().trim();
  const souAutor = emailAtualNormalizado !== "" && emailAutor === emailAtualNormalizado;
  const podeExcluirEste = podeExcluir || souAutor;
  const classeDestaque = autorOrientador ? "cm-comentario-card-orientador" : autorAdmin ? "cm-comentario-card-admin" : "";
  const temRespostas = Array.isArray(comentario.respostas) && comentario.respostas.length > 0;
  // Em "Sua prática hoje" (DificuldadeDoDia.jsx) o card tem altura FIXA de
  // 78px (ver .cm-duvida .cm-comentario-card no CSS, pedido do cliente) —
  // essa classe destrava essa altura só quando há formulário de resposta
  // aberto ou respostas pra mostrar, senão "Responder"/as respostas ficariam
  // cortados pelo overflow:hidden. Em ComentariosFeed.jsx (fora de .cm-duvida)
  // não tem efeito nenhum, já que lá a altura já é automática.
  // comentario.image_url entrou aqui em 26/08 (pedido do cliente: foto mini
  // saiu do cabeçalho e foi pra baixo do texto, acima do "Responder" — ver
  // JSX abaixo) — sem isso, em "Sua prática hoje" (.cm-duvida, card travado
  // em 92px) a foto ficaria cortada pelo overflow:hidden sempre que não
  // houvesse resposta aberta nem respostas já existentes. Vale ainda mais
  // agora que a foto ficou maior e empilhada (2ª mudança, mesmo dia).
  const classeExpandido = respondendoAberto || editando || temRespostas || comentario.image_url ? "cm-comentario-card-expandido" : "";
  // Não faz sentido mandar mensagem privada pra outro admin/orientador —
  // só o nome de alunos "normais" vira clicável.
  const nomeClicavel = podeEnviarMensagem && !autorAdmin && !autorOrientador && typeof onIniciarMensagem === "function";
  // Editar é SEMPRE só do próprio dono (nunca do podeExcluir de admin/
  // orientador, diferente da lixeira) — ver docstring do prop onEditar acima.
  const podeEditarEste = souAutor && typeof onEditar === "function";

  function handleAbrirEdicao() {
    setTextoEdicao(comentario.comentario);
    setEditando(true);
  }

  function handleCancelarEdicao() {
    setEditando(false);
    setTextoEdicao("");
  }

  async function handleSalvarEdicao(e) {
    e.preventDefault();
    const valor = textoEdicao.trim();
    if (!valor || salvandoEdicao || !onEditar) return;

    setSalvandoEdicao(true);
    try {
      await onEditar(comentario.id, valor);
      setEditando(false);
      setTextoEdicao("");
    } catch (err) {
      console.error("[Clube Presença] falha ao editar comentário:", err);
      window.alert("Não foi possível editar o comentário.");
    } finally {
      setSalvandoEdicao(false);
    }
  }

  async function handleEnviarResposta(e) {
    e.preventDefault();
    const valor = textoResposta.trim();
    if (!valor || enviandoResposta || !onResponder) return;

    setEnviandoResposta(true);
    try {
      await onResponder(comentario.id, valor);
      setTextoResposta("");
      setRespondendoAberto(false);
    } catch (err) {
      console.error("[Clube Presença] falha ao enviar resposta:", err);
      window.alert("Não foi possível enviar a resposta.");
    } finally {
      setEnviandoResposta(false);
    }
  }

  return (
    <div className={`cm-comentario-card ${classeDestaque} ${classeExpandido}`}>
      {comentario.avatar_url ? <img src={comentario.avatar_url} alt="" className="cm-comentario-card-avatar cm-comentario-card-avatar-img" /> : <div className="cm-comentario-card-avatar">{iniciais(comentario.nome)}</div>}
      <div className="cm-comentario-card-corpo">
        {/* Wrapper -topo é OBRIGATÓRIO (25/08, bug reaparecido): é ele quem
            vira flex/nowrap no CSS (.cm-comentario-card-topo) e permite o
            nome truncar com "…" em vez de cortar cru. Sem essa div, nome/
            badge/cluster-direita ficam soltos como filhos diretos de -corpo
            (que não é flex) e o -nome perde a largura que precisa pra
            truncar — foi exatamente o que ficou cortado ("Raphael
            ADMINISTRADOR", "Fernanda Costa") depois de duas limpezas
            seguidas (commits "bug"/"bug 2") removerem essa div junto com uma
            duplicação de -corpo que não tinha nada a ver. NUNCA remover de
            novo sem também mover a regra de flex do CSS pra -corpo. */}
        <div className="cm-comentario-card-topo">
          {nomeClicavel ? (
            <button type="button" className="cm-comentario-card-nome cm-comentario-card-nome-clicavel" onClick={() => onIniciarMensagem(comentario)} title={`Enviar mensagem para ${comentario.nome}`}>
              {comentario.nome}
            </button>
          ) : (
            <span className="cm-comentario-card-nome">{comentario.nome}</span>
          )}
          {autorOrientador && (
            <span className="cm-badge-orientador">
              <Star size={11} strokeWidth={3} fill="currentColor" /> Orientador
            </span>
          )}
          {autorAdmin && <span className="cm-badge-admin">Administrador</span>}
          {/* Cluster da direita, empurrado pro fim da linha em bloco (o
                margin-left:auto está no wrapper, não mais em -quando sozinho):
                data -> lixeira (se podeExcluir), gap:8px entre eles,
                centralizados verticalmente. A foto (image_url) NÃO mora mais
                aqui (saiu em 26/08, pedido do cliente) — foi pra baixo do
                texto, própria linha, ver logo abaixo do parágrafo. */}
          <span className="cm-comentario-card-topo-direita">
            <span className="cm-comentario-card-quando">{formatarDataBr(comentario.created_at)}</span>
            {podeEditarEste && !editando && (
              <button type="button" className="cm-comentario-card-editar" aria-label="Editar comentário" title="Editar comentário" onClick={handleAbrirEdicao}>
                <Pencil size={14} />
              </button>
            )}
            {podeExcluirEste && (
              <button type="button" className="cm-comentario-card-excluir" aria-label="Excluir comentário" title="Excluir comentário" onClick={() => onExcluir(comentario.id)}>
                <Trash2 size={15} />
              </button>
            )}
          </span>
        </div>
        {editando ? (
          // Substitui o <p> pelo formulário de edição inline — mesmo limite
          // de 140 chars do textarea original (LIMITE_TEXTO em
          // DificuldadeDoDia.jsx), reforçado de novo no PUT de
          // comentarios.php (nunca confia só no maxLength do front).
          <form className="cm-comentario-edicao-form" onSubmit={handleSalvarEdicao}>
            <textarea
              className="cm-comentario-edicao-textarea"
              value={textoEdicao}
              onChange={(e) => setTextoEdicao(e.target.value)}
              maxLength={LIMITE_TEXTO_EDICAO}
              autoFocus
              disabled={salvandoEdicao}
              rows={2}
            />
            <div className="cm-comentario-resposta-acoes">
              <span className="cm-comentario-edicao-contador">
                {textoEdicao.length}/{LIMITE_TEXTO_EDICAO}
              </span>
              <button type="button" className="cm-comentario-resposta-cancelar" onClick={handleCancelarEdicao} disabled={salvandoEdicao}>
                Cancelar
              </button>
              <button type="submit" className="cm-comentario-resposta-enviar" disabled={!textoEdicao.trim() || salvandoEdicao}>
                {salvandoEdicao ? "Salvando..." : "Salvar"}
              </button>
            </div>
          </form>
        ) : (
          <p className="cm-comentario-card-texto">{renderizarMarkdown(comentario.comentario)}</p>
        )}

        {/* Foto anexada (se houver): própria linha, alinhada à esquerda,
            logo abaixo do texto. Pedido do cliente 26/08 (2ª mudança): antes
            ficava lado a lado com "Responder" nesse mesmo rodapé (empurrada
            pro fim da linha) — agora cada um fica em sua própria linha,
            foto primeiro (maior que antes) e "Responder" depois, abaixo
            dela. */}
        {comentario.image_url && !fotoQuebrada && (
          <button type="button" className="cm-comentario-card-foto-mini" aria-label="Ampliar foto" onClick={() => setLightboxAberto(true)}>
            <img src={comentario.image_url} alt="" onError={() => setFotoQuebrada(true)} />
          </button>
        )}

        {podeResponder && onResponder && (
          <button type="button" className="cm-comentario-card-responder-btn" onClick={() => setRespondendoAberto((v) => !v)}>
            Responder
          </button>
        )}

        {respondendoAberto && (
          <form className="cm-comentario-resposta-form" onSubmit={handleEnviarResposta}>
            <input type="text" className="cm-comentario-resposta-input" placeholder={`Responder para @${comentario.nome}...`} value={textoResposta} onChange={(e) => setTextoResposta(e.target.value)} maxLength={2000} autoFocus disabled={enviandoResposta} />
            <div className="cm-comentario-resposta-acoes">
              <button
                type="button"
                className="cm-comentario-resposta-cancelar"
                onClick={() => {
                  setRespondendoAberto(false);
                  setTextoResposta("");
                }}
                disabled={enviandoResposta}
              >
                Cancelar
              </button>
              <button type="submit" className="cm-comentario-resposta-enviar" disabled={!textoResposta.trim() || enviandoResposta}>
                {enviandoResposta ? "Enviando..." : "Enviar"}
              </button>
            </div>
          </form>
        )}

        {Array.isArray(comentario.respostas) && comentario.respostas.length > 0 && (
          <div className="cm-comentario-respostas">
            {comentario.respostas.map((resposta) => (
              <ComentarioCard key={resposta.id} comentario={resposta} podeExcluir={podeExcluir} emailAtual={emailAtual} onExcluir={onExcluir} podeResponder={false} podeEnviarMensagem={podeEnviarMensagem} onIniciarMensagem={onIniciarMensagem} onEditar={onEditar} />
            ))}
          </div>
        )}
      </div>
      {lightboxAberto && <ImageLightbox src={comentario.image_url} onClose={() => setLightboxAberto(false)} />}
    </div>
  );
}

export default ComentarioCard;
