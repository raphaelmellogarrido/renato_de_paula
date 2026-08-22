import BotaoMediteiHoje from "./BotaoMediteiHoje";
import Sequencia from "./Sequencia";
import JornadaProgress from "./JornadaProgress";
import { useProgressoAulasRaiz } from "./useProgressoAulasRaiz";

// Botão "Já meditei hoje" (linha 1) + Sequência (linha 2) + Sua Jornada
// (linha 3, versão compacta) da coluna 2 do dashboard. Fragment (sem
// wrapper) de propósito: cada widget precisa cair numa linha diferente do
// grid definido em `.cm-main` (ver ComunidadeApp.css), então os três
// filhos têm que ficar diretos do grid, não agrupados dentro de um
// `<aside>`. O botão ficava isolado no topbar da página inteira; o
// cliente pediu pra trazer ele pra cima do card Sequência, com a mesma
// largura (ver grid-area "botao" em ComunidadeApp.css).
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
