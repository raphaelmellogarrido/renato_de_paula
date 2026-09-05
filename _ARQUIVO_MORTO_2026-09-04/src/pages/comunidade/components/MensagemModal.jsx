import { useState } from "react";
import { X } from "lucide-react";

// Modal "Enviar mensagem para @Nome" (Tarefa 2) — aberto ao clicar no nome
// de um aluno em ComentarioCard.jsx, só visível pra admin/orientador
// (podeEnviarMensagem). Mesmo espírito visual/estrutura de ImageLightbox.jsx
// (overlay fixo + fecha ao clicar fora/Esc), mas com formulário em vez de
// imagem.
//
// Props:
//   destinatario { email, nome } — quem vai receber
//   onEnviar     (texto) => Promise — POST em mensagens/enviar.php, feito
//                pelo componente pai (DificuldadeDoDia.jsx), que já sabe o
//                de_email (admin logado)
//   onClose      () => void
function MensagemModal({ destinatario, onEnviar, onClose }) {
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");

  async function handleEnviar(e) {
    e.preventDefault();
    const valor = texto.trim();
    if (!valor || enviando) return;

    setErro("");
    setEnviando(true);
    try {
      await onEnviar(valor);
      onClose();
    } catch (err) {
      setErro(err.message || "Não foi possível enviar a mensagem.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="cm-mensagem-modal-overlay" onClick={onClose}>
      <div className="cm-mensagem-modal" onClick={(e) => e.stopPropagation()}>
        <div className="cm-mensagem-modal-topo">
          <h3>Enviar mensagem para @{destinatario?.nome}</h3>
          <button type="button" className="cm-mensagem-modal-fechar" aria-label="Fechar" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleEnviar}>
          <textarea
            className="cm-mensagem-modal-textarea"
            placeholder="Escreva sua mensagem..."
            rows={5}
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            maxLength={2000}
            autoFocus
            disabled={enviando}
          />
          {erro && <p className="cm-mensagem-modal-erro">{erro}</p>}
          <div className="cm-mensagem-modal-acoes">
            <button type="button" className="cm-mensagem-modal-cancelar" onClick={onClose} disabled={enviando}>
              Cancelar
            </button>
            <button type="submit" className="cm-mensagem-modal-enviar" disabled={!texto.trim() || enviando}>
              {enviando ? "Enviando..." : "Enviar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default MensagemModal;
