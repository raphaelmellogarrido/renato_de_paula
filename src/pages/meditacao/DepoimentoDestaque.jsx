// Cartão de depoimento em destaque: print real (WhatsApp/Instagram) de um
// lado, citação grande do outro. Reutilizado tanto no bloco de depoimentos
// logo após o vídeo (hero 2) quanto embutido dentro da seção de mitos (hero 5).
function DepoimentoDestaque({ foto, nome, citacao, legenda, reverse = false }) {
  return (
    <div className={`mr-quote-card ${reverse ? "reverse" : ""}`}>
      <div className="mr-quote-media">
        <img src={foto} alt={`Print de conversa com ${nome}`} />
      </div>
      <div className="mr-quote-copy">
        <span className="mr-eyebrow">
          {nome} · Relato real
        </span>
        <blockquote>&ldquo;{citacao}&rdquo;</blockquote>
        <p className="mr-quote-legenda">{legenda}</p>
      </div>
    </div>
  );
}

export default DepoimentoDestaque;
