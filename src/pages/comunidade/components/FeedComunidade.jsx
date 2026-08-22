import { useEffect, useState } from "react";
import { Lock } from "lucide-react";
import { formatarDataBr } from "./comentariosUtils";

const POSTS_URL = "/api/comunidade/posts";

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
// fake pra todo mundo).
function ListaPosts() {
  const [posts, setPosts] = useState(null); // null = carregando ainda

  useEffect(() => {
    const controller = new AbortController();
    fetch(POSTS_URL, { signal: controller.signal })
      .then((res) => res.json())
      .then((data) => setPosts(Array.isArray(data?.itens) ? data.itens : []))
      .catch((err) => {
        if (err.name !== "AbortError") {
          console.error("[Clube Presença] falha ao carregar feed da comunidade:", err);
          setPosts([]);
        }
      });
    return () => controller.abort();
  }, []);

  if (posts === null) {
    return <div className="cm-feed-vazio">Carregando…</div>;
  }

  if (posts.length === 0) {
    return <div className="cm-feed-vazio">Seja o primeiro a compartilhar sua presença hoje 🌿</div>;
  }

  return (
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
