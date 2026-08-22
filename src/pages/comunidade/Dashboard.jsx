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
// linha/coluna numérica solta. Coluna 1 é sempre a Comunidade agora (o
// switch Curso/Comunidade foi removido — produto virou um bundle único
// pago, sem view alternativa) — "Sua prática hoje" (DificuldadeDoDia) e o
// feed da Comunidade (FeedComunidade) ficam empilhados na mesma célula
// "hero", ocupando as 3 linhas inteiras onde Sequência+Progresso e
// Próximo+Desafio+Ranking ficam empilhados nas colunas 2 e 3 (Biblioteca
// de Meditações foi removida a pedido do cliente — a área "biblioteca" do
// grid não existe mais, ver ComunidadeApp.css). Sem accordion por Dia
// nesta versão (removido a pedido do cliente); DIAS continua existindo só
// para abrir a "meditação de hoje" e alimentar /comunidade/aula/:id.
function Dashboard() {
  const { session } = useComunidadeAuth();

  return (
    <div className="cm-main">
      <ComunidadeTopBar />

      <div className="cm-grid-feed cm-feed-empilhado">
        <DificuldadeDoDia />
        <FeedComunidade liberado={temAcessoComunidade(session)} souFundador={!!session} />
      </div>

      <ColunaProgresso />
      <ColunaEncontros />
    </div>
  );
}

export default Dashboard;
