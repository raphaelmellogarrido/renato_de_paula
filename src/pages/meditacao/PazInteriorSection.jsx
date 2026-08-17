const PILARES = ["Força se treina", "Foco se treina", "Técnica se treina"];

function PazInteriorSection() {
  return (
    <section className="section mr-section" id="paz-interior">
      <div className="container">
        <div className="mr-paz-wrap">
          <div className="mr-eyebrow">Da minha história para a sua</div>
          <h2>
            Paz interior é <span id="riscado">um dom</span> <span id="negrito">praticável.</span>
          </h2>
          <div className="mr-paz-pills">
            {PILARES.map((pilar) => (
              <span key={pilar}>{pilar.toUpperCase()}</span>
            ))}
          </div>
          <p>Força se treina malhando, inteligência se afia estudando e equilíbrio emocional?</p>
          <p>É comum considerarmos calma, paz interior e equilíbrio como se fossem traços fixos de personalidade.</p>
          <p>
            Na <strong>meditação raíz</strong> tratamos tudo isso como <strong>habilidades treináveis.</strong>
          </p>
        </div>
      </div>
    </section>
  );
}

export default PazInteriorSection;
