import { useMemo } from "react";
import { TITULOS_AULAS_RAIZ } from "../../../lib/titulosAulasRaiz";
import { calcularMaxDiaCompleto, calcularUltimoDiaCompletadoData, isoLocal } from "./progressoDias";

const TOTAL_AULAS = Object.keys(TITULOS_AULAS_RAIZ).length; // 48 (dia1.3.mp4 removido, ver ARQUIVOS_OCULTOS_AULAS_RAIZ)
const TOTAL_DIAS = 16; // Dia 0 a Dia 15

// Agrupa TITULOS_AULAS_RAIZ (chaves "diaN.M.mp4") por número do dia — uma
// vez, no import. Assim o card sabe quantos vídeos cada dia tem sem
// depender do catálogo vindo da API (que só chega depois de um fetch).
const AULAS_POR_DIA = Array.from({ length: TOTAL_DIAS }, () => []);
for (const arquivo of Object.keys(TITULOS_AULAS_RAIZ)) {
  const dia = Number(arquivo.match(/^dia(\d+)\./)?.[1]);
  if (AULAS_POR_DIA[dia]) AULAS_POR_DIA[dia].push(arquivo);
}

// Mesmo formato { dia, videos: [{arquivo}] } que progressoDias.js espera —
// permite reusar EXATAMENTE o cálculo de bloqueio por calendário que já
// trava os vídeos em AulasMeditacaoRaiz.jsx, em vez de duplicar a regra
// aqui com um cálculo próprio que poderia divergir.
const DIAS_CATALOGO = AULAS_POR_DIA.map((arquivos, dia) => ({
  dia,
  videos: arquivos.map((arquivo) => ({ arquivo })),
}));

const RAIO_ANEL = 54;
const CIRCUNFERENCIA_ANEL = 2 * Math.PI * RAIO_ANEL;

const ICONE_TITULO = "/icons/meditation_icon_cutout.png";
const ICONE_BORA_AULA = "/icons/running_icon_cutout.png";
const ICONE_DIA_CONCLUIDO = "/icons/check_clock_cutout.png";
const ICONE_CURSO_CONCLUIDO = "/icons/trophy_lotus_cutout.png";

// Badge do canto superior direito do card: 3 estados, nesta ordem de
// prioridade.
//  1. curso-concluido — todas as 48 aulas assistidas.
//  2. dia-concluido — terminou o dia mais recente HOJE e está esperando a
//     virada de calendário pro próximo dia liberar (mesma regra de
//     "calendario" do podeAssistir em progressoDias.js). maxDiaCompleto===0
//     fica de fora de propósito: é a exceção Dia0->Dia1, que já libera no
//     mesmo dia, então não faz sentido mostrar "bloqueado" aqui.
//  3. bora-aula — default: ainda tem vídeo do dia atual pra assistir.
function getStatusJornada({ jornadaCompleta, maxDiaCompleto, ultimoDiaCompletadoData }) {
  if (jornadaCompleta) {
    return { estado: "curso-concluido", texto: "Curso concluído", icone: ICONE_CURSO_CONCLUIDO };
  }
  const bloqueadoAteAmanha = maxDiaCompleto >= 1 && ultimoDiaCompletadoData === isoLocal(new Date());
  if (bloqueadoAteAmanha) {
    return { estado: "dia-concluido", texto: "Dia de curso concluído", icone: ICONE_DIA_CONCLUIDO };
  }
  return { estado: "bora-aula", texto: "Bora pra aula?", icone: ICONE_BORA_AULA };
}

// Função pura fora do componente de propósito: a mutação local (soma) fica
// fora do corpo de render/useMemo, que o eslint-plugin-react-hooks (regras
// de compat com o React Compiler) não deixa reatribuir variável nenhuma.
function calcularStatusPorDia(progressoPorArquivo) {
  const status = AULAS_POR_DIA.map((arquivos, dia) => {
    const concluidas = arquivos.filter((a) => progressoPorArquivo[a]?.assistida).length;
    return { dia, total: arquivos.length, concluidas };
  });
  const totalAssistidos = status.reduce((soma, d) => soma + d.concluidas, 0);
  // Primeiro dia ainda não 100% concluído = "dia atual" da trilha.
  const indiceAtual = status.findIndex((d) => d.concluidas < d.total);
  return {
    statusPorDia: status,
    totalAssistidos,
    diaAtualIndex: indiceAtual === -1 ? TOTAL_DIAS - 1 : indiceAtual,
  };
}

