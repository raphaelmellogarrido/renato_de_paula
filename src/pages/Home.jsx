import { Link } from "react-router-dom";
import heroImg from "../assets/renato.png";

function Home() {
  return (
    <>
      {/* Hero */}
      <section className="hero">
        <div className="container hero-grid">
          <div className="hero-copy">
            <span className="eyebrow">Dr. Renato Silva de Paula • Nefrologista</span>
            <h1>Menos Dor, Mais Segurança</h1>
            <p className="lede">Um programa completo em vídeo para você entender sinais de alerta, tratamentos e quando realmente procurar um médico — com linguagem simples e responsável.</p>
            <div className="hero-actions">
              <Link to="/cursos" className="btn btn-primary">
                Quero o Programa Completo — R$ 97
              </Link>
              <Link to="/cursos" className="btn-ghost">
                Prefiro só o e-book por R$ 47
              </Link>
            </div>
            <div className="stat-row">
              <div className="stat">
                <strong>850mil+</strong>
                <span>visualizações no vídeo original</span>
              </div>
              <div className="stat">
                <strong>7 aulas</strong>
                <span>gravadas e objetivas</span>
              </div>
            </div>
          </div>
          <div className="hero-media">
            <img src={heroImg} alt="Dr. Renato Silva de Paula" />
          </div>
        </div>
      </section>

      {/* Prova social */}
      <section className="section">
        <div className="container center">
          <span className="eyebrow">Origem do conteúdo</span>
          <h2>"Então, doutor... o que eu faço quando sentir dor?"</h2>
          <p className="lede" style={{ margin: "0 auto 32px" }}>
            Foi essa a pergunta mais repetida pelos seguidores depois que o vídeo original do Dr. Renato ultrapassou <strong>850 mil visualizações</strong>. Esse programa nasceu para responder, com profundidade, a essa dúvida tão comum.
          </p>
          <div className="card-grid">
            <div className="testimonial">
              <p>"Ele me explicou de um jeito que finalmente entendi quando devo me preocupar."</p>
              <div className="who">— Maria Fernanda</div>
            </div>
            <div className="testimonial">
              <p>"Sempre tomava remédio por conta própria. Depois desse conteúdo, mudei minha visão."</p>
              <div className="who">— Carlos Andrade</div>
            </div>
            <div className="testimonial">
              <p>"Simples, objetivo, direto e muito seguro. Recomendo isso para todo mundo."</p>
              <div className="who">— Joana Silva</div>
            </div>
          </div>
        </div>
      </section>

      {/* Problema x Transformação */}
      <section className="section section-alt">
        <div className="container two-col">
          <div>
            <span className="eyebrow">O Problema</span>
            <h2>Automedicação e falta de orientação</h2>
            <p>Muita gente usa remédios por conta própria ou por indicação de terceiros, sem saber dos riscos reais do uso inadequado de anti-inflamatórios e sem orientação simples sobre o que fazer diante da dor.</p>
          </div>
          <div>
            <span className="eyebrow">A Transformação</span>
            <h2>Clareza para agir com segurança</h2>
            <p>Você vai aprender a reconhecer sinais de alerta, entender o papel do gelo, calor e fisioterapia, os limites dos analgésicos e quando é hora de buscar exames e avaliação médica.</p>
          </div>
        </div>
      </section>

      {/* Programa */}
      <section className="section">
        <div className="container center">
          <span className="eyebrow">O que você vai aprender</span>
          <h2>7 aulas gravadas, direto ao ponto</h2>
        </div>
        <div className="container" style={{ marginTop: 32 }}>
          <div className="lesson-list">
            {[
              "Dores e sinais de alerta que exigem atendimento imediato",
              "Uso de gelo, calor, movimento e fisioterapia",
              "Tratamentos tópicos: pomadas, géis, cremes e adesivos",
              "Analgésicos comuns: benefícios, limites e cuidados",
              "Anti-inflamatórios: quando ajudam e riscos à saúde",
              "Uso frequente, acompanhamento e exames",
              "Outras opções médicas para dores específicas",
            ].map((title, i) => (
              <div className="lesson-item" key={i}>
                <span className="lesson-num">{i + 1}</span>
                <div>
                  <strong>Aula {i + 1}</strong>
                  <p style={{ margin: 0 }}>{title}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA final */}
      <section className="section section-alt center">
        <div className="container">
          <h2>Pronto para entender sua dor com segurança?</h2>
          <p className="lede" style={{ margin: "0 auto 28px" }}>
            Programa completo em vídeo com e-book incluso, ou apenas o e-book — você escolhe o formato ideal para o seu momento.
          </p>
          <div className="hero-actions" style={{ justifyContent: "center" }}>
            <Link to="/cursos" className="btn btn-primary">
              Quero o Programa Completo — R$ 97
            </Link>
            <Link to="/cursos" className="btn btn-secondary">
              Só o e-book — R$ 47
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

export default Home;
