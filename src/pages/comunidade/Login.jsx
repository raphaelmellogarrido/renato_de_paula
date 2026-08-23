import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Check, Eye, EyeOff, ShieldCheck } from "lucide-react";
import { avisarSessaoMudou } from "./components/usuarioStorage";
import { checarRequisitosSenha } from "./components/senhaForte";
import "./Login.css";

// Só letras (com acentos pt-BR) e espaço, mínimo 2 caracteres — é esse nome
// que aparece no Ranking de Presença, então não deixa passar e-mail/número.
const REGEX_NOME = /^[A-Za-zÀ-ÖØ-öø-ÿ' ]{2,}$/;
const REGEX_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function nomeValido(nome) {
  return REGEX_NOME.test(nome.trim());
}

function emailValido(email) {
  return REGEX_EMAIL.test(email.trim());
}

export default function ComunidadeLogin() {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [modo, setModo] = useState("login");
  const [msg, setMsg] = useState("");
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [mostrarConfirmar, setMostrarConfirmar] = useState(false);
  const navigate = useNavigate();
  const emailRef = useRef(null);
  const senhaRef = useRef(null);

  // Autofill do Chrome/gerenciador de senha às vezes preenche o input sem
  // disparar onChange do React (o valor muda no DOM, mas o state fica vazio).
  // Isso deixava o botão "Entrar" com aparência de desabilitado até um
  // refresh forçado. O autofill pode chegar bem depois do mount (às vezes só
  // quando o usuário interage com a página), então em vez de checar uma
  // única vez, poll por alguns segundos — sem gambiarra de CSS no botão, que
  // agora só desabilita por loading (ver botão de submit abaixo).
  useEffect(() => {
    let tentativas = 0;
    const id = setInterval(() => {
      tentativas += 1;
      if (emailRef.current?.value && emailRef.current.value !== email) setEmail(emailRef.current.value);
      if (senhaRef.current?.value && senhaRef.current.value !== senha) setSenha(senhaRef.current.value);
      if (tentativas >= 10) clearInterval(id); // ~3s cobre autofill tardio
    }, 300);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const requisitosSenha = checarRequisitosSenha(senha);
  const senhaForte = Object.values(requisitosSenha).every(Boolean);
  const nomeOk = nomeValido(nome);
  const emailOk = emailValido(email);
  const senhasIguais = confirmarSenha.length > 0 && senha === confirmarSenha;
  const podeCriar = nomeOk && emailOk && senhaForte && senhasIguais;

  function salvarSessao(dados) {
    const nomeFinal = dados.nome || nome.trim() || "";
    localStorage.setItem("user_email", dados.email);
    localStorage.setItem("userName", nomeFinal);
    localStorage.setItem("comunidade_session", JSON.stringify({ email: dados.email, nome: nomeFinal }));
    console.log("[Clube Presença] login → sessão trocada para usuário:", dados.email);
    avisarSessaoMudou();
    navigate("/comunidade");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErro("");
    setMsg("");

    if (modo === "criar" && !podeCriar) return;

    setLoading(true);
    try {
      if (modo === "criar") {
        const res = await fetch("/api/hotmart/register.php", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          // Manda "nome" pra bater com o mesmo campo que Login.jsx já lê na
          // resposta do login (data.nome) e que vira comunidade_session.nome
          // — é ele que aparece no Ranking de Presença, não o e-mail.
          body: JSON.stringify({ email, senha, nome: nome.trim() }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.erro || "Erro ao criar conta");

        // Conta criada: já loga em seguida (sem pedir senha de novo). Se
        // register.php já devolver email/sessão prontos, usa direto; senão
        // completa com um login.php normal logo depois.
        if (data.email) {
          salvarSessao(data);
          return;
        }

        const resLogin = await fetch("/api/hotmart/login.php", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, senha }),
        });
        const dataLogin = await resLogin.json();
        if (!resLogin.ok) {
          // Conta foi criada, só o auto-login que falhou — manda pro login
          // manual em vez de travar numa mensagem de erro confusa.
          setMsg("Conta criada com sucesso! Agora faça login.");
          setModo("login");
          setSenha("");
          setConfirmarSenha("");
          setLoading(false);
          return;
        }
        salvarSessao(dataLogin);
        return;
      }

      const res = await fetch("/api/hotmart/login.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, senha }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.erro || "Erro ao processar");
      salvarSessao(data);
    } catch (err) {
      setErro(err.message);
      setLoading(false);
    }
  }

  return (
    <div className="cm-login-page">
      <div className="cm-login-card">
        <h1 className="cm-login-title">{modo === "criar" ? "Crie sua senha do Clube" : "Entrar no Clube Presença"}</h1>
        {modo === "criar" && <p className="cm-login-subtitle">Detectamos sua compra na Hotmart. Crie uma senha só pro Clube.</p>}

        {erro && <div className="cm-login-alert cm-login-alert-erro">{erro}</div>}
        {msg && <div className="cm-login-alert cm-login-alert-msg">{msg}</div>}

        <form onSubmit={handleSubmit} className="cm-login-form">
          {modo === "criar" && (
            <div className="cm-login-field">
              <label htmlFor="cm-login-nome">Nome completo</label>
              <div className="cm-login-input-wrap">
                <input id="cm-login-nome" type="text" required placeholder="Como você quer ser chamado no Ranking" value={nome} onChange={(e) => setNome(e.target.value)} className={`cm-login-input ${nome ? (nomeOk ? "is-valid" : "is-invalid") : ""}`} />
                {nome && nomeOk && (
                  <span className="cm-login-icon-right" aria-hidden="true">
                    <span className="cm-login-icon-valid">
                      <Check size={18} strokeWidth={3} />
                    </span>
                  </span>
                )}
              </div>
              {nome && !nomeOk && <span className="cm-login-error">Use apenas letras e espaço (mínimo 2 caracteres)</span>}
            </div>
          )}

          <div className="cm-login-field">
            <label htmlFor="cm-login-email">E-mail</label>
            <input id="cm-login-email" ref={emailRef} type="email" required autoComplete="email" placeholder="seu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} onInput={(e) => setEmail(e.target.value)} className="cm-login-input" />
          </div>

          <div className="cm-login-field">
            <label htmlFor="cm-login-senha">{modo === "criar" ? "Crie uma senha forte" : "Senha"}</label>
            <div className="cm-login-input-wrap">
              <input
                id="cm-login-senha"
                ref={senhaRef}
                type={mostrarSenha ? "text" : "password"}
                required
                minLength={modo === "criar" ? 8 : undefined}
                autoComplete={modo === "criar" ? "new-password" : "current-password"}
                placeholder="••••••••"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                onInput={(e) => setSenha(e.target.value)}
                className={`cm-login-input cm-login-input-senha ${modo === "criar" && senha ? (senhaForte ? "is-strong" : "is-weak") : ""}`}
              />
              <span className="cm-login-icon-right cm-login-icon-group">
                {modo === "criar" && senhaForte && (
                  <span className="cm-login-icon-valid" aria-hidden="true">
                    <ShieldCheck size={18} strokeWidth={2.5} />
                  </span>
                )}
                <button type="button" className="cm-login-eye-btn" onClick={() => setMostrarSenha((v) => !v)} aria-label={mostrarSenha ? "Esconder senha" : "Mostrar senha"}>
                  {mostrarSenha ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </span>
            </div>
            {modo === "criar" && senha && (
              <ul className="cm-login-checklist">
                <ChecklistItem ok={requisitosSenha.comprimento} texto="Mínimo 8 caracteres" />
                <ChecklistItem ok={requisitosSenha.maiuscula} texto="1 letra maiúscula" />
                <ChecklistItem ok={requisitosSenha.minuscula} texto="1 letra minúscula" />
                <ChecklistItem ok={requisitosSenha.numero} texto="1 número" />
                <ChecklistItem ok={requisitosSenha.especial} texto="1 caractere especial (!@#$%)" />
              </ul>
            )}
            {modo === "login" && (
              <Link to="/esqueceu-senha" className="cm-login-esqueceu">
                Esqueceu sua senha?
              </Link>
            )}
          </div>

          {modo === "criar" && (
            <div className="cm-login-field">
              <label htmlFor="cm-login-confirmar">Confirme sua senha</label>
              <div className="cm-login-input-wrap">
                <input
                  id="cm-login-confirmar"
                  type={mostrarConfirmar ? "text" : "password"}
                  required
                  placeholder="••••••••"
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
                  <button type="button" className="cm-login-eye-btn" onClick={() => setMostrarConfirmar((v) => !v)} aria-label={mostrarConfirmar ? "Esconder senha" : "Mostrar senha"}>
                    {mostrarConfirmar ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </span>
              </div>
              {confirmarSenha && senhasIguais && (
                <span className="cm-login-success">
                  <Check size={12} strokeWidth={3} /> Senhas coincidem
                </span>
              )}
              {confirmarSenha && !senhasIguais && <span className="cm-login-error">Senhas não coincidem</span>}
            </div>
          )}

          {/* Antes o disabled também checava email/senha vazio no state. Com
              autofill do Chrome (preenche o DOM sem sempre disparar onChange
              a tempo), o state ficava vazio e o botão travava disabled+cinza
              claro num card branco — visualmente sumia, mesmo sempre presente
              no DOM. Agora só desabilita por loading; a validação de campo
              vazio/senha fraca continua sendo feita dentro do handleSubmit
              (e o `required` do HTML barra o submit nativo se estiver vazio). */}
          <button type="submit" disabled={loading} className="cm-login-submit is-ready">
            {loading ? "Carregando..." : modo === "criar" ? "Criar conta e começar" : "Entrar"}
          </button>
        </form>

        <div className="cm-login-toggle">
          {modo === "login" ? (
            <button type="button" onClick={() => setModo("criar")}>
              Primeiro acesso? Criar senha
            </button>
          ) : (
            <button type="button" onClick={() => setModo("login")}>
              Já tenho senha
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// Item do checklist de força da senha: bolinha cinza vazia -> bolinha verde
// com check quando o requisito é cumprido, com transição suave.
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
