import { Play, Clock } from "lucide-react";

// Card da "Biblioteca de Meditações" (grid com filtro por tema) — usa foto
// real de fundo (Unsplash) em vez do ícone+gradiente do CardAula do curso.
// Estrutura de card branco com borda (foto no topo + rodapé com padding),
// copiada 1:1 da referência.
function CardBiblioteca({ item }) {
  return (
    <button type="button" className="cm-card-biblioteca" title={`Em breve: ${item.titulo}`}>
      <div className="cm-card-biblioteca-capa" style={{ backgroundImage: `url(${item.imagem})` }}>
        <span className="cm-card-aula-tag">{item.tag}</span>
        <span className="cm-card-aula-duracao">
          <Clock size={11} /> {item.duracao}
        </span>
        <span className="cm-card-aula-play">
          <Play size={16} fill="currentColor" />
        </span>
      </div>
      <div className="cm-card-biblioteca-rodape-area">
        <span className="cm-card-biblioteca-titulo">{item.titulo}</span>
        <div className="cm-card-biblioteca-rodape">
          <span className="cm-card-biblioteca-nivel">{item.nivel}</span>
          <span className="cm-card-biblioteca-praticas">{item.praticas} práticas</span>
        </div>
      </div>
    </button>
  );
}

export default CardBiblioteca;
