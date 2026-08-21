import { useState, useEffect } from "react";
import { avisarSessaoMudou, EVENTO_SESSAO_MUDOU } from "./usuarioStorage";

export function limparSessao() {
  localStorage.removeItem("comunidade_session");
  localStorage.removeItem("user_email");
  localStorage.removeItem("comunidade_email");
  // Avisa qualquer hook por usuário (useEmailSessao) montado no ar — sem
  // isso, um componente que não desmontasse na troca de conta continuaria
  // mostrando os dados do usuário anterior.
  avisarSessaoMudou();
}

function lerSessao() {
  try {
    const raw = localStorage.getItem("comunidade_session");
    if (raw) return JSON.parse(raw);
    const email = localStorage.getItem("user_email");
    return email ? { email } : null;
  } catch {
    return null;
  }
}

export function useComunidadeAuth() {
  // Leitura síncrona (sem efeito de montagem): localStorage já está
  // disponível no primeiro render numa SPA client-side-only como esta, e
  // isso evita o piscar "loading=true" que só existia pra esperar um
  // useEffect fazer a mesma leitura um tick depois. Mesmo padrão de
  // useEmailSessao() em usuarioStorage.js.
  const [session, setSession] = useState(lerSessao);

  // ComunidadeLayout monta esse hook uma vez só e não desmonta ao navegar
  // entre /comunidade/*, então sem isso o nome na sidebar ficava "preso" no
  // valor do login mesmo depois de salvar um novo "como quer ser chamado"
  // em Configuracoes.jsx. Reage ao mesmo evento que login/logout já disparam.
  useEffect(() => {
    function sincronizar() {
      setSession(lerSessao());
    }
    window.addEventListener(EVENTO_SESSAO_MUDOU, sincronizar);
    window.addEventListener("storage", sincronizar);
    return () => {
      window.removeEventListener(EVENTO_SESSAO_MUDOU, sincronizar);
      window.removeEventListener("storage", sincronizar);
    };
  }, []);

  return { session, loading: false };
}

export default useComunidadeAuth;
