import { temAcessoComunidade } from "./featureFlags";
import useComunidadeAuth from "./components/useComunidadeAuth";
import ColunaProgresso from "./components/ColunaProgresso";
import ColunaEncontros from "./components/ColunaEncontros";
import FeedComunidade from "./components/FeedComunidade";
import DificuldadeDoDia from "./components/DificuldadeDoDia";

// Dashboard: grid único de 3 colunas (a 4ª, sidebar esquerda, é resolvida
// por fora em ComunidadeLayout) — cada coluna é um filho direto do grid
// definido em .cm-main (ver ComunidadeApp.css), empilhando seu próprio
// conteúdo com flexbox por dentro, SEM linha de grid compartilhada entre
// colunas (era isso que quebrava o alinhamento: conteúdo alto de uma
// coluna empurrava pra baixo o conteúdo de outra que "dividia a linha").
// Coluna 1 é sempre a Comunidade agora (o switch Curso/Comunidade foi
// removido — produto virou um bundle único pago, sem view alternativa) —
// "Sua prática hoje" (DificuldadeDoDia) e o feed da Comunidade
// (FeedComunidade) ficam empilhados na coluna 1. Coluna 2
// (.cm-coluna-meio) é o botão "Já meditei hoje" (BotaoMediteiHoje, dentro
// de ColunaProgresso) + Sequência + Sua Jornada + Meditando junto. Coluna 3
// (.cm-coluna-direita) é Próximo encontro + Desafio da semana + Ranking
// (ColunaEncontros). Biblioteca de Meditações foi removida a pedido do
// cliente. Sem accordion por Dia nesta versão (removido a pedido do
// cliente); DIAS continua existindo só para abrir a "meditação de hoje" e
// alimentar /comunidade/aula/:id.
function Dashboard() {
  const { session } = useComunidadeAuth();

  return (
    <div className="cm-main">
      <div className="cm-grid-feed cm-feed-empilhado">
        <DificuldadeDoDia />
        <FeedComunidade liberado={temAcessoComunidade(session)} />
      </div>

      <div className="cm-coluna-meio">
        <ColunaProgresso />
      </div>

      <div className="cm-coluna-direita">
        <ColunaEncontros />
      </div>
    </div>
  );
}

export default Dashboard;
