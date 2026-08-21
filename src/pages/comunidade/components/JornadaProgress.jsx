import { useMemo } from "react";
import { TITULOS_AULAS_RAIZ } from "../../../lib/titulosAulasRaiz";

const TOTAL_AULAS = Object.keys(TITULOS_AULAS_RAIZ).length; // 49
const TOTAL_DIAS = 16; // Dia 0 a Dia 15

// Agrupa TITULOS_AULAS_RAIZ (chaves "diaN.M.mp4") por número do dia — uma
// vez, no import. Assim o card sabe quantos vídeos cada dia tem sem
// depender do catálogo vindo da API (que só chega depois de um fetch).
const AULAS_POR_DIA = Array.from({ length: TOTAL_DIAS }, () => []);
for (const arquivo of Object.keys(TITULOS_AULAS_RAIZ)) {
  const dia = Number(arquivo.match(/^dia(\d+)\./)?.[1]);
  if (AULAS_POR_DIA[dia]) AULAS_POR_DIA[dia].push(arquivo);
}

const RAIO_ANEL = 54;
const CIRCUNFERENCIA_ANEL = 2 * Math.PI * RAIO_ANEL;

// Funções puras fora do componente de propósito: mutações locais (soma,
// contador de sequência) ficam fora do corpo de render/useMemo, que o
// eslint-plugin-react-hooks (regras de compat com o React Compiler) não
// deixa reatribuir variável nenhuma.
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

// Sequência: dias consecutivos 100% concluídos a partir do Dia 0.
function contarSequencia(statusPorDia) {
  let sequencia = 0;
  for (const dia of statusPorDia) {
    if (dia.total > 0 && dia.concluidas === dia.total) sequencia++;
    else break;
  }
  return sequencia;
}

/**
 * Card "Sua Jornada" da sidebar de /comunidade/aulas-raiz: anel de
 * progresso circular (sobre o total fixo de 49 aulas) + trilha dos 16
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
  const sequencia = useMemo(() => contarSequencia(statusPorDia), [statusPorDia]);

  const percentual = TOTAL_AULAS ? Math.round((totalAssistidos / TOTAL_AULAS) * 100) : 0;
  const jornadaCompleta = totalAssistidos >= TOTAL_AULAS;
  const dashoffset = CIRCUNFERENCIA_ANEL * (1 - Math.min(percentual, 100) / 100);

  const restantes = TOTAL_AULAS - totalAssistidos;
  let mensagem;
  if (jornadaCompleta) {
    mensagem = "Jornada completa! Bem-vindo ao Clube Presença 🏆";
  } else if (totalAssistidos === 0) {
    mensagem = "Sua jornada começa agora 🧘";
  } else if (percentual < 50) {
    mensagem = `Faltam ${restantes} aula${restantes === 1 ? "" : "s"} pra sua transformação`;
  } else {
    mensagem = "Você está na metade! Continue firme 🔥";
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
        <h2>Sua Jornada</h2>
        {sequencia > 0 && !jornadaCompleta && (
          <span className="cm-jornada-streak">
            🔥 {sequencia} dia{sequencia === 1 ? "" : "s"} seguido{sequencia === 1 ? "" : "s"}
          </span>
        )}
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

      <p className={`cm-jornada-mensagem ${jornadaCompleta ? "is-completa" : ""}`}>
        {!jornadaCompleta && "🪷 "}
        {mensagem}
      </p>
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
