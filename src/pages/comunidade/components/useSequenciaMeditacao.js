import { useEffect, useState } from "react";
import { useEmailSessao, chaveUsuario } from "./usuarioStorage";

// Mesma base de chave que useMeditacaoHoje.js já escreve (mesma base + mesmo
// e-mail via chaveUsuario) — não altera aquele hook além de adicionar essa
// gravação, só observa o resultado aqui. Esse literal precisa continuar
// igual nos dois arquivos.
const CHAVE_BASE_HISTORICO = "meditacaoHistorico";
// Mesmo evento que useMeditacaoHoje.js já dispara toda vez que "Meditei
// hoje" é clicado — reaproveita em vez de criar um segundo evento
// redundante pra a mesma ação.
const EVENTO_ATUALIZOU = "meditacaoHojeAtualizada";
const RANKING_URL = "/api/hotmart/presenca/ranking.php";

// Faixas de fallback pedidas (usadas quando o ranking.php ainda não existe
// no servidor ou está indisponível): streak 1 -> 45%, 3 -> 28%, 7 -> 12%,
// 15 -> 5%, 21+ -> 1%.
const FAIXAS_PERCENTUAL_FALLBACK = [
  { min: 21, percentual: 1 },
  { min: 15, percentual: 5 },
  { min: 7, percentual: 12 },
  { min: 3, percentual: 28 },
  { min: 1, percentual: 45 },
];

// Label de dia-da-semana a partir de `Date#getDay()` (0 = domingo).
const LABEL_POR_DIA_SEMANA = ["D", "S", "T", "Q", "Q", "S", "S"];

// Mesmo fuso travado que useMeditacaoHoje.js usa pra gravar `hojeIso()` no
// histórico (America/Sao_Paulo, não o fuso do sistema operacional). Bug
// real: aqui embaixo "hoje"/dia-da-semana eram calculados com `new Date()`
// cru, que lê o relógio no fuso do APARELHO — num aparelho configurado num
// fuso diferente de Brasília (comum em celular com fuso automático, ou PC
// mal configurado), o "hoje" gravado por useMeditacaoHoje.js (sempre -03:00)
// podia cair um dia adiante/atrás do "hoje" usado aqui pra montar as 7
// bolinhas da semana, deixando tudo apagado mesmo com presença real batida
// (streak batendo por já cair no fallback de "ontem").
const FUSO_BRASIL = "America/Sao_Paulo";

const MENSAGENS_LUDICAS = {
  "segunda-feira": { badge: "🔥 Começou na Segunda", texto: "Começar na segunda é pra quem leva a sério. 💪" },
  "terça-feira": { badge: "🔥 Começou na Terça", texto: "Terça com presença. Você não esperou a próxima segunda." },
  "quarta-feira": { badge: "🔥 Começou na Quarta", texto: "No meio da semana você escolheu você. 🪷" },
  "quinta-feira": { badge: "🔥 Começou na Quinta", texto: "Quinta já é quase sexta, mas você começou hoje." },
  "sexta-feira": { badge: "🔥 Começou na Sexta", texto: "Sexta de presença? Você é do time raro. ✨" },
  sábado: { badge: "🔥 Começou no Sábado", texto: "Sábado também é dia de cuidar da mente." },
  domingo: { badge: "🔥 Começou no Domingo", texto: "Domingo de recomeço. Perfeito pra começar. 🙏" },
};

