import { useEffect, useState } from "react";
import { Check, Eye, EyeOff, ShieldCheck, CheckCircle2, XCircle } from "lucide-react";
import {
  useEmailSessao,
  chaveUsuario,
  avisarSessaoMudou,
  logSalvandoParaUsuario,
  extrairPrimeiroNome,
  CHAVE_BASE_NOME_COMPLETO,
  CHAVE_BASE_PRIMEIRO_NOME,
} from "./components/usuarioStorage";
import { checarRequisitosSenha } from "./components/senhaForte";

// Endpoints assumidos por analogia com os demais deste app (login.php,
// register.php, presenca.php sempre em /api/hotmart/*) — não existem neste
// repositório pra eu confirmar o contrato exato, então o formato do corpo
// da requisição é minha melhor suposição. Se o back-end usar outro nome de
// campo/rota, é só ajustar aqui.
const PERFIL_URL = "/api/hotmart/user.php";
const SENHA_URL = "/api/hotmart/user/change-password.php";

// TODO: reativar lembrete quando configurar Resend + Cron Hostinger
//
// CARD 3 - PREFERÊNCIAS (horário do lembrete diário) removido temporariamente
// da tela em 2026-08-21 a pedido do cliente — o backend de lembrete
// (tabela `user_reminders` + endpoint /api/cron/lembretes.php, que dispara o
// e-mail via Resend numa Cron Job da Hostinger) ainda não está configurado
// no servidor. Nada foi apagado: é só religar quando o backend existir.
//
// O que existia e volta assim que o backend estiver pronto:
// 1. const CHAVE_BASE_LEMBRETE = "lembreteHorario";
// 2. Estado: const [lembreteHorario, setLembreteHorario] = useState(
//      () => lerLocal(chaveUsuario(CHAVE_BASE_LEMBRETE, email)) || "07:00",
//    );
//    — e resetar junto no bloco de troca de conta (if (email !== emailAnterior) {...}).
// 3. Handler:
//    function handleLembreteChange(e) {
//      const valor = e.target.value;
//      setLembreteHorario(valor);
//      localStorage.setItem(chaveUsuario(CHAVE_BASE_LEMBRETE, email), valor);
//      fetch(PERFIL_URL, {
//        method: "PATCH",
//        headers: { "Content-Type": "application/json" },
//        body: JSON.stringify({ email, lembrete_horario: valor }),
//      });
//    }
// 4. Card JSX (ver histórico do git): input type="time", label "Horário do
//    lembrete diário", hint "Vamos te lembrar de meditar nesse horário".
//
// O botão "Sair da conta" que também vivia neste card 3 foi removido de
// propósito (não é sobre o TODO acima) — o logout já existe e continua
// funcionando normalmente pelo botão da sidebar (ComunidadeSidebar.jsx).

function lerLocal(chave) {
  try {
    return localStorage.getItem(chave) || "";
  } catch {
    return "";
  }
}

// Mesma leitura síncrona usada em ColunaEncontros.jsx: `comunidade_session.nome`
// já é, hoje, o nome mostrado no Ranking — vira o valor inicial de "Nome e
// sobrenome" (campo que agora é a fonte do Ranking), caso ainda não exista
// rascunho salvo por usuário.
function lerNomeSessaoAtual() {
  try {
    const sess = JSON.parse(localStorage.getItem("comunidade_session") || "{}");
    return sess.nome || "";
  } catch {
    return "";
  }
}

