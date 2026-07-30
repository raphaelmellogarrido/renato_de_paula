import { Link } from "react-router-dom";
import fotoPrincipal from "../assets/renato.png";

const FOTO = fotoPrincipal;

const CAMPOS = [
  {
    titulo: "História e sintomas",
    texto: "Como começou, como evoluiu e o que interfere na vida.",
    icone: (
      <svg viewBox="0 0 24 24">
        <path d="M7 3v8a5 5 0 0 0 10 0V3"></path>
        <path d="M12 16v5M9 21h6"></path>
      </svg>
    ),
  },
  {
    titulo: "Exames e diagnósticos",
    texto: "O que já foi investigado, quais hipóteses foram levantadas e o que ainda precisa ser esclarecido.",
    icone: (
      <svg viewBox="0 0 24 24">
        <path d="M6 3h9l3 3v15H6z"></path>
        <path d="M15 3v4h4M9 11h6M9 15h6"></path>
      </svg>
    ),
  },
  {
    titulo: "Medicamentos",
    texto: "O motivo de cada escolha, os benefícios esperados, os cuidados necessários e o que pode precisar de revisão.",
    icone: (
      <svg viewBox="0 0 24 24">
        <path d="M8 4a4 4 0 0 1 6 0l6 6a4 4 0 0 1-6 6L8 10a4 4 0 0 1 0-6z"></path>
        <path d="M9 11l6-6"></path>
      </svg>
    ),
  },
  {
    titulo: "Rotina e hábitos",
    texto: "Sono, alimentação, movimento, trabalho, descanso e possibilidades reais de mudança.",
    icone: (
      <svg viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="8"></circle>
        <path d="M12 7v5l3 2"></path>
      </svg>
    ),
  },
  {
    titulo: "Contexto emocional",
    texto: "Estresse, relações e padrões que podem interferir na saúde e no cuidado.",
    icone: (
      <svg viewBox="0 0 24 24">
        <path d="M12 21s-8-4.5-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 10c0 6.5-8 11-8 11z"></path>
      </svg>
    ),
  },
  {
    titulo: "Sentido e valores",
    texto: "Espiritualidade, propósito, meditação e valores pessoais, quando forem relevantes.",
    icone: (
      <svg viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="8"></circle>
        <path d="M15 9l-2 5-5 2 2-5z"></path>
      </svg>
    ),
  },
];

const ETAPAS = [
  {
    n: "01",
    titulo: "Escutar e compreender",
    texto: "Entender os sintomas, a história, o que já aconteceu, como você compreende o próprio quadro e o que realmente está limitando sua vida.",
  },
  {
    n: "02",
    titulo: "Juntar as peças do seu caso",
    texto: "Analisar exames, diagnósticos, hipóteses, medicamentos e tratamentos anteriores para compreender o conjunto — e não cada informação isoladamente.",
  },
  {
    n: "03",
    titulo: "Definir prioridades junto com você",
    texto: "Identificar o que exige atenção imediata, o que precisa ser investigado, o que pode ser revisto e o que não necessita de intervenção naquele momento.",
  },
  {
    n: "04",
    titulo: "Construir um plano possível",
    texto: "Criar um plano por etapas, considerando riscos, necessidades, preferências e a realidade da sua vida.",
  },
];

const PARA_QUEM = [
  "Tem sintomas ou queixas que ainda não conseguiu compreender.",
  "Possui exames, diagnósticos e hipóteses diferentes, mas pouca clareza sobre as prioridades.",
  "Usa vários medicamentos e deseja uma revisão clínica cuidadosa.",
  "Sente que seu cuidado está fragmentado entre diferentes profissionais.",
  "Gosta de entender o próprio caso e participar das decisões.",
  "Quer saber por que um exame está sendo solicitado e o que o resultado significa.",
  "Valoriza explicações sobre a escolha de medicamentos e alternativas.",
  "Procura uma avaliação que considere a doença e também sua rotina, valores e realidade.",
];

const BENEFICIOS = [
  "Desenvolver a concentração",
  "Fortalecer a autorregulação emocional",
  "Reduzir reações automáticas e impulsivas",
  "Aumentar a clareza na tomada de decisões",
  "Melhorar a capacidade de lidar com o estresse",
];

