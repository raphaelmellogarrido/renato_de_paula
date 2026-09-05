import { useState, useEffect } from "react";
import { avisarSessaoMudou, EVENTO_SESSAO_MUDOU } from "./usuarioStorage";

// Endpoint de revalidação de perfil (só avatar_url por enquanto) — ver
// public/api/hotmart/user.php (GET).
const PERFIL_URL = "/api/hotmart/user.php";

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

  // Revalida a foto de perfil com o servidor uma vez por carregamento do
  // app (este hook só monta uma vez, em ComunidadeLayout, sem desmontar ao
  // navegar — ver comentário lá) — bug reportado 26/08: comunidade_session
  // só ganha avatarUrl no login ou logo após um upload feito NESTE mesmo
  // aparelho, então trocar a foto em outro aparelho deixava este aqui preso
  // numa cópia antiga (localStorage + cache imutável da imagem) até o
  // próximo login manual. GET user.php é a fonte única da verdade
  // (avatar_versao no banco); só grava/avisa se realmente vier diferente,
  // pra não gerar re-render/evento à toa em cada carregamento.
  useEffect(() => {
    const email = lerSessao()?.email;
    if (!email) return;
    fetch(`${PERFIL_URL}?email=${encodeURIComponent(email)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!data) return;
        const sessaoAtual = lerSessao();
        if (!sessaoAtual || sessaoAtual.avatarUrl === data.avatar_url) return;
        const sessaoNova = { ...sessaoAtual, avatarUrl: data.avatar_url || null };
        localStorage.setItem("comunidade_session", JSON.stringify(sessaoNova));
        setSession(sessaoNova);
        // Avisa outros consumidores de avatar fora deste hook (ex:
        // useAvatarUrlSessao em usuarioStorage.js, usado por Mensagens.jsx)
        // — sem isso eles ficariam presos no valor antigo até o próximo
        // evento de sessão (login/upload).
        avisarSessaoMudou();
      })
      .catch(() => {}); // offline/erro: mantém o que já está em cache, sem travar o app
  }, []);

  return { session, loading: false };
}

export default useComunidadeAuth;
