import Sequencia from "./Sequencia";
import JornadaProgress from "./JornadaProgress";
import { useProgressoAulasRaiz } from "./useProgressoAulasRaiz";

// Sequência (linha 1) + Sua Jornada (linha 2, versão compacta) da coluna 3
// do dashboard. Fragment (sem wrapper) de propósito: cada widget precisa
// cair numa linha diferente do grid definido em `.cm-main` (ver
// ComunidadeApp.css), então os dois `.cm-widget` têm que ser filhos
// diretos do grid, não agrupados dentro de um `<aside>`.
function ColunaProgresso() {
  const progressoPorArquivo = useProgressoAulasRaiz();

  return (
    <>
      <Sequencia />
      <JornadaProgress progressoPorArquivo={progressoPorArquivo} />
    </>
  );
}

export default ColunaProgresso;
