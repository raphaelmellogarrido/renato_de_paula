// Revistas científicas reais de onde vêm os estudos citados abaixo — só
// para dar credibilidade rápida antes de entrar no conteúdo em si.
const REVISTAS = [
  { nome: "PNAS", estilo: "mr-badge-pnas" },
  { nome: "JAMA", sub: "Network", estilo: "mr-badge-jama" },
  { nome: "The Lancet", estilo: "mr-badge-lancet" },
  { nome: "Psychological Science", estilo: "mr-badge-serif" },
  { nome: "Psychosomatic Medicine", estilo: "mr-badge-serif" },
  { nome: "Journal of Neuroscience", estilo: "mr-badge-neuro" },
];

const CATEGORIAS = [
  {
    key: "atencao",
    title: "Atenção e cognição",
    cards: [
      {
        label: "PNAS · 2007",
        title: "Atenção em 5 dias",
        text: "Estudantes que meditaram 20 minutos por dia, durante 5 dias, foram melhor em testes de atenção e ficaram menos estressados do que um grupo que só relaxou pelo mesmo tempo.",
        meta: ["80 universitários", "5 dias de treino", "20 minutos por dia"],
        link: "https://pubmed.ncbi.nlm.nih.gov/17940025/",
        reportagem: "https://www.psychologicalscience.org/observer/boosting-brain-power-through-a-mind-body-connection",
      },
      {
        label: "Psychological Science · 2013",
        title: "Menos distração",
        text: "Depois de duas semanas de meditação, um grupo de estudantes se distraiu menos e foi melhor em provas de leitura e memória do que um grupo que só recebeu instruções sobre alimentação.",
        meta: ["Curso de 2 semanas", "Avaliação antes e depois"],
        link: "https://pubmed.ncbi.nlm.nih.gov/23538911/",
        reportagem: "https://www.sciencedaily.com/releases/2013/03/130326133335.htm",
      },
      {
        label: "Psychological Science · 2010",
        title: "Atenção sustentada",
        text: "Pessoas que passaram três meses em um retiro intensivo de meditação conseguiram manter a atenção fixa por mais tempo, sem se distrair, em comparação a antes do retiro.",
        meta: ["60 participantes", "3 meses de retiro", "~5h de prática por dia"],
        link: "https://pubmed.ncbi.nlm.nih.gov/20483826/",
        reportagem: "https://www.lionsroar.com/inside-the-shamatha-project/",
      },
    ],
  },
  {
    key: "emocoes",
    title: "Saúde mental e emoções",
    cards: [
      {
        label: "JAMA Internal Medicine · 2014",
        title: "Ansiedade, humor e dor",
        text: "Juntando os resultados de 47 estudos com mais de 3 mil pessoas, pesquisadores encontraram uma melhora moderada em sintomas de ansiedade, depressão e dor em quem praticava meditação.",
        meta: ["47 estudos", "3.515 participantes"],
        link: "https://pubmed.ncbi.nlm.nih.gov/24395196/",
        reportagem: "https://www.sciencedaily.com/releases/2014/01/140106190050.htm",
      },
      {
        label: "JAMA Psychiatry · 2023",
        title: "Ansiedade clínica",
        text: "Em um estudo com 276 adultos com ansiedade, um curso de meditação de 8 semanas teve resultado parecido ao de um remédio bastante usado para ansiedade — com bem menos efeitos colaterais.",
        meta: ["276 adultos", "8 semanas", "Meditação × remédio para ansiedade"],
        link: "https://pubmed.ncbi.nlm.nih.gov/36350591/",
        reportagem: "https://www.npr.org/2022/11/11/1135984116/study-mindfulness-based-stress-reduction-works-as-well-as-a-popular-anxiety-drug",
      },
      {
        label: "The Lancet · 2015",
        title: "Recaída de depressão",
        text: "Um treinamento de meditação teve resultado parecido ao de continuar tomando antidepressivo na prevenção de recaída depressiva, ao longo de 2 anos de acompanhamento.",
        meta: ["424 participantes", "24 meses de acompanhamento"],
        link: "https://pubmed.ncbi.nlm.nih.gov/25907157/",
        reportagem: "https://medicalxpress.com/news/2015-04-mindfulness-based-therapy-alternative-antidepressants-depression.html",
      },
    ],
  },
  {
    key: "sono",
    title: "Sono e saúde física",
    cards: [
      {
        label: "JAMA Internal Medicine · 2015",
        title: "Qualidade do sono",
        text: "Idosos com dificuldade para dormir que fizeram um curso de meditação relataram sono melhor do que os que participaram de um curso comum sobre hábitos de sono.",
        meta: ["49 idosos", "6 semanas", "2h de prática por semana"],
        link: "https://pubmed.ncbi.nlm.nih.gov/25686304/",
        reportagem: "https://www.sciencedaily.com/releases/2015/02/150216131115.htm",
      },
      {
        label: "Psychosomatic Medicine · 2013",
        title: "Pressão arterial",
        text: "Pessoas com pressão um pouco alta (mas ainda sem indicação de remédio) que praticaram meditação apresentaram queda na pressão ao final do estudo.",
        meta: ["56 participantes", "8 semanas"],
        link: "https://pubmed.ncbi.nlm.nih.gov/24127622/",
        reportagem: "https://www.sciencedaily.com/releases/2013/10/131015094436.htm",
      },
      {
        label: "Journal of Neuroscience · 2015",
        title: "Percepção da dor",
        text: "Um treinamento breve de meditação ajudou a reduzir a intensidade e o incômodo da dor sentida pelos participantes, com mudanças visíveis em exames do cérebro.",
        meta: ["75 adultos", "4 dias de treino"],
        link: "https://pubmed.ncbi.nlm.nih.gov/26586819/",
        reportagem: "https://www.psychologytoday.com/us/blog/the-athletes-way/201511/the-neuroscience-mindfulness-meditation-and-pain-relief",
      },
    ],
  },
];

