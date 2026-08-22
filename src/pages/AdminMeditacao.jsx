import { useEffect, useState } from "react";

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

function escapeHtml(texto) {
  return String(texto)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function verMensagemCompleta(item) {
  const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <title>${escapeHtml(item.assunto)}</title>
</head>
<body style="font-family: sans-serif; max-width: 700px; margin: 40px auto; padding: 0 20px; line-height: 1.6;">
  <h2>${escapeHtml(item.assunto)}</h2>
  <p style="color: #666;">${formatarData(item.criado_em)} — enviado para ${item.enviados} pessoa(s)</p>
  <hr>
  <div style="white-space: pre-wrap;">${escapeHtml(item.mensagem)}</div>
</body>
</html>`;
  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  window.open(url, "_blank");
}

function AdminMeditacao() {
  const [secret, setSecret] = useState("");
  const [autenticado, setAutenticado] = useState(false);
  const [erroLogin, setErroLogin] = useState("");
  const [carregando, setCarregando] = useState(false);

  const [inscricoes, setInscricoes] = useState([]);
  const [historico, setHistorico] = useState([]);
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(0);
  const [excluindo, setExcluindo] = useState(null);
  const [historicoPageSize, setHistoricoPageSize] = useState(10);
  const [historicoPage, setHistoricoPage] = useState(0);

  const [assunto, setAssunto] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [resultadoEnvio, setResultadoEnvio] = useState(null);
  const [erroEnvio, setErroEnvio] = useState("");
  const [copiado, setCopiado] = useState(false);

  // Seção "Encontro ao Vivo" (rota desta página: /admin) — edita o card
  // que o aluno vê em /comunidade (ColunaEncontros.jsx via
  // public/api/encontro.php). Usa a mesma chave
  // digitada no login acima (`secret`) como header X-Admin-Secret nas
  // chamadas ao back-end PHP (back-end separado do Node usado no resto
  // desta página, ver public/api/admin/encontro.php).
  const [encontroForm, setEncontroForm] = useState({
    titulo: "",
    data_texto: "",
    horario: "",
    linha1: "",
    linha2: "",
    linha3: "",
    link_live: "",
  });
  const [salvandoEncontro, setSalvandoEncontro] = useState(false);
  const [encontroSucesso, setEncontroSucesso] = useState(false);
  const [encontroErro, setEncontroErro] = useState("");

  // Seção "Controle da Live" — trava/libera manualmente o botão "Entrar na
  // live" que o aluno vê em /comunidade (ColunaEncontros.jsx via
  // public/api/live/status.php), independente do link_live salvo acima em
  // "Encontro ao Vivo". Mesmo padrão de auth (X-Admin-Secret) e mesmo
  // back-end PHP separado (public/api/admin/live-controle.php).
  const [liveLiberada, setLiveLiberada] = useState(false);
  const [liveCarregado, setLiveCarregado] = useState(false);
  const [salvandoLive, setSalvandoLive] = useState(false);
  const [liveErro, setLiveErro] = useState("");

  // Seção "Desafio da Semana" — edita os 3 itens (título + descrição) que
  // o aluno vê em /comunidade (DesafioSemana.jsx via
  // public/api/desafios-semana.php). Mesmo padrão de auth (X-Admin-Secret)
  // e mesmo back-end PHP separado da seção "Encontro ao Vivo" acima.
  const [desafiosForm, setDesafiosForm] = useState([]);
  const [salvandoDesafios, setSalvandoDesafios] = useState(false);
  const [desafiosSucesso, setDesafiosSucesso] = useState(false);
  const [desafiosErro, setDesafiosErro] = useState("");

  useEffect(() => {
    if (!autenticado) return;
    let cancelado = false;
    fetch("/api/admin/encontro.php", { headers: { "X-Admin-Secret": secret } })
      .then((r) => r.json())
      .then((dados) => {
        if (!cancelado && dados?.ok) {
          setEncontroForm({
            titulo: dados.titulo || "",
            data_texto: dados.data_texto || "",
            horario: dados.horario || "",
            linha1: dados.linha1 || "",
            linha2: dados.linha2 || "",
            linha3: dados.linha3 || "",
            link_live: dados.link_live || "",
          });
        }
      })
      .catch(() => {
        // Endpoint PHP indisponível (ex: dev local sem PHP rodando) — o
        // formulário fica vazio, mas não trava o resto da página.
      });
    return () => {
      cancelado = true;
    };
  }, [autenticado, secret]);

  useEffect(() => {
    if (!encontroSucesso) return;
    const t = setTimeout(() => setEncontroSucesso(false), 3000);
    return () => clearTimeout(t);
  }, [encontroSucesso]);

  function handleEncontroChange(campo) {
    return (e) => setEncontroForm((atual) => ({ ...atual, [campo]: e.target.value }));
  }

  useEffect(() => {
    if (!autenticado) return;
    let cancelado = false;
    fetch("/api/admin/live-controle.php", { headers: { "X-Admin-Secret": secret } })
      .then((r) => r.json())
      .then((dados) => {
        if (!cancelado && dados?.ok) {
          setLiveLiberada(!!dados.liberada);
          setLiveCarregado(true);
        }
      })
      .catch(() => {
        // Endpoint PHP indisponível (ex: dev local sem PHP rodando) — o
        // botão de alternar fica desabilitado (liveCarregado continua
        // false) em vez de arriscar mostrar/enviar um estado desatualizado.
      });
    return () => {
      cancelado = true;
    };
  }, [autenticado, secret]);

  async function handleAlternarLive() {
    if (salvandoLive || !liveCarregado) return;
    setLiveErro("");
    setSalvandoLive(true);
    const novoValor = !liveLiberada;

    try {
      const res = await fetch("/api/admin/live-controle.php", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Admin-Secret": secret },
        body: JSON.stringify({ liberada: novoValor ? 1 : 0 }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(res.status === 401 ? "Senha incorreta." : data.erro || "Falha ao salvar.");
      }

      setLiveLiberada(!!data.liberada);
    } catch (err) {
      setLiveErro(err.message || "Não foi possível atualizar.");
    } finally {
      setSalvandoLive(false);
    }
  }

  useEffect(() => {
    if (!autenticado) return;
    let cancelado = false;
    fetch("/api/admin/desafios-semana.php", { headers: { "X-Admin-Secret": secret } })
      .then((r) => r.json())
      .then((dados) => {
        if (!cancelado && dados?.ok && Array.isArray(dados.itens)) {
          setDesafiosForm(dados.itens.map((i) => ({ id: i.id, titulo: i.titulo || "", descricao: i.descricao || "" })));
        }
      })
      .catch(() => {
        // Endpoint PHP indisponível (ex: dev local sem PHP rodando) — a
        // seção fica vazia, mas não trava o resto da página.
      });
    return () => {
      cancelado = true;
    };
  }, [autenticado, secret]);

  useEffect(() => {
    if (!desafiosSucesso) return;
    const t = setTimeout(() => setDesafiosSucesso(false), 3000);
    return () => clearTimeout(t);
  }, [desafiosSucesso]);

  function handleDesafioChange(index, campo) {
    return (e) => {
      const valor = e.target.value;
      setDesafiosForm((atual) => atual.map((item, i) => (i === index ? { ...item, [campo]: valor } : item)));
    };
  }

  async function handleSalvarDesafios(e) {
    e.preventDefault();
    setDesafiosErro("");
    setDesafiosSucesso(false);
    setSalvandoDesafios(true);

    try {
      const res = await fetch("/api/admin/desafios-semana.php", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Admin-Secret": secret },
        body: JSON.stringify({ itens: desafiosForm }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(res.status === 401 ? "Senha incorreta." : data.erro || "Falha ao salvar.");
      }

      if (Array.isArray(data.itens)) {
        setDesafiosForm(data.itens.map((i) => ({ id: i.id, titulo: i.titulo || "", descricao: i.descricao || "" })));
      }
      setDesafiosSucesso(true);
    } catch (err) {
      setDesafiosErro(err.message || "Não foi possível salvar.");
    } finally {
      setSalvandoDesafios(false);
    }
  }

  async function handleSalvarEncontro(e) {
    e.preventDefault();
    setEncontroErro("");
    setEncontroSucesso(false);
    setSalvandoEncontro(true);

    try {
      const res = await fetch("/api/admin/encontro.php", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Admin-Secret": secret },
        body: JSON.stringify(encontroForm),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(res.status === 401 ? "Senha incorreta." : data.erro || "Falha ao salvar.");
      }

      setEncontroForm({
        titulo: data.titulo || "",
        data_texto: data.data_texto || "",
        horario: data.horario || "",
        linha1: data.linha1 || "",
        linha2: data.linha2 || "",
        linha3: data.linha3 || "",
        link_live: data.link_live || "",
      });
      setEncontroSucesso(true);
    } catch (err) {
      setEncontroErro(err.message || "Não foi possível salvar.");
    } finally {
      setSalvandoEncontro(false);
    }
  }

  const totalPaginas = Math.max(1, Math.ceil(inscricoes.length / pageSize));
  const paginaAtual = Math.min(page, totalPaginas - 1);
  const inicioPagina = paginaAtual * pageSize;
  const inscricoesPagina = inscricoes.slice(inicioPagina, inicioPagina + pageSize);

  function handlePageSizeChange(e) {
    setPageSize(Number(e.target.value));
    setPage(0);
  }

  const historicoTotalPaginas = Math.max(1, Math.ceil(historico.length / historicoPageSize));
  const historicoPaginaAtual = Math.min(historicoPage, historicoTotalPaginas - 1);
  const historicoInicio = historicoPaginaAtual * historicoPageSize;
  const historicoPagina = historico.slice(historicoInicio, historicoInicio + historicoPageSize);

  function handleHistoricoPageSizeChange(e) {
    setHistoricoPageSize(Number(e.target.value));
    setHistoricoPage(0);
  }

  async function handleCopiarTelefones() {
    await copiarTelefones(inscricoes);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  }

  async function carregarHistorico(secretAtual) {
    try {
      const res = await fetch(`${API_URL}/api/meditacao/historico`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ secret: secretAtual }),
      });
      if (res.ok) {
        const data = await res.json();
        setHistorico(data.historico || []);
      }
    } catch {
      // histórico é só informativo — uma falha aqui não deve travar a página
    }
  }

  async function handleExcluir(email) {
    if (!window.confirm(`Remover ${email} da lista? Essa pessoa não recebe mais emails.`)) return;

    setExcluindo(email);
    try {
      const res = await fetch(`${API_URL}/api/meditacao/excluir`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ secret, email }),
      });
      if (!res.ok) throw new Error("Falha ao excluir.");
      setInscricoes((atual) => atual.filter((i) => i.email !== email));
    } catch (err) {
      alert(err.message || "Não foi possível excluir.");
    } finally {
      setExcluindo(null);
    }
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
      carregarHistorico(secret);
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
      carregarHistorico(secret);
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

        <div style={{ overflowX: "auto", marginBottom: 16 }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ textAlign: "left", borderBottom: "2px solid #ddd" }}>
                <th style={{ padding: "8px 12px" }}>Email</th>
                <th style={{ padding: "8px 12px" }}>Telefone</th>
                <th style={{ padding: "8px 12px" }}>Cadastrado em</th>
                <th style={{ padding: "8px 12px" }}></th>
              </tr>
            </thead>
            <tbody>
              {inscricoesPagina.map((i) => (
                <tr key={i.email} style={{ borderBottom: "1px solid #eee" }}>
                  <td style={{ padding: "8px 12px" }}>{i.email}</td>
                  <td style={{ padding: "8px 12px" }}>{i.telefone || "-"}</td>
                  <td style={{ padding: "8px 12px" }}>{formatarData(i.criado_em)}</td>
                  <td style={{ padding: "8px 12px" }}>
                    <button
                      type="button"
                      onClick={() => handleExcluir(i.email)}
                      disabled={excluindo === i.email}
                      aria-label={`Excluir ${i.email}`}
                      title="Excluir"
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: "50%",
                        border: "1px solid #d33",
                        color: "#d33",
                        background: "transparent",
                        cursor: "pointer",
                        lineHeight: 1,
                        fontWeight: 700,
                      }}
                    >
                      −
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12, marginBottom: 40 }}>
          <label>
            Mostrar{" "}
            <select value={pageSize} onChange={handlePageSizeChange}>
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>{" "}
            por página
          </label>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={paginaAtual === 0}
              aria-label="Página anterior"
            >
              ‹
            </button>
            <span>
              Página {paginaAtual + 1} de {totalPaginas}
            </span>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setPage((p) => Math.min(totalPaginas - 1, p + 1))}
              disabled={paginaAtual >= totalPaginas - 1}
              aria-label="Próxima página"
            >
              ›
            </button>
          </div>
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

        <div style={{ marginTop: 40 }}>
          <h3>Histórico de mensagens enviadas</h3>
          {historico.length === 0 ? (
            <p>Nenhuma mensagem enviada ainda.</p>
          ) : (
            <>
              <div style={{ overflowX: "auto", marginBottom: 16 }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ textAlign: "left", borderBottom: "2px solid #ddd" }}>
                      <th style={{ padding: "8px 12px" }}>Data</th>
                      <th style={{ padding: "8px 12px" }}>Assunto</th>
                      <th style={{ padding: "8px 12px" }}>Enviados</th>
                      <th style={{ padding: "8px 12px" }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {historicoPagina.map((h, idx) => (
                      <tr key={idx} style={{ borderBottom: "1px solid #eee" }}>
                        <td style={{ padding: "8px 12px" }}>{formatarData(h.criado_em)}</td>
                        <td style={{ padding: "8px 12px" }}>{h.assunto}</td>
                        <td style={{ padding: "8px 12px" }}>{h.enviados}</td>
                        <td style={{ padding: "8px 12px" }}>
                          <button type="button" className="btn btn-secondary" onClick={() => verMensagemCompleta(h)}>
                            Ver mensagem
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
                <label>
                  Mostrar{" "}
                  <select value={historicoPageSize} onChange={handleHistoricoPageSizeChange}>
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                  </select>{" "}
                  por página
                </label>

                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setHistoricoPage((p) => Math.max(0, p - 1))}
                    disabled={historicoPaginaAtual === 0}
                    aria-label="Página anterior do histórico"
                  >
                    ‹
                  </button>
                  <span>
                    Página {historicoPaginaAtual + 1} de {historicoTotalPaginas}
                  </span>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setHistoricoPage((p) => Math.min(historicoTotalPaginas - 1, p + 1))}
                    disabled={historicoPaginaAtual >= historicoTotalPaginas - 1}
                    aria-label="Próxima página do histórico"
                  >
                    ›
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="form-card" style={{ marginTop: 40 }}>
          <h3>Controle da Live</h3>
          <p style={{ marginTop: -8, marginBottom: 16, color: "#666" }}>
            Trava/libera o botão "Entrar na live" que o aluno vê em /comunidade — independente do link salvo abaixo em "Encontro ao Vivo".
          </p>
          {liveErro && <div className="error-box">{liveErro}</div>}
          <button
            type="button"
            onClick={handleAlternarLive}
            disabled={salvandoLive || !liveCarregado}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              width: "100%",
              maxWidth: 360,
              padding: "12px 18px",
              borderRadius: 999,
              border: "1px solid #ddd",
              background: liveLiberada ? "#e8f5e9" : "#fdecea",
              cursor: salvandoLive || !liveCarregado ? "default" : "pointer",
              fontWeight: 600,
              fontSize: 14,
              opacity: liveCarregado ? 1 : 0.6,
            }}
          >
            <span>{liveLiberada ? "🟢 Liberar entrada" : "🔴 Live Fechada"}</span>
            <span style={{ fontSize: 12, color: "#666", fontWeight: 400 }}>
              {salvandoLive ? "Salvando..." : "Clique para alternar"}
            </span>
          </button>
          <p style={{ marginTop: 10, marginBottom: 0, fontSize: 13, color: "#666" }}>
            Status atual:{" "}
            {liveLiberada
              ? 'Liberada — o aluno vê o botão "Entrar na live" clicável.'
              : 'Travada — o aluno vê "Aguardando liberação do professor".'}
          </p>
        </div>

        <div className="form-card" style={{ marginTop: 40 }}>
          <h3>Encontro ao Vivo</h3>
          <p style={{ marginTop: -8, marginBottom: 16, color: "#666" }}>
            Edita o card "Próximo encontro ao vivo" que o aluno vê em /comunidade.
          </p>
          {encontroSucesso && <div className="success-box">Atualizado</div>}
          {encontroErro && <div className="error-box">{encontroErro}</div>}
          <form onSubmit={handleSalvarEncontro} noValidate>
            <div className="field">
              <label htmlFor="encontro-titulo">Título do encontro</label>
              <input
                id="encontro-titulo"
                type="text"
                value={encontroForm.titulo}
                onChange={handleEncontroChange("titulo")}
                placeholder="Aterramento Matinal"
              />
            </div>
            <div className="field">
              <label htmlFor="encontro-data">Data (ex: Qui, 15 Mai)</label>
              <input
                id="encontro-data"
                type="text"
                value={encontroForm.data_texto}
                onChange={handleEncontroChange("data_texto")}
                placeholder="Qui, 15 Mai"
              />
            </div>
            <div className="field">
              <label htmlFor="encontro-horario">Horário (ex: 7:00 - 7:30)</label>
              <input
                id="encontro-horario"
                type="text"
                value={encontroForm.horario}
                onChange={handleEncontroChange("horario")}
                placeholder="7:00 - 7:30"
              />
            </div>
            <div className="field">
              <label htmlFor="encontro-linha1">Linha 1</label>
              <input id="encontro-linha1" type="text" value={encontroForm.linha1} onChange={handleEncontroChange("linha1")} />
            </div>
            <div className="field">
              <label htmlFor="encontro-linha2">Linha 2</label>
              <input id="encontro-linha2" type="text" value={encontroForm.linha2} onChange={handleEncontroChange("linha2")} />
            </div>
            <div className="field">
              <label htmlFor="encontro-linha3">Linha 3</label>
              <input id="encontro-linha3" type="text" value={encontroForm.linha3} onChange={handleEncontroChange("linha3")} />
            </div>
            <div className="field">
              <label htmlFor="encontro-link">Link da live</label>
              <input
                id="encontro-link"
                type="text"
                value={encontroForm.link_live}
                onChange={handleEncontroChange("link_live")}
                placeholder="https://..."
              />
            </div>
            <button type="submit" className="btn btn-primary btn-block" disabled={salvandoEncontro}>
              {salvandoEncontro ? "Salvando..." : "Salvar"}
            </button>
          </form>

          {/* Prévia de conteúdo (não é um clone pixel-perfect do card real —
              essa página não importa o CSS da comunidade de propósito, pra
              não acoplar/arriscar CSS de uma área na outra). */}
          <div
            style={{
              marginTop: 24,
              padding: 20,
              border: "1px solid #ddd",
              borderRadius: 12,
              maxWidth: 320,
            }}
          >
            <p style={{ margin: "0 0 4px", fontSize: 12, textTransform: "uppercase", color: "#999" }}>Prévia</p>
            <span style={{ display: "block", marginBottom: 4, fontSize: 12, color: "#999" }}>Próximo encontro ao vivo</span>
            <strong style={{ display: "block", marginBottom: 4 }}>{encontroForm.titulo || "—"}</strong>
            <span style={{ display: "block", marginBottom: 12, color: "#555" }}>
              {encontroForm.data_texto || "—"} · {encontroForm.horario || "—"}
            </span>
            <ul style={{ margin: "0 0 16px", padding: 0, listStyle: "none" }}>
              {[encontroForm.linha1, encontroForm.linha2, encontroForm.linha3].filter(Boolean).map((linha, i) => (
                <li key={i} style={{ padding: "4px 0", fontSize: 14 }}>
                  ✓ {linha}
                </li>
              ))}
            </ul>
            {encontroForm.link_live ? (
              <span style={{ display: "block", padding: "8px 12px", border: "1px solid #333", borderRadius: 8, textAlign: "center", fontSize: 13 }}>
                Entrar na live
              </span>
            ) : (
              <span
                style={{
                  display: "block",
                  padding: "8px 12px",
                  border: "1px solid #ccc",
                  borderRadius: 8,
                  textAlign: "center",
                  fontSize: 13,
                  color: "#999",
                }}
              >
                Em breve
              </span>
            )}
          </div>
        </div>

        <div className="form-card" style={{ marginTop: 40 }}>
          <h3>Desafio da Semana</h3>
          <p style={{ marginTop: -8, marginBottom: 16, color: "#666" }}>
            Edita os 3 itens do card "Desafio da Semana" que o aluno vê em /comunidade.
          </p>
          {desafiosSucesso && <div className="success-box">Atualizado</div>}
          {desafiosErro && <div className="error-box">{desafiosErro}</div>}
          {desafiosForm.length === 0 ? (
            <p style={{ color: "#999" }}>Carregando desafios...</p>
          ) : (
            <form onSubmit={handleSalvarDesafios} noValidate>
              {desafiosForm.map((item, idx) => (
                <div
                  key={item.id}
                  style={{
                    marginBottom: 20,
                    paddingBottom: 20,
                    borderBottom: idx < desafiosForm.length - 1 ? "1px solid #eee" : "none",
                  }}
                >
                  <p style={{ margin: "0 0 8px", fontWeight: 600 }}>Item {idx + 1}</p>
                  <div className="field">
                    <label htmlFor={`desafio-titulo-${item.id}`}>Título</label>
                    <input
                      id={`desafio-titulo-${item.id}`}
                      type="text"
                      value={item.titulo}
                      onChange={handleDesafioChange(idx, "titulo")}
                    />
                  </div>
                  <div className="field">
                    <label htmlFor={`desafio-descricao-${item.id}`}>Descrição</label>
                    <input
                      id={`desafio-descricao-${item.id}`}
                      type="text"
                      value={item.descricao}
                      onChange={handleDesafioChange(idx, "descricao")}
                    />
                  </div>
                </div>
              ))}
              <button type="submit" className="btn btn-primary btn-block" disabled={salvandoDesafios}>
                {salvandoDesafios ? "Salvando..." : "Salvar Desafios"}
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}

export default AdminMeditacao;
