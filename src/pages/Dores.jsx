import { useState } from 'react'
import { Link } from 'react-router-dom'
import { REGIOES, INTRO_TEXTO, EBOOK_TITULO } from '../config/dores'

const LOCKED_OPCOES = ['Ver mais causas', 'Ver tratamentos avançados', 'Ver quando fazer exames']

function Dores() {
  const [trail, setTrail] = useState([])

  const regiaoId = trail.find((e) => e.regiaoId)?.regiaoId
  const regiao = REGIOES.find((r) => r.id === regiaoId)
  const step = trail.length + 1

  function handleReiniciar() {
    setTrail([])
  }

  function handleSenteDores() {
    setTrail([{ label: 'Sente dores?' }])
  }

  function handleEscolherRegiao(r) {
    setTrail((t) => [...t, { label: r.label, regiaoId: r.id }])
  }

  function handleEscolherOpcao(label) {
    setTrail((t) => [...t, { label }])
  }

  function handleTrailClick(index) {
    setTrail((t) => t.slice(0, index + 1))
  }

  const nivelAtual = regiao && step >= 3 && step <= 5 ? regiao.niveis[step - 3] : null

  return (
    <>
      <section className="page-hero">
        <div className="container">
          <span className="eyebrow">Dores</span>
          <h1>Entenda a sua dor, passo a passo</h1>
          <p className="lede" style={{ margin: '0 auto' }}>
            Um guia interativo para te ajudar a entender melhor o que você está
            sentindo — e quando é hora de procurar um médico.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container" style={{ maxWidth: 720, width: '100%', margin: '0 auto' }}>
          <div className="decision-stage center">
            {trail.length > 0 && (
              <div className="trail-header">
                <div className="trail-row">
                  {trail.map((entry, i) => (
                    <button
                      key={i}
                      className={`decision-btn trail-btn ${i === trail.length - 1 ? 'trail-btn-current' : ''}`}
                      onClick={() => handleTrailClick(i)}
                    >
                      {entry.label}
                    </button>
                  ))}
                </div>
                <button className="btn-restart" onClick={handleReiniciar}>
                  <span>↺</span> Recomeçar
                </button>
              </div>
            )}

            {trail.length === 0 && (
              <>
                <button className="btn btn-primary btn-pill" onClick={handleSenteDores}>
                  Sente dores?
                </button>
                <div className="dores-intro">
                  <p>{INTRO_TEXTO}</p>
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <h3 className="decision-question">Onde você sente a dor?</h3>
                <div className="decision-buttons">
                  {REGIOES.map((r) => (
                    <button key={r.id} className="decision-btn" onClick={() => handleEscolherRegiao(r)}>
                      {r.label}
                    </button>
                  ))}
                </div>
              </>
            )}

            {nivelAtual && (
              <>
                <h3 className="decision-question">{nivelAtual.titulo}</h3>
                <div className="decision-buttons">
                  {nivelAtual.opcoes.map((opcao) => (
                    <button key={opcao} className="decision-btn" onClick={() => handleEscolherOpcao(opcao)}>
                      {opcao}
                    </button>
                  ))}
                </div>
              </>
            )}

            {step === 6 && (
              <div className="locked-stage">
                <div className="decision-buttons">
                  {LOCKED_OPCOES.map((opcao) => (
                    <button key={opcao} className="decision-btn locked-btn" disabled>
                      {opcao}
                    </button>
                  ))}
                </div>
                <div className="locked-cta">
                  <p>
                    Você já percorreu boa parte do caminho entendendo a{' '}
                    {regiao?.label.toLowerCase()} — e é exatamente esse tipo de
                    raciocínio, passo a passo, que o Dr. Renato aprofunda aula por
                    aula no Programa Completo. Desbloqueie o conteúdo inteiro,
                    continue essa jornada de autoconhecimento com segurança e
                    aprenda de vez o que fazer da próxima vez que a dor aparecer.
                  </p>
                  <Link to="/cursos" className="btn btn-primary btn-pill">
                    Quero o Programa Completo — R$ 97
                  </Link>
                </div>
              </div>
            )}

            {nivelAtual && (
              <blockquote className="citacao-box">
                <p>"{nivelAtual.citacao}"</p>
                <cite>
                  retirado do e-book <Link to="/cursos">{EBOOK_TITULO}</Link>
                </cite>
              </blockquote>
            )}
          </div>
        </div>
      </section>
    </>
  )
}

export default Dores