// Formata uma data LOCAL (nunca UTC) como "YYYY-MM-DD", pra bater com o que
// useMeditacaoHoje.js grava no histórico.
function isoLocal(data) {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  const dia = String(data.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
}

// Reconstrói uma data LOCAL a partir de "YYYY-MM-DD" — `new Date("YYYY-MM-DD")`
// interpreta como UTC meia-noite, o que pode virar o dia da semana errado
// pra quem está num fuso negativo (Brasil). Sempre usar isso pra reler datas
// do histórico.
function dataLocalDeIso(iso) {
  const [ano, mes, dia] = iso.split("-").map(Number);
  return new Date(ano, mes - 1, dia);
}

// "Hoje" travado no fuso de Brasília, devolvido como Date com os campos
// ano/mes/dia já corretos (a partir daqui pode usar getFullYear/getMonth/
// getDate/getDay/setDate normalmente — só a leitura do relógio real usa
// Intl com o fuso forçado, o resto é aritmética de calendário local, igual
// dataLocalDeIso acima).
function hojeBrasil() {
  const partes = new Intl.DateTimeFormat("en-CA", { timeZone: FUSO_BRASIL, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date());
  const mapa = Object.fromEntries(partes.map((p) => [p.type, p.value]));
  return new Date(Number(mapa.year), Number(mapa.month) - 1, Number(mapa.day));
}

function lerHistoricoLocal(email) {
  try {
    const lista = JSON.parse(localStorage.getItem(chaveUsuario(CHAVE_BASE_HISTORICO, email)) || "[]");
    return Array.isArray(lista) ? lista : [];
  } catch {
    return [];
  }
}

// Streak real, contando dias consecutivos pra trás a partir de hoje. Se hoje
// ainda não foi marcado, a contagem começa em ontem (a sequência continua
// existindo, só falta marcar hoje). Qualquer buraco quebra a contagem.
function calcularStreak(historico) {
  const marcados = new Set(historico);
  const cursor = hojeBrasil();
  if (!marcados.has(isoLocal(cursor))) {
    cursor.setDate(cursor.getDate() - 1);
  }
  let streak = 0;
  while (marcados.has(isoLocal(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

// As 7 bolinhas do card "Sequência". NÃO são mais a semana-calendário
// (Seg-Dom fixo) — isso fazia as bolinhas "apagarem sozinhas" toda virada de
// semana mesmo com a sequência intacta. Agora é uma janela rolante dos
// últimos 7 dias terminando hoje, e uma bolinha só fica preenchida se aquele
// dia faz parte da sequência ATUAL (`streak`, já quebrada por buraco em
// `calcularStreak`) — nunca por estar "marcado" isoladamente no histórico.
// Efeito: bolinha nunca apaga enquanto a sequência continua (ela só cresce,
// um dia de cada vez), e quando a sequência quebra (1 dia sem meditar) o
// `streak` vira 0 e TODAS as bolinhas zeram juntas — exatamente o pedido.
function calcularBolinhasSemana(historico, streak) {
  const marcados = new Set(historico);
  const hoje = hojeBrasil();
  // Mesma regra do `calcularStreak`: se hoje ainda não foi marcado, a
  // sequência (e a janela de dias preenchidos) termina em ontem, não hoje.
  const offsetAncora = marcados.has(isoLocal(hoje)) ? 0 : 1;

  const bolinhas = [];
  for (let diasAtras = 6; diasAtras >= 0; diasAtras -= 1) {
    const data = new Date(hoje);
    data.setDate(hoje.getDate() - diasAtras);
    const concluido = diasAtras >= offsetAncora && diasAtras < offsetAncora + streak;
    bolinhas.push({ iso: isoLocal(data), label: LABEL_POR_DIA_SEMANA[data.getDay()], concluido, hoje: diasAtras === 0 });
  }
  return bolinhas;
}

function percentualFallback(streak) {
  const faixa = FAIXAS_PERCENTUAL_FALLBACK.find((f) => streak >= f.min);
  return faixa ? faixa.percentual : null;
}

// Aceita alguns formatos plausíveis de resposta do ranking.php (array puro,
// { streaks: [...] } ou { ranking: [...] }, cada item número ou objeto) —
// esse endpoint não existe neste repositório pra eu confirmar o formato
// exato, então a leitura é defensiva.
function extrairStreaks(data) {
  const lista = Array.isArray(data) ? data : Array.isArray(data?.streaks) ? data.streaks : Array.isArray(data?.ranking) ? data.ranking : [];
  return lista.map((item) => (typeof item === "number" ? item : Number(item?.streak ?? item?.dias ?? item?.sequencia))).filter((n) => Number.isFinite(n));
}

function mensagemLudica(primeiraDataIso) {
  if (!primeiraDataIso) return null;
  const nomeDia = dataLocalDeIso(primeiraDataIso).toLocaleDateString("pt-BR", { weekday: "long" }).toLowerCase();
  return MENSAGENS_LUDICAS[nomeDia] || null;
}

/**
 * Fonte de verdade do card "Sequência": lê o mesmo histórico que
 * useMeditacaoHoje.js grava a cada clique em "Meditei hoje", e deriva tudo
 * (streak real com quebra por buraco, as 7 bolinhas da semana, percentual de
 * consistência e a mensagem lúdica do dia que começou) sem precisar de
 * nenhum clique próprio — o card não é clicável.
 */
export function useSequenciaMeditacao() {
  const email = useEmailSessao();
  const [historico, setHistorico] = useState(() => lerHistoricoLocal(email));
  const [percentualApi, setPercentualApi] = useState(null);
  const [emailAnterior, setEmailAnterior] = useState(email);

  // Troca de conta / logout+login: recarrega do zero pra chave do NOVO
  // usuário (mostra "sem sequência" se for conta nova). Ajusta o estado
  // direto no render (não em efeito), mesmo padrão já usado nos outros
  // hooks por usuário desta página.
  if (email !== emailAnterior) {
    setEmailAnterior(email);
    setHistorico(lerHistoricoLocal(email));
    setPercentualApi(null);
  }

  useEffect(() => {
    function sincronizar() {
      setHistorico(lerHistoricoLocal(email));
    }
    window.addEventListener(EVENTO_ATUALIZOU, sincronizar);
    // Cobre presença marcada em outra aba/janela.
    window.addEventListener("storage", sincronizar);
    return () => {
      window.removeEventListener(EVENTO_ATUALIZOU, sincronizar);
      window.removeEventListener("storage", sincronizar);
    };
  }, [email]);

  const streak = calcularStreak(historico);

  useEffect(() => {
    if (!email) return;
    let cancelado = false;

    // AbortController com timeout de 8s: se o ranking.php demorar (ou
    // travar) além disso, desiste e segue com a faixa de fallback — nunca
    // deixa esse fetch pendurado influenciando outro estado da tela.
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    fetch(`${RANKING_URL}?email=${encodeURIComponent(email)}`, { signal: controller.signal })
      .then((r) => r.json())
      .then((data) => {
        const streaks = extrairStreaks(data);
        if (!streaks.length) return;
        const total = streaks.length;
        const comMenos = streaks.filter((s) => s < streak).length;
        const percentil = Math.round(100 - (comMenos / total) * 100);
        if (!cancelado) setPercentualApi(Math.max(1, Math.min(100, percentil)));
      })
      .catch(() => {
        // ranking.php indisponível, lento (abort do timeout) ou ainda não
        // existe — segue com a faixa de fallback calculada a partir do
        // streak local.
      })
      .finally(() => clearTimeout(timeoutId));

    return () => {
      cancelado = true;
      controller.abort();
      clearTimeout(timeoutId);
    };
  }, [email, streak]);

  const bolinhas = calcularBolinhasSemana(historico, streak);
  const percentual = percentualApi ?? percentualFallback(streak);
  const primeiraData = historico.length ? [...historico].sort()[0] : null;
  const ludico = streak === 1 || streak === 2 ? mensagemLudica(primeiraData) : null;

  return { streak, bolinhas, percentual, ludico };
}

export default useSequenciaMeditacao;
