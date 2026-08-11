import { useRef, useState } from "react";

const PANELS = [
  {
    key: "atencao",
    title: "Atenção e cognição",
    refs: "Tang et al., 2007 · Mrazek et al., 2013 · MacLean et al., 2010.",
    cards: [
      {
        label: "PNAS · 2007",
        title: "Atenção em 5 dias",
        text: "Um treinamento breve de meditação, com sessões diárias curtas, foi associado a melhoras mensuráveis em testes de atenção em comparação com um grupo de relaxamento.",
        meta: ["80 universitários", "5 dias de treino", "20 minutos por dia"],
        link: "https://pubmed.ncbi.nlm.nih.gov/17940025/",
      },
      {
        label: "Psychological Science · 2013",
        title: "Menos distração",
        text: "Um curso de duas semanas envolvendo meditação foi associado a menor divagação mental e melhor desempenho em tarefas de leitura e memória de trabalho.",
        meta: ["Curso de 2 semanas", "Avaliação cognitiva pré/pós"],
        link: "https://pubmed.ncbi.nlm.nih.gov/23538911/",
      },
      {
        label: "Psychological Science · 2010",
        title: "Atenção sustentada",
        text: "Participantes de um retiro intensivo de meditação apresentaram melhoras na capacidade de manter a atenção de forma estável ao longo do tempo.",
        meta: ["60 participantes", "3 meses de retiro", "~5h de prática diária"],
        link: "https://pubmed.ncbi.nlm.nih.gov/20483826/",
      },
    ],
  },
  {
    key: "emocoes",
    title: "Saúde mental e emoções",
    refs: "Goyal et al., 2014 · Hoge et al., 2023 · Kuyken et al., 2015.",
    cards: [
      {
        label: "JAMA Internal Medicine · 2014",
        title: "Ansiedade, humor e dor",
        text: "Uma revisão sistemática de dezenas de ensaios clínicos encontrou evidências de melhora moderada em sintomas de ansiedade, depressão e dor com programas de meditação.",
        meta: ["47 ensaios clínicos", "3.515 participantes"],
        link: "https://pubmed.ncbi.nlm.nih.gov/24395196/",
      },
      {
        label: "JAMA Psychiatry · 2023",
        title: "Ansiedade clínica",
        text: "Um ensaio clínico randomizado comparou um programa estruturado de meditação a um medicamento de primeira linha para transtorno de ansiedade, com resultados comparáveis entre os grupos.",
        meta: ["276 adultos", "8 semanas", "MBSR × escitalopram"],
        link: "https://pubmed.ncbi.nlm.nih.gov/36350591/",
      },
      {
        label: "The Lancet · 2015",
        title: "Recaída de depressão",
        text: "Um treinamento baseado em meditação mostrou eficácia comparável ao uso contínuo de antidepressivo na prevenção de recaída depressiva ao longo do acompanhamento.",
        meta: ["424 participantes", "24 meses de acompanhamento"],
        link: "https://pubmed.ncbi.nlm.nih.gov/25907157/",
      },
    ],
  },
  {
    key: "sono",
    title: "Sono e saúde física",
    refs: "Black et al., 2015 · Hughes et al., 2013 · Zeidan et al., 2015.",
    cards: [
      {
        label: "JAMA Internal Medicine · 2015",
        title: "Qualidade do sono",
        text: "Um programa de meditação voltado a adultos mais velhos com queixas de sono foi associado a melhora na qualidade do sono relatada, em comparação a um programa educativo.",
        meta: ["49 idosos", "6 semanas", "2h de prática semanal"],
        link: "https://pubmed.ncbi.nlm.nih.gov/25686304/",
      },
      {
        label: "Psychosomatic Medicine · 2013",
        title: "Pressão arterial",
        text: "Participantes com pressão arterial pré-hipertensiva que passaram por um programa de meditação apresentaram redução na pressão sistólica ao final do estudo.",
        meta: ["56 participantes", "8 semanas"],
        link: "https://pubmed.ncbi.nlm.nih.gov/24127622/",
      },
      {
        label: "Journal of Neuroscience · 2015",
        title: "Percepção da dor",
        text: "Um treinamento breve de meditação foi associado à redução na intensidade e no desconforto da dor percebida, com alterações observadas em exames de imagem cerebral.",
        meta: ["75 adultos", "4 dias de treino"],
        link: "https://pubmed.ncbi.nlm.nih.gov/26586819/",
      },
    ],
  },
];

