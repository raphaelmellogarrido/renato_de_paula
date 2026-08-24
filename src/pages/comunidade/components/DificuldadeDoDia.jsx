import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEmailSessao, lerNomeSessao } from "./usuarioStorage";
import ComentarioCard, { EMAIL_ADMINISTRADOR, EMAIL_ORIENTADOR } from "./ComentarioCard";
import { chaveCacheComentarios, lerCacheComentarios, salvarCacheComentarios, buscarComentarios } from "./cacheComentarios";

const COMENTARIOS_URL = "/api/hotmart/comentarios.php";
// aula_id fixo — este card não é sobre um vídeo específico, é uma reflexão
// livre do dia, compartilhada entre todos os alunos (não reseta por
// semana/dia, é a mesma tabela permanente de comentarios.php).
const AULA_ID = "dificuldade_do_dia";
const POR_PAGINA = 6; // era 7 — ajuste fino de altura (23/08) pra alinhar o final das 3 colunas de /comunidade
// Limite visual do textarea: card tem ~700px de largura, fonte 14px (~8px/char,
// ~87 chars/linha) — 2 linhas dariam ~174 chars, mas 140 garante que também
// caiba em 2 linhas no mobile (card mais estreito). Mesmo limite do
// -webkit-line-clamp:2 em cm-comentario-card-texto (ComunidadeApp.css).
const LIMITE_TEXTO = 140;
// Mesmo padrão de acoplamento por evento global (literal, não import) já
// usado em useMeditacaoHoje.js/RankingPresenca.jsx/MeditandoJunto.jsx —
// avisa o card "Meditando junto" que uma partilha nova acabou de entrar,
// pra "💬 partilhas hoje" subir sem esperar o próximo tick do polling nem F5.
const EVENTO_PARTILHA_CRIADA = "comunidadePartilhaCriada";

