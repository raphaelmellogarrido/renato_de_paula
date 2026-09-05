import { useEffect } from "react";
import { X } from "lucide-react";

// Lightbox genérico pra ampliar a foto de um post/comentário
// (ComentarioCard.jsx). Fundo preto 80%, foto no tamanho original
// (limitada ao viewport) centralizada, fecha no X, clique fora ou ESC. Sem
// lib externa nem portal — `position: fixed` já escapa do card que o
// renderiza, mesmo padrão sem-Tailwind do resto do projeto (ver
// ComunidadeApp.css).
function ImageLightbox({ src, onClose }) {
  useEffect(() => {
    function aoTeclar(e) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", aoTeclar);
    return () => document.removeEventListener("keydown", aoTeclar);
  }, [onClose]);

  return (
    <div className="cm-lightbox" onClick={onClose}>
      <button type="button" className="cm-lightbox-fechar" aria-label="Fechar" onClick={onClose}>
        <X size={20} />
      </button>
      {/* stopPropagation: clique NA foto não fecha, só clique no fundo/X */}
      <img src={src} alt="" onClick={(e) => e.stopPropagation()} />
    </div>
  );
}

export default ImageLightbox;
