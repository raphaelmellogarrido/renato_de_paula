import { useState } from "react";

const STEPS = [
  {
    key: "myths",
    numero: "Etapa 01",
    titulo: "Desfazer os mitos",
    detalhe:
      "Identificar as ideias equivocadas que fazem você acreditar que está meditando errado ou que a prática deveria ser sempre calma e agradável.",
    visual: "1. Desfazer os mitos",
    visualDetail: "Retirar expectativas que fazem a pessoa abandonar antes de compreender a prática.",
  },
  {
    key: "root",
    numero: "Etapa 02",
    titulo: "Compreender o princípio-raiz",
    detalhe:
      "Entender o exercício interno que sustenta a prática e passar a reconhecer o que está sendo treinado.",
    visual: "2. Princípio-raiz",
    visualDetail: "Compreender o núcleo do exercício para saber o que fazer quando a atenção se afasta.",
  },
  {
    key: "progress",
    numero: "Etapa 03",
    titulo: "Praticar com progressão",
    detalhe:
      "Começar com poucos minutos e avançar em tempo, estabilidade e autonomia sem pular etapas.",
    visual: "3. Progressão",
    visualDetail: "Tempo, estabilidade e autonomia crescem juntos — sem saltos arbitrários.",
  },
  {
    key: "hard",
    numero: "Etapa 04",
    titulo: "Atravessar os dias difíceis",
    detalhe:
      "Aprender a lidar com inquietação, sono, tédio, desconforto e vontade de desistir sem zerar o caminho.",
    visual: "4. Dias difíceis",
    visualDetail: "Aprender a continuar sem interpretar cada oscilação como fracasso.",
  },
  {
    key: "autonomy",
    numero: "Etapa 05",
    titulo: "Empreender a prática meditativa",
    detalhe:
      "Organizar a meditação dentro da sua vida e desenvolver condições para conduzir a própria prática.",
    visual: "5. Empreender a prática",
    visualDetail: "Orientação no início, compreensão no caminho e autonomia no final.",
  },
];

function MetodoSection() {
  const [active, setActive] = useState("myths");

  return (
    <section className="section mr-section" id="metodo">
      <div className="container">
        <div className="mr-section-mark" />
        <div className="mr-eyebrow">A ordem que organiza o treinamento</div>
        <h2>Um treinamento de 15 dias para compreender a base e construir uma prática própria.</h2>
        <p className="mr-lead">
          O Meditação Raiz não é uma biblioteca de áudios para você escolher conforme o humor do dia. É um caminho
          organizado em cinco etapas, em que compreensão e prática avançam juntas.
        </p>

        <div className="mr-method-editorial">
          <div className="mr-method-list">
            {STEPS.map((step) => (
              <div
                key={step.key}
                className={`mr-method-item ${active === step.key ? "active" : ""}`}
                onMouseEnter={() => setActive(step.key)}
                onFocus={() => setActive(step.key)}
              >
                <button className="mr-method-trigger" onClick={() => setActive(step.key)}>
                  <span className="mr-number">{step.numero}</span>
                  <strong>{step.titulo}</strong>
                </button>
                <div className="mr-method-detail">{step.detalhe}</div>
              </div>
            ))}
          </div>

          <div className="mr-method-visual">
            {STEPS.map((step, i) => (
              <div key={step.key} className={`mr-method-scene ${active === step.key ? "active" : ""}`}>
                <span className="mr-method-scene-number">{String(i + 1).padStart(2, "0")}</span>
                <div className="mr-visual-label">
                  <strong>{step.visual}</strong>
                  <span>{step.visualDetail}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mr-method-central">
          <p>
            Você não recebe apenas sessões para acompanhar. Você aprende um método para empreender a prática
            meditativa na sua vida.
          </p>
          <p className="mr-lead" style={{ margin: "0 auto" }}>
            Cada conceito é apresentado junto de uma experiência prática. O entendimento é construído enquanto a
            prática evolui.
          </p>
        </div>
      </div>
    </section>
  );
}

export default MetodoSection;
