import { HOTMART_PROGRAMA_URL, HOTMART_EBOOK_URL } from '../config/links'

function Cursos() {
  return (
    <>
      <section className="page-hero">
        <div className="container">
          <span className="eyebrow">Cursos</span>
          <h1>Escolha o formato ideal para você</h1>
          <p className="lede" style={{ margin: '0 auto' }}>
            O Programa Completo é a opção mais recomendada — inclui o e-book como
            bônus. Se preferir apenas ler no seu ritmo, o e-book avulso é a opção
            mais econômica.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="pricing-grid">
            <div className="pricing-card featured">
              <span className="badge">Mais recomendado</span>
              <div className="pricing-title">Programa Completo</div>
              <div className="pricing-price">
                R$ 97
              </div>
              <p className="pricing-includes">Inclui:</p>
              <ul className="pricing-list">
                <li>7 aulas gravadas</li>
                <li>Explicação guiada</li>
                <li>E-book de apoio incluso como bônus</li>
                <li>Acesso vitalício ao conteúdo</li>
              </ul>
              <a
                className="btn btn-primary btn-block"
                href={HOTMART_PROGRAMA_URL}
                target="_blank"
                rel="noreferrer"
              >
                Quero o Programa Completo
              </a>
            </div>

            <div className="pricing-card">
              <div className="pricing-title">E-book</div>
              <div className="pricing-price">R$ 47</div>
              <p className="pricing-includes">Inclui:</p>
              <ul className="pricing-list">
                <li>Ler no próprio ritmo</li>
                <li>Opção mais econômica</li>
              </ul>
              <a
                className="btn btn-secondary btn-block"
                href={HOTMART_EBOOK_URL}
                target="_blank"
                rel="noreferrer"
              >
                Quero só o e-book
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Comparação */}
      <section className="section section-alt">
        <div className="container">
          <div className="center" style={{ marginBottom: 32 }}>
            <span className="eyebrow">Comparativo</span>
            <h2>Qual opção é para você?</h2>
          </div>
          <table className="compare-table">
            <thead>
              <tr>
                <th>Recurso</th>
                <th className="recommended">Programa Completo — R$ 97</th>
                <th>Somente E-book — R$ 47</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>7 aulas gravadas</td>
                <td>✓</td>
                <td>—</td>
              </tr>
              <tr>
                <td>Explicação guiada em vídeo</td>
                <td>✓</td>
                <td>—</td>
              </tr>
              <tr>
                <td>E-book de apoio</td>
                <td>✓ (incluso)</td>
                <td>✓</td>
              </tr>
              <tr>
                <td>Ler no próprio ritmo</td>
                <td>✓</td>
                <td>✓</td>
              </tr>
              <tr>
                <td>Investimento</td>
                <td><strong>R$ 97</strong></td>
                <td><strong>R$ 47</strong></td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* FAQ */}
      <section className="section">
        <div className="container" style={{ maxWidth: 760, width: '100%', margin: '0 auto' }}>
          <div className="center" style={{ marginBottom: 8 }}>
            <span className="eyebrow">Dúvidas frequentes</span>
            <h2>Perguntas Frequentes</h2>
          </div>

          <details className="faq-item">
            <summary>Esse conteúdo substitui uma consulta médica?</summary>
            <p>
              Não. O programa e o e-book têm caráter educativo e não substituem
              avaliação, diagnóstico ou tratamento realizado por um médico.
            </p>
          </details>
          <details className="faq-item">
            <summary>O conteúdo incentiva a automedicação?</summary>
            <p>
              De forma alguma. O objetivo é justamente o oposto: ajudar você a
              reconhecer sinais de alerta e saber quando buscar atendimento
              profissional, evitando o uso indevido de medicamentos.
            </p>
          </details>
          <details className="faq-item">
            <summary>Como funciona a entrega e o pagamento?</summary>
            <p>
              A compra é processada pela plataforma Hotmart, com entrega 100%
              digital e acesso liberado logo após a confirmação do pagamento.
            </p>
          </details>
          <details className="faq-item">
            <summary>Tenho garantia?</summary>
            <p>
              Sim, você conta com garantia incondicional conforme as políticas da
              plataforma de pagamento.
            </p>
          </details>
        </div>
      </section>

      <section className="section section-alt center">
        <div className="container">
          <h2>Comece agora a entender sua dor com segurança</h2>
          <div className="hero-actions" style={{ justifyContent: 'center' }}>
            <a className="btn btn-primary" href={HOTMART_PROGRAMA_URL} target="_blank" rel="noreferrer">
              Quero o Programa Completo — R$ 97
            </a>
            <a className="btn-ghost" href={HOTMART_EBOOK_URL} target="_blank" rel="noreferrer">
              Só o e-book — R$ 47
            </a>
          </div>
        </div>
      </section>
    </>
  )
}

export default Cursos
