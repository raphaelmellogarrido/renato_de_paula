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

// Fuso travado em America/Sao_Paulo (não o fuso do sistema operacional do
// aparelho) — evita depender do relógio/fuso do dispositivo estar
// configurado certo, e garante que "hoje" bate com o que o backend também
// calcula em -03:00 (ver _conexao.php).
const FUSO_BRASIL = "America/Sao_Paulo";

// Formato pedido pro localStorage: dd/mm/aaaa, no fuso de Brasília.
function hojePtBr() {
  return new Date().toLocaleDateString("pt-BR", { timeZone: FUSO_BRASIL });
}

// Formato pedido pro corpo do POST / histórico: aaaa-mm-dd, no fuso de
// Brasília. `en-CA` é o truque padrão pra Intl devolver já em YYYY-MM-DD.
function hojeIso() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: FUSO_BRASIL }).format(new Date());
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

  // Busca o histórico real de presenças no servidor ao montar/trocar de
  // conta — `presenca.php` é a fonte de verdade; o localStorage é só cache
  // rápido pra pintar a tela sem esperar rede. Corrige o caso relatado de
  // "desmarca sozinho": se o localStorage foi perdido (aba anônima,
  // storage limpo pelo navegador, outro aparelho) mas o servidor já tem
  // presença de hoje, reconcilia o botão pra marcado — nunca o contrário
  // (nunca desmarca com base no servidor, só complementa).
  useEffect(() => {
    if (!email) return;
    let cancelado = false;

    fetch(`${PRESENCA_URL}?email=${encodeURIComponent(email)}`)
      .then((r) => r.json())
      .then((dados) => {
        if (cancelado) return;
        console.log("[Clube Presença] presença carregada com a data retornada:", dados);

        const historicoServidor = Array.isArray(dados?.historico) ? dados.historico : [];
        if (!historicoServidor.length) return;

        // Merge — nunca overwrite: soma o que já está local com o que veio
        // do servidor, sem apagar nada que já estava salvo.
        const historicoMesclado = Array.from(new Set([...lerHistorico(email), ...historicoServidor])).sort();

        try {
          localStorage.setItem(chaveUsuario(CHAVE_BASE_HISTORICO, email), JSON.stringify(historicoMesclado));
          // Servidor já tem presença de hoje (fuso Brasil) mas o aparelho
          // não — reconcilia sem exigir novo clique.
          if (historicoServidor.includes(hojeIso())) {
            localStorage.setItem(chaveUsuario(CHAVE_BASE_DATA, email), hojePtBr());
          }
          if (Number.isFinite(dados?.streak)) {
            localStorage.setItem(chaveUsuario(CHAVE_BASE_STREAK, email), String(dados.streak));
          }
        } catch {
          // localStorage indisponível (modo privado, quota cheia etc.) —
          // segue só em memória, sem travar a tela.
        }

        window.dispatchEvent(new CustomEvent(EVENTO_ATUALIZOU));
      })
      .catch((err) => {
        console.error("[Clube Presença] falha ao carregar presença do servidor:", err);
      });

    return () => {
      cancelado = true;
    };
  }, [email]);

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
