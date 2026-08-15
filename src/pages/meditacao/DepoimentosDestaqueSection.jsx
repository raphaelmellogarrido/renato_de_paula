import DepoimentoDestaque from "./DepoimentoDestaque";

const diandra = "/comentario_diandra.jpg";
const wictor = "/comentario_wictor.jpeg";

// Hero 2 — logo após o vídeo, dois relatos reais em destaque (print da
// conversa + citação grande), um embaixo do outro.
function DepoimentosDestaqueSection() {
  return (
    <section className="section mr-section" id="depoimentos">
      <div className="container mr-quote-stack">
        <div className="container">
          <h2>Se você pensa que meditação não serve pra você:</h2>
        </div>
        <DepoimentoDestaque foto={diandra} nome="Diandra" citacao="Sempre achei que fosse algo meio místico, distante da minha realidade." legenda="O ponto de virada foi perceber que a prática podia ser explicada de forma simples e aplicada no cotidiano." />
        <DepoimentoDestaque foto={wictor} nome="Wictor" citacao="Tá sendo muito divertido, não tá doendo. Eu sinto que sei o que tô fazendo." legenda="Depois de manter a rotina, a prática deixou de ser desconfortável e passou a fazer sentido." reverse />
      </div>
    </section>
  );
}

export default DepoimentosDestaqueSection;
