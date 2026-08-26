import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEmailSessao, lerNomeSessao } from "./usuarioStorage";
import ComentarioCard, { EMAIL_ADMINISTRADOR, EMAIL_ORIENTADOR } from "./ComentarioCard";
import { chaveCacheComentarios, lerCacheComentarios, salvarCacheComentarios, buscarComentarios } from "./cacheComentarios";

const COMENTARIOS_URL = "/api/hotmart/comentarios.php";
// aula_id fixo — antes cada vídeo tinha seu próprio bucket de comentários
// (prop `aulaId` dinâmica) e trocar de aula fazia a lista toda "sumir"
// (bug real: sumia porque ia pra outro aula_id, não porque perdia dado).
// Agora é um mural único, compartilhado entre todos os vídeos. Não confundir
// com DificuldadeDoDia.jsx, que usa o mesmo backend só que com aula_id
// PRÓPRIO ("dificuldade_do_dia") — feed diferente de propósito, não mexe
// aqui.
const AULA_ID = "geral";

// Feed de comentários: persistido em public/api/hotmart/comentarios.php,
// paginado de 10 em 10 (mais recentes primeiro). Permanente: nenhum reset
// semanal (DesafioSemana etc.) toca essa tabela.
function ComentariosFeed() {
  const email = useEmailSessao();
  const [itens, setItens] = useState([]);
  const [total, setTotal] = useState(null); // null = ainda carregando a 1ª vez
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);

  // Quem está logado agora — decide se a lixeira aparece em TODO comentário
  // (admin/orientador apaga qualquer um). Um aluno normal também exclui o
  // PRÓPRIO comentário mesmo com isso false — essa parte é decidida dentro
  // de ComentarioCard.jsx via o prop emailAtual (comparado ao autor).
  const emailAtualNormalizado = (email || "").toLowerCase().trim();
  const souAdmin = emailAtualNormalizado === EMAIL_ADMINISTRADOR;
  const souOrientador = emailAtualNormalizado === EMAIL_ORIENTADOR;
  const podeExcluir = souAdmin || souOrientador;

  const carregar = useCallback((paginaAlvo) => {
    // Stale-while-revalidate — mesmo padrão de DificuldadeDoDia.jsx: pinta
    // cache de visita recente (<2min) na hora, busca fresco em background.
    // Ver cacheComentarios.js.
    const chave = chaveCacheComentarios(AULA_ID, paginaAlvo);
    const cache = lerCacheComentarios(chave);
    if (cache) {
      setItens(Array.isArray(cache.itens) ? cache.itens : []);
      setTotal(Number.isFinite(cache.total) ? cache.total : 0);
      setPage(Number.isFinite(cache.page) ? cache.page : paginaAlvo);
      setPages(Number.isFinite(cache.pages) ? Math.max(1, cache.pages) : 1);
    }

    buscarComentarios(`${COMENTARIOS_URL}?aula_id=${AULA_ID}&page=${paginaAlvo}`)
      .then((dados) => {
        setItens(Array.isArray(dados?.itens) ? dados.itens : []);
        setTotal(Number.isFinite(dados?.total) ? dados.total : 0);
        setPage(Number.isFinite(dados?.page) ? dados.page : paginaAlvo);
        setPages(Number.isFinite(dados?.pages) ? Math.max(1, dados.pages) : 1);
        salvarCacheComentarios(chave, dados);
      })
      .catch((err) => {
        console.error("[Clube Presença] falha ao carregar comentários (após retry):", err);
        // Mesmo motivo de DificuldadeDoDia.jsx: buscarComentarios já fez 1
        // retry, então não zera itens/total aqui — mantém cache pintado ou
        // skeleton, nunca mostra estado vazio por falha transitória.
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
      })
      .catch((err) => {
        console.error("[Clube Presença] falha ao enviar comentário:", err);
      })
      .finally(() => setEnviando(false));
  }

  function handleExcluir(id) {
    if (!window.confirm("Excluir este comentário?")) return;

    fetch(`${COMENTARIOS_URL}?id=${id}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }), // backend confere se `email` está na lista de admins
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
    <section className="cm-comentarios">
      <h2>Comentários</h2>

      {vazio && !carregando && <p className="cm-comentarios-vazio">Seja o primeiro a comentar</p>}

      <form className="cm-comentario-form" onSubmit={handleEnviar}>
        <textarea
          placeholder="Compartilhe como foi a sua prática..."
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          rows={2}
        />
        <button type="submit" disabled={!texto.trim() || !email || enviando}>
          {enviando ? "Enviando..." : "Comentar"}
        </button>
      </form>

      {carregando && (
        // Some direto se carregar() já achou cache pra pintar (ver
        // carregando acima) — só aparece numa visita realmente sem cache.
        <div className="cm-comentarios-lista" aria-hidden="true">
          {[0, 1, 2].map((i) => (
            <div className="cm-comentario-skeleton" key={i} />
          ))}
        </div>
      )}

      {!carregando && !vazio && (
        <div className="cm-comentarios-lista">
          {itens.map((comentario) => (
            <ComentarioCard key={comentario.id} comentario={comentario} podeExcluir={podeExcluir} emailAtual={email} onExcluir={handleExcluir} />
          ))}
        </div>
      )}

      {!carregando && !vazio && (
        <div className="cm-comentarios-paginacao">
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
    </section>
  );
}

export default ComentariosFeed;
