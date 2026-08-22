import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Lock } from "lucide-react";
import { formatarDataBr } from "./comentariosUtils";

const POSTS_URL = "/api/comunidade/posts";
// 3 por página — mesmo padrão de paginação de DificuldadeDoDia.jsx
// (per_page=5) e ComentariosFeed.jsx (per_page=10), só que aqui o backend
// (public/api/comunidade/posts.php) já aceitava page/per_page desde sempre,
// o front que nunca usava e trazia a tabela inteira numa página só.
const POR_PAGINA = 3;

function iniciais(nome) {
  return (nome || "Aluno")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0])
    .join("")
    .toUpperCase();
}

// Feed 100% real, vem de GET /api/comunidade/posts (ver
// public/api/comunidade/posts.php). Tabela vazia = empty state, nunca
// posts inventados no front — não existe mais mock aqui (removido
// FEED_COMUNIDADE de mockData.js, que fixava sempre os mesmos 4 posts
// fake pra todo mundo). `vazio` é derivado de `total` (contagem real do
// banco), não de `posts.length` — assim o empty state nunca aparece junto
// com posts de outra página só porque a página atual voltou vazia.
function ListaPosts() {
  const [posts, setPosts] = useState([]);
  const [total, setTotal] = useState(null); // null = ainda carregando a 1ª vez
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);

  const carregar = useCallback((paginaAlvo, signal) => {
    fetch(`${POSTS_URL}?page=${paginaAlvo}&per_page=${POR_PAGINA}`, { signal })
      .then((res) => res.json())
      .then((data) => {
        setPosts(Array.isArray(data?.itens) ? data.itens : []);
        setTotal(Number.isFinite(data?.total) ? data.total : 0);
        setPage(Number.isFinite(data?.page) ? data.page : paginaAlvo);
        setPages(Number.isFinite(data?.pages) ? Math.max(1, data.pages) : 1);
      })
      .catch((err) => {
        if (err.name !== "AbortError") {
          console.error("[Clube Presença] falha ao carregar feed da comunidade:", err);
          setPosts([]);
          setTotal(0);
        }
      });
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    carregar(1, controller.signal);
    return () => controller.abort();
  }, [carregar]);

  const carregando = total === null;
  const vazio = total === 0;

  if (carregando) {
    return <div className="cm-feed-vazio">Carregando…</div>;
  }

  // Único lugar do componente que mostra essa mensagem, e só quando o banco
  // não tem NENHUM post (total === 0) — nunca ao mesmo tempo que a lista.
  if (vazio) {
    return <div className="cm-feed-vazio">Seja o primeiro a compartilhar sua presença hoje 🌿</div>;
  }

  return (
    <>
      <div className="cm-feed-lista">
        {posts.map((post) => (
          <article className="cm-feed-post" key={post.id}>
            <div className="cm-feed-post-avatar">{iniciais(post.nome)}</div>
            <div>
              <strong>
                {post.nome} <span className="cm-feed-post-quando">{formatarDataBr(post.created_at)}</span>
              </strong>
              <p className="cm-feed-post-texto">{post.texto}</p>
              <span className="cm-feed-post-curtidas">♥ {post.curtidas}</span>
            </div>
          </article>
        ))}
      </div>

      <div className="cm-feed-paginacao">
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
    </>
  );
}

// Mural da comunidade (Clube Presença), parte do produto único de
// R$49,90/mês (curso + comunidade). `liberado` vem da regra de negócio em
// featureFlags.js: hoje é sempre true pra quem está logado (login já é a
// trava real). Esse branch de blur + CTA fica pronto como placeholder
// visual pra quando o Stripe recorrente existir (próxima task) e passar a
// existir de fato sessão sem assinatura ativa — por enquanto não tem
// cobrança real nenhuma, é só a UI da oferta.
function FeedComunidade({ liberado }) {
  const [quisAssinar, setQuisAssinar] = useState(false);

  if (!liberado) {
    return (
      <section className="cm-feed-bloqueado">
        <div className="cm-feed-blur">
          <ListaPosts />
        </div>
        <div className="cm-feed-overlay-construcao">
          <Lock size={22} />
          <h3>Assine para continuar</h3>
          <p>A Comunidade faz parte do Clube Presença: curso + comunidade por R$49,90/mês.</p>
          <button type="button" className="cm-btn-primary" onClick={() => setQuisAssinar(true)} disabled={quisAssinar}>
            {quisAssinar ? "Pedido registrado! ✓" : "Assinar por R$49,90/mês"}
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="cm-feed-liberado">
      <ListaPosts />
    </section>
  );
}

export default FeedComunidade;
