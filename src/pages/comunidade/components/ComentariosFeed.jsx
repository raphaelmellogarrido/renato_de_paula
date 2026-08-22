import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEmailSessao, lerNomeSessao } from "./usuarioStorage";
import { iniciais, formatarDataBr } from "./comentariosUtils";

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

  const carregar = useCallback((paginaAlvo) => {
    fetch(`${COMENTARIOS_URL}?aula_id=${AULA_ID}&page=${paginaAlvo}`)
      .then((r) => r.json())
      .then((dados) => {
        setItens(Array.isArray(dados?.itens) ? dados.itens : []);
        setTotal(Number.isFinite(dados?.total) ? dados.total : 0);
        setPage(Number.isFinite(dados?.page) ? dados.page : paginaAlvo);
        setPages(Number.isFinite(dados?.pages) ? Math.max(1, dados.pages) : 1);
      })
      .catch((err) => {
        console.error("[Clube Presença] falha ao carregar comentários:", err);
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
        console.error("[Clube Presença] falha ao enviar comentário:", err);
      })
      .finally(() => setEnviando(false));
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

      {!carregando &&
        itens.map((comentario) => (
          <div className="cm-comentario" key={comentario.id}>
            <div className="cm-comentario-avatar">{iniciais(comentario.nome)}</div>
            <div className="cm-comentario-corpo">
              <strong>
                {comentario.nome}
                <span className="cm-comentario-quando">{formatarDataBr(comentario.created_at)}</span>
              </strong>
              <p className="cm-comentario-texto">{comentario.comentario}</p>
            </div>
          </div>
        ))}

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
