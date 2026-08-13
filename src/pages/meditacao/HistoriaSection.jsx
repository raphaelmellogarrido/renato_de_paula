// Seção 3 — "Antes de qualquer técnica, uma história"
// Fotos reais (enviadas para /public). A primeira ocupa a vaga grande da
// galeria (2 colunas); as demais preenchem os quadrados menores.
const MEDIA_SLOTS = [
  { key: "foto-principal", variant: "large", src: "/EA0FF898-BC03-44D4-95F4-0953F9C509CE_1_105_c.jpeg", alt: "Dr. Renato de Paula" },
  { key: "foto-2", variant: "", src: "/E0B10E85-6911-4C75-AF9D-6F0069C00CF3_1_105_c.jpeg", alt: "Dr. Renato de Paula" },
  { key: "foto-3", variant: "", src: "/IMG_0969.jpg", alt: "Dr. Renato de Paula" },
  // { key: "foto-4", variant: "", src: "/IMG_1383.JPG", alt: "Dr. Renato de Paula" },
  // { key: "foto-5", variant: "", src: "/IMG_6021.jpg", alt: "Dr. Renato de Paula" },
];

function HistoriaSection() {
  return (
    <section className="section mr-section" id="historia">
      <div className="container mr-story-grid">
        <div className="mr-story-copy">
          <div className="mr-section-mark" />
          <div className="mr-eyebrow">Antes de qualquer técnica, uma história</div>
          <h2>Comecei a meditar no meio de um dos períodos mais difíceis da minha vida.</h2>
          <p style={{ marginTop: 22 }}>Eu estava longe de casa, no meio de um intercâmbio durante a minha formação médica na Austrália, quando atravessei um quadro grave de depressão. Foi um período difícil até para pedir ajuda.</p>
          <p>Foi nesse momento que conheci um treinamento de meditação — e ele se tornou parte importante do meu processo de recuperação e reconstrução pessoal.</p>
          <p>
            <strong>Eu sou Renato de Paula, médico pela UFRJ.</strong> Hoje sou professor de meditação e criei o Meditação Raiz.
          </p>
          <p>Nos anos seguintes, aprofundei a prática — inclusive em temporadas de imersão dedicadas só a isso — e busquei compreender a meditação tanto pela experiência direta quanto pelo conhecimento médico e científico.</p>
          <p>
            Com o tempo, comecei a ensinar outras pessoas e percebi um padrão: quem abandonava a meditação, na maioria das vezes, não abandonava por incapacidade. Abandonava porque não compreendia o exercício, não sabia como progredir ou recebeu a técnica misturada a expectativas e informações
            contraditórias.
          </p>
          <div className="mr-story-quote">A técnica não foi inventada por mim. O método de ensinar, organizar e conduzir essa progressão é o Meditação Raiz.</div>
          <p>O objetivo foi organizar os princípios essenciais da prática em uma linguagem clara, racional e progressiva — sem exigir adesão religiosa e sem criar dependência permanente de quem está ensinando.</p>
          <div className="mr-story-pills">
            <span>Clareza</span>
            <span>Progressão</span>
            <span>Independência</span>
            <span>Prática no mundo real</span>
          </div>
          <p className="mr-story-bridge">Essa foi a minha experiência. Mas a meditação não depende só dela — hoje ela também vem sendo estudada de perto pela ciência.</p>
        </div>
        <div className="mr-media-gallery">
          {MEDIA_SLOTS.map((slot) => (
            <div key={slot.key} className={`mr-media-slot ${slot.variant}`}>
              <img src={slot.src} alt={slot.alt} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default HistoriaSection;
