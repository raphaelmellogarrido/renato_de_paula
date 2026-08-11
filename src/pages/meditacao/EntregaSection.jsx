import { useState } from "react";

const ITEMS = [
  { icon: "15", titulo: "Aulas breves", texto: "Instruções curtas para orientar cada etapa e explicar o que está sendo treinado." },
  { icon: "30", titulo: "Práticas meditativas", texto: "Duas práticas por dia, uma pela manhã e outra à noite." },
  { icon: "5→25", titulo: "Minutos por prática", texto: "O tempo aumenta gradualmente conforme a condução externa diminui." },
  { icon: "0→15", titulo: "Percurso completo", texto: "Da preparação inicial até a prática final de 25 minutos sem guia." },
  { icon: "1 ano", titulo: "Tempo de acesso", texto: "Revisite aulas, repita etapas e consolide a prática no seu ritmo." },
  { icon: "↗", titulo: "Suporte", texto: "Canais de e-mail e WhatsApp para dúvidas de acesso e treinamento." },
  { icon: "Agora", titulo: "Acesso imediato", texto: "Após a confirmação da compra, a plataforma é liberada." },
  { icon: "7 dias", titulo: "Garantia", texto: "Conheça a proposta e decida se faz sentido continuar." },
];

const LESSONS = [
  "Dia 01 · Princípio-raiz",
  "Prática da manhã · 5 min",
  "Prática da noite · 5 min",
  "Dia 02 · Desfazendo mitos",
  "Sua progressão",
];

function isTouchDevice() {
  return typeof window !== "undefined" && window.matchMedia?.("(hover: none)").matches;
}

function DeliverItem({ item }) {
  const [open, setOpen] = useState(false);

  return (
    <div
      className={`mr-deliver-item ${open ? "open" : ""}`}
      tabIndex={0}
      onClick={() => isTouchDevice() && setOpen((o) => !o)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          setOpen((o) => !o);
        }
      }}
    >
      <div className="mr-deliver-icon">{item.icon}</div>
      <h4>{item.titulo}</h4>
      <p>{item.texto}</p>
    </div>
  );
}

function EntregaSection() {
  return (
    <section className="section mr-section" id="entrega">
      <div className="container">
        <div className="mr-section-mark" />
        <div className="mr-eyebrow">Clareza antes de comprar</div>
        <h2>O que você recebe ao começar o Meditação Raiz</h2>
        <p className="mr-lead">
          Uma estrutura clara e progressiva para que você não precise improvisar o caminho sozinho.
        </p>

        <div className="mr-deliver-grid">
          <div className="mr-deliver-items">
            {ITEMS.map((item) => (
              <DeliverItem item={item} key={item.titulo} />
            ))}
          </div>

          <div className="mr-device-stage">
            <div className="mr-device-float one">
              <strong>Manhã e noite</strong>
              Duas práticas organizadas por dia.
            </div>
            <div className="mr-phone-mock">
              <div className="mr-phone-screen">
                <div className="mr-phone-bar" />
                <div className="mr-screen-brand">Meditação Raiz</div>
                {LESSONS.map((lesson) => (
                  <div className="mr-lesson-thumb" key={lesson}>
                    {lesson}
                  </div>
                ))}
              </div>
            </div>
            <div className="mr-device-float two">
              <strong>Área de membros</strong>
              Acesse suas aulas e práticas em qualquer dispositivo.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default EntregaSection;
