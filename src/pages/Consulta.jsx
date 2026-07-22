function Consulta() {
  return (
    <>
      <section className="page-hero">
        <div className="container">
          <span className="eyebrow">Consulta</span>
          <h1>Atendimento nefrológico com foco em prevenção</h1>
          <p className="lede" style={{ margin: "0 auto" }}>
            Uma consulta pensada para escutar você com atenção, entender seu histórico e construir, junto, um cuidado preventivo e humanizado.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container two-col">
          <div>
            <h2>Como funciona o atendimento</h2>
            <ul className="info-list">
              <li>
                <span className="info-icon">1</span>
                <div>
                  <strong>Escuta ativa</strong>
                  <p>Conversa detalhada sobre seu histórico, hábitos e queixas antes de qualquer conduta.</p>
                </div>
              </li>
              <li>
                <span className="info-icon">2</span>
                <div>
                  <strong>Avaliação clínica completa</strong>
                  <p>Exame físico e análise cuidadosa de exames, com explicações claras em cada etapa.</p>
                </div>
              </li>
              <li>
                <span className="info-icon">3</span>
                <div>
                  <strong>Foco em prevenção</strong>
                  <p>Orientações práticas para prevenir complicações renais e melhorar sua qualidade de vida.</p>
                </div>
              </li>
              <li>
                <span className="info-icon">4</span>
                <div>
                  <strong>Acompanhamento contínuo</strong>
                  <p>Plano de retorno e exames de rotina para acompanhar sua evolução ao longo do tempo.</p>
                </div>
              </li>
            </ul>
          </div>

          <div className="card">
            <div className="card-icon">📅</div>
            <h3>Agende sua consulta</h3>
            <p>Escolha o canal mais conveniente para você. Nossa equipe cuidará de encontrar o melhor horário.</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 20 }}>
              <a className="btn btn-primary btn-block" href="https://wa.me/+5521969066030" target="_blank" rel="noreferrer">
                Agendar pelo WhatsApp
              </a>
              <a className="btn btn-secondary btn-block" href="https://www.doctoralia.com.br/" target="_blank" rel="noreferrer">
                Agendar pela Doctoralia
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="section section-alt center">
        <div className="container">
          <span className="eyebrow">Cuidado humanizado</span>
          <h2>Seu tempo e sua história importam</h2>
          <p className="lede" style={{ margin: "0 auto" }}>
            Cada paciente é único. O objetivo é ir além do exame: entender o contexto de vida para oferecer orientações que façam sentido no seu dia a dia.
          </p>
        </div>
      </section>
    </>
  );
}

export default Consulta;
