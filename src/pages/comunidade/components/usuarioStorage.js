import { useEffect, useState } from "react";

// Fonte única do "usuário atual" pra todo /comunidade — usada por
// DesafioSemana, ContadorDesafioSemanal e useMeditacaoHoje pra garantir que
// TODA chave de localStorage inclua o e-mail de quem está logado, e que
// trocar de conta recarregue os dados certos sem precisar de refresh.
// Exportado (não só interno) porque useComunidadeAuth.js também precisa
// escutar esse mesmo evento pra sincronizar `session.nome` na sidebar
// assim que Configuracoes.jsx salva um novo "como quer ser chamado", sem
// precisar de reload nem trocar de rota.
export const EVENTO_SESSAO_MUDOU = "comunidade:sessaoMudou";

export function lerEmailSessao() {
  try {
    const sess = JSON.parse(localStorage.getItem("comunidade_session") || "{}");
    return sess.email || localStorage.getItem("user_email") || "";
  } catch {
    return localStorage.getItem("user_email") || "";
  }
}

// Nunca deixa uma chave "vazar" pra um bucket global por engano: sem
// sessão, cai num bucket "anonimo" isolado — nunca no nome puro (que era o
// bug: `desafioSemana_v1` sem sufixo nenhum, compartilhado por todo mundo
// que já usou aquele navegador).
export function chaveUsuario(base, email) {
  return `${base}_${email || "anonimo"}`;
}

// Login.jsx chama depois de gravar a sessão; limparSessao() (useComunidadeAuth.js)
// chama depois de apagar. Qualquer hook com useEmailSessao() montado no ar
// recarrega na hora — cobre troca de conta mesmo nos casos em que a rota
// não desmonta a árvore inteira.
export function avisarSessaoMudou() {
  window.dispatchEvent(new CustomEvent(EVENTO_SESSAO_MUDOU));
}

// Versão reativa de lerEmailSessao(): resincroniza sozinha quando a sessão
// muda (login/logout nesta aba) ou quando outra aba loga/desloga (evento
// nativo "storage").
export function useEmailSessao() {
  const [email, setEmail] = useState(lerEmailSessao);

  useEffect(() => {
    function sincronizar() {
      setEmail(lerEmailSessao());
    }
    window.addEventListener(EVENTO_SESSAO_MUDOU, sincronizar);
    window.addEventListener("storage", sincronizar);
    return () => {
      window.removeEventListener(EVENTO_SESSAO_MUDOU, sincronizar);
      window.removeEventListener("storage", sincronizar);
    };
  }, []);

  return email;
}

// Pedido explícito do cliente pra conseguir testar troca de conta: loga no
// console qual usuário está sendo usado toda vez que algo é salvo.
export function logSalvandoParaUsuario(modulo, email) {
  console.log(`[Clube Presença] ${modulo} → salvando para usuário:`, email || "(sem sessão / anônimo)");
}

// Nome pra exibir/gravar quando o usuário comenta (ComentariosFeed.jsx) —
// mesma prioridade que a sidebar já usa: "como quer ser chamado"
// (comunidade_session.nome, atualizável em Configuracoes.jsx) primeiro,
// caindo pro nome de cadastro gravado no login (userName) se a sessão ainda
// não tiver passado por Configuracoes.
export function lerNomeSessao() {
  try {
    const sess = JSON.parse(localStorage.getItem("comunidade_session") || "{}");
    return sess.nome || localStorage.getItem("userName") || "Aluno";
  } catch {
    return localStorage.getItem("userName") || "Aluno";
  }
}
