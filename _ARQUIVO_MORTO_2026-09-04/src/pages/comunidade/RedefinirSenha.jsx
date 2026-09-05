import { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { Eye, EyeOff, Check, ShieldCheck } from "lucide-react";
import { checarRequisitosSenha } from "./components/senhaForte";
import "./Login.css";

// Passo 2 da recuperação de senha: chega aqui pelo link do email
// (?token=...), pede a nova senha 2x e chama redefinir-senha.php. Reaproveita
// a mesma régua de senha forte do cadastro (Login.jsx modo "criar").
export default function RedefinirSenha() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const navigate = useNavigate();

  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [mostrarConfirmar, setMostrarConfirmar] = useState(false);
  const [erro, setErro] = useState("");
  const [ok, setOk] = useState(false);
  const [loading, setLoading] = useState(false);

  const requisitosSenha = checarRequisitosSenha(senha);
  const senhaForte = Object.values(requisitosSenha).every(Boolean);
  const senhasIguais = confirmarSenha.length > 0 && senha === confirmarSenha;
  const podeRedefinir = !!token && senhaForte && senhasIguais;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!podeRedefinir || loading) return;

    setErro("");
    setLoading(true);
    try {
      const res = await fetch("/api/hotmart/redefinir-senha.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, nova_senha: senha }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.erro || "Erro ao redefinir senha");
      setOk(true);
      setTimeout(() => navigate("/comunidade/login"), 2500);
    } catch (err) {
      setErro(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <div className="cm-login-page">
        <div className="cm-login-card">
          <h1 className="cm-login-title">Link inválido</h1>
          <p className="cm-login-subtitle">Esse link de redefinição está incompleto. Peça um novo.</p>
          <div className="cm-login-toggle">
            <Link to="/esqueceu-senha">Pedir novo link</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="cm-login-page">
      <div className="cm-login-card">
        <h1 className="cm-login-title">Criar nova senha</h1>
        <p className="cm-login-subtitle">Escolha uma senha forte para sua conta do Clube.</p>

        {erro && <div className="cm-login-alert cm-login-alert-erro">{erro}</div>}
        {ok && <div className="cm-login-alert cm-login-alert-msg">Senha redefinida! Levando você para o login...</div>}

        {!ok && (
          <form onSubmit={handleSubmit} className="cm-login-form">
            <div className="cm-login-field">
              <label htmlFor="cm-redefinir-senha">Nova senha</label>
              <div className="cm-login-input-wrap">
                <input
                  id="cm-redefinir-senha"
                  type={mostrarSenha ? "text" : "password"}
                  required
                  minLength={8}
                  placeholder="Crie uma senha forte"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  className={`cm-login-input cm-login-input-senha ${senha ? (senhaForte ? "is-strong" : "is-weak") : ""}`}
                />
                <span className="cm-login-icon-right cm-login-icon-group">
                  {senhaForte && (
                    <span className="cm-login-icon-valid" aria-hidden="true">
                      <ShieldCheck size={18} strokeWidth={2.5} />
                    </span>
                  )}
                  <button
                    type="button"
                    className="cm-login-eye-btn"
                    onClick={() => setMostrarSenha((v) => !v)}
                    aria-label={mostrarSenha ? "Esconder senha" : "Mostrar senha"}
                  >
                    {mostrarSenha ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </span>
              </div>
              {senha && (
                <ul className="cm-login-checklist">
                  <ChecklistItem ok={requisitosSenha.comprimento} texto="Mínimo 8 caracteres" />
                  <ChecklistItem ok={requisitosSenha.maiuscula} texto="1 letra maiúscula" />
                  <ChecklistItem ok={requisitosSenha.minuscula} texto="1 letra minúscula" />
                  <ChecklistItem ok={requisitosSenha.numero} texto="1 número" />
                  <ChecklistItem ok={requisitosSenha.especial} texto="1 caractere especial (!@#$%)" />
                </ul>
              )}
            </div>

            <div className="cm-login-field">
              <label htmlFor="cm-redefinir-confirmar">Confirme a nova senha</label>
              <div className="cm-login-input-wrap">
                <input
                  id="cm-redefinir-confirmar"
                  type={mostrarConfirmar ? "text" : "password"}
                  required
                  placeholder="Repita a senha"
                  value={confirmarSenha}
                  onChange={(e) => setConfirmarSenha(e.target.value)}
                  className={`cm-login-input cm-login-input-confirmar ${confirmarSenha ? (senhasIguais ? "is-valid" : "is-invalid") : ""}`}
                />
                <span className="cm-login-icon-right cm-login-icon-group">
                  {senhasIguais && (
                    <span className="cm-login-icon-valid" aria-hidden="true">
                      <Check size={18} strokeWidth={3} />
                    </span>
                  )}
                  <button
                    type="button"
                    className="cm-login-eye-btn"
                    onClick={() => setMostrarConfirmar((v) => !v)}
                    aria-label={mostrarConfirmar ? "Esconder senha" : "Mostrar senha"}
                  >
                    {mostrarConfirmar ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </span>
              </div>
              {confirmarSenha && !senhasIguais && <span className="cm-login-error">Senhas não coincidem</span>}
            </div>

            <button type="submit" disabled={!podeRedefinir || loading} className={`cm-login-submit ${podeRedefinir ? "is-ready" : ""}`}>
              {loading ? "Salvando..." : "Redefinir senha"}
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

function ChecklistItem({ ok, texto }) {
  return (
    <li className={`cm-login-check-item ${ok ? "is-ok" : ""}`}>
      <span className="cm-login-check-dot" aria-hidden="true">
        {ok && <Check size={11} strokeWidth={3} />}
      </span>
      {texto}
    </li>
  );
}
