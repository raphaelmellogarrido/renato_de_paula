import { useState } from "react";
import { temAcessoComunidade } from "./featureFlags";
import useComunidadeAuth from "./components/useComunidadeAuth";
import ColunaProgresso from "./components/ColunaProgresso";
import ColunaEncontros from "./components/ColunaEncontros";
import ComunidadeTopBar from "./components/ComunidadeTopBar";
import FeedComunidade from "./components/FeedComunidade";
import DificuldadeDoDia from "./components/DificuldadeDoDia";

// Dashboard: grid único de 3 colunas (a 4ª, sidebar esquerda, é resolvida
// por fora em ComunidadeLayout) usando `grid-template-areas` nomeadas (ver
// ComunidadeApp.css) — cada card ocupa a área com seu nome, não uma célula
// linha/coluna numérica solta. Hero (coluna 1) agora cobre as 3 linhas
// inteiras onde Sequência+Progresso e Próximo+Desafio+Ranking ficam
// empilhados nas colunas 2 e 3 (Biblioteca de Meditações foi removida a
// pedido do cliente — a área "biblioteca" do grid não existe mais, ver
// ComunidadeApp.css). Sem accordion por Dia nesta versão (removido a
// pedido do cliente); DIAS continua existindo só para abrir a "meditação
// de hoje" e alimentar /comunidade/aula/:id.
function Dashboard() {
  const { session } = useComunidadeAuth();
  const [view, setView] = useState("curso");

  return (
    <div className="cm-main">
      <ComunidadeTopBar view={view} onViewChange={setView} />

      {view === "curso" ? (
        <div className="cm-grid-hero">
          <DificuldadeDoDia />
        </div>
      ) : (
        <div className="cm-grid-feed">
          <FeedComunidade liberado={temAcessoComunidade(session)} souFundador={!!session?.isAlunoCurso} />
        </div>
      )}

      <ColunaProgresso />
      <ColunaEncontros />
    </div>
  );
}

export default Dashboard;
