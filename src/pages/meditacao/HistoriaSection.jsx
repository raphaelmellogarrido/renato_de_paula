// Seção 3 — "Antes de qualquer técnica, uma história"
// Fotos reais (enviadas para /public). A foto principal ocupa a vaga grande
// à esquerda; as 4 fotos de viagem/trajetória ficam empilhadas à direita,
// cada uma com o nome do país e a bandeira correspondente acima.
const FOTO_PRINCIPAL = { key: "foto-principal", src: "/foto_principal.jpg", alt: "Dr. Renato de Paula" };

// Abaixo de 720px, algumas fotos trocam pra uma versão "inteira" (sem corte)
// via srcMobile — ainda não existe uma versão inteira pra todas, só entram
// no <picture> as que têm.
const PAISES = [
  { key: "australia", pais: "Austrália", bandeira: "/australia_flag.svg", src: "/australia.jpeg", srcMobile: "/australia_inteira.jpeg", alt: "Dr. Renato de Paula na Austrália" },
  { key: "india", pais: "Índia", bandeira: "/indian_flag.svg", src: "/india.jpeg", srcMobile: "/india_inteira.jpeg", alt: "Dr. Renato de Paula na Índia" },
  { key: "birmania", pais: "Birmânia", bandeira: "/burma_flag.svg", src: "/birmania.jpg", srcMobile: "/birmania_inteira.jpg", alt: "Dr. Renato de Paula meditando na Birmânia" },
  { key: "brasil", pais: "Brasil", bandeira: "/brazil_flag.svg", src: "/medico.jpg", srcMobile: "/medico_inteira.jpg", alt: "Dr. Renato de Paula, médico no Brasil" },
];

function HistoriaSection() {
  return (
    <section className="section mr-section" id="historia">
      <div className="container mr-story-grid">
        <div className="mr-story-copy">
          <div className="mr-section-mark" />
          <div className="mr-eyebrow">O que essa experiência me mostrou</div>
          <h2>Eu não conheci a meditação como produtividade ou moda de bem-estar.</h2>
          <p style={{ marginTop: 22 }}>Eu conheci porque precisava encontrar uma forma de cuidar melhor da minha mente em um período muito difícil.</p>
          <p>Foi durante um intercâmbio na Austrália, ainda na formação médica, que a prática começou a fazer parte da minha vida. Depois, vieram anos de prática, estudo, imersões e a tentativa de entender o que funcionava fora do ambiente de retiro — dentro da vida real.</p>
          <p>Com o tempo, percebi que aquilo não era apenas uma experiência pessoal. Era uma prática que podia ser ensinada, organizada e cultivada no cotidiano.</p>

          <div className="mr-story-quote">A meditação foi parte importante da minha reconstrução pessoal. Hoje, eu ensino a base que eu gostaria de ter entendido quando comecei.</div>
        </div>
        <div className="mr-media-gallery">
          <div className="mr-media-slot large">
            <img src={FOTO_PRINCIPAL.src} alt={FOTO_PRINCIPAL.alt} />
          </div>
          {PAISES.map((p) => (
            <div key={p.key} className="mr-media-item">
              <div className="mr-media-label">
                <span>{p.pais}</span>
                <img className="mr-media-flag" src={p.bandeira} alt={`Bandeira: ${p.pais}`} />
              </div>
              <div className={`mr-media-slot ${p.srcMobile ? "has-mobile-full" : ""}`}>
                <picture>
                  {p.srcMobile && <source media="(max-width: 720px)" srcSet={p.srcMobile} />}
                  <img src={p.src} alt={p.alt} />
                </picture>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default HistoriaSection;
