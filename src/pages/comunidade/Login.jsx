import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MOCK_USUARIOS } from "./data/mockData";
import { salvarSessao } from "./components/useComunidadeAuth";
import "./ComunidadeApp.css";

// Login fake da Fase 1: valida contra a lista mock de usuários, sem
// backend. A validação real (compra Hotmart aprovada) entra na Fase 2.
function Login() {
  const [email, setEmail] = useState("");
  const [erro, setErro] = useState("");
  const navigate = useNavigate();

  function handleSubmit(e) {
    e.preventDefault();
    const usuario = MOCK_USUARIOS.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
    if (!usuario) {
      setErro("Acesso restrito. Verifique se o e-mail usado na compra está correto.");
      return;
    }
    salvarSessao(usuario);
    navigate("/comunidade");
  }

  return (
    <div className="comunidade-app cm-login-page">
      <form className="cm-login-card" onSubmit={handleSubmit}>
        <h1>Meditação Raiz</h1>
        <p className="cm-login-sub">Acesse com o e-mail usado na compra</p>
        <input
          type="email"
          placeholder="seu@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        {erro && <p className="cm-login-erro">{erro}</p>}
        <button type="submit">Entrar</button>
        <p className="cm-login-hint">
          Aluno do curso (Membro Fundador): {MOCK_USUARIOS[0].email}
          <br />
          Sem curso (comunidade bloqueada): {MOCK_USUARIOS[1].email}
        </p>
      </form>
    </div>
  );
}

export default Login;