function EstudoCard({ card }) {
  return (
    <div className="mr-science-card">
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
      <div className="mr-science-links">
        <a className="mr-science-link" href={card.link} target="_blank" rel="noreferrer">
          Abrir publicação ↗
        </a>
        {card.reportagem && (
          <a className="mr-science-link mr-science-link--reportagem" href={card.reportagem} target="_blank" rel="noreferrer">
            Ler reportagem sobre o estudo ↗
          </a>
        )}
      </div>
    </div>
  );
}

function CategoriaBloco({ categoria }) {
  return (
    <div className="mr-science-panel">
      <h3>{categoria.title}</h3>
      <div className="mr-science-cards">
        {categoria.cards.map((card) => (
          <EstudoCard card={card} key={card.title} />
        ))}
      </div>
    </div>
  );
}

function CienciaSection() {
  return (
    <section className="section section-alt mr-section" id="ciencia">
      <div className="container mr-centered">
        <div className="mr-section-mark" />
        <div className="mr-eyebrow centered">Pesquisa científica</div>
        <h2 className="centered">
          Meditação é papo de <span id="riscado">guru</span> <strong>cientista</strong>.
        </h2>
        <p className="mr-lead">As revistas científicas mais relevantes do planeta estão investigando associações de meditação com saúde mental, qualidade do sono, controle do estresse, melhora de memória/atenção e até no controle da dor...</p>

        <div className="mr-science-badges">
          {REVISTAS.map((revista) => (
            <div className="mr-science-badge" key={revista.nome}>
              <strong className={revista.estilo}>{revista.nome}</strong>
              {revista.sub && <span>{revista.sub}</span>}
            </div>
          ))}
        </div>
      </div>
      <div className="container mr-science-categorias">
        {CATEGORIAS.map((categoria) => (
          <CategoriaBloco categoria={categoria} key={categoria.key} />
        ))}
      </div>
      <div className="container">
        <div className="mr-science-disclaimer container center">Os estudos acima investigaram práticas, durações e populações diferentes. Eles mostram possibilidades estudadas pela ciência — não garantias individuais nem equivalência direta com o Meditação Raiz.</div>
        <div className="container center">
          <p>A ciência mostra que a meditação tem aplicações importantes. Mas praticar sem orientação e sem entender o que está sendo treinado é justamente o que costuma levar ao abandono.</p>
        </div>
      </div>
    </section>
  );
}

export default CienciaSection;
