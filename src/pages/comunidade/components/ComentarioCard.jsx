import { Star, Trash2 } from "lucide-react";
import { iniciais, formatarDataBr } from "./comentariosUtils";

// 2 contas fixas com destaque visual + poder de apagar qualquer comentário
// (pedido do cliente). Orientador tem destaque MAIOR que Administrador
// (borda dourada + brilho + estrela) — não é hierarquia de permissão, os
// dois podem excluir igual. Mesma lista que public/api/hotmart/comentarios.php
// usa no DELETE — comparação sempre em minúsculo/trim dos dois lados.
export const EMAIL_ADMINISTRADOR = "raphaelmellogarrido@gmail.com";
export const EMAIL_ORIENTADOR = "rsp.ren@gmail.com";

/**
 * Card de UM comentário — único lugar que decide como um comentário é
 * desenhado (avatar, nome, badge de Administrador/Orientador, data, texto,
 * lixeira). Usado por ComentariosFeed.jsx (mural "geral", em Aulas e no
 * player de vídeo) E DificuldadeDoDia.jsx ("Sua prática hoje", no
 * Dashboard) — antes cada um tinha sua própria cópia do JSX + CSS pra isso,
 * e um ajuste de contraste aplicado só num dos dois ficava pra trás no
 * outro sem ninguém perceber (foi exatamente o que aconteceu). Qualquer
 * mudança de visual de comentário entra AQUI, nunca duplicada de novo.
 *
 * Props:
 *   comentario  { id, email, nome, comentario, created_at }
 *   podeExcluir bool — se true, mostra a lixeira (decidido pelo usuário
 *               LOGADO, não pelo autor do comentário: admin/orientador
 *               apaga o comentário de qualquer um, não só o próprio)
 *   onExcluir   (id) => void
 */
function ComentarioCard({ comentario, podeExcluir, onExcluir }) {
  const emailAutor = (comentario.email || "").toLowerCase().trim();
  const autorOrientador = emailAutor === EMAIL_ORIENTADOR;
  const autorAdmin = !autorOrientador && emailAutor === EMAIL_ADMINISTRADOR;
  const classeDestaque = autorOrientador ? "cm-comentario-card-orientador" : autorAdmin ? "cm-comentario-card-admin" : "";

  return (
    <div className={`cm-comentario-card ${classeDestaque}`}>
      <div className="cm-comentario-card-avatar">{iniciais(comentario.nome)}</div>
      <div className="cm-comentario-card-corpo">
        <div className="cm-comentario-card-topo">
          <span className="cm-comentario-card-nome">{comentario.nome}</span>
          {autorOrientador && (
            <span className="cm-badge-orientador">
              <Star size={11} strokeWidth={3} fill="currentColor" /> Orientador
            </span>
          )}
          {autorAdmin && <span className="cm-badge-admin">Administrador</span>}
          <span className="cm-comentario-card-quando">{formatarDataBr(comentario.created_at)}</span>
        </div>
        <p className="cm-comentario-card-texto">{comentario.comentario}</p>
      </div>
      {podeExcluir && (
        <button
          type="button"
          className="cm-comentario-card-excluir"
          aria-label="Excluir comentário"
          title="Excluir comentário"
          onClick={() => onExcluir(comentario.id)}
        >
          <Trash2 size={15} />
        </button>
      )}
    </div>
  );
}

export default ComentarioCard;
