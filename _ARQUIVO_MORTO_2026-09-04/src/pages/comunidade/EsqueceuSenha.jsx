import { useState } from "react";
import { Link } from "react-router-dom";
import "./Login.css";

const REGEX_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Passo 1 da recuperação de senha: pede o email, chama esqueceu-senha.php.
// A resposta é sempre {ok:true} (mesmo email não cadastrado) — por isso a
// mensagem de sucesso é sempre a mesma, não revela se a conta existe.
export default function EsqueceuSenha() {
  const [email, setEmail] = useState("");
  const [enviado, setEnviado] = useState(false);
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);

  const emailOk = REGEX_EMAIL.test(email.trim());

  async function handleSubmit(e) {
    e.preventDefault();
    if (!emailOk || loading) return;

    setErro("");
    setLoading(true);
    try {
      const res = await fetch("/api/hotmart/esqueceu-senha.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      if (!res.ok) throw new Error("Erro ao processar pedido");
      setEnviado(true);
    } catch (err) {
      setErro(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="cm-login-page">
      <div className="cm-login-card">
        <h1 className="cm-login-title">Esqueceu sua senha?</h1>
        <p className="cm-login-subtitle">Digite o email da sua conta e enviamos um link pra redefinir.</p>

        {erro && <div className="cm-login-alert cm-login-alert-erro">{erro}</div>}
        {enviado && (
          <div className="cm-login-alert cm-login-alert-msg">
            Se esse email existir, enviamos um link de redefinição. Confira também a caixa de spam.
          </div>
        )}

        {!enviado && (
          <form onSubmit={handleSubmit} className="cm-login-form">
            <div className="cm-login-field">
              <label htmlFor="cm-esqueceu-email">Email</label>
              <input
                id="cm-esqueceu-email"
                type="email"
                required
                placeholder="Email da sua conta"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="cm-login-input"
              />
            </div>

            <button type="submit" disabled={!emailOk || loading} className={`cm-login-submit ${emailOk ? "is-ready" : ""}`}>
              {loading ? "Enviando..." : "Enviar link"}
            </button>
          </form>
        )}

        <div className="cm-login-toggle">
          <Link to="/comunidade/login">Voltar para o login</Link>
        </div>
      </div>
    </div>
  );
}
