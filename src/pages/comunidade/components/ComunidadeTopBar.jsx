import { Check } from "lucide-react";
import useMeditacaoHoje from "./useMeditacaoHoje";

// Barra do topo do Dashboard: switch (Curso/Comunidade) na ponta esquerda,
// botão "Meditei hoje" na ponta direita, com respiro vazio no meio (busca
// removida — sem filtro de texto na Biblioteca por enquanto).
function ComunidadeTopBar({ view, onViewChange }) {
  const { marcado, marcarHoje } = useMeditacaoHoje();

  return (
    <div className="cm-topbar-nova cm-grid-topbar">
      <div className="cm-switch" role="tablist" aria-label="Alternar entre curso e comunidade">
        <button type="button" role="tab" aria-selected={view === "curso"} className={`cm-switch-btn ${view === "curso" ? "is-ativo" : ""}`} onClick={() => onViewChange("curso")}>
          Curso Meditação Raiz
        </button>
        <button type="button" role="tab" aria-selected={view === "comunidade"} className={`cm-switch-btn ${view === "comunidade" ? "is-ativo" : ""}`} onClick={() => onViewChange("comunidade")}>
          Comunidade
        </button>
      </div>

      <button type="button" className={`cm-btn-preto ${marcado ? "is-marcado" : ""}`} onClick={marcarHoje} disabled={marcado} aria-pressed={marcado}>
        {marcado ? (
          <>
            <Check size={14} strokeWidth={3} /> Já meditei hoje
          </>
        ) : (
          "Meditei hoje"
        )}
      </button>
    </div>
  );
}

export default ComunidadeTopBar;
