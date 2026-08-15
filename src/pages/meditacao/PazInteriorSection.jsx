// Hero 4 — ponte entre a história pessoal e o restante da página: fundo
// verde escuro, frase de efeito e os três "pilares" que a gente já aceita
// como treináveis (força, foco, técnica) contra o que o Meditação Raiz
// propõe treinar também (a relação com a própria mente).
const PILARES = ["Força se treina", "Foco se treina", "Técnica se treina"];

function PazInteriorSection() {
  return (
    <section className="section mr-section" id="paz-interior">
      <div className="container">
        <div className="mr-paz-wrap">
          <div className="mr-eyebrow">Da minha história para a sua</div>
          <h2>Paz interior se pratica.</h2>
          <div className="mr-paz-pills">
            {PILARES.map((pilar) => (
              <span key={pilar}>{pilar.toUpperCase()}</span>
            ))}
          </div>
          <p>
            A gente aceita que força, foco e técnica podem ser treinados. Mas muitas vezes trata calma, equilíbrio e
            paz interior como se fossem traços fixos de personalidade. <strong>O Meditação Raiz parte de outra ideia:
            a relação com a própria mente também pode ser praticada.</strong>
          </p>
        </div>
      </div>
    </section>
  );
}

export default PazInteriorSection;
