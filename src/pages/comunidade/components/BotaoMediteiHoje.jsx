import { Check } from "lucide-react";
import useMeditacaoHoje from "./useMeditacaoHoje";

// Botão "Já meditei hoje" — primeiro elemento da coluna 2 do dashboard (ver
// grid-area "botao" em ComunidadeApp.css), sempre acima do card Sequência
// e com a mesma largura dele (360px). Antes ficava isolado no topo da
// página inteira (topbar), mas o cliente pediu pra aproximar do card que
// ele alimenta. Lógica (marcado/loading/toggle via useMeditacaoHoje) não
// mudou, só o lugar e a largura.
function BotaoMediteiHoje() {
  const { marcado, marcarHoje } = useMeditacaoHoje();

  return (
    <button
      type="button"
      className={`cm-btn-meditei cm-grid-botao ${marcado ? "is-marcado" : ""}`}
      onClick={marcarHoje}
      disabled={marcado}
      aria-pressed={marcado}
    >
      {marcado ? (
        <>
          <Check size={14} strokeWidth={3} /> Já meditei hoje
        </>
      ) : (
        "Meditei hoje"
      )}
    </button>
  );
}

export default BotaoMediteiHoje;
