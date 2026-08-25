import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";

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
  // Botão "Resetar desafios da semana" (Tarefa 4) — apaga o progresso de
  // CHECK de todos os alunos pra semana atual (tabela desafio_semana, ver
  // public/api/admin/resetar_desafios.php). Não mexe em desafiosForm acima
  // (título/descrição dos itens continuam intactos, só o check de cada
  // aluno é zerado).
  const [resetandoDesafios, setResetandoDesafios] = useState(false);
  const [resetDesafiosToast, setResetDesafiosToast] = useState("");
  const [resetDesafiosErro, setResetDesafiosErro] = useState("");

  // Seção "Frase Motivacional da Semana" — edita o card que o aluno vê em
  // /comunidade (FraseMotivacionalSemana.jsx, fim da coluna 3, no lugar do
  // antigo Ranking de Presença). Leitura pública é
  // public/api/get_frase_semana.php; salvar é public/api/update_frase_semana.php
  // (POST protegido por X-Admin-Secret, mesmo padrão das seções acima) —
  // faz INSERT (mantém histórico), nunca UPDATE.
  const [fraseForm, setFraseForm] = useState({ frase: "", subfrase: "" });
  const [salvandoFrase, setSalvandoFrase] = useState(false);
  const [fraseSucesso, setFraseSucesso] = useState(false);
  const [fraseErro, setFraseErro] = useState("");

  // Seção "Acesso de Teste" — libera amigos na comunidade sem compra
  // Hotmart, sem precisar mexer no SQL manualmente
  // (public/api/admin/teste-emails.php). Mesmo padrão de auth
  // (X-Admin-Secret) e mesmo back-end PHP separado das seções acima.
  const [testeEmails, setTesteEmails] = useState([]);
  const [testeCarregando, setTesteCarregando] = useState(true);
  const [testeInput, setTesteInput] = useState("");
  const [testeNome, setTesteNome] = useState("");
  const [testeEnviarEmail, setTesteEnviarEmail] = useState(true);
  const [testeSalvando, setTesteSalvando] = useState(false);
  const [testeToast, setTesteToast] = useState("");
  const [testeErro, setTesteErro] = useState("");
  const [testeBusca, setTesteBusca] = useState("");
  const [testeRemovendo, setTesteRemovendo] = useState(null);
  const [linkCopiado, setLinkCopiado] = useState(false);

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

  useEffect(() => {
    if (!resetDesafiosToast) return;
    const t = setTimeout(() => setResetDesafiosToast(""), 3000);
    return () => clearTimeout(t);
  }, [resetDesafiosToast]);

  function handleDesafioChange(index, campo) {
    return (e) => {
      const valor = e.target.value;
      setDesafiosForm((atual) => atual.map((item, i) => (i === index ? { ...item, [campo]: valor } : item)));
    };
  }

  // Pré-carrega o form com a última frase salva — usa o endpoint público
  // get_frase_semana.php (sem precisar de X-Admin-Secret pra leitura, só
  // pra salvar).
  useEffect(() => {
    if (!autenticado) return;
    let cancelado = false;
    fetch("/api/get_frase_semana.php")
      .then((r) => r.json())
      .then((dados) => {
        if (!cancelado && dados?.ok) {
          setFraseForm({ frase: dados.frase || "", subfrase: dados.subfrase || "" });
        }
      })
      .catch(() => {
        // Endpoint PHP indisponível (ex: dev local sem PHP rodando) — o
        // formulário fica vazio, mas não trava o resto da página.
      });
    return () => {
      cancelado = true;
    };
  }, [autenticado]);

  useEffect(() => {
    if (!fraseSucesso) return;
    const t = setTimeout(() => setFraseSucesso(false), 3000);
    return () => clearTimeout(t);
  }, [fraseSucesso]);

  function handleFraseChange(campo) {
    return (e) => setFraseForm((atual) => ({ ...atual, [campo]: e.target.value }));
  }

  async function handleSalvarFrase(e) {
    e.preventDefault();
    setFraseErro("");
    setFraseSucesso(false);
    setSalvandoFrase(true);

    try {
      const res = await fetch("/api/update_frase_semana.php", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Admin-Secret": secret },
        body: JSON.stringify(fraseForm),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(res.status === 401 ? "Senha incorreta." : data.erro || "Falha ao salvar.");
      }

      setFraseForm({ frase: data.frase || "", subfrase: data.subfrase || "" });
      setFraseSucesso(true);
    } catch (err) {
      setFraseErro(err.message || "Não foi possível salvar.");
    } finally {
      setSalvandoFrase(false);
    }
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

  // Tarefa 4: zera o CHECK de "Desafio da Semana" de todos os alunos pra
  // semana atual (tabela desafio_semana). Não mexe no texto dos itens
  // (desafiosForm/desafio_config) — só o progresso de quem já marcou.
  async function handleResetarDesafios() {
    const confirmado = window.confirm(
      "Tem certeza? Isso vai desmarcar todos os checks de desafios de todos os alunos."
    );
    if (!confirmado) return;

    setResetDesafiosErro("");
    setResetandoDesafios(true);
    try {
      const res = await fetch("/api/admin/resetar_desafios.php", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Admin-Secret": secret },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        throw new Error(res.status === 401 ? "Senha incorreta." : data.erro || "Falha ao resetar.");
      }
      setResetDesafiosToast("Desafios resetados com sucesso");
    } catch (err) {
      setResetDesafiosErro(err.message || "Não foi possível resetar.");
    } finally {
      setResetandoDesafios(false);
    }
  }

  // Extraído do useEffect abaixo pra também poder ser chamado depois de
  // Adicionar/Remover — assim a tabela atualiza sozinha (novo e-mail no
  // topo, já com a data de agora, direto do ORDER BY criado_em DESC do
  // backend) sem precisar de F5.
  async function recarregarTesteEmails() {
    try {
      const res = await fetch("/api/admin/teste-emails.php", { headers: { "X-Admin-Secret": secret } });
      const dados = await res.json();
      if (dados?.ok && Array.isArray(dados.itens)) {
        setTesteEmails(dados.itens);
      }
    } catch {
      // Endpoint PHP indisponível (ex: dev local sem PHP rodando) — mantém
      // a lista como está, mas não trava o resto da página.
    }
  }

  useEffect(() => {
    if (!autenticado) return;
    let cancelado = false;
    recarregarTesteEmails().finally(() => {
      if (!cancelado) setTesteCarregando(false);
    });
    return () => {
      cancelado = true;
    };
  }, [autenticado, secret]);

  useEffect(() => {
    if (!testeToast) return;
    const t = setTimeout(() => setTesteToast(""), 3000);
    return () => clearTimeout(t);
  }, [testeToast]);

  // Aceita colar vários e-mails separados por vírgula, espaço ou quebra de
  // linha — o campo "nome" só se aplica quando sobra exatamente 1 e-mail.
  function parseEmailsColados(texto) {
    return [...new Set(texto.split(/[\s,]+/).map((e) => e.trim().toLowerCase()).filter(Boolean))];
  }

  async function handleAdicionarTeste(e) {
    e.preventDefault();
    const emails = parseEmailsColados(testeInput);
    if (emails.length === 0) return;

    setTesteErro("");
    setTesteToast("");
    setTesteSalvando(true);
    try {
      const res = await fetch("/api/admin/teste-emails.php", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Admin-Secret": secret },
        body: JSON.stringify({ emails, nome: testeNome.trim(), enviar_email: testeEnviarEmail }),
      });

      const data = await res.json().catch(() => null);
      if (!data) {
        throw new Error("O servidor não respondeu em JSON. Tente novamente em instantes.");
      }
      if (!res.ok && res.status === 401) {
        throw new Error("Senha incorreta.");
      }

      const alvo = emails.length === 1 ? emails[0] : `${emails.length} e-mails`;

      if (data.success === false) {
        // Mostra o erro exato que veio do backend (ErrorInfo do PHPMailer
        // quando é falha de envio) — nunca esconder.
        setTesteErro(data.error || "Falha ao adicionar.");
      } else {
        setTesteToast(
          data.sent_via
            ? `✅ Convite enviado para ${alvo} e e-mail disparado via ${data.sent_via}`
            : `✅ ${data.message || "E-mail liberado"} para ${alvo}`
        );
        // Envio parcial em lote: liberou mas algum convite falhou — ainda é
        // sucesso (data.success !== false), mas o admin precisa saber quais.
        if (data.error) setTesteErro(data.error);
        setTesteInput("");
        setTesteNome("");
      }

      if ((data.invalidos || []).length > 0) {
        setTesteErro((atual) => {
          const aviso = `Ignorado(s) por formato inválido: ${data.invalidos.join(", ")}`;
          return atual ? `${atual} ${aviso}` : aviso;
        });
      }

      // Busca a lista atualizada em vez de confiar só no que o POST
      // devolveu — o novo e-mail aparece no topo (ORDER BY criado_em DESC)
      // sem precisar de F5.
      await recarregarTesteEmails();
    } catch (err) {
      setTesteErro(err.message || "Não foi possível adicionar.");
    } finally {
      setTesteSalvando(false);
    }
  }

  async function handleRemoverTeste(item) {
    if (!window.confirm(`Remover ${item.email} do acesso de teste? Essa pessoa não consegue mais logar sem compra.`)) return;

    setTesteErro("");
    setTesteRemovendo(item.id);
    try {
      const res = await fetch(`/api/admin/teste-emails.php?id=${item.id}`, {
        method: "DELETE",
        headers: { "X-Admin-Secret": secret },
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(res.status === 401 ? "Senha incorreta." : data.erro || "Falha ao remover.");
      }

      setTesteEmails(data.itens || []);
      setTesteToast("E-mail removido");
    } catch (err) {
      setTesteErro(err.message || "Não foi possível remover.");
    } finally {
      setTesteRemovendo(null);
    }
  }

  async function handleCopiarLinkConvite() {
    await navigator.clipboard.writeText("https://renatodepaula.com/comunidade");
    setLinkCopiado(true);
    setTimeout(() => setLinkCopiado(false), 2000);
  }

  const testeEmailsFiltrados = testeEmails.filter((item) => {
    const busca = testeBusca.trim().toLowerCase();
    if (!busca) return true;
    return item.email.toLowerCase().includes(busca) || (item.nome || "").toLowerCase().includes(busca);
  });

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

          <div style={{ marginTop: 24, paddingTop: 20, borderTop: "1px solid #eee" }}>
            {resetDesafiosToast && <div className="success-box">{resetDesafiosToast}</div>}
            {resetDesafiosErro && <div className="error-box">{resetDesafiosErro}</div>}
            <button
              type="button"
              onClick={handleResetarDesafios}
              disabled={resetandoDesafios}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                background: "#dc2626",
                color: "#fff",
                border: "none",
                borderRadius: 8,
                padding: "10px 16px",
                fontSize: 14,
                fontWeight: 600,
                cursor: resetandoDesafios ? "default" : "pointer",
                opacity: resetandoDesafios ? 0.7 : 1,
              }}
            >
              <RefreshCw size={16} />
              {resetandoDesafios ? "Resetando..." : "Resetar desafios da semana"}
            </button>
          </div>
        </div>

        <div className="form-card" style={{ marginTop: 40 }}>
          <h3>Frase Motivacional da Semana</h3>
          <p style={{ marginTop: -8, marginBottom: 16, color: "#666" }}>
            Edita o card "Frase Motivacional da Semana" que o aluno vê em /comunidade (fim da coluna da direita).
          </p>
          {fraseSucesso && <div className="success-box">Atualizado</div>}
          {fraseErro && <div className="error-box">{fraseErro}</div>}
          <form onSubmit={handleSalvarFrase} noValidate>
            <div className="field">
              <label htmlFor="frase-principal">Frase principal</label>
              <textarea
                id="frase-principal"
                rows={3}
                required
                value={fraseForm.frase}
                onChange={handleFraseChange("frase")}
                placeholder="Cada momento de presença é uma semente de transformação."
              />
            </div>
            <div className="field">
              <label htmlFor="frase-subfrase">Subfrase</label>
              <input
                id="frase-subfrase"
                type="text"
                value={fraseForm.subfrase}
                onChange={handleFraseChange("subfrase")}
                placeholder="frase teste"
              />
            </div>
            <button type="submit" className="btn btn-primary btn-block" disabled={!fraseForm.frase.trim() || salvandoFrase}>
              {salvandoFrase ? "Salvando..." : "Salvar"}
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
              borderRadius: 20,
              maxWidth: 360,
              textAlign: "center",
            }}
          >
            <p style={{ margin: "0 0 4px", fontSize: 12, textTransform: "uppercase", color: "#999" }}>Prévia</p>
            <span style={{ display: "block", fontSize: 40, lineHeight: 1, fontFamily: "Georgia, serif", color: "#7c9473" }}>
              “
            </span>
            <strong style={{ display: "block", marginBottom: 8, fontSize: 18 }}>
              {fraseForm.frase || "—"}
            </strong>
            <span style={{ display: "block", fontSize: 14, fontStyle: "italic", color: "#666" }}>
              {fraseForm.subfrase || "—"}
            </span>
          </div>
        </div>

        <div className="form-card" style={{ marginTop: 40 }}>
          <h3>Acesso de Teste 🔑</h3>
          <p style={{ marginTop: -8, marginBottom: 16, color: "#666" }}>
            Convidar para a comunidade
          </p>

          {testeToast && <div className="success-box">{testeToast}</div>}
          {testeErro && <div className="error-box">{testeErro}</div>}

          <form onSubmit={handleAdicionarTeste} noValidate>
            <div className="field">
              <label htmlFor="teste-emails">E-mail(s)</label>
              <textarea
                id="teste-emails"
                rows={3}
                value={testeInput}
                onChange={(e) => setTesteInput(e.target.value)}
                placeholder="amigo@teste.com, outro@teste.com&#10;(cole vários separados por vírgula, espaço ou linha)"
              />
            </div>
            <div className="field">
              <label htmlFor="teste-nome">Nome</label>
              <input
                id="teste-nome"
                type="text"
                value={testeNome}
                onChange={(e) => setTesteNome(e.target.value)}
                placeholder="Nome do amigo"
              />
            </div>
            <div className="field" style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input
                id="teste-enviar-email"
                type="checkbox"
                checked={testeEnviarEmail}
                onChange={(e) => setTesteEnviarEmail(e.target.checked)}
                style={{ width: "auto" }}
              />
              <label htmlFor="teste-enviar-email" style={{ margin: 0 }}>
                Enviar e-mail de convite automaticamente
              </label>
            </div>
            <button type="submit" className="btn btn-primary btn-block" disabled={!testeInput.trim() || testeSalvando}>
              {testeSalvando ? (testeEnviarEmail ? "Enviando convites..." : "Adicionando...") : "Adicionar"}
            </button>
          </form>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12, marginTop: 24, marginBottom: 12 }}>
            <strong>{testeEmails.length} e-mail(s) com acesso de teste</strong>
            <button type="button" className="btn btn-secondary" onClick={handleCopiarLinkConvite}>
              {linkCopiado ? "Link copiado!" : "Copiar link de convite"}
            </button>
          </div>

          <div className="field">
            <input
              type="text"
              value={testeBusca}
              onChange={(e) => setTesteBusca(e.target.value)}
              placeholder="Buscar por e-mail ou nome..."
            />
          </div>

          {testeCarregando ? (
            <p style={{ color: "#999" }}>Carregando...</p>
          ) : testeEmailsFiltrados.length === 0 ? (
            <p style={{ color: "#999" }}>{testeEmails.length === 0 ? "Nenhum e-mail de teste ainda." : "Nada encontrado pra essa busca."}</p>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ textAlign: "left", borderBottom: "2px solid #ddd" }}>
                    <th style={{ padding: "8px 12px" }}>Email</th>
                    <th style={{ padding: "8px 12px" }}>Nome</th>
                    <th style={{ padding: "8px 12px" }}>Adicionado em</th>
                    <th style={{ padding: "8px 12px" }}></th>
                  </tr>
                </thead>
                <tbody>
                  {testeEmailsFiltrados.map((item) => (
                    <tr key={item.id} style={{ borderBottom: "1px solid #eee" }}>
                      <td style={{ padding: "8px 12px" }}>{item.email}</td>
                      <td style={{ padding: "8px 12px" }}>{item.nome || "-"}</td>
                      <td style={{ padding: "8px 12px" }}>{formatarData(item.criado_em)}</td>
                      <td style={{ padding: "8px 12px" }}>
                        <button
                          type="button"
                          onClick={() => handleRemoverTeste(item)}
                          disabled={testeRemovendo === item.id}
                          aria-label={`Remover ${item.email}`}
                          title="Remover"
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
                          ×
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export default AdminMeditacao;
