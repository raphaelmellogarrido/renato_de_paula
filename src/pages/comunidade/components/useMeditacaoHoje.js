import { useEffect, useState } from "react";
import { useEmailSessao, chaveUsuario, logSalvandoParaUsuario } from "./usuarioStorage";

// Botão "Meditei hoje" (ComunidadeTopBar) + Ranking de Presença
// (ColunaEncontros) são dois componentes irmãos, sem pai em comum que
// guarde estado — esse hook é a fonte de verdade compartilhada entre os
// dois: cada instância lê o MESMO localStorage (por usuário) e se
// resincroniza via CustomEvent quando qualquer uma delas marca a presença
// do dia, ou quando a sessão troca de conta.
const CHAVE_BASE_DATA = "meditacaoHoje_ultimaData";
const CHAVE_BASE_STREAK = "meditacaoHoje_streak";
// Mesma base de chave que useSequenciaMeditacao.js lê (mesmo padrão de
// acoplamento por literal usado entre DesafioSemana.jsx e
// ContadorDesafioSemanal.jsx) — mudar aqui exige mudar lá também.
const CHAVE_BASE_HISTORICO = "meditacaoHistorico";
const PRESENCA_URL = "/api/hotmart/presenca.php";
const EVENTO_ATUALIZOU = "meditacaoHojeAtualizada";

// Formato pedido pro localStorage: dd/mm/aaaa, no fuso do navegador (nunca
// UTC) — é isso que faz a virada de dia bater com a meia-noite LOCAL da
// pessoa, não a de Greenwich.
function hojePtBr() {
  return new Date().toLocaleDateString("pt-BR");
}

// Formato pedido pro corpo do POST: aaaa-mm-dd.
function hojeIso() {
  const d = new Date();
  const ano = d.getFullYear();
  const mes = String(d.getMonth() + 1).padStart(2, "0");
  const dia = String(d.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
}

function lerUltimaData(email) {
  return localStorage.getItem(chaveUsuario(CHAVE_BASE_DATA, email)) || "";
}

function lerStreak(email) {
  const bruto = Number(localStorage.getItem(chaveUsuario(CHAVE_BASE_STREAK, email)));
  return Number.isFinite(bruto) && bruto > 0 ? bruto : 0;
}

function lerHistorico(email) {
  try {
    const lista = JSON.parse(localStorage.getItem(chaveUsuario(CHAVE_BASE_HISTORICO, email)) || "[]");
    return Array.isArray(lista) ? lista : [];
  } catch {
    return [];
  }
}

// Se a última marcação não foi hoje (dia local mudou — seja por reload
// depois da virada, seja pelo timer de meia-noite, seja troca de conta),
// o botão libera de novo.
function marcadoHojeAgora(email) {
  return lerUltimaData(email) === hojePtBr();
}

// ms até a próxima meia-noite LOCAL — usado pra resetar o botão sozinho se
// a pessoa deixar a aba aberta passando da virada do dia, sem precisar
// dar refresh.
function msAteProximaMeiaNoite() {
  const agora = new Date();
  const proximaMeiaNoite = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate() + 1, 0, 0, 0, 0);
  return proximaMeiaNoite.getTime() - agora.getTime();
}

export function useMeditacaoHoje() {
  const email = useEmailSessao();
  const [marcado, setMarcado] = useState(() => marcadoHojeAgora(email));
  const [streak, setStreak] = useState(() => lerStreak(email));

  useEffect(() => {
    function sincronizar() {
      setMarcado(marcadoHojeAgora(email));
      setStreak(lerStreak(email));
    }

    // Roda também quando `email` muda (troca de conta / logout+login):
    // mostra o streak zerado se for conta nova, em vez de arrastar o
    // número de quem usou o navegador antes.
    sincronizar();
    window.addEventListener(EVENTO_ATUALIZOU, sincronizar);
    // Cobre presença marcada em outra aba/janela.
    window.addEventListener("storage", sincronizar);
    // +1s de folga sobre o cálculo pra garantir que já virou o dia local
    // quando o timer disparar.
    const timer = setTimeout(sincronizar, msAteProximaMeiaNoite() + 1000);

    return () => {
      window.removeEventListener(EVENTO_ATUALIZOU, sincronizar);
      window.removeEventListener("storage", sincronizar);
      clearTimeout(timer);
    };
  }, [email, streak]); // reagenda o timer de meia-noite depois de cada marcação/virada/troca de conta

  function marcarHoje() {
    if (marcadoHojeAgora(email)) return; // já marcado hoje — impossível desmarcar

    const novoStreak = lerStreak(email) + 1;
    const hojeIsoStr = hojeIso();
    const historicoAtual = lerHistorico(email);
    // Adiciona hoje no histórico só se ainda não estiver lá — protege contra
    // clique duplo/corrida de eventos duplicando a mesma data.
    const novoHistorico = historicoAtual.includes(hojeIsoStr) ? historicoAtual : [...historicoAtual, hojeIsoStr];

    logSalvandoParaUsuario("MeditacaoHoje", email);
    try {
      localStorage.setItem(chaveUsuario(CHAVE_BASE_DATA, email), hojePtBr());
      localStorage.setItem(chaveUsuario(CHAVE_BASE_STREAK, email), String(novoStreak));
      localStorage.setItem(chaveUsuario(CHAVE_BASE_HISTORICO, email), JSON.stringify(novoHistorico));
    } catch {
      // localStorage indisponível (modo privado, quota cheia etc.) — segue
      // só em memória, sem travar o clique.
    }

    setMarcado(true);
    setStreak(novoStreak);
    // Avisa qualquer outra instância do hook montada na página (o Ranking e
    // o card Sequência) pra reler o localStorage e atualizar na hora, sem
    // refresh.
    window.dispatchEvent(new CustomEvent(EVENTO_ATUALIZOU));

    fetch(PRESENCA_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      // Manda o e-mail e o histórico completo também (além do que o
      // $_SESSION do PHP já deveria saber) — não depende só do cookie de
      // sessão pra separar por usuário, o que evita problemas se front e
      // /api ficarem em origens diferentes (ex: dev local).
      body: JSON.stringify({ data: hojeIsoStr, acao: "meditei", email, historico: novoHistorico }),
    })
      .then((r) => r.json())
      .then((data) => {
        // O servidor calcula o streak a partir de `presencas` no banco —
        // fonte de verdade real (cobre presença marcada em outro
        // navegador/dispositivo). Reconcilia o valor otimista assim que a
        // resposta chega, em vez de confiar só no contador local.
        if (Number.isFinite(data?.streak)) {
          localStorage.setItem(chaveUsuario(CHAVE_BASE_STREAK, email), String(data.streak));
          setStreak(data.streak);
        }
      })
      .catch((err) => {
        console.error("Não foi possível sincronizar a presença de hoje com o servidor:", err);
      });
  }

  return { marcado, streak, marcarHoje };
}

export default useMeditacaoHoje;
