import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function ComunidadeLogin() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [modo, setModo] = useState("login"); // login | criar
  const [msg, setMsg] = useState("");
  const [erro, setErro] = useState("");
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setErro("");
    setMsg("");

    const url = modo === "criar" ? "/api/hotmart/register.php" : "/api/hotmart/login.php";

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, senha }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.erro || "Erro ao processar");
      }

      if (modo === "criar") {
        setMsg("Senha criada com sucesso! Agora faca login.");
        setModo("login");
        setSenha("");
        return;
      }

      // login ok - salva sessao
      localStorage.setItem("user_email", data.email);
      localStorage.setItem("comunidade_session", JSON.stringify({ email: data.email, nome: data.nome }));
      navigate("/comunidade");
    } catch (err) {
      setErro(err.message);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[#f7f5f2]">
      <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow">
        <h1 className="text-2xl font-bold mb-2">{modo === "criar" ? "Crie sua senha do Clube" : "Entrar no Clube Presenca"}</h1>
        <p className="text-sm text-gray-600 mb-6">{modo === "criar" ? "Detectamos sua compra na Hotmart. Crie uma senha so pro Clube." : "Use o email da sua compra na Hotmart."}</p>

        {erro && <div className="bg-red-50 text-red-700 p-3 rounded mb-4 text-sm">{erro}</div>}
        {msg && <div className="bg-green-50 text-green-700 p-3 rounded mb-4 text-sm">{msg}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="email" required placeholder="Email da compra" className="w-full border p-3 rounded" value={email} onChange={(e) => setEmail(e.target.value)} />
          <input type="password" required placeholder={modo === "criar" ? "Crie uma senha (min 6)" : "Sua senha do Clube"} className="w-full border p-3 rounded" value={senha} onChange={(e) => setSenha(e.target.value)} />
          <button type="submit" className="w-full bg-black text-white p-3 rounded font-medium">
            {modo === "criar" ? "Criar senha e entrar" : "Entrar"}
          </button>
        </form>

        <div className="mt-4 text-center text-sm">
          {modo === "login" ? (
            <button onClick={() => setModo("criar")} className="underline">
              Primeiro acesso? Criar senha
            </button>
          ) : (
            <button onClick={() => setModo("login")} className="underline">
              Ja tenho senha
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