/**
 * Card "Sua Jornada" da sidebar de /comunidade/aulas-raiz: anel de
 * progresso circular (sobre o total fixo de 48 aulas) + trilha dos 16
 * dias (Dia 0 a Dia 15) + mensagem motivacional dinâmica.
 *
 * Não busca nada sozinho — recebe `progressoPorArquivo` no mesmo formato
 * já usado em AulasMeditacaoRaiz ({ [arquivo]: { assistida, progresso } }),
 * pra continuar valendo a mesma fonte de verdade (localStorage + PHP
 * externo) que já alimenta a lista de vídeos do dia.
 *
 * `compacto`: versão mini que ocupa o lugar do antigo card "Meu Progresso"
 * no dashboard — mesmo cálculo de progresso, só troca o card grande
 * (anel + trilha de 16 dias) por um anel pequeno ao lado do texto, do
 * tamanho de um `.cm-widget` comum, pra não desalinhar a grade do
 * dashboard com o "Desafio da Semana" ao lado.
 */
export default function JornadaProgress({ progressoPorArquivo = {}, compacto = false }) {
  const { totalAssistidos, statusPorDia, diaAtualIndex } = useMemo(
    () => calcularStatusPorDia(progressoPorArquivo),
    [progressoPorArquivo],
  );

  const percentual = TOTAL_AULAS ? Math.round((totalAssistidos / TOTAL_AULAS) * 100) : 0;
  const jornadaCompleta = totalAssistidos >= TOTAL_AULAS;
  const dashoffset = CIRCUNFERENCIA_ANEL * (1 - Math.min(percentual, 100) / 100);

  // Mesmas bases do bloqueio por dia/calendário de AulasMeditacaoRaiz.jsx
  // (ver progressoDias.js), reaproveitadas aqui só pra escolher o badge.
  const maxDiaCompleto = useMemo(
    () => calcularMaxDiaCompleto(DIAS_CATALOGO, progressoPorArquivo),
    [progressoPorArquivo],
  );
  const ultimoDiaCompletadoData = useMemo(
    () => calcularUltimoDiaCompletadoData(DIAS_CATALOGO, progressoPorArquivo, maxDiaCompleto),
    [progressoPorArquivo, maxDiaCompleto],
  );
  const statusJornada = useMemo(
    () => getStatusJornada({ jornadaCompleta, maxDiaCompleto, ultimoDiaCompletadoData }),
    [jornadaCompleta, maxDiaCompleto, ultimoDiaCompletadoData],
  );

  const restantes = TOTAL_AULAS - totalAssistidos;
  let mensagem;
  if (statusJornada.estado === "curso-concluido") {
    mensagem = "Você completou sua transformação! 🪷";
  } else if (statusJornada.estado === "dia-concluido") {
    mensagem = "Próximo dia libera à meia-noite ✨";
  } else if (totalAssistidos === 0) {
    mensagem = "🪷 Sua jornada começa agora";
  } else if (percentual < 50) {
    mensagem = `🪷 Faltam ${restantes} aula${restantes === 1 ? "" : "s"} pra sua transformação`;
  } else {
    // Sem emoji de fogo aqui de propósito — pedido do cliente, esse card só
    // usa os ícones PNG fornecidos.
    mensagem = "🪷 Você está na metade! Continue firme";
  }

  if (compacto) {
    return (
      <div className="cm-widget cm-grid-progresso cm-jornada-compacta">
        <h3>Sua Jornada</h3>
        <div className="cm-jornada-compacta-corpo">
          <div className="cm-jornada-compacta-anel-wrap">
            <svg className="cm-jornada-anel" viewBox="0 0 120 120">
              <defs>
                <linearGradient id="cm-jornada-gradiente-compacta" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#9b7fc7" />
                  <stop offset="100%" stopColor="#e0b978" />
                </linearGradient>
              </defs>
              <circle className="cm-jornada-anel-trilho" cx="60" cy="60" r={RAIO_ANEL} />
              <circle
                className="cm-jornada-anel-progresso cm-jornada-anel-progresso--compacta"
                cx="60"
                cy="60"
                r={RAIO_ANEL}
                strokeDasharray={CIRCUNFERENCIA_ANEL}
                strokeDashoffset={dashoffset}
              />
            </svg>
            <span className="cm-jornada-compacta-anel-percentual">{percentual}%</span>
          </div>
          <div className="cm-jornada-compacta-texto">
            <strong>
              {totalAssistidos}/{TOTAL_AULAS} aulas
            </strong>
            <span>{mensagem}</span>
          </div>
        </div>

        <div className="cm-jornada-compacta-trilha" role="list">
          {statusPorDia.map(({ dia, total, concluidas }) => {
            const completo = total > 0 && concluidas === total;
            const atual = dia === diaAtualIndex && !completo;
            const bloqueado = !completo && !atual && dia > diaAtualIndex;
            const classe = completo ? "is-completo" : atual ? "is-atual" : bloqueado ? "is-bloqueado" : "";
            return (
              <span
                key={dia}
                role="listitem"
                className={`cm-jornada-bolinha cm-jornada-bolinha--compacta ${classe}`}
                title={`Dia ${dia} - ${concluidas}/${total} concluídas`}
              >
                {completo ? "✓" : dia}
              </span>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="cm-jornada cm-grid-progresso">
      <div className="cm-jornada-topo">
        <h2 className="cm-jornada-titulo">
          <img src={ICONE_TITULO} alt="" className="cm-jornada-titulo-icone" />
          <span>Sua Jornada</span>
        </h2>
        <span className={`cm-jornada-badge cm-jornada-badge--${statusJornada.estado}`}>
          <img src={statusJornada.icone} alt="" className="cm-jornada-badge-icone" />
          {statusJornada.texto}
        </span>
      </div>

      <div className="cm-jornada-anel-wrap">
        <svg className="cm-jornada-anel" viewBox="0 0 120 120">
          <defs>
            <linearGradient id="cm-jornada-gradiente" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#9b7fc7" />
              <stop offset="100%" stopColor="#e0b978" />
            </linearGradient>
          </defs>
          <circle className="cm-jornada-anel-trilho" cx="60" cy="60" r={RAIO_ANEL} />
          <circle
            className="cm-jornada-anel-progresso"
            cx="60"
            cy="60"
            r={RAIO_ANEL}
            strokeDasharray={CIRCUNFERENCIA_ANEL}
            strokeDashoffset={dashoffset}
          />
        </svg>
        <div className="cm-jornada-anel-centro">
          <span className="cm-jornada-anel-numero">
            {totalAssistidos}/{TOTAL_AULAS}
          </span>
          <span className="cm-jornada-anel-legenda">{percentual}% da jornada</span>
        </div>
        {jornadaCompleta && <ConfeteJornada />}
      </div>

      <div className="cm-jornada-trilha" role="list">
        {statusPorDia.map(({ dia, total, concluidas }) => {
          const completo = total > 0 && concluidas === total;
          const atual = dia === diaAtualIndex && !completo;
          const bloqueado = !completo && !atual && dia > diaAtualIndex;
          const classe = completo ? "is-completo" : atual ? "is-atual" : bloqueado ? "is-bloqueado" : "";
          return (
            <span
              key={dia}
              role="listitem"
              className={`cm-jornada-bolinha ${classe}`}
              title={`Dia ${dia} - ${concluidas}/${total} concluídas`}
            >
              {completo ? "✓" : dia}
            </span>
          );
        })}
      </div>

      <p className={`cm-jornada-mensagem ${jornadaCompleta ? "is-completa" : ""}`}>{mensagem}</p>
    </div>
  );
}

// Confete simples em CSS puro (sem dependência extra) — só aparece com a
// jornada 100% concluída.
function ConfeteJornada() {
  const pecas = Array.from({ length: 14 });
  return (
    <div className="cm-jornada-confete" aria-hidden="true">
      {pecas.map((_, i) => (
        <span key={i} className="cm-jornada-confete-peca" style={{ "--i": i }} />
      ))}
    </div>
  );
}
