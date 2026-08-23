import BotaoMediteiHoje from "./BotaoMediteiHoje";
import Sequencia from "./Sequencia";
import JornadaProgress from "./JornadaProgress";
import RankingPresenca from "./RankingPresenca";
import { useProgressoAulasRaiz } from "./useProgressoAulasRaiz";

// Botão "Já meditei hoje" + Sequência + Sua Jornada (versão compacta) +
// Ranking de Presença da coluna 2 do dashboard (Ranking trocou de lugar
// com Meditando junto, pedido do cliente — ver
// RankingPresenca.jsx/ColunaEncontros.jsx). Fragment (sem wrapper) de
// propósito: quem controla o empilhamento vertical (gap:24px) é o
// `.cm-coluna-meio` em Dashboard.jsx/ComunidadeApp.css, então os quatro
// widgets ficam diretos dentro daquele flex column, sem outro wrapper no
// meio. O botão ficava isolado no topbar da página inteira; o cliente
// pediu pra trazer ele pra cima do card Sequência, com a mesma largura
// (ver `.cm-btn-meditei` em ComunidadeApp.css). RankingPresenca entra
// depois de JornadaProgress (Sua Jornada) — ocupava o quadrado vazio que
// sobrava ali antes (era o lugar do Meditando junto).
function ColunaProgresso() {
  const progressoPorArquivo = useProgressoAulasRaiz();

  return (
    <>
      <BotaoMediteiHoje />
      <Sequencia />
      <JornadaProgress progressoPorArquivo={progressoPorArquivo} />
      <RankingPresenca />
    </>
  );
}

export default ColunaProgresso;
