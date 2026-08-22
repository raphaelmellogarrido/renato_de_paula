import { useState } from "react";
import { Lock, PartyPopper } from "lucide-react";
import { FEED_COMUNIDADE } from "../data/mockData";

function iniciais(nome) {
  return nome
    .split(" ")
    .slice(0, 2)
    .map((parte) => parte[0])
    .join("")
    .toUpperCase();
}

function ListaPosts() {
  return (
    <div className="cm-feed-lista">
      {FEED_COMUNIDADE.map((post) => (
        <article className="cm-feed-post" key={post.id}>
          <div className="cm-feed-post-avatar">{iniciais(post.autor)}</div>
          <div>
            <strong>
              {post.autor} <span className="cm-feed-post-quando">{post.quando}</span>
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
function FeedComunidade({ liberado, souFundador }) {
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
      {souFundador && (
        <div className="cm-banner-fundador">
          <PartyPopper size={16} />
          Você é um dos primeiros membros do Clube Presença 🎉
        </div>
      )}
      <ListaPosts />
    </section>
  );
}

export default FeedComunidade;
