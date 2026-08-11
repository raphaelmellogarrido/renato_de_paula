import { useState } from "react";

const TABS = [
  {
    key: "study",
    icon: (
      <svg viewBox="0 0 32 32">
        <path d="M6 9l10-5 10 5-10 5-10-5z" />
        <path d="M11 12v7c0 2 2 4 5 4s5-2 5-4v-7" />
      </svg>
    ),
    label: "Estudos e trabalho",
    short: "Recuperar a atenção antes de se perder na distração.",
    scene: {
      title: "Estudos e trabalho",
      text: "Perceber mais cedo quando a atenção saiu da tarefa e retornar antes de se perder completamente na distração pode favorecer continuidade em leituras, projetos e atividades longas.",
      skill: "Na prática: recuperação da atenção",
    },
  },
  {
    key: "relations",
    icon: (
      <svg viewBox="0 0 32 32">
        <circle cx="12" cy="12" r="5" />
        <circle cx="22" cy="14" r="4" />
        <path d="M4 27c1-6 5-9 8-9s7 3 8 9" />
        <path d="M18 27c1-5 4-8 8-8" />
      </svg>
    ),
    label: "Relacionamentos",
    short: "Criar espaço entre emoção e reação impulsiva.",
    scene: {
      title: "Relacionamentos",
      text: "Reconhecer uma emoção surgindo e criar algum espaço antes de reagir pode favorecer escuta mais consciente, respostas menos automáticas e escolhas melhores diante de conflitos.",
      skill: "Na prática: menor reatividade",
    },
  },
  {
    key: "stress",
    icon: (
      <svg viewBox="0 0 32 32">
        <path d="M16 5c-3 4-8 8-8 14a8 8 0 0016 0c0-6-5-10-8-14z" />
      </svg>
    ),
    label: "Mente acelerada e estresse",
    short: "Perceber ciclos mentais e recuperar a direção.",
    scene: {
      title: "Mente acelerada e estresse",
      text: "Perceber pensamentos repetitivos, sensações e impulsos antes de ser completamente conduzido por eles pode ajudar a recuperar sua direção com mais rapidez.",
      skill: "Na prática: percepção e redirecionamento",
    },
  },
  {
    key: "routine",
    icon: (
      <svg viewBox="0 0 32 32">
        <circle cx="16" cy="16" r="11" />
        <path d="M16 9v7l5 3" />
      </svg>
    ),
    label: "Rotina e decisões",
    short: "Sustentar ações mesmo sem recompensa imediata.",
    scene: {
      title: "Rotina e decisões",
      text: "Sustentar uma intenção quando surgem tédio, desconforto ou busca imediata por estímulo pode ajudar você a continuar ações importantes sem recompensa instantânea.",
      skill: "Na prática: continuidade da ação",
    },
  },
];

function VidaCotidianaSection() {
  const [active, setActive] = useState("study");

  return (
    <section className="section section-alt mr-section" id="vida-cotidiana">
      <div className="container">
        <div className="mr-section-mark" />
        <div className="mr-eyebrow">O treino não termina junto com a sessão</div>
        <h2>Benefícios da meditação na vida real.</h2>
        <p className="mr-lead">O objetivo não é criar apenas um momento isolado de calma. É treinar capacidades que você possa utilizar no estudo, no trabalho, nos relacionamentos e nas decisões cotidianas.</p>

        <div className="mr-life-editorial">
          <div className="mr-life-tabs" role="tablist">
            {TABS.map((tab) => (
              <button key={tab.key} className={`mr-life-tab ${active === tab.key ? "active" : ""}`} aria-selected={active === tab.key} onMouseEnter={() => setActive(tab.key)} onFocus={() => setActive(tab.key)} onClick={() => setActive(tab.key)}>
                <span className="mr-life-tab-icon">{tab.icon}</span>
                <span className="mr-life-tab-copy">
                  <strong>{tab.label}</strong>
                  <span>{tab.short}</span>
                </span>
              </button>
            ))}
          </div>

          <div className="mr-life-media">
            {TABS.map((tab) => (
              <div key={tab.key} className={`mr-life-scene ${active === tab.key ? "active" : ""}`}>
                <span className="mr-life-scene-icon">{tab.icon}</span>
                <div className="mr-scene-copy">
                  <h3>{tab.scene.title}</h3>
                  <p>{tab.scene.text}</p>
                  <span className="mr-scene-skill">{tab.scene.skill}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mr-life-close">
          <strong>É isso que transforma a meditação em uma ferramenta de autodomínio aplicada à vida cotidiana.</strong>
          <span>Não porque ela elimine pensamentos, emoções ou dificuldades, mas porque treina sua capacidade de perceber, reduzir respostas automáticas e escolher para onde retornar.</span>
        </div>
        <p className="mr-science-bridge">Nada disso aparece sozinho. Precisa ser treinado — e em uma ordem.</p>
      </div>
    </section>
  );
}

export default VidaCotidianaSection;
