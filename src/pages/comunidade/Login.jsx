import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function ComunidadeLogin() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [modo, setModo] = useState("login");
  const [msg, setMsg] = useState("");
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setErro("");
    setMsg("");
    setLoading(true);

    const url = modo === "criar" ? "/api/hotmart/register.php" : "/api/hotmart/login.php";

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, senha }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.erro || "Erro ao processar");

      if (modo === "criar") {
        setMsg("Senha criada com sucesso! Agora faca login.");
        setModo("login");
        setSenha("");
        setLoading(false);
        return;
      }

      localStorage.setItem("user_email", data.email);
      localStorage.setItem("comunidade_session", JSON.stringify({ email: data.email, nome: data.nome }));
      navigate("/comunidade");
    } catch (err) {
      setErro(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, background: "#f7f5f2" }}>
      <div style={{ width: "100%", maxWidth: 440, background: "white", padding: 32, borderRadius: 20, boxShadow: "0 10px 30px rgba(0,0,0,0.08)" }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 6, color: "#1a1a1a" }}>{modo === "criar" ? "Crie sua senha do Clube" : "Entrar no Clube Presenca"}</h1>
        <p style={{ fontSize: 14, color: "#6b7280", marginBottom: 24 }}>{modo === "criar" ? "Detectamos sua compra na Hotmart. Crie uma senha so pro Clube." : "Use o email da sua compra na Hotmart."}</p>

        {erro && <div style={{ background: "#fef2f2", color: "#b91c1c", padding: 12, borderRadius: 10, marginBottom: 16, fontSize: 14 }}>{erro}</div>}
        {msg && <div style={{ background: "#f0fdf4", color: "#15803d", padding: 12, borderRadius: 10, marginBottom: 16, fontSize: 14 }}>{msg}</div>}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <input type="email" required placeholder="Email da compra" value={email} onChange={(e) => setEmail(e.target.value)} style={{ width: "100%", border: "1px solid #e5e7eb", padding: "12px 14px", borderRadius: 12, fontSize: 15, outline: "none" }} />
          <input
            type="password"
            required
            placeholder={modo === "criar" ? "Crie uma senha (min 6)" : "Sua senha do Clube"}
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            style={{ width: "100%", border: "1px solid #e5e7eb", padding: "12px 14px", borderRadius: 12, fontSize: 15, outline: "none" }}
          />
          <button type="submit" disabled={loading} style={{ width: "100%", background: "black", color: "white", padding: 13, borderRadius: 12, fontWeight: 600, cursor: "pointer", opacity: loading ? 0.6 : 1 }}>
            {loading ? "Carregando..." : modo === "criar" ? "Criar senha e entrar" : "Entrar"}
          </button>
        </form>

        <div style={{ marginTop: 18, textAlign: "center", fontSize: 14 }}>
          {modo === "login" ? (
            <button onClick={() => setModo("criar")} style={{ textDecoration: "underline", background: "none", border: "none", cursor: "pointer" }}>
              Primeiro acesso? Criar senha
            </button>
          ) : (
            <button onClick={() => setModo("login")} style={{ textDecoration: "underline", background: "none", border: "none", cursor: "pointer" }}>
              Ja tenho senha
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
