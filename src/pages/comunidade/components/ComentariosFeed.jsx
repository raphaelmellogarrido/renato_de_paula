import { useState } from "react";
import { COMENTARIOS } from "../data/mockData";

function iniciais(nome) {
  return nome
    .split(" ")
    .slice(0, 2)
    .map((parte) => parte[0])
    .join("")
    .toUpperCase();
}

// Feed de comentários abaixo do vídeo. Fase 1: comentários mockados +
// novo comentário só entra no estado local (não persiste, não tem backend).
function ComentariosFeed() {
  const [comentarios, setComentarios] = useState(COMENTARIOS);
  const [texto, setTexto] = useState("");

  function handleEnviar(e) {
    e.preventDefault();
    const valor = texto.trim();
    if (!valor) return;
    setComentarios((atual) => [
      { id: Date.now(), autor: "Você", texto: valor, quandoAtras: "agora" },
      ...atual,
    ]);
    setTexto("");
  }

  return (
    <section className="cm-comentarios">
      <h2>Comentários</h2>
      <form className="cm-comentario-form" onSubmit={handleEnviar}>
        <input
          type="text"
          placeholder="Compartilhe como foi a sua prática..."
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
        />
        <button type="submit">Enviar</button>
      </form>
      {comentarios.map((comentario) => (
        <div className="cm-comentario" key={comentario.id}>
          <div className="cm-comentario-avatar">{iniciais(comentario.autor)}</div>
          <div className="cm-comentario-corpo">
            <strong>
              {comentario.autor}
              <span className="cm-comentario-quando">{comentario.quandoAtras}</span>
            </strong>
            <p className="cm-comentario-texto">{comentario.texto}</p>
          </div>
        </div>
      ))}
    </section>
  );
}

export default ComentariosFeed;
