import { Trophy } from "lucide-react";
import { PROXIMO_ENCONTRO_VIVO, RANKING } from "../data/mockData";
import DesafioSemana from "./DesafioSemana";

// Próximo encontro (linha 1) + Desafio da Semana (linha 2) + Ranking (linha 3)
// da coluna 4 do dashboard. Fragment (sem wrapper) de propósito: cada
// widget cai numa linha diferente do grid definido em `.cm-main` (ver
// ComunidadeApp.css), então os três `.cm-widget` têm que ser filhos
// diretos do grid, não agrupados dentro de um `<aside>`.
function ColunaEncontros() {
  return (
    <>
      <div className="cm-widget cm-encontro-vivo cm-grid-encontro">
        <h3>
          <span className="cm-dot-pulse" aria-hidden="true" /> Próximo encontro ao vivo
        </h3>
        <div className="cm-encontro-caixa">
          <strong className="cm-encontro-titulo">{PROXIMO_ENCONTRO_VIVO.titulo}</strong>
          <span className="cm-encontro-quando">{PROXIMO_ENCONTRO_VIVO.quando}</span>
          <div className="cm-encontro-anfitriao">
            <img src={PROXIMO_ENCONTRO_VIVO.avatar} alt="" />
            <span>{PROXIMO_ENCONTRO_VIVO.anfitriao}</span>
          </div>
        </div>
        <button type="button" className="cm-btn-primary cm-encontro-btn" title="Em breve">
          Reservar minha vaga
        </button>
      </div>

      <DesafioSemana />

      <div className="cm-widget cm-widget-escuro cm-grid-ranking">
        <h3>
          <Trophy size={16} /> Ranking de Presença
        </h3>
        {RANKING.map((item) => (
          <div className={`cm-ranking-item ${item.nome === "Você" ? "is-voce" : ""}`} key={item.posicao}>
            <span className="cm-ranking-esquerda">
              <span className="cm-ranking-pos">#{item.posicao}</span>
              <span className="cm-ranking-nome">{item.nome}</span>
            </span>
            <span className="cm-ranking-dias">{item.diasSeguidos} dias</span>
          </div>
        ))}
      </div>
    </>
  );
}

export default ColunaEncontros;
