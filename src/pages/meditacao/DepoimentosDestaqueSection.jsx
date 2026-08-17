import DepoimentoDestaque from "./DepoimentoDestaque";

const diandra = "/comentario_diandra.jpg";
const wictor = "/comentario_wictor.jpeg";

// Hero 2 — logo após o vídeo, dois relatos reais em destaque (print da
// conversa + citação grande), um embaixo do outro.
function DepoimentosDestaqueSection() {
  return (
    <section className="section mr-section" id="depoimentos">
      <div className="container mr-quote-stack">
        <div className="container center">
          <h2>Se você pensa que meditação não é pra você...</h2>
        </div>
        <DepoimentoDestaque foto={diandra} nome="Diandra" citacao="Sempre achei que fosse algo meio místico, distante da minha realidade." />
        <DepoimentoDestaque foto={wictor} nome="Wictor" citacao="Tá sendo muito divertido, não tá doendo. Eu sinto que sei o que tô fazendo." reverse />
      </div>
    </section>
  );
}

export default DepoimentosDestaqueSection;
