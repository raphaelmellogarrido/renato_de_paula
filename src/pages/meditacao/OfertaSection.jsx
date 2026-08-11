const WHATSAPP_LINK =
  "https://wa.me/5521976624767?text=" +
  encodeURIComponent("Olá! Conheci o Meditação Raiz pelo site e gostaria de tirar uma dúvida antes de começar o treinamento.");

function OfertaSection({ hotmartLink }) {
  return (
    <section className="section mr-section" id="oferta">
      <div className="container">
        <div className="mr-offer-wrap">
          <div>
            <div className="mr-eyebrow">Comece agora o Meditação Raiz</div>
            <h2>Transforme seu interesse pela meditação em uma prática diária.</h2>
            <p style={{ marginTop: 22 }}>
              Você já conheceu os obstáculos que interrompem a prática, o princípio-raiz da meditação e a progressão
              que leva da orientação inicial à autonomia. Agora, o próximo passo é experimentar esse caminho.
            </p>
            <div className="mr-offer-list">
              <span>15 aulas breves de instrução</span>
              <span>30 práticas meditativas</span>
              <span>Duas práticas por dia</span>
              <span>Progressão de 5 a 25 minutos</span>
              <span>Prática final sem guia</span>
              <span>Acesso por 1 ano</span>
              <span>Suporte por e-mail e WhatsApp</span>
              <span>Garantia de 7 dias</span>
            </div>
            <p style={{ marginTop: 24 }}>
              <strong>
                Comece com orientação. Compreenda o princípio-raiz. Desfaça os mitos. Empreenda a prática meditativa
                na sua vida.
              </strong>
            </p>
          </div>

          <div className="mr-price-card">
            <div className="mr-label">Investimento</div>
            <div className="mr-price">
              <small>R$</small> 297
            </div>
            <div className="mr-price-note">À vista ou em até 12 vezes pela Hotmart.</div>
            <a className="mr-btn mr-btn--primary" href={hotmartLink} target="_blank" rel="noreferrer">
              Comece a meditar agora
            </a>
            <div className="mr-secure-note">Acesso imediato · Compra processada pela Hotmart · 7 dias de garantia</div>
            <a
              className="mr-science-link"
              style={{ justifyContent: "center", marginTop: 16 }}
              href={WHATSAPP_LINK}
              target="_blank"
              rel="noreferrer"
            >
              Ainda tem uma dúvida? Fale pelo WhatsApp ↗
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

export default OfertaSection;
