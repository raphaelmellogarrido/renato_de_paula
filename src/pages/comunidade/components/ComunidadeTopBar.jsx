import { Check } from "lucide-react";
import useMeditacaoHoje from "./useMeditacaoHoje";

// Barra do topo do Dashboard: só o botão "Meditei hoje", alinhado à
// direita (switch Curso/Comunidade removido — produto virou um bundle
// único, sem view alternativa; busca também já tinha sido removida — sem
// filtro de texto na Biblioteca por enquanto).
function ComunidadeTopBar() {
  const { marcado, marcarHoje } = useMeditacaoHoje();

  return (
    <div className="cm-topbar-nova cm-grid-topbar">
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
