import BotaoMediteiHoje from "./BotaoMediteiHoje";
import Sequencia from "./Sequencia";
import JornadaProgress from "./JornadaProgress";
import { useProgressoAulasRaiz } from "./useProgressoAulasRaiz";

// Botão "Já meditei hoje" + Sequência + Sua Jornada (versão compacta) da
// coluna 2 do dashboard. Fragment (sem wrapper) de propósito: quem
// controla o empilhamento vertical (gap:24px) é o `.cm-coluna-meio` em
// Dashboard.jsx/ComunidadeApp.css, então os três widgets ficam diretos
// dentro daquele flex column, sem outro wrapper no meio. O botão ficava
// isolado no topbar da página inteira; o cliente pediu pra trazer ele pra
// cima do card Sequência, com a mesma largura (ver `.cm-btn-meditei` em
// ComunidadeApp.css).
function ColunaProgresso() {
  const progressoPorArquivo = useProgressoAulasRaiz();

  return (
    <>
      <BotaoMediteiHoje />
      <Sequencia />
      <JornadaProgress progressoPorArquivo={progressoPorArquivo} />
    </>
  );
}

export default ColunaProgresso;