const AUTORIDADE = [
  {
    titulo: "Médico pela UFRJ",
    texto: "Formação médica baseada em ciência e raciocínio clínico.",
    icone: (
      <svg viewBox="0 0 24 24">
        <path d="M3 10l9-6 9 6-9 6z"></path>
        <path d="M6 12v5c3 2 9 2 12 0v-5"></path>
      </svg>
    ),
  },
  {
    titulo: "Pós-graduado em Nefrologia",
    texto: "Experiência com doença crônica, cuidado complexo e acompanhamento de longo prazo.",
    icone: (
      <svg viewBox="0 0 24 24">
        <path d="M12 3v18M3 12h18"></path>
        <circle cx="12" cy="12" r="8"></circle>
      </svg>
    ),
  },
  {
    titulo: "Educação em saúde",
    texto: "Produção de conteúdos para ajudar pessoas a compreender melhor as decisões relacionadas à própria saúde.",
    icone: (
      <svg viewBox="0 0 24 24">
        <path d="M4 5h16v12H7l-3 3z"></path>
        <path d="M8 9h8M8 13h6"></path>
      </svg>
    ),
  },
];

const FAQ = [
  { pergunta: "A consulta é online?", resposta: "Sim. O atendimento é realizado por videochamada, em horário previamente agendado." },
  {
    pergunta: "Posso enviar exames antes da consulta?",
    resposta: "Sim. Depois da confirmação do agendamento, você recebe as orientações para enviar exames, receitas e outras informações relevantes.",
  },
  {
    pergunta: "Como faço para agendar?",
    resposta: "Ao clicar em “Agendar consulta”, você poderá consultar os horários disponíveis e receber as orientações para confirmação do atendimento.",
  },
  {
    pergunta: "A consulta substitui o acompanhamento com um especialista?",
    resposta: "A consulta pode ajudar a organizar o quadro e definir prioridades, mas não substitui automaticamente o acompanhamento especializado quando ele é necessário.",
  },
  {
    pergunta: "Posso marcar uma consulta apenas para pedir exames?",
    resposta: "A solicitação de exames depende da avaliação clínica. O objetivo é investigar o que realmente for pertinente, evitando pedidos indiscriminados.",
  },
  {
    pergunta: "Como sei se meu caso pode ser atendido online?",
    resposta: "Alguns casos exigem exame físico ou avaliação presencial. Situações de urgência devem ser atendidas em um serviço apropriado.",
  },
];

const WHATSAPP_NUMBER = "5521976624767";
const WHATSAPP_MENSAGEM_FINAL = "Olá! Gostaria de explicar brevemente o meu caso para saber se o atendimento do Dr. Renato pode fazer sentido para mim.";