// Mesmo regex de Login.jsx — só letras (com acentos pt-BR) e espaço, usado
// nos dois campos porque os dois aparecem no Ranking/Comunidade.
const REGEX_NOME = /^[A-Za-zÀ-ÖØ-öø-ÿ' ]{2,}$/;

function nomeValido(valor) {
  return REGEX_NOME.test(valor.trim());
}

// Item do checklist de força da senha — mesmo visual do cadastro
// (Login.jsx), só que com as classes `cm-config-*` (esta página vive dentro
// de .comunidade-app/ComunidadeApp.css, não de Login.css).
function ChecklistItem({ ok, texto }) {
  return (
    <li className={`cm-config-check-item ${ok ? "is-ok" : ""}`}>
      <span className="cm-config-check-dot" aria-hidden="true">
        {ok && <Check size={11} strokeWidth={3} />}
      </span>
      {texto}
    </li>
  );
}

// Página /comunidade/configuracoes — perfil, conta/senha e preferências, os
// 3 cards pedidos. Cada salvamento é POR USUÁRIO (chaveUsuario com o e-mail
// da sessão) e some/reaparece sozinho se a conta trocar nesta aba, mesmo
// padrão já usado no resto do /comunidade.
// "Nome e sobrenome": rascunho salvo por usuário, senão o nome já usado na
// sessão atual (comunidade_session.nome).
function lerNomeSobrenomeInicial(email) {
  return lerLocal(chaveUsuario(CHAVE_BASE_NOME_COMPLETO, email)) || lerNomeSessaoAtual();
}

// "Primeiro nome": rascunho salvo por usuário, senão SUGERE a primeira
// palavra do nome completo em vez de deixar vazio (era o bug: campo ficava
// vazio com placeholder "Ex: Raphael" e contador 0/11 na primeira visita).
// É só um valor inicial lido do storage — depois disso o campo vive só no
// estado do React e só muda quando o usuário digita ou troca de conta;
// nunca é sobrescrito a partir de "Nome e sobrenome" por um useEffect.
function lerPrimeiroNomeInicial(email, nomeSobrenomeInicial) {
  return lerLocal(chaveUsuario(CHAVE_BASE_PRIMEIRO_NOME, email)) || extrairPrimeiroNome(nomeSobrenomeInicial);
}

function Configuracoes() {
  const email = useEmailSessao();

  const [emailAnterior, setEmailAnterior] = useState(email);
  const [nomeSobrenome, setNomeSobrenome] = useState(() => lerNomeSobrenomeInicial(email));
  const [primeiroNome, setPrimeiroNome] = useState(() => lerPrimeiroNomeInicial(email, nomeSobrenome));

  // Borda só fica verde enquanto o campo está focado e válido; ao sair do
  // campo (blur) ela volta pra cor neutra (var(--cm-border)), em vez de
  // ficar verde permanentemente depois da primeira validação.
  const [focoNome, setFocoNome] = useState(false);
  const [focoPrimeiro, setFocoPrimeiro] = useState(false);

  // Troca de conta nesta mesma aba: recarrega os campos do usuário novo em
  // vez de deixar os dados do anterior na tela. Ajuste direto no render
  // (não em efeito), mesmo padrão já usado nos outros hooks/páginas por
  // usuário desta área.
  if (email !== emailAnterior) {
    setEmailAnterior(email);
    const novoNomeSobrenome = lerNomeSobrenomeInicial(email);
    setNomeSobrenome(novoNomeSobrenome);
    setPrimeiroNome(lerPrimeiroNomeInicial(email, novoNomeSobrenome));
  }

  const [salvandoPerfil, setSalvandoPerfil] = useState(false);
  const [senhaAtual, setSenhaAtual] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarNovaSenha, setConfirmarNovaSenha] = useState("");
  const [verSenhaAtual, setVerSenhaAtual] = useState(false);
  const [verNovaSenha, setVerNovaSenha] = useState(false);
  const [verConfirmar, setVerConfirmar] = useState(false);
  const [trocandoSenha, setTrocandoSenha] = useState(false);
  const [toast, setToast] = useState(null); // { tipo: "sucesso" | "erro", texto }

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3200);
    return () => clearTimeout(t);
  }, [toast]);

  function mostrarToast(tipo, texto) {
    setToast({ tipo, texto });
  }

  const nomeOk = nomeValido(nomeSobrenome);
  const primeiroNomeOk = nomeValido(primeiroNome);
  const podeSalvarPerfil = nomeOk && primeiroNomeOk && !salvandoPerfil;

  const requisitosSenha = checarRequisitosSenha(novaSenha);
  const novaSenhaForte = Object.values(requisitosSenha).every(Boolean);
  const senhasIguais = confirmarNovaSenha.length > 0 && novaSenha === confirmarNovaSenha;
  const podeAlterarSenha = senhaAtual.trim().length > 0 && novaSenhaForte && senhasIguais && !trocandoSenha;

  async function handleSalvarPerfil(e) {
    e.preventDefault();
    if (!podeSalvarPerfil) return;

    setSalvandoPerfil(true);
    logSalvandoParaUsuario("Configuracoes/Perfil", email);
    try {
      const res = await fetch(PERFIL_URL, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name: nomeSobrenome.trim(), display_name: primeiroNome.trim() }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.erro || "Não foi possível salvar o perfil");
      }

      // localStorage por usuário + sessão + sidebar (via avisarSessaoMudou,
      // que useComunidadeAuth.js agora escuta) — tudo na hora, sem reload.
      // "Nome e sobrenome" é o nome do Ranking/Comunidade, então é ele (não
      // "Primeiro nome") que vai pra chave legada "userName" e pro
      // comunidade_session.nome. "Primeiro nome" também entra na sessão
      // (comunidade_session.primeiroNome) — sem isso a saudação da sidebar
      // ("Olá, X") continuava presa na primeira palavra de "Nome e
      // sobrenome" mesmo depois de salvar um "Primeiro nome" diferente.
      localStorage.setItem(chaveUsuario(CHAVE_BASE_NOME_COMPLETO, email), nomeSobrenome.trim());
      localStorage.setItem(chaveUsuario(CHAVE_BASE_PRIMEIRO_NOME, email), primeiroNome.trim());
      localStorage.setItem("userName", nomeSobrenome.trim());
      const sessaoAntiga = JSON.parse(localStorage.getItem("comunidade_session") || "{}");
      localStorage.setItem(
        "comunidade_session",
        JSON.stringify({ ...sessaoAntiga, email, nome: nomeSobrenome.trim(), primeiroNome: primeiroNome.trim() }),
      );
      avisarSessaoMudou();
      // "storage" não dispara na própria aba nativamente (só em outras abas)
      // e "perfil-atualizado" é o evento dedicado que RankingPresenca.jsx
      // escuta pra trocar o nome exibido sem esperar o próximo fetch do
      // ranking.php — dispara os dois pra cobrir esta aba e as outras.
      window.dispatchEvent(new Event("storage"));
      window.dispatchEvent(new CustomEvent("perfil-atualizado", { detail: { nome: nomeSobrenome.trim() } }));

      mostrarToast("sucesso", "Perfil atualizado");
    } catch (err) {
      mostrarToast("erro", err.message || "Erro ao salvar perfil");
    } finally {
      setSalvandoPerfil(false);
    }
  }

  async function handleAlterarSenha(e) {
    e.preventDefault();
    if (!podeAlterarSenha) return;

    setTrocandoSenha(true);
    logSalvandoParaUsuario("Configuracoes/Senha", email);
    try {
      const res = await fetch(SENHA_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, senha_atual: senhaAtual, nova_senha: novaSenha }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.erro || "Não foi possível alterar a senha");

      setSenhaAtual("");
      setNovaSenha("");
      setConfirmarNovaSenha("");
      mostrarToast("sucesso", "Senha alterada com sucesso");
    } catch (err) {
      mostrarToast("erro", err.message || "Erro ao alterar senha");
    } finally {
      setTrocandoSenha(false);
    }
  }

  return (
    <div className="cm-config-page">
      <div className="cm-config-header">
        <h1>Configurações</h1>
        <p>Gerencie seu perfil</p>
      </div>

      {/* CARD 1 — PERFIL */}
      <form className="cm-config-card" onSubmit={handleSalvarPerfil}>
        <h2 className="cm-config-card-title">Perfil</h2>

        <div className="cm-config-field">
          <label htmlFor="cm-config-nome">Nome e sobrenome</label>
          <div className="cm-config-input-wrap">
            <input
              id="cm-config-nome"
              type="text"
              required
              maxLength={20}
              placeholder="Ex: Raphael Mello"
              value={nomeSobrenome}
              onChange={(e) => {
                const valor = e.target.value;
                if (valor.length <= 20) setNomeSobrenome(valor);
              }}
              onFocus={() => setFocoNome(true)}
              onBlur={() => setFocoNome(false)}
              className={`cm-config-input ${focoNome && nomeSobrenome ? (nomeOk ? "is-valid" : "is-invalid") : ""}`}
            />
            {focoNome && nomeSobrenome && nomeOk && (
              <span className="cm-config-icon-right" aria-hidden="true">
                <Check size={18} strokeWidth={3} className="cm-config-icon-valid" />
              </span>
            )}
          </div>
          <div className="cm-config-field-footer">
            <span className="cm-config-hint">É esse nome que aparece no Ranking de Presença e na Comunidade.</span>
            <span className="cm-config-counter">{nomeSobrenome.length}/20</span>
          </div>
          {nomeSobrenome && !nomeOk && <span className="cm-config-error">Use apenas letras e espaço (mínimo 2 caracteres)</span>}
        </div>

        <div className="cm-config-field">
          <label htmlFor="cm-config-apelido">Primeiro nome</label>
          <div className="cm-config-input-wrap">
            <input
              id="cm-config-apelido"
              type="text"
              required
              maxLength={11}
              placeholder="Ex: Raphael"
              value={primeiroNome}
              onChange={(e) => {
                const valor = e.target.value;
                if (valor.length <= 11) setPrimeiroNome(valor);
              }}
              onFocus={() => setFocoPrimeiro(true)}
              onBlur={() => setFocoPrimeiro(false)}
              className={`cm-config-input ${focoPrimeiro && primeiroNome ? (primeiroNomeOk ? "is-valid" : "is-invalid") : ""}`}
            />
            {focoPrimeiro && primeiroNome && primeiroNomeOk && (
              <span className="cm-config-icon-right" aria-hidden="true">
                <Check size={18} strokeWidth={3} className="cm-config-icon-valid" />
              </span>
            )}
          </div>
          <div className="cm-config-field-footer">
            <span className="cm-config-hint">Nome que vai ser exibido no seu perfil</span>
            <span className="cm-config-counter">{primeiroNome.length}/11</span>
          </div>
          {primeiroNome && !primeiroNomeOk && <span className="cm-config-error">Use apenas letras e espaço (mínimo 2 caracteres)</span>}
        </div>

        <button type="submit" disabled={!podeSalvarPerfil} className={`cm-config-btn ${podeSalvarPerfil ? "is-ready" : ""}`}>
          {salvandoPerfil ? "Salvando..." : "Salvar perfil"}
        </button>
      </form>

      {/* CARD 2 — CONTA */}
      <div className="cm-config-card">
        <h2 className="cm-config-card-title">Conta</h2>

        <div className="cm-config-field">
          <label htmlFor="cm-config-email">Email</label>
          <input id="cm-config-email" type="email" value={email} disabled readOnly className="cm-config-input is-disabled" />
          <span className="cm-config-hint">Seu acesso é vinculado ao email da Hotmart</span>
        </div>

        <hr className="cm-config-sep" />

        <form onSubmit={handleAlterarSenha}>
          <h3 className="cm-config-subtitle">Alterar senha</h3>

          <div className="cm-config-field">
            <label htmlFor="cm-config-senha-atual">Senha atual</label>
            <div className="cm-config-input-wrap">
              <input
                id="cm-config-senha-atual"
                type={verSenhaAtual ? "text" : "password"}
                required
                value={senhaAtual}
                onChange={(e) => setSenhaAtual(e.target.value)}
                className="cm-config-input cm-config-input-senha"
              />
              <span className="cm-config-icon-right cm-config-icon-group">
                <button
                  type="button"
                  className="cm-config-eye-btn"
                  onClick={() => setVerSenhaAtual((v) => !v)}
                  aria-label={verSenhaAtual ? "Esconder senha" : "Mostrar senha"}
                >
                  {verSenhaAtual ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </span>
            </div>
          </div>

          <div className="cm-config-field">
            <label htmlFor="cm-config-nova-senha">Nova senha</label>
            <div className="cm-config-input-wrap">
              <input
                id="cm-config-nova-senha"
                type={verNovaSenha ? "text" : "password"}
                required
                minLength={8}
                value={novaSenha}
                onChange={(e) => setNovaSenha(e.target.value)}
                className={`cm-config-input cm-config-input-senha ${novaSenha ? (novaSenhaForte ? "is-strong" : "is-weak") : ""}`}
              />
              <span className="cm-config-icon-right cm-config-icon-group">
                {novaSenha && novaSenhaForte && (
                  <span className="cm-config-icon-valid" aria-hidden="true">
                    <ShieldCheck size={18} strokeWidth={2.5} />
                  </span>
                )}
                <button
                  type="button"
                  className="cm-config-eye-btn"
                  onClick={() => setVerNovaSenha((v) => !v)}
                  aria-label={verNovaSenha ? "Esconder senha" : "Mostrar senha"}
                >
                  {verNovaSenha ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </span>
            </div>
            {novaSenha && (
              <ul className="cm-config-checklist">
                <ChecklistItem ok={requisitosSenha.comprimento} texto="Mínimo 8 caracteres" />
                <ChecklistItem ok={requisitosSenha.maiuscula} texto="1 letra maiúscula" />
                <ChecklistItem ok={requisitosSenha.minuscula} texto="1 letra minúscula" />
                <ChecklistItem ok={requisitosSenha.numero} texto="1 número" />
                <ChecklistItem ok={requisitosSenha.especial} texto="1 caractere especial (!@#$%)" />
              </ul>
            )}
          </div>

          <div className="cm-config-field">
            <label htmlFor="cm-config-confirmar-senha">Confirmar nova senha</label>
            <div className="cm-config-input-wrap">
              <input
                id="cm-config-confirmar-senha"
                type={verConfirmar ? "text" : "password"}
                required
                value={confirmarNovaSenha}
                onChange={(e) => setConfirmarNovaSenha(e.target.value)}
                className={`cm-config-input cm-config-input-senha ${confirmarNovaSenha ? (senhasIguais ? "is-valid" : "is-invalid") : ""}`}
              />
              <span className="cm-config-icon-right cm-config-icon-group">
                {senhasIguais && (
                  <span className="cm-config-icon-valid" aria-hidden="true">
                    <Check size={18} strokeWidth={3} />
                  </span>
                )}
                <button
                  type="button"
                  className="cm-config-eye-btn"
                  onClick={() => setVerConfirmar((v) => !v)}
                  aria-label={verConfirmar ? "Esconder senha" : "Mostrar senha"}
                >
                  {verConfirmar ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </span>
            </div>
            {confirmarNovaSenha && senhasIguais && (
              <span className="cm-config-success">
                <Check size={12} strokeWidth={3} /> Senhas coincidem
              </span>
            )}
            {confirmarNovaSenha && !senhasIguais && <span className="cm-config-error">Senhas não coincidem</span>}
          </div>

          <button type="submit" disabled={!podeAlterarSenha} className={`cm-config-btn ${podeAlterarSenha ? "is-ready" : ""}`}>
            {trocandoSenha ? "Alterando..." : "Alterar senha"}
          </button>
        </form>
      </div>

      {toast && (
        <div className={`cm-config-toast ${toast.tipo === "erro" ? "is-erro" : "is-sucesso"}`} role="status">
          {toast.tipo === "erro" ? <XCircle size={16} /> : <CheckCircle2 size={16} />}
          {toast.texto}
        </div>
      )}
    </div>
  );
}

export default Configuracoes;
