import { Play, Clock } from "lucide-react";

// Card da "Biblioteca de Meditações" — fotos reais do Dr. Renato (grading
// unificado todo em CSS: warm tint + overlay preto 12%, ver
// `.cm-card-biblioteca-capa` em ComunidadeApp.css). Layout pensado pra não
// parecer curso de plataforma: badges soltos sobre a foto (categoria em
// cima-esquerda, duração embaixo-esquerda em vidro escuro), botão de play
// central em vidro claro, e no rodapé só título + uma linha humana ("12min
// • com Dr. Renato" + frase em itálico) — sem "Iniciante · X mil práticas".
function CardBiblioteca({ item }) {
  return (
    <button type="button" className="cm-card-biblioteca" title={`Em breve: ${item.titulo}`}>
      <div
        className="cm-card-biblioteca-capa"
        style={{ backgroundImage: `url(${item.imagem})`, backgroundPosition: item.posicaoFoto || "center" }}
      >
        <span className="cm-card-biblioteca-categoria">{item.categoria}</span>
        <span className="cm-card-biblioteca-duracao">
          <Clock size={11} /> {item.duracao}
        </span>
        <span className="cm-card-biblioteca-play">
          <Play size={16} fill="currentColor" />
        </span>
      </div>
      <div className="cm-card-biblioteca-rodape-area">
        <span className="cm-card-biblioteca-titulo">{item.titulo}</span>
        <p className="cm-card-biblioteca-subtitulo">
          {item.duracao} • com Dr. Renato
          <br />
          <em>{item.frase}</em>
        </p>
      </div>
    </button>
  );
}

export default CardBiblioteca;
