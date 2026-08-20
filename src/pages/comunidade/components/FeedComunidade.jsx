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
          <div className="cm-comentario-avatar">{iniciais(post.autor)}</div>
          <div>
            <strong>
              {post.autor} <span className="cm-comentario-quando">{post.quando}</span>
            </strong>
            <p className="cm-feed-post-texto">{post.texto}</p>
            <span className="cm-feed-post-curtidas">♥ {post.curtidas}</span>
          </div>
        </article>
      ))}
    </div>
  );
}

// Mural da comunidade (Clube Presença). `liberado` vem da regra de negócio
// em featureFlags.js: aluno do curso = fundador liberado durante o beta;
// senão, mostra o feed borrado + overlay de "Em Construção" com lista de
// espera (fake, só troca de estado local).
function FeedComunidade({ liberado, souFundador }) {
  const [naLista, setNaLista] = useState(false);

  if (!liberado) {
    return (
      <section className="cm-feed-bloqueado">
        <div className="cm-feed-blur">
          <ListaPosts />
        </div>
        <div className="cm-feed-overlay-construcao">
          <Lock size={22} />
          <h3>Comunidade em construção</h3>
          <p>O Clube Presença ainda está sendo preparado. Entre na lista de espera para ser avisado assim que abrir.</p>
          <button type="button" className="cm-btn-primary" onClick={() => setNaLista(true)} disabled={naLista}>
            {naLista ? "Você está na lista! ✓" : "Entrar na lista de espera"}
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
          Você é Membro Fundador — acesso grátis por 90 dias
        </div>
      )}
      <ListaPosts />
    </section>
  );
}

export default FeedComunidade;
