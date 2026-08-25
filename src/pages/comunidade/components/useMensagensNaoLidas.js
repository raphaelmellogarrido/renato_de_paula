import { useCallback, useEffect, useState } from "react";
import { useEmailSessao } from "./usuarioStorage";

const LISTAR_URL = "/api/mensagens/listar.php";
const INTERVALO_MS = 30000; // mais frequente que o pulso (60s) — é notificação pessoal, não agregado
// Mesmo padrão de acoplamento por evento global literal (não import) já
// usado em MeditandoJunto.jsx/RankingPresenca.jsx — Mensagens.jsx dispara
// isso depois de marcar como lida, pra o badge da sidebar sumir na hora em
// vez de esperar o próximo tick do polling.
export const EVENTO_MENSAGENS_ATUALIZOU = "comunidadeMensagensAtualizou";

// Contagem de mensagens privadas não lidas (Tarefa 2) — usado pelo card
// "Mensagens" na sidebar (ComunidadeSidebar.jsx) pro badge vermelho. Mesmo
// padrão de polling de MeditandoJunto.jsx: fetch imediato no mount +
// setInterval, e reage a um evento global pra atualizar sem esperar o tick.
function useMensagensNaoLidas() {
  const email = useEmailSessao();
  const [naoLidas, setNaoLidas] = useState(0);

  const carregar = useCallback(() => {
    if (!email) {
      // Reseta de forma assíncrona (não direto no corpo do effect) — mesmo
      // motivo do .then() abaixo: evita o setState síncrono dentro de
      // useEffect que o react-hooks/set-state-in-effect reclama.
      Promise.resolve().then(() => setNaoLidas(0));
      return;
    }
    fetch(`${LISTAR_URL}?email=${encodeURIComponent(email)}&apenas_contagem=1`, { cache: "no-store" })
      .then((r) => r.json())
      .then((dados) => {
        if (dados?.ok) setNaoLidas(dados.naoLidas || 0);
      })
      .catch(() => {
        // endpoint indisponível (ex: dev local sem PHP) — mantém o último
        // valor conhecido, nunca quebra a sidebar por causa disso.
      });
  }, [email]);

  useEffect(() => {
    carregar();
    const intervalo = setInterval(carregar, INTERVALO_MS);
    return () => clearInterval(intervalo);
  }, [carregar]);

  useEffect(() => {
    window.addEventListener(EVENTO_MENSAGENS_ATUALIZOU, carregar);
    return () => window.removeEventListener(EVENTO_MENSAGENS_ATUALIZOU, carregar);
  }, [carregar]);

  return naoLidas;
}

export default useMensagensNaoLidas;
