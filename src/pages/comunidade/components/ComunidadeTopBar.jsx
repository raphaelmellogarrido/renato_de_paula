import { Check } from "lucide-react";
import useMeditacaoHoje from "./useMeditacaoHoje";

// Barra do topo do Dashboard: 3 elementos lado a lado (busca | switch |
// botão) — preenche a área "topbar" do grid principal por inteiro, em vez
// de deixar as pontas vazias com só o switch centralizado.
function ComunidadeTopBar({ view, onViewChange, busca, onBuscaChange }) {
  const { marcado, marcarHoje } = useMeditacaoHoje();

  return (
    <div className="cm-topbar-nova cm-grid-topbar">
      <input type="search" className="cm-busca-input" placeholder="Buscar meditações, temas, emoções..." value={busca} onChange={(e) => onBuscaChange(e.target.value)} />

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
