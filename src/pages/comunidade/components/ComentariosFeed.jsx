import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Trash2, Star } from "lucide-react";
import { useEmailSessao, lerNomeSessao } from "./usuarioStorage";
import { iniciais, formatarDataBr } from "./comentariosUtils";

const COMENTARIOS_URL = "/api/hotmart/comentarios.php";
// 2 contas fixas com destaque visual + poder de apagar qualquer comentário
// do mural (pedido do cliente). Orientador tem destaque MAIOR que
// Administrador (borda dourada + brilho + estrela), não é hierarquia de
// permissão — os dois podem excluir igual. Comparação sempre em
// minúsculo/trim (mesmo padrão que o backend já usa pra email).
const EMAIL_ADMINISTRADOR = "raphaelmellogarrido@gmail.com";
const EMAIL_ORIENTADOR = "rsp.ren@gmail.com";
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

  // Quem está logado agora — decide se aparece a lixeira em TODO comentário
  // (não só nos próprios), igual pedido: admin/orientador apaga qualquer um.
  const emailAtualNormalizado = (email || "").toLowerCase().trim();
  const souAdmin = emailAtualNormalizado === EMAIL_ADMINISTRADOR;
  const souOrientador = emailAtualNormalizado === EMAIL_ORIENTADOR;
  const podeExcluir = souAdmin || souOrientador;

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

      {!carregando &&
        itens.map((comentario) => {
          const emailAutorNormalizado = (comentario.email || "").toLowerCase().trim();
          const autorOrientador = emailAutorNormalizado === EMAIL_ORIENTADOR;
          const autorAdmin = !autorOrientador && emailAutorNormalizado === EMAIL_ADMINISTRADOR;
          const classeDestaque = autorOrientador ? "cm-comentario-orientador" : autorAdmin ? "cm-comentario-admin" : "";

          return (
            <div className={`cm-comentario ${classeDestaque}`} key={comentario.id}>
              <div className="cm-comentario-avatar">{iniciais(comentario.nome)}</div>
              <div className="cm-comentario-corpo">
                <strong>
                  {comentario.nome}
                  {autorOrientador && (
                    <span className="cm-badge-orientador">
                      <Star size={11} strokeWidth={3} fill="currentColor" /> Orientador
                    </span>
                  )}
                  {autorAdmin && <span className="cm-badge-admin">Administrador</span>}
                  <span className="cm-comentario-quando">{formatarDataBr(comentario.created_at)}</span>
                </strong>
                <p className="cm-comentario-texto">{comentario.comentario}</p>
              </div>
              {podeExcluir && (
                <button
                  type="button"
                  className="cm-comentario-excluir"
                  aria-label="Excluir comentário"
                  title="Excluir comentário"
                  onClick={() => handleExcluir(comentario.id)}
                >
                  <Trash2 size={15} />
                </button>
              )}
            </div>
          );
        })}

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