// Card "Sua prática hoje" — único conteúdo da coluna 1 do dashboard
// (.cm-grid-feed/.cm-feed-empilhado, ver Dashboard.jsx/ComunidadeApp.css),
// sempre visível (não depende mais de nenhum switch/view). Sem foto, sem
// overlay: pergunta + textarea + os 7 comentários mais recentes de todos
// os alunos, paginados — mesmo backend de ComentariosFeed.jsx, só com
// aula_id fixo e per_page=7 em vez de 10. Vazio (nenhum comentário ainda)
// mostra "Seja o primeiro..." DENTRO deste mesmo card, nunca como card
// separado (era isso que o FeedComunidade fazia, empilhado embaixo deste —
// removido de Dashboard.jsx a pedido do cliente). Paginado de 6 em 6.
function DificuldadeDoDia() {
  const email = useEmailSessao();
  const [itens, setItens] = useState([]);
  const [total, setTotal] = useState(null); // null = ainda carregando a 1ª vez
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);

  const emailAtualNormalizado = (email || "").toLowerCase().trim();
  const souAdmin = emailAtualNormalizado === EMAIL_ADMINISTRADOR;
  const souOrientador = emailAtualNormalizado === EMAIL_ORIENTADOR;
  const podeExcluir = souAdmin || souOrientador;

  const carregar = useCallback((paginaAlvo) => {
    // Stale-while-revalidate: se tiver cache de visita recente (<2min) pra
    // essa página, pinta ele JÁ (sem esperar rede) e ainda assim busca fresco
    // em background — evita a área da lista ficar em branco por segundos
    // numa visita repetida. Cache é do mural inteiro (não por email): ver
    // cacheComentarios.js.
    const chave = chaveCacheComentarios(AULA_ID, paginaAlvo);
    const cache = lerCacheComentarios(chave);
    if (cache) {
      setItens(Array.isArray(cache.itens) ? cache.itens : []);
      setTotal(Number.isFinite(cache.total) ? cache.total : 0);
      setPage(Number.isFinite(cache.page) ? cache.page : paginaAlvo);
      setPages(Number.isFinite(cache.pages) ? Math.max(1, cache.pages) : 1);
    }

    buscarComentarios(`${COMENTARIOS_URL}?aula_id=${AULA_ID}&page=${paginaAlvo}&per_page=${POR_PAGINA}`)
      .then((dados) => {
        setItens(Array.isArray(dados?.itens) ? dados.itens : []);
        setTotal(Number.isFinite(dados?.total) ? dados.total : 0);
        setPage(Number.isFinite(dados?.page) ? dados.page : paginaAlvo);
        setPages(Number.isFinite(dados?.pages) ? Math.max(1, dados.pages) : 1);
        salvarCacheComentarios(chave, dados);
      })
      .catch((err) => {
        console.error("[Clube Presença] falha ao carregar 'Sua prática hoje' (após retry):", err);
        // Nunca zera itens/total aqui: já tentamos 2x (buscarComentarios já
        // faz 1 retry). Se havia cache, ele continua pintado; se não havia,
        // total continua null e a tela fica no skeleton — nunca mostra
        // "Seja o primeiro a comentar" por causa de uma falha transitória
        // (era isso que fazia o mural aparecer vazio no primeiro load e só
        // corrigir com F5).
      });
  }, []);

  useEffect(() => {
    carregar(1);
  }, [carregar]);

  function handleEnviar(e) {
    e.preventDefault();
    const valor = texto.trim();
    if (!valor || !email || enviando) return;

    setEnviando(true);
    fetch(COMENTARIOS_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, nome: lerNomeSessao(), aula_id: AULA_ID, comentario: valor }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data?.erro) throw new Error(data.erro);
        setTexto("");
        carregar(1); // comentário novo entra no topo — sempre volta pra página 1
        window.dispatchEvent(new CustomEvent(EVENTO_PARTILHA_CRIADA));
      })
      .catch((err) => {
        console.error("[Clube Presença] falha ao compartilhar:", err);
      })
      .finally(() => setEnviando(false));
  }

  function handleExcluir(id) {
    if (!window.confirm("Excluir este comentário?")) return;

    fetch(`${COMENTARIOS_URL}?id=${id}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data?.erro) throw new Error(data.erro);
        setItens((atual) => atual.filter((c) => c.id !== id));
        setTotal((atual) => (typeof atual === "number" ? Math.max(0, atual - 1) : atual));
      })
      .catch((err) => {
        console.error("[Clube Presença] falha ao excluir comentário:", err);
        window.alert("Não foi possível excluir o comentário.");
      });
  }

  const carregando = total === null;
  const vazio = total === 0;

  return (
    <div className="cm-duvida">
      <span className="cm-duvida-eyebrow">Sua prática hoje</span>
      <h2 className="cm-duvida-titulo">Qual foi sua dificuldade ao meditar hoje?</h2>
      <p className="cm-duvida-sub">Compartilhe aqui. Sua experiência pode acolher outra pessoa.</p>

      <form className="cm-duvida-form" onSubmit={handleEnviar}>
        <textarea
          placeholder="Hoje eu senti..."
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          rows={3}
          maxLength={LIMITE_TEXTO}
        />
        <div className="cm-duvida-form-acoes">
          <span className="cm-duvida-contador">
            {texto.length}/{LIMITE_TEXTO}
          </span>
          <button type="submit" disabled={!texto.trim() || !email || enviando}>
            {enviando ? "Enviando..." : "Compartilhar"}
          </button>
        </div>
      </form>

      <div className="cm-duvida-divider" />

      {carregando && (
        // Skeleton só aparece se não havia cache pra pintar de cara (carregar()
        // já preenche itens/total a partir do cache antes do fetch resolver,
        // então nesse caso `carregando` já vira false direto) — nunca mais
        // deixa a área da lista em branco enquanto espera a rede.
        <div className="cm-comentarios-lista" aria-hidden="true">
          {[0, 1, 2].map((i) => (
            <div className="cm-comentario-skeleton" key={i} />
          ))}
        </div>
      )}

      {!carregando && vazio && <p className="cm-duvida-vazio">Seja o primeiro a comentar</p>}

      {!carregando && !vazio && (
        <div className="cm-comentarios-lista">
          {itens.map((comentario) => (
            <ComentarioCard key={comentario.id} comentario={comentario} podeExcluir={podeExcluir} onExcluir={handleExcluir} />
          ))}
        </div>
      )}

      {!carregando && !vazio && (
        <div className="cm-duvida-paginacao">
          <button type="button" aria-label="Página anterior" disabled={page <= 1} onClick={() => carregar(page - 1)}>
            <ChevronLeft size={16} />
          </button>
          <span>
            {page} / {pages}
          </span>
          <button
            type="button"
            aria-label="Próxima página"
            disabled={page >= pages || pages <= 1}
            onClick={() => carregar(page + 1)}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
}

export default DificuldadeDoDia;
