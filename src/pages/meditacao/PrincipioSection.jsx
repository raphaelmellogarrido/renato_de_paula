import { useState } from "react";
import DepoimentoDestaque from "./DepoimentoDestaque";

const allan = "/comentário_allan.jpeg";

const PREREQS = [
  {
    expectativa: "Estar calmo antes de meditar",
    treino: "Recuperar a calma mesmo quando existe tensão, inquietação ou agitação.",
  },
  {
    expectativa: "Parar de pensar",
    treino: "Aprender a observar pensamentos sem precisar alimentá-los ou se deixar conduzir por eles.",
  },
  {
    expectativa: "Permanecer concentrado o tempo inteiro",
    treino: "Reconhecer a distração e retornar ao exercício meditativo.",
  },
  {
    expectativa: "Relaxar rapidamente",
    treino: "Continuar no exercício mesmo quando o relaxamento não aparece imediatamente.",
  },
  {
    expectativa: "Encontrar silêncio e condições perfeitas",
    treino: "Construir uma prática possível mesmo quando o ambiente não é perfeito.",
  },
  {
    expectativa: "Ter sessões sempre agradáveis",
    treino: "Compreender o que foi treinado, inclusive nas sessões desconfortáveis ou difíceis.",
  },
  {
    expectativa: "Sentir alguma experiência especial",
    treino: "Reconhecer o valor do exercício sem depender de uma experiência extraordinária.",
  },
  {
    expectativa: "Identificar-se com uma religião ou filosofia",
    treino: "Aprender uma técnica meditativa sem precisar mudar suas crenças pessoais.",
  },
];

function isTouchDevice() {
  return typeof window !== "undefined" && window.matchMedia?.("(hover: none)").matches;
}

function PrereqItem({ item }) {
  const [open, setOpen] = useState(false);

  return (
    <div className={`mr-prereq-item ${open ? "open" : ""}`} onMouseEnter={() => !isTouchDevice() && setOpen(true)} onMouseLeave={() => !isTouchDevice() && setOpen(false)}>
      <button className="mr-prereq-button" aria-expanded={open} onFocus={() => !isTouchDevice() && setOpen(true)} onBlur={() => !isTouchDevice() && setOpen(false)} onClick={() => isTouchDevice() && setOpen((o) => !o)}>
        <span>{item.expectativa}</span>
      </button>
      <div className="mr-prereq-answer">
        <span className="mr-answer-label">O que a prática treina: </span>
        {item.treino}
      </div>
    </div>
  );
}

function PrincipioSection() {
  return (
    <section className="section mr-section" id="principio">
      <div className="container mr-editorial-split">
        <div className="mr-editorial-copy">
          <div className="mr-section-mark" />
          <div className="mr-eyebrow">Calma. Vamos separar uma coisa da outra.</div>
          <h2>Não confunda resultado com pré-requisito.</h2>
          <h3>Você não precisa chegar pronto pra começar.</h3>
          <p className="mr-lead">Muitas pessoas olham para um meditador experiente e acreditam que precisam ser calmas, concentradas e emocionalmente equilibradas antes de começar. Mas essas características não são requisitos de entrada. São parte do que a prática pode ajudar a desenvolver.</p>

          <div className="mr-prereq-guide">
            <span className="mr-prereq-label">O que se pensa que é preciso</span>
            <span className="mr-prereq-label">Passe o mouse ou toque</span>
            <span className="mr-prereq-label">O que a prática realmente treina</span>
          </div>
          <div className="mr-prereq-grid">
            {PREREQS.map((item) => (
              <PrereqItem item={item} key={item.expectativa} />
            ))}
          </div>

          <div className="mr-transition-cue mr-transition-cue--annotated">
            <span>Repare que tudo à direita é capacidade treinável — nada ali é pré-requisito.</span>
            <span className="mr-spoken-note">E o que se treina nesses minutos não fica nesses minutos. ↓</span>
          </div>
        </div>

        <div className="mr-visual-stage mr-visual-stage--quote">
          <DepoimentoDestaque foto={allan} nome="Allan" citacao="Foi tenso... mas me mantive firme até o despertador tocar." legenda={'Uma prática difícil não precisa significar que a meditação "deu errado".'} />
        </div>
      </div>
    </section>
  );
}

export default PrincipioSection;
