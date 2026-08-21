// Barra do topo do Dashboard: 3 elementos lado a lado (busca | switch |
// botão) — preenche a área "topbar" do grid principal por inteiro, em vez
// de deixar as pontas vazias com só o switch centralizado.
function ComunidadeTopBar({ view, onViewChange, busca, onBuscaChange }) {
  return (
    <div className="cm-topbar-nova cm-grid-topbar">
      <input type="search" className="cm-busca-input" placeholder="Buscar meditações, temas, emoções..." value={busca} onChange={(e) => onBuscaChange(e.target.value)} />

      <div className="cm-switch" role="tablist" aria-label="Alternar entre curso e comunidade">
        <button type="button" role="tab" aria-selected={view === "curso"} className={`cm-switch-btn ${view === "curso" ? "is-ativo" : ""}`} onClick={() => onViewChange("curso")}>
          Curso Meditação Raiz
        </button>
        <button type="button" role="tab" aria-selected={view === "comunidade"} className={`cm-switch-btn ${view === "comunidade" ? "is-ativo" : ""}`} onClick={() => onViewChange("comunidade")}>
          Clube Presença
        </button>
      </div>

      <button type="button" className="cm-btn-preto" title="Em breve">
        Meditei hoje
      </button>
    </div>
  );
}

export default ComunidadeTopBar;