function ScienceCarousel({ panel }) {
  const [index, setIndex] = useState(0);
  const startXRef = useRef(null);
  const total = panel.cards.length;

  function go(delta) {
    setIndex((i) => (i + delta + total) % total);
  }

  function handlePointerDown(e) {
    startXRef.current = e.clientX;
  }

  function handlePointerUp(e) {
    if (startXRef.current === null) return;
    const delta = e.clientX - startXRef.current;
    if (Math.abs(delta) > 35) {
      setIndex((i) => (delta < 0 ? Math.min(i + 1, total - 1) : Math.max(i - 1, 0)));
    }
    startXRef.current = null;
  }

  return (
    <div className="mr-science-panel">
      <div className="mr-science-panel-head">
        <h3>{panel.title}</h3>
        <span className="mr-science-counter">
          {index + 1} de {total}
        </span>
      </div>
      <div className="mr-science-viewport">
        <div
          className="mr-science-track"
          style={{ transform: `translateX(-${index * 100}%)` }}
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
        >
          {panel.cards.map((card) => (
            <div className="mr-science-card" key={card.title}>
              <div>
                <div className="mr-study-label">{card.label}</div>
                <h4>{card.title}</h4>
                <p>{card.text}</p>
                <div className="mr-science-meta">
                  {card.meta.map((m) => (
                    <span key={m}>{m}</span>
                  ))}
                </div>
              </div>
              <a className="mr-science-link" href={card.link} target="_blank" rel="noreferrer">
                Ver estudo original ↗
              </a>
            </div>
          ))}
        </div>
      </div>
      <div className="mr-carousel-controls">
        <button className="mr-carousel-arrow" onClick={() => go(-1)} aria-label="Anterior">
          ←
        </button>
        <div className="mr-carousel-dots">
          {panel.cards.map((card, i) => (
            <span key={card.title} className={`mr-carousel-dot ${i === index ? "active" : ""}`} />
          ))}
        </div>
        <button className="mr-carousel-arrow" onClick={() => go(1)} aria-label="Próximo">
          →
        </button>
      </div>
      <div className="mr-science-refs">{panel.refs}</div>
    </div>
  );
}

function CienciaSection() {
  return (
    <section className="section section-alt mr-section" id="ciencia">
      <div className="container mr-centered">
        <div className="mr-section-mark" />
        <div className="mr-eyebrow">Pesquisa científica</div>
        <h2>O que a ciência tem investigado sobre a meditação</h2>
        <p className="mr-lead">
          Diferentes práticas meditativas são investigadas por seus possíveis efeitos sobre a atenção, as emoções, o
          sono, o estresse e processos físicos.
        </p>
        <p className="mr-micro">
          Os resultados variam conforme a técnica utilizada, o tempo de prática, a frequência e o grupo estudado.
        </p>
      </div>
      <div className="container mr-science-grid">
        {PANELS.map((panel) => (
          <ScienceCarousel panel={panel} key={panel.key} />
        ))}
      </div>
      <div className="container">
        <div className="mr-science-disclaimer">
          Os estudos acima investigaram práticas, durações e populações diferentes. Eles mostram possibilidades
          estudadas pela ciência — não garantias individuais nem equivalência direta com o Meditação Raiz.
        </div>
        <p className="mr-science-closing">
          A ciência mostra que a meditação tem aplicações importantes. Mas praticar sem orientação e sem entender o
          que está sendo treinado é justamente o que costuma levar ao abandono.
        </p>
      </div>
    </section>
  );
}

export default CienciaSection;
