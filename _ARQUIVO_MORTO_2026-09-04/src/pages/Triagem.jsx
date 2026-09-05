import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  TRIAGEM,
  estadoInicial,
  aplicarAcoes,
  resolverDestino,
  interpolarTexto,
  calcularResultado,
} from '../lib/triagemEngine'
import { MICROCONTEUDOS, resolveUrl } from '../config/triagemContent'

// Os valores abaixo precisam bater exatamente com o campo `etapa` do YAML
// (sem acento), já que são usados para comparação. A exibição usa ETAPA_LABELS.
const ETAPAS = ['Inicio', 'Seguranca', 'Entender a dor', 'Sua rota']
const ETAPA_LABELS = {
  Inicio: 'Início',
  Seguranca: 'Segurança',
  'Entender a dor': 'Entender a dor',
  'Sua rota': 'Sua rota',
}

const PRIORIDADE_CLASSE = {
  samu_agora: 'saida-critica',
  pronto_atendimento_agora: 'saida-urgente',
  avaliacao_mesmo_dia: 'saida-atencao',
  consulta_programada: 'saida-consulta',
  educacao: 'saida-consulta',
}

function Triagem() {
  const [nodeId, setNodeId] = useState('inicio')
  const [estado, setEstado] = useState(estadoInicial)
  const [etapaAtual, setEtapaAtual] = useState('Inicio')

  const no = TRIAGEM.nos[nodeId]

  function irParaNo(id, novoEstado) {
    const destinoFinal = resolverDestino(id, novoEstado)
    const destinoNo = TRIAGEM.nos[destinoFinal]
    setEstado(novoEstado)
    setNodeId(destinoFinal)
    if (destinoNo?.etapa) {
      setEtapaAtual(destinoNo.etapa)
    } else if (destinoFinal === 'resultado_educacional') {
      setEtapaAtual('Sua rota')
    }
  }

  function handleResposta(resposta) {
    const novoEstado = aplicarAcoes(estado, resposta.acoes)
    irParaNo(resposta.destino, novoEstado)
  }

  function handleContinuar(destino) {
    irParaNo(destino, estado)
  }

  function handleReiniciar() {
    setNodeId('inicio')
    setEstado(estadoInicial())
    setEtapaAtual('Inicio')
  }

  const mostrarBarraPersistente = ['pergunta', 'pergunta_com_educacao', 'mensagem'].includes(no?.tipo)
  const mostrarVerConteudos = mostrarBarraPersistente && etapaAtual !== 'Inicio' && etapaAtual !== 'Seguranca'

  const resultado = useMemo(() => (no?.tipo === 'resultado_por_pontuacao' ? calcularResultado(estado) : null), [no, estado])

  return (
    <>
      <section className="page-hero">
        <div className="container">
          <span className="eyebrow">Triagem do Saber</span>
          <h1>Descubra o que você precisa aprender sobre a sua dor</h1>
          <p className="lede" style={{ margin: '0 auto' }}>
            Em poucos cliques, entenda o que fazer agora e receba uma rota de
            conhecimento personalizada. Isto não é um diagnóstico.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container" style={{ maxWidth: 720, width: '100%', margin: '0 auto' }}>
          {mostrarBarraPersistente && (
            <div className="triagem-topbar">
              <div className="triagem-etapas">
                {ETAPAS.map((etapa) => (
                  <span key={etapa} className={`triagem-etapa ${etapa === etapaAtual ? 'ativa' : ''}`}>
                    {ETAPA_LABELS[etapa]}
                  </span>
                ))}
              </div>
              <div className="triagem-topbar-acoes">
                {mostrarVerConteudos && (
                  <Link to="/cursos" className="btn-restart">
                    Ver todos os conteúdos
                  </Link>
                )}
                <a href="tel:192" className="btn-emergencia">
                  🚨 Preciso de ajuda agora
                </a>
              </div>
            </div>
          )}

          <div className="decision-stage center">
            {(no.tipo === 'pergunta' || no.tipo === 'pergunta_com_educacao') && (
              <>
                <h3 className="decision-question">{no.pergunta}</h3>
                {no.ajuda && <p className="triagem-ajuda">{no.ajuda}</p>}
                {no.educacao && <p className="triagem-educacao">{no.educacao}</p>}
                <div className="decision-buttons">
                  {no.respostas.map((resposta) => (
                    <button key={resposta.texto} className="decision-btn" onClick={() => handleResposta(resposta)}>
                      {resposta.texto}
                    </button>
                  ))}
                </div>
              </>
            )}

            {no.tipo === 'mensagem' && (
              <>
                <h3 className="decision-question">{no.titulo}</h3>
                <p className="triagem-ajuda">{no.texto}</p>
                {no.destino.startsWith('tel:') ? (
                  <a href={no.destino} className="btn btn-primary btn-pill">
                    {no.botao}
                  </a>
                ) : (
                  <button className="btn btn-primary btn-pill" onClick={() => handleContinuar(no.destino)}>
                    {no.botao}
                  </button>
                )}
              </>
            )}

            {(no.tipo === 'saida' || no.tipo === 'saida_com_continuacao') && (
              <div className={`saida-box ${PRIORIDADE_CLASSE[no.prioridade] || ''}`}>
                <h2>{no.titulo}</h2>
                <p>{interpolarTexto(no.texto, estado)}</p>
                {no.justificativa_dinamica && (estado.alertas_acionados.length > 0 || estado.motivos_consulta.length > 0) && (
                  <p className="saida-justificativa">{interpolarTexto(no.justificativa_dinamica, estado)}</p>
                )}
                <div className="decision-buttons">
                  {no.acoes.map((acao) => {
                    if (acao.tipo === 'telefone') {
                      return (
                        <a key={acao.texto} href={acao.destino} className="btn btn-primary btn-pill">
                          {acao.texto}
                        </a>
                      )
                    }
                    if (acao.tipo === 'link') {
                      return (
                        <a key={acao.texto} href={resolveUrl(acao.destino)} target="_blank" rel="noreferrer" className="btn btn-primary btn-pill">
                          {acao.texto}
                        </a>
                      )
                    }
                    if (acao.tipo === 'conteudo' || acao.tipo === 'continuar') {
                      return (
                        <button key={acao.texto} className="decision-btn" onClick={() => handleContinuar(acao.destino)}>
                          {acao.texto}
                        </button>
                      )
                    }
                    return (
                      <button key={acao.texto} className="decision-btn" onClick={handleReiniciar}>
                        {acao.texto}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {no.tipo === 'resultado_por_pontuacao' && resultado && (
              <div className="resultado-box">
                <span className="eyebrow">{no.titulo}</span>
                <h2>{TRIAGEM.catalogo_conteudos[resultado.principal].titulo}</h2>
                <p className="triagem-ajuda">{TRIAGEM.catalogo_conteudos[resultado.principal].descricao}</p>

                <blockquote className="citacao-box">
                  <p>{MICROCONTEUDOS[resultado.principal]}</p>
                </blockquote>

                <Link to="/cursos" className="btn btn-primary btn-pill">
                  {no.apresentacao.cta_principal}
                </Link>

                <div className="resultado-complementares">
                  <h4>Também pode te interessar</h4>
                  <div className="decision-buttons">
                    {resultado.complementares.map((id) => (
                      <div key={id} className="card resultado-card">
                        <h3>{TRIAGEM.catalogo_conteudos[id].titulo}</h3>
                        <p>{TRIAGEM.catalogo_conteudos[id].descricao}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {resultado.ofertaId !== 'ebook_completo' && (
                  <div className="resultado-oferta">
                    <h4>{TRIAGEM.ofertas[resultado.ofertaId].titulo}</h4>
                    <a
                      href={resolveUrl(TRIAGEM.ofertas[resultado.ofertaId].url)}
                      target="_blank"
                      rel="noreferrer"
                      className="btn btn-secondary"
                    >
                      {TRIAGEM.ofertas[resultado.ofertaId].cta}
                    </a>
                  </div>
                )}

                <div className="resultado-oferta">
                  <h4>{TRIAGEM.ofertas.ebook_completo.titulo}</h4>
                  <a
                    href={resolveUrl(TRIAGEM.ofertas.ebook_completo.url)}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-primary btn-pill"
                  >
                    {no.apresentacao.cta_ebook}
                  </a>
                </div>
              </div>
            )}

            <button className="btn-restart" onClick={handleReiniciar} style={{ marginTop: 32 }}>
              <span>↺</span> Recomeçar
            </button>
          </div>
        </div>
      </section>
    </>
  )
}

export default Triagem
