import { useState } from "react";

const DIAS = [
  { dot: "0", label: "DIA 0", short: "Preparar o início", title: "Dia 0 · Preparar o início", detail: "Conheça a estrutura do percurso e prepare o terreno para começar com clareza." },
  { dot: "5", label: "DIAS 1–3", short: "Compreender", title: "Dias 1 a 3 · 5 minutos", detail: "Primeiro bloco: compreender o exercício e começar pequeno." },
  { dot: "10", label: "DIAS 4–6", short: "Ganhar continuidade", title: "Dias 4 a 6 · 10 minutos", detail: "Segundo bloco: ganhar continuidade com menor necessidade de condução." },
  { dot: "15", label: "DIAS 7–9", short: "Consolidar", title: "Dias 7 a 9 · 15 minutos", detail: "Terceiro bloco: consolidar a base e atravessar as variações da experiência." },
  { dot: "20", label: "DIAS 10–12", short: "Refinar", title: "Dias 10 a 12 · 20 minutos", detail: "Quarto bloco: refinar a prática e fortalecer atenção, percepção e retorno." },
  { dot: "25", label: "DIAS 13–15", short: "Conduzir sozinho", title: "Dias 13 a 15 · 25 minutos", detail: "Bloco final: retirar a condução e concluir uma prática de 25 minutos sem guia." },
];

function QuinzeDiasSection() {
  const [active, setActive] = useState(0);
  const current = DIAS[active];

  return (
    <section className="section section-alt mr-section" id="quinze-dias">
      <div className="container mr-centered">
        <div className="mr-section-mark" />
        <div className="mr-eyebrow centered">Progressão estruturada</div>
        <h2 className="centered">Como funciona o curso</h2>
        <p className="mr-lead">• 15 dias de treinamento contínuo e programado.</p>
        <p className="mr-lead">• Prática e teoria alternada pra você aplicar no mesmo dia o que aprendeu.</p>
        <p className="mr-lead">• Comece no dia 1 com meditação de 5 minutos com guia, no dia 15 você consegue meditações mais longas e profundas sem guia.</p>
        <p className="mr-lead">• Entenda o princípio raíz da meditação sem nenhuma religiosidade ou misticísmo envolvido.</p>

        <div className="mr-timeline-wrap">
          <div className="mr-timeline-root" />
          <div className="mr-timeline-grid">
            {DIAS.map((dia, i) => (
              <button key={dia.title} className={`mr-timeline-card ${active === i ? "active" : ""}`} onMouseEnter={() => setActive(i)} onFocus={() => setActive(i)} onClick={() => setActive(i)}>
                <div className="mr-timeline-card-main">
                  <div className="mr-timeline-dot">{dia.dot}</div>
                  <strong>{dia.label}</strong>
                  <span>{dia.short}</span>
                </div>
                {active === i && (
                  <div className="mr-timeline-detail-inline">
                    <h3>{dia.title}</h3>
                    <p>{dia.detail}</p>
                  </div>
                )}
              </button>
            ))}
          </div>

          <div className="mr-timeline-detail">
            <h3>{current.title}</h3>
            <p>{current.detail}</p>
          </div>
        </div>

        <p className="mr-micro centered" style={{ marginTop: 26 }}>
          Cada dia combina uma aula breve de instrução com duas práticas meditativas: uma pela manhã e outra à noite.
        </p>
        <p className="mr-timeline-phrase">O tempo aumenta porque a compreensão aumenta. A orientação diminui porque a autonomia começa a ocupar o lugar dela.</p>
      </div>
    </section>
  );
}

export default QuinzeDiasSection;
