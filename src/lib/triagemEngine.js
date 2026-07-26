import { load } from 'js-yaml'
import triagemYamlRaw from '../config/triagem_do_saber_arvore.yaml?raw'

export const TRIAGEM = load(triagemYamlRaw)

// Ordem de prioridade clínica — índice menor = mais urgente.
// "Uma prioridade maior nunca pode ser rebaixada" (regra do YAML).
const PRIORIDADE_ORDEM = [
  'samu_agora',
  'pronto_atendimento_agora',
  'avaliacao_mesmo_dia',
  'consulta_programada',
  'educacao',
]

function rank(prioridade) {
  const i = PRIORIDADE_ORDEM.indexOf(prioridade)
  return i === -1 ? PRIORIDADE_ORDEM.length : i
}

export function estadoInicial() {
  const campos = TRIAGEM.estado_sessao.campos
  return JSON.parse(JSON.stringify(campos))
}

export function aplicarAcoes(estado, acoes) {
  if (!acoes) return estado
  let novo = { ...estado, pontuacao: { ...estado.pontuacao } }

  for (const acao of acoes) {
    if (acao.definir) {
      novo = { ...novo, ...acao.definir }
    }
    if (acao.somar) {
      for (const [cap, pontos] of Object.entries(acao.somar)) {
        novo.pontuacao[cap] = (novo.pontuacao[cap] || 0) + pontos
      }
    }
    if (acao.definir_prioridade) {
      if (rank(acao.definir_prioridade) < rank(novo.prioridade_atual)) {
        novo.prioridade_atual = acao.definir_prioridade
      }
    }
    if (acao.adicionar_motivo_consulta) {
      if (!novo.motivos_consulta.includes(acao.adicionar_motivo_consulta)) {
        novo.motivos_consulta = [...novo.motivos_consulta, acao.adicionar_motivo_consulta]
      }
    }
    if (acao.adicionar_alerta) {
      if (!novo.alertas_acionados.includes(acao.adicionar_alerta)) {
        novo.alertas_acionados = [...novo.alertas_acionados, acao.adicionar_alerta]
      }
    }
  }

  return novo
}

function avaliarClausula(clausula, estado) {
  const trimmed = clausula.trim()

  const lengthMatch = trimmed.match(/^([a-zA-Z_]+)\.length\s*(>=|<=|==|>|<)\s*(\d+)$/)
  if (lengthMatch) {
    const [, campo, op, valorStr] = lengthMatch
    const valor = Number(valorStr)
    const tamanho = (estado[campo] || []).length
    switch (op) {
      case '>=':
        return tamanho >= valor
      case '<=':
        return tamanho <= valor
      case '>':
        return tamanho > valor
      case '<':
        return tamanho < valor
      default:
        return tamanho === valor
    }
  }

  const eqMatch = trimmed.match(/^([a-zA-Z_]+)\s*==\s*([a-zA-Z_0-9]+)$/)
  if (eqMatch) {
    const [, campo, valor] = eqMatch
    return estado[campo] === valor
  }

  return false
}

function avaliarCondicao(condicao, estado) {
  if (condicao.includes(' OR ')) {
    return condicao.split(' OR ').some((c) => avaliarCondicao(c, estado))
  }
  if (condicao.includes(' AND ')) {
    return condicao.split(' AND ').every((c) => avaliarCondicao(c, estado))
  }
  return avaliarClausula(condicao, estado)
}

// Segue um nó do tipo "regra" (sem UI) até encontrar o próximo nó exibível.
export function resolverDestino(nodeId, estado) {
  let atual = nodeId
  let guarda = 0

  while (TRIAGEM.nos[atual]?.tipo === 'regra' && guarda < 10) {
    const no = TRIAGEM.nos[atual]
    const regraSenao = no.regras.find((r) => 'senao' in r)
    const match = no.regras.find((r) => r.se && avaliarCondicao(r.se, estado))
    atual = (match || regraSenao).destino
    guarda += 1
  }

  return atual
}

function formatarLista(itens) {
  if (!itens || itens.length === 0) return ''
  if (itens.length === 1) return itens[0]
  return `${itens.slice(0, -1).join(', ')} e ${itens[itens.length - 1]}`
}

export function interpolarTexto(texto, estado) {
  if (!texto) return texto
  return texto
    .replace('[alertas_acionados]', formatarLista(estado.alertas_acionados))
    .replace('[motivos_consulta]', formatarLista(estado.motivos_consulta))
}

const ORDEM_CATALOGO = Object.keys(TRIAGEM.catalogo_conteudos)

export function calcularResultado(estado) {
  const pontuados = ORDEM_CATALOGO.map((id) => ({ id, pontos: estado.pontuacao[id] || 0 }))
  pontuados.sort((a, b) => b.pontos - a.pontos || ORDEM_CATALOGO.indexOf(a.id) - ORDEM_CATALOGO.indexOf(b.id))

  const principal = pontuados[0].id
  const complementares = pontuados.slice(1, 3).map((p) => p.id)

  const regra = TRIAGEM.regras_de_oferta.find((r) => {
    if (r.condicao.includes('nenhuma oferta')) return false
    return r.condicao
      .split(' OR ')
      .some((c) => c.trim() === `conteudo_principal == ${principal}`)
  })
  const fallback = TRIAGEM.regras_de_oferta.find((r) => r.condicao.includes('nenhuma oferta'))
  const ofertaId = (regra || fallback).oferta_preferencial

  return { principal, complementares, ofertaId }
}
