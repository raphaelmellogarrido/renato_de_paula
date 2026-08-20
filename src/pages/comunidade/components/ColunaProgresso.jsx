import { Flame, Award, Check } from "lucide-react";
import { SEQUENCIA, PROGRESSO_SEMANA } from "../data/mockData";

// Sequência (linha 1) + Meu Progresso (linha 2) da coluna 3 do dashboard.
// Fragment (sem wrapper) de propósito: cada widget precisa cair numa linha
// diferente do grid definido em `.cm-main` (ver ComunidadeApp.css), então
// os dois `.cm-widget` têm que ser filhos diretos do grid, não agrupados
// dentro de um `<aside>`.
function ColunaProgresso() {
  const percentualSemana = Math.round((PROGRESSO_SEMANA.minutosFeitos / PROGRESSO_SEMANA.metaMinutos) * 100);

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

      <div className="cm-widget cm-widget-progresso cm-grid-progresso">
        <span className="cm-widget-progresso-eyebrow">Meu Progresso</span>
        <p>{PROGRESSO_SEMANA.resumo}</p>
        <div className="cm-progress-track cm-progress-track-escuro">
          <div className="cm-progress-fill cm-progress-fill-claro" style={{ width: `${percentualSemana}%` }} />
        </div>
        <span className="cm-widget-progresso-meta">
          Meta: {Math.round(PROGRESSO_SEMANA.metaMinutos / 60)}h · Faltam{" "}
          {Math.max(0, Math.round((PROGRESSO_SEMANA.metaMinutos - PROGRESSO_SEMANA.minutosFeitos) / 60))}h
          {Math.max(0, (PROGRESSO_SEMANA.metaMinutos - PROGRESSO_SEMANA.minutosFeitos) % 60)
            ? Math.max(0, (PROGRESSO_SEMANA.metaMinutos - PROGRESSO_SEMANA.minutosFeitos) % 60) + "min"
            : ""}
        </span>
      </div>
    </>
  );
}

export default ColunaProgresso;
