import { useState } from "react";

const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? "http://localhost:3001" : "");

function formatarData(iso) {
  return new Date(iso).toLocaleString("pt-BR");
}

function baixarCsv(inscricoes) {
  const linhas = [
    ["email", "telefone", "cadastrado_em"],
    ...inscricoes.map((i) => [i.email, i.telefone || "", i.criado_em]),
  ];
  const csv = linhas.map((linha) => linha.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "inscritos-meditacao.csv";
  a.click();
  URL.revokeObjectURL(url);
}

async function copiarTelefones(inscricoes) {
  const telefones = inscricoes.map((i) => i.telefone).filter(Boolean).join("\n");
  await navigator.clipboard.writeText(telefones);
}

function AdminMeditacao() {
  const [secret, setSecret] = useState("");
  const [autenticado, setAutenticado] = useState(false);
  const [erroLogin, setErroLogin] = useState("");
  const [carregando, setCarregando] = useState(false);

  const [inscricoes, setInscricoes] = useState([]);

  const [assunto, setAssunto] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [resultadoEnvio, setResultadoEnvio] = useState(null);
  const [erroEnvio, setErroEnvio] = useState("");
  const [copiado, setCopiado] = useState(false);

  async function handleCopiarTelefones() {
    await copiarTelefones(inscricoes);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  }

  async function handleLogin(e) {
    e.preventDefault();
    setErroLogin("");
    setCarregando(true);

    try {
      const res = await fetch(`${API_URL}/api/meditacao/listar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ secret }),
      });

      if (!res.ok) {
        throw new Error(res.status === 401 ? "Senha incorreta." : "Falha ao consultar.");
      }

      const data = await res.json();
      setInscricoes(data.inscricoes || []);
      setAutenticado(true);
    } catch (err) {
      setErroLogin(err.message || "Não foi possível entrar.");
    } finally {
      setCarregando(false);
    }
  }

  async function handleEnviar(e) {
    e.preventDefault();
    setErroEnvio("");
    setResultadoEnvio(null);
    setEnviando(true);

    try {
      const res = await fetch(`${API_URL}/api/meditacao/enviar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ secret, assunto, mensagem }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Falha ao enviar os emails.");
      }

      setResultadoEnvio(data.enviados);
      setAssunto("");
      setMensagem("");
    } catch (err) {
      setErroEnvio(err.message || "Não foi possível enviar.");
    } finally {
      setEnviando(false);
    }
  }

  if (!autenticado) {
    return (
      <section className="section">
        <div className="container" style={{ maxWidth: 420, width: "100%", margin: "0 auto" }}>
          <div className="form-card">
            <h2>Área administrativa</h2>
            {erroLogin && <div className="error-box">{erroLogin}</div>}
            <form onSubmit={handleLogin} noValidate>
              <div className="field">
                <label htmlFor="secret">Chave de administrador</label>
                <input
                  id="secret"
                  type="password"
                  required
                  value={secret}
                  onChange={(e) => setSecret(e.target.value)}
                  placeholder="ADMIN_SECRET"
                />
              </div>
              <button type="submit" className="btn btn-primary btn-block" disabled={!secret || carregando}>
                {carregando ? "Entrando..." : "Entrar"}
              </button>
            </form>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="section">
      <div className="container" style={{ maxWidth: 900, width: "100%", margin: "0 auto" }}>
        <h2>Inscritos na Meditação ({inscricoes.length})</h2>

        <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
          <button type="button" className="btn btn-secondary" onClick={() => baixarCsv(inscricoes)}>
            Exportar CSV
          </button>
          <button type="button" className="btn btn-secondary" onClick={handleCopiarTelefones}>
            {copiado ? "Telefones copiados!" : "Copiar telefones"}
          </button>
        </div>

        <div style={{ overflowX: "auto", marginBottom: 40 }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ textAlign: "left", borderBottom: "2px solid #ddd" }}>
                <th style={{ padding: "8px 12px" }}>Email</th>
                <th style={{ padding: "8px 12px" }}>Telefone</th>
                <th style={{ padding: "8px 12px" }}>Cadastrado em</th>
              </tr>
            </thead>
            <tbody>
              {inscricoes.map((i) => (
                <tr key={i.email} style={{ borderBottom: "1px solid #eee" }}>
                  <td style={{ padding: "8px 12px" }}>{i.email}</td>
                  <td style={{ padding: "8px 12px" }}>{i.telefone || "-"}</td>
                  <td style={{ padding: "8px 12px" }}>{formatarData(i.criado_em)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="form-card">
          <h3>Enviar email para todos os inscritos</h3>
          {resultadoEnvio !== null && <div className="success-box">Enviado com sucesso para {resultadoEnvio} pessoa(s).</div>}
          {erroEnvio && <div className="error-box">{erroEnvio}</div>}
          <form onSubmit={handleEnviar} noValidate>
            <div className="field">
              <label htmlFor="assunto">Assunto</label>
              <input id="assunto" type="text" required value={assunto} onChange={(e) => setAssunto(e.target.value)} placeholder="Assunto do email" />
            </div>
            <div className="field">
              <label htmlFor="mensagem">Mensagem</label>
              <textarea id="mensagem" rows="8" required value={mensagem} onChange={(e) => setMensagem(e.target.value)} placeholder="Escreva a mensagem..." />
            </div>
            <button type="submit" className="btn btn-primary btn-block" disabled={!assunto || !mensagem || enviando}>
              {enviando ? "Enviando..." : `Enviar para ${inscricoes.length} pessoa(s)`}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}

export default AdminMeditacao;
