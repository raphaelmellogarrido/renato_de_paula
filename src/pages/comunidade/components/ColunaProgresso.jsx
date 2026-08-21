import { Flame, Award, Check } from "lucide-react";
import { SEQUENCIA } from "../data/mockData";
import JornadaProgress from "./JornadaProgress";
import { useProgressoAulasRaiz } from "./useProgressoAulasRaiz";

// Sequência (linha 1) + Sua Jornada (linha 2, versão compacta) da coluna 3
// do dashboard. Fragment (sem wrapper) de propósito: cada widget precisa
// cair numa linha diferente do grid definido em `.cm-main` (ver
// ComunidadeApp.css), então os dois `.cm-widget` têm que ser filhos
// diretos do grid, não agrupados dentro de um `<aside>`.
function ColunaProgresso() {
  const progressoPorArquivo = useProgressoAulasRaiz();

  return (
    <>
      <div className="cm-widget cm-widget-sequencia cm-grid-sequencia">
        <div className="cm-widget-topo">
          <h3>
            <span className="cm-icone-badge cm-icone-fogo">
              <Flame size={15} />
            </span>
            Sequência
          </h3>
          <span className="cm-pill-suave">Esta semana</span>
        </div>
        <div className="cm-sequencia-numero">
          {SEQUENCIA.diasSeguidos} <span>dias seguidos</span>
        </div>
        <div className="cm-sequencia-dias">
          {SEQUENCIA.semana.map((dia, i) => (
            <div className="cm-sequencia-dia" key={i}>
              <span className={`cm-sequencia-bolinha ${dia.concluido ? "is-concluido" : ""}`}>
                {dia.concluido && <Check size={13} strokeWidth={3} />}
              </span>
              <span className="cm-sequencia-label">{dia.label}</span>
            </div>
          ))}
        </div>
        <div className="cm-sequencia-badge">
          <Award size={14} />
          Você está entre os {SEQUENCIA.percentualConsistencia}% mais consistentes
        </div>
      </div>

      <JornadaProgress progressoPorArquivo={progressoPorArquivo} />
    </>
  );
}

export default ColunaProgresso;
