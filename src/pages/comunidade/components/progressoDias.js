// Bloqueio por DIA (não por vídeo) de AulasMeditacaoRaiz.jsx: cada dia libera
// inteiro (3 vídeos em ordem) de uma vez, Dia 0 -> Dia 1 pode ser feito no
// mesmo dia (exceção pedida pelo cliente), e a partir daí só libera um dia
// novo por dia de calendário (data local, vira à meia-noite). Dias já
// completados continuam sempre revisitáveis, em qualquer ordem.
//
// Pseudocódigo `podeAssistir` fornecido pelo cliente, implementado aqui
// EXATAMENTE como pedido ("Não criar outra lógica, usar EXATAMENTE essa"),
// só adaptado ao formato real dos dados deste projeto (ver comentários
// inline em cada desvio).

// Mesmo par de helpers que useSequenciaMeditacao.js já usa: data LOCAL,
// nunca UTC — new Date("YYYY-MM-DD") interpreta como UTC meia-noite, o que
// vira o dia errado pra quem está num fuso negativo (Brasil).
export function isoLocal(data) {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  const dia = String(data.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
}

export function dataLocalDeIso(iso) {
  const [ano, mes, dia] = iso.split("-").map(Number);
  return new Date(ano, mes - 1, dia);
}

function hoje() {
  return isoLocal(new Date());
}

// `completado_em` vem do backend como "YYYY-MM-DD HH:MM:SS" (ou null) —
// já nasce comparável como string, sem precisar de Date() pra achar o maior.
function dataDoVideo(progressoPorArquivo, arquivo) {
  return progressoPorArquivo[arquivo]?.completado_em || null;
}

// Dia "completo" = TODOS os vídeos do dia (contagem REAL do catálogo, não
// hardcoded 3 — resolve sozinho o caso do Dia 1, que só tem 3 vídeos
// visíveis apesar do dia1.3.mp4 estar oculto, ver ARQUIVOS_OCULTOS_AULAS_RAIZ)
// estão com assistida=true.
function diaEstaCompleto(diaObj, progressoPorArquivo) {
  if (!diaObj?.videos?.length) return false;
  return diaObj.videos.every((v) => !!progressoPorArquivo[v.arquivo]?.assistida);
}

// Maior dia 100% concluído a partir do Dia 0, ou -1 se nem o Dia 0 foi
// concluído ("Novo aluno: max = -1" do exemplo do cliente). `dias` precisa
// já vir ordenado por número do dia (é como /api/aulas-raiz devolve).
export function calcularMaxDiaCompleto(dias, progressoPorArquivo) {
  let max = -1;
  for (const diaObj of dias) {
    if (diaEstaCompleto(diaObj, progressoPorArquivo)) {
      max = diaObj.dia;
    } else {
      break;
    }
  }
  return max;
}

// Data (YYYY-MM-DD local) em que o dia `maxDiaCompleto` foi concluído —
// maior completado_em entre os vídeos desse dia. null se ainda não há
// nenhum dia completo.
export function calcularUltimoDiaCompletadoData(dias, progressoPorArquivo, maxDiaCompleto) {
  if (maxDiaCompleto < 0) return null;
  const diaObj = dias.find((d) => d.dia === maxDiaCompleto);
  if (!diaObj) return null;

  let maiorData = null;
  for (const v of diaObj.videos) {
    const dataCompleta = dataDoVideo(progressoPorArquivo, v.arquivo);
    if (dataCompleta && (!maiorData || dataCompleta > maiorData)) {
      maiorData = dataCompleta;
    }
  }
  // completado_em é datetime completo ("2026-08-22 11:00:00") — só a parte
  // da data importa pra comparar com hoje() (isoLocal, "YYYY-MM-DD").
  return maiorData ? maiorData.slice(0, 10) : null;
}

// Vídeo anterior (mesmo dia, índice-1 na ordem real do catálogo — índice de
// POSIÇÃO no array já ordenado, não o número do nome do arquivo) já foi
// assistido?
function videoAnteriorAssistido(dias, progressoPorArquivo, diaAlvo, videoIndexAlvo) {
  if (videoIndexAlvo <= 0) return true;
  const diaObj = dias.find((d) => d.dia === diaAlvo);
  const anterior = diaObj?.videos?.[videoIndexAlvo - 1];
  return anterior ? !!progressoPorArquivo[anterior.arquivo]?.assistida : false;
}

/**
 * podeAssistir(diaAlvo, videoIndexAlvo) — regras exatas pedidas pelo
 * cliente. Retorna { liberado, motivo }, motivo só é usado quando
 * liberado===false, pra escolher o toast certo em AulasMeditacaoRaiz.jsx:
 *  - "ordem"      -> "Assista o vídeo anterior para liberar."
 *  - "calendario" -> "Você já completou seu dia hoje! Volte amanhã..."
 *  - "sequencia"  -> tentando pular 2+ dias (não deveria ser alcançável
 *                    pela UI normal, mas cobre navegação manual).
 */
export function podeAssistir(diaAlvo, videoIndexAlvo, { dias, progressoPorArquivo, maxDiaCompleto, ultimoDiaCompletadoData }) {
  // DIA 0 SEMPRE LIVRE — mas em ordem dentro do próprio dia.
  if (diaAlvo === 0) {
    if (videoIndexAlvo === 0) return { liberado: true, motivo: null };
    const ok = videoAnteriorAssistido(dias, progressoPorArquivo, diaAlvo, videoIndexAlvo);
    return ok ? { liberado: true, motivo: null } : { liberado: false, motivo: "ordem" };
  }

  // REASSISTIR DIAS JÁ COMPLETADOS: sempre pode, qualquer ordem.
  if (diaAlvo <= maxDiaCompleto) {
    return { liberado: true, motivo: null };
  }

  // TENTANDO AVANÇAR 1 DIA (o próximo depois do último completo).
  if (diaAlvo === maxDiaCompleto + 1) {
    // EXCEÇÃO DIA 0 -> DIA 1: libera mesmo no mesmo dia que terminou o Dia 0.
    if (maxDiaCompleto === 0) {
      if (videoIndexAlvo === 0) return { liberado: true, motivo: null };
      const ok = videoAnteriorAssistido(dias, progressoPorArquivo, diaAlvo, videoIndexAlvo);
      return ok ? { liberado: true, motivo: null } : { liberado: false, motivo: "ordem" };
    }

    // REGRA GERAL: 1 dia novo por dia de calendário. Só libera se o último
    // dia completado foi ANTES de hoje (comparação de DATE, não datetime).
    if (maxDiaCompleto >= 1) {
      if (ultimoDiaCompletadoData && ultimoDiaCompletadoData < hoje()) {
        if (videoIndexAlvo === 0) return { liberado: true, motivo: null };
        const ok = videoAnteriorAssistido(dias, progressoPorArquivo, diaAlvo, videoIndexAlvo);
        return ok ? { liberado: true, motivo: null } : { liberado: false, motivo: "ordem" };
      }
      return { liberado: false, motivo: "calendario" };
    }

    // maxDiaCompleto === -1 não deveria cair aqui (diaAlvo seria 0, já
    // tratado acima) — defensivo.
    return { liberado: false, motivo: "sequencia" };
  }

  // TENTANDO PULAR 2 DIAS OU MAIS.
  return { liberado: false, motivo: "sequencia" };
}
