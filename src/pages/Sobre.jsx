import renatoImg from "../assets/renato_atendendo.png";

function Sobre() {
  return (
    <>
      <section className="page-hero">
        <div className="container">
          <span className="eyebrow">Sobre</span>
          <h1>Quem é o Dr. Renato Silva de Paula</h1>
        </div>
      </section>

      <section className="section">
        <div className="container two-col">
          <div className="hero-media">
            <img src={renatoImg} alt="Dr. Renato Silva de Paula" />
          </div>
          <div>
            <h2>Uma visão humanizada da medicina</h2>
            <p>Médico nefrologista, o Dr. Renato construiu sua trajetória com um propósito claro: aproximar a medicina das pessoas. Sua atuação une rigor técnico à escuta atenta, sempre priorizando a prevenção antes da intervenção.</p>
            <p>Fora do consultório, leva a mesma missão para as redes sociais, criando conteúdo educativo que já alcançou centenas de milhares de pessoas — sempre com responsabilidade, deixando claro que informação não substitui consulta médica.</p>
            <p>
              Ao longo dos anos de prática clínica, percebeu como a falta de informação simples e acessível leva muitos pacientes a tomar decisões precipitadas sobre a própria saúde, como o uso indiscriminado e automático de medicamentos para a dor. Foi a partir de dúvidas reais recebidas
              diariamente em seu consultório e em seus canais de comunicação que nasceu o desejo de ir além das consultas individuais e criar programas educativos estruturados.
            </p>
            <p>
              Acredita que o verdadeiro cuidado em saúde começa pela conscientização e pela autonomia do paciente. Para o Dr. Renato, educar não significa incentivar o autodiagnóstico ou a automedicação, mas sim capacitar as pessoas para reconhecerem sinais de alerta, compreenderem quando uma
              avaliação médica é indispensável e participarem ativamente das decisões sobre a sua qualidade de vida.
            </p>
            <p>Seja na investigação de doenças renais, no acompanhamento clínico individualizado ou na produção de conteúdos digitais, sua premissa permanece a mesma: medicina clínica além do medicamento, pautada no respeito, na transparência e no compromisso com o bem-estar de cada pessoa.</p>
          </div>
        </div>
      </section>

      <section className="section section-alt">
        <div className="container">
          <div className="center" style={{ marginBottom: 32 }}>
            <span className="eyebrow">Credibilidade</span>
            <h2>Formação e atuação</h2>
          </div>
          <div className="card-grid">
            <div className="card">
              <div className="card-icon">🩺</div>
              <h3>CRM-RJ 52.011743-8</h3>
              <p>Registro médico ativo no estado do Rio de Janeiro.</p>
            </div>
            <div className="card">
              <div className="card-icon">🎓</div>
              <h3>Especialização em Nefrologia</h3>
              <p>Formação especializada em saúde renal, com foco em prevenção e diagnóstico precoce.</p>
            </div>
            <div className="card">
              <div className="card-icon">📚</div>
              <h3>Educação em saúde</h3>
              <p>Produção contínua de conteúdo educativo com alcance relevante nas redes sociais.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="section center">
        <div className="container">
          <h2>Acompanhe o trabalho do Dr. Renato</h2>
          <p className="lede" style={{ margin: "0 auto 24px" }}>
            Conteúdo semanal sobre saúde renal, prevenção e bem-estar.
          </p>
          <a className="btn btn-primary" href="https://www.instagram.com/dr.renatodepaula/" target="_blank" rel="noreferrer">
            Seguir no Instagram
          </a>
        </div>
      </section>
    </>
  );
}

export default Sobre;
