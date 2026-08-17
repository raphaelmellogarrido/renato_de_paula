import { useState } from "react";

const FAQS = [
  { q: "Nunca meditei. Posso fazer o treinamento?", a: "Sim. O método começa com poucos minutos e foi organizado para ensinar os fundamentos desde o início." },
  { q: "Já tentei meditar e parei. O curso também serve para mim?", a: "Sim. Uma das primeiras etapas é justamente desfazer os mitos e as interpretações que costumam gerar frustração e abandono." },
  { q: "Preciso parar de pensar para meditar?", a: "Não. Pensamentos podem aparecer durante a prática. O treinamento ensina como perceber a distração e retornar ao exercício." },
  { q: "Preciso seguir alguma religião ou filosofia?", a: "Não. O Meditação Raiz apresenta a prática em linguagem racional, sem exigir mudança de religião ou adesão a crenças específicas." },
  { q: "As meditações são guiadas?", a: "No início, existe orientação. Ao longo dos 15 dias, essa condução é progressivamente reduzida até a prática final sem guia." },
  { q: "Quanto tempo preciso reservar por dia?", a: "Há uma aula breve de instrução e duas práticas meditativas, uma pela manhã e outra à noite. As práticas começam com 5 minutos e avançam progressivamente até 25 minutos." },
  {
    q: "E se eu sentir inquietação, sono ou ansiedade durante a prática?",
    a: "Essas experiências podem acontecer. O treinamento ensina a reconhecer dificuldades comuns e progredir sem interpretar automaticamente todo desconforto como fracasso. Sintomas intensos ou persistentes devem ser avaliados por um profissional de saúde.",
  },
  { q: "O curso substitui terapia, consulta ou medicamentos?", a: "Não. O Meditação Raiz é um treinamento educativo. Não substitui atendimento médico, psicoterapia ou tratamento indicado pelos profissionais que acompanham você." },
  { q: "Por quanto tempo terei acesso?", a: "O acesso ao treinamento será válido por um ano." },
  { q: "Como funciona o suporte?", a: "Dúvidas relacionadas ao acesso e ao treinamento poderão ser enviadas pelos canais de e-mail e WhatsApp informados após a compra." },
  { q: "Como funciona o pagamento?", a: "O pagamento é processado pela Hotmart. O valor é de R$ 297, com possibilidade de parcelamento em até 12 vezes, conforme as condições apresentadas no checkout." },
  { q: "Como funciona a garantia?", a: "Você terá sete dias após a compra para conhecer o treinamento e, caso não queira continuar, solicitar o reembolso conforme as regras da Hotmart." },
];

function DuvidasSection() {
  const [openSet, setOpenSet] = useState(() => new Set());

  function toggle(i) {
    setOpenSet((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  }

  return (
    <section className="section mr-section mr-section--sand" id="duvidas">
      <div className="container mr-centered">
        <div className="mr-section-mark" />
        <div className="mr-eyebrow centered">Perguntas frequentes</div>
        <h2 className="centered">Tire suas dúvidas antes de começar</h2>

        <div className="mr-faq-wrap">
          {FAQS.map((item, i) => (
            <div className={`mr-faq-item ${openSet.has(i) ? "open" : ""}`} key={item.q}>
              <button className="mr-faq-question" onClick={() => toggle(i)}>
                <span>{item.q}</span>
                <span>+</span>
              </button>
              <div className="mr-faq-answer">
                <p>{item.a}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default DuvidasSection;