function Home() {
  return (
    <>
      {/* 1. Primeira dobra */}
      <section className="hero">
        <div className="container hero-grid">
          <div className="hero-copy">
            <span className="eyebrow">Médico pela UFRJ</span>
            <h1>Medicina clínica além do remédio.</h1>
            <p className="lede">
              Um cuidado baseado em ciência, com um olhar ampliado para tudo o que faz parte de você — seus sintomas, sua história, sua rotina, suas emoções, seus valores e sua realidade — sem
              reduzir você a um diagnóstico.
            </p>
            <p style={{ fontWeight: 700, color: "var(--primary)", textTransform: "uppercase", fontSize: 13, letterSpacing: "0.1em", marginTop: 8 }}>Base científica. Visão integral.</p>
            <div className="hero-actions">
              <Link to="/consulta" className="btn btn-primary btn-pill btn-mobile-full">
                Agendar consulta
              </Link>
              <a href="#forma-de-cuidar" className="btn btn-secondary btn-mobile-full">
                Conhecer minha forma de cuidar
              </a>
            </div>
            <div className="online-note">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <rect x="3" y="5" width="13" height="14" rx="2"></rect>
                <path d="M16 10l5-3v10l-5-3z"></path>
              </svg>
              <span>Consulta médica online</span>
            </div>
          </div>
          <div className="hero-media">
            <img src={FOTO} alt="Dr. Renato Silva de Paula" />
          </div>
        </div>
      </section>

      {/* 2. Compreender para se cuidar */}
      <section className="section section-alt">
        <div className="container two-col">
          <div>
            <span className="eyebrow">Compreender para se cuidar</span>
            <h2>Eu ajudo você a compreender melhor o seu próprio caso.</h2>
            <p className="plain-highlight">
              Quando você entende melhor o seu quadro, participa mais ativamente do tratamento, toma decisões com mais segurança e consegue seguir o plano com mais clareza.
            </p>
          </div>
          <div>
            <p>Muitas pessoas chegam com exames guardados, receitas antigas, laudos, diagnósticos mencionados ao longo do caminho e informações que nunca foram completamente explicadas.</p>
            <p>
              Antes de propor qualquer conduta, eu procuro entender o que você sente, o que já viveu e como você compreende o próprio quadro. Depois, reunimos essas informações e acrescentamos a
              análise médica para construir uma visão mais clara do que está acontecendo e do que merece atenção primeiro.
            </p>
            <p>Faço questão de explicar o que estamos investigando, por que um exame é solicitado, por que um medicamento é escolhido e o que cada resultado muda no plano.</p>
            <div className="quote-box">
              Meu trabalho é reunir exames, sintomas, hipóteses e diagnósticos que parecem desconectados, construir com você uma compreensão clara do quadro e transformá-la em um plano possível.
            </div>
          </div>
        </div>
      </section>

      {/* 3. Minha visão da medicina */}
      <section className="section">
        <div className="container two-col">
          <div>
            <span className="eyebrow">Minha visão da medicina</span>
            <h2>Ciência como base. A pessoa por inteiro no centro do cuidado.</h2>
            <p className="lede" style={{ marginTop: 24 }}>
              Minha atuação parte da medicina tradicional: escuta clínica, raciocínio diagnóstico, interpretação de exames e tratamentos baseados em evidências científicas.
            </p>
            <p>
              Mas uma pessoa não cabe apenas em resultados de laboratório. Sono, alimentação, movimento, trabalho, descanso, relações, emoções, valores, espiritualidade e os hábitos que sustentam a
              vida cotidiana também podem influenciar a saúde, o sofrimento e a capacidade de mudar.
            </p>
            <p>
              Quando necessário, o cuidado também pode incluir estratégias graduais para construir hábitos mais saudáveis e reduzir comportamentos que prejudicam o bem-estar — respeitando a
              realidade, o tempo e as possibilidades de cada pessoa.
            </p>
            <p>Práticas como a meditação também podem ser consideradas quando fizerem sentido para o caso e para a pessoa.</p>
            <div className="quote-box">
              Considerar a pessoa por inteiro não significa abandonar medicamentos ou tratamentos convencionais. Significa entender quando eles são necessários — e reconhecer quando, sozinhos, não
              são suficientes.
            </div>
          </div>
          <div className="hero-media">
            <img src={FOTO} alt="Dr. Renato em teleconsulta" />
          </div>
        </div>
      </section>

      {/* 4. Minha forma de cuidar */}
      <section id="forma-de-cuidar" className="section section-alt">
        <div className="container center" style={{ marginBottom: 32 }}>
          <span className="eyebrow">Minha forma de cuidar</span>
          <h2>Como eu conduzo o cuidado</h2>
          <p className="lede" style={{ margin: "24px auto 0" }}>
            A consulta não é uma sequência automática de perguntas e prescrições. O cuidado é construído por etapas, com raciocínio clínico, prioridades claras e participação do paciente.
          </p>
        </div>
        <div className="container card-grid-4">
          {ETAPAS.map((etapa) => (
            <div className="card" key={etapa.n}>
              <div className="step-number">{etapa.n}</div>
              <h3>{etapa.titulo}</h3>
              <p>{etapa.texto}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 5. Campos da avaliação */}
      <section className="section">
        <div className="container center" style={{ marginBottom: 32 }}>
          <span className="eyebrow">O que pode ser considerado</span>
          <h2>Um olhar clínico, humano e organizado</h2>
          <p className="lede" style={{ margin: "24px auto 0" }}>
            Nem todos os campos precisam ser aprofundados em todas as consultas. A avaliação segue o que for clinicamente relevante para cada pessoa.
          </p>
        </div>
        <div className="container card-grid">
          {CAMPOS.map((campo) => (
            <div className="card" key={campo.titulo}>
              <div className="icon-wrap">{campo.icone}</div>
              <h3>{campo.titulo}</h3>
              <p>{campo.texto}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 6. Para quem */}
      <section className="section section-alt">
        <div className="container two-col">
          <div>
            <span className="eyebrow">Para quem</span>
            <h2>Este atendimento pode fazer sentido para você que…</h2>
          </div>
          <ul className="check-list">
            {PARA_QUEM.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </section>

      {/* 7. Consulta online */}
      <section className="section">
        <div className="container center">
          <span className="eyebrow">Consulta médica online</span>
          <h2>Como funciona a consulta</h2>
          <p className="lede" style={{ margin: "24px auto 0" }}>
            Uma experiência organizada em três momentos, para que o atendimento seja aproveitado com profundidade e clareza.
          </p>
        </div>
        <div className="container timeline">
          <div className="card">
            <div className="timeline-label">Antes</div>
            <h3>Preparação</h3>
            <p>Depois da confirmação do agendamento, você recebe as orientações para enviar exames, receitas e outras informações relevantes.</p>
          </div>
          <div className="card">
            <div className="timeline-label">Durante</div>
            <h3>Avaliação aprofundada</h3>
            <p>Em uma videochamada, conversamos sobre sintomas, histórico, tratamentos, dúvidas e prioridades. Exames e medicamentos disponíveis também são analisados.</p>
          </div>
          <div className="card">
            <div className="timeline-label">Depois</div>
            <h3>Plano por etapas</h3>
            <p>Você recebe a primeira versão de um plano organizado, além das receitas, solicitações de exames ou encaminhamentos que forem necessários.</p>
          </div>
        </div>
        <div className="container center" style={{ marginTop: 44 }}>
          <Link to="/consulta" className="btn btn-primary btn-pill btn-mobile-full">
            Agendar consulta
          </Link>
        </div>
      </section>

      {/* 8. Meditação ou medicação? */}
      <section className="section section-alt">
        <div className="container two-col">
          <div>
            <span className="eyebrow">Meditação e saúde</span>
            <h2>Meditação ou medicação?</h2>
            <p className="lede" style={{ marginTop: 20 }}>
              <strong>Em muitos casos, essa não precisa ser uma escolha.</strong>
            </p>
            <p>
              A meditação faz parte da minha trajetória pessoal e do meu trabalho em educação em saúde. Na minha experiência, ela tem um papel muito importante na minha saúde mental, no meu
              desempenho profissional e na forma como lido com a vida pessoal e familiar.
            </p>
            <p>Também acredito que seja uma ferramenta ainda pouco aproveitada no mundo — e especialmente no Brasil.</p>
            <div className="benefits">
              {BENEFICIOS.map((beneficio, i) => (
                <div className="benefit" key={beneficio}>
                  <span className="benefit-index">{i + 1}</span>
                  <span className="benefit-text">{beneficio}</span>
                </div>
              ))}
            </div>
            <p>Isso não significa substituir medicamentos ou tratamentos necessários. Cada situação precisa ser avaliada individualmente. A meditação entra como uma possibilidade adicional de cuidado.</p>
            <p>Na página Meditação, conto minha história com a prática, compartilho minha visão sobre o tema e apresento o Meditação Raiz, método que desenvolvi para tornar essa prática mais clara, acessível e aplicável.</p>
            <Link to="/meditacao" className="btn btn-secondary btn-mobile-full">
              Conhecer a Meditação Raiz
            </Link>
          </div>
          <div className="hero-media">
            <img src={FOTO} alt="Meditação" />
          </div>
        </div>
      </section>

      {/* 9. Autoridade resumida */}
      <section className="section">
        <div className="container center" style={{ marginBottom: 32 }}>
          <span className="eyebrow">Formação e experiência</span>
          <h2>Base técnica para cuidar com profundidade e responsabilidade</h2>
        </div>
        <div className="container card-grid">
          {AUTORIDADE.map((item) => (
            <div className="card" key={item.titulo}>
              <div className="icon-wrap">{item.icone}</div>
              <h3>{item.titulo}</h3>
              <p>{item.texto}</p>
            </div>
          ))}
        </div>
        <div className="container center" style={{ marginTop: 38 }}>
          <Link to="/sobre" className="btn btn-secondary btn-mobile-full">
            Conhecer minha trajetória
          </Link>
        </div>
      </section>

      {/* 10. FAQ */}
      <section className="section section-alt">
        <div className="container center">
          <span className="eyebrow">Perguntas frequentes</span>
          <h2>Dúvidas antes de agendar</h2>
        </div>
        <div className="container">
          <div className="faq-wrap">
            {FAQ.map((item) => (
              <details key={item.pergunta}>
                <summary>{item.pergunta}</summary>
                <p>{item.resposta}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* 11. Chamada final */}
      <section className="section section-dark center">
        <div className="container" style={{ maxWidth: 700, width: "100%", margin: "0 auto" }}>
          <span className="eyebrow" style={{ color: "var(--gold)" }}>
            Contato
          </span>
          <h2>Deseja conversar sobre o seu caso?</h2>
          <p style={{ margin: "20px auto 28px", color: "#d8ccbc" }}>Envie uma mensagem breve para entender se esta proposta de atendimento faz sentido para o que você procura.</p>
          <a
            className="btn btn-light btn-pill btn-mobile-full"
            href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_MENSAGEM_FINAL)}`}
            target="_blank"
            rel="noreferrer"
          >
            Falar pelo WhatsApp
          </a>
        </div>
      </section>
    </>
  );
}

export default Home;
