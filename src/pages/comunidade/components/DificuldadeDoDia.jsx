import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEmailSessao, lerNomeSessao } from "./usuarioStorage";
import { formatarDataBr } from "./comentariosUtils";

const COMENTARIOS_URL = "/api/hotmart/comentarios.php";
// aula_id fixo — este card não é sobre um vídeo específico, é uma reflexão
// livre do dia, compartilhada entre todos os alunos (não reseta por
// semana/dia, é a mesma tabela permanente de comentarios.php).
const AULA_ID = "dificuldade_do_dia";
const POR_PAGINA = 5;

// Card "Sua prática hoje" — ocupa a mesma célula do grid (.cm-grid-hero, ver
// Dashboard.jsx/ComunidadeApp.css) onde antes ficava o hero de vídeo
// ("Continue sua jornada", foto + player, removido). Sem foto, sem overlay:
// pergunta + textarea + os 5 comentários mais recentes de todos os alunos,
// paginados — mesmo backend de ComentariosFeed.jsx, só com aula_id fixo e
// per_page=5 em vez de 10.
function DificuldadeDoDia() {
  const email = useEmailSessao();
  const [itens, setItens] = useState([]);
  const [total, setTotal] = useState(null); // null = ainda carregando a 1ª vez
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);

  const carregar = useCallback((paginaAlvo) => {
    fetch(`${COMENTARIOS_URL}?aula_id=${AULA_ID}&page=${paginaAlvo}&per_page=${POR_PAGINA}`)
      .then((r) => r.json())
      .then((dados) => {
        setItens(Array.isArray(dados?.itens) ? dados.itens : []);
        setTotal(Number.isFinite(dados?.total) ? dados.total : 0);
        setPage(Number.isFinite(dados?.page) ? dados.page : paginaAlvo);
        setPages(Number.isFinite(dados?.pages) ? Math.max(1, dados.pages) : 1);
      })
      .catch((err) => {
        console.error("[Clube Presença] falha ao carregar 'Sua prática hoje':", err);
        setItens([]);
        setTotal(0);
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
        console.error("[Clube Presença] falha ao compartilhar:", err);
      })
      .finally(() => setEnviando(false));
  }

  const carregando = total === null;
  const vazio = total === 0;

  return (
    <div className="cm-duvida">
      <span className="cm-duvida-eyebrow">Sua prática hoje</span>
      <h2 className="cm-duvida-titulo">Qual foi sua dificuldade ao meditar hoje?</h2>
      <p className="cm-duvida-sub">Compartilhe aqui. Sua experiência pode acolher outra pessoa.</p>

      <form className="cm-duvida-form" onSubmit={handleEnviar}>
        <textarea placeholder="Hoje eu senti..." value={texto} onChange={(e) => setTexto(e.target.value)} rows={3} />
        <div className="cm-duvida-form-acoes">
          <button type="submit" disabled={!texto.trim() || !email || enviando}>
            {enviando ? "Enviando..." : "Compartilhar"}
          </button>
        </div>
      </form>

      <div className="cm-duvida-divider" />

      {!carregando && vazio && <p className="cm-duvida-vazio">Seja o primeiro a comentar</p>}

      {!carregando && !vazio && (
        <div className="cm-duvida-lista">
          {itens.map((comentario) => (
            <div className="cm-duvida-comentario" key={comentario.id}>
              <strong>
                {comentario.nome}
                <span className="cm-duvida-quando">{formatarDataBr(comentario.created_at)}</span>
              </strong>
              <p>{comentario.comentario}</p>
            </div>
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
