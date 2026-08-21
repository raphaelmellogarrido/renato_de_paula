import { useEffect, useState } from "react";
import { Repeat2 } from "lucide-react";
import { DESAFIO_SEMANA } from "../data/mockData";
import { useEmailSessao, chaveUsuario, logSalvandoParaUsuario } from "./usuarioStorage";

// Lê a MESMA chave que DesafioSemana.jsx já escreve (mesma base + mesmo
// e-mail via chaveUsuario) — não altera aquele componente, só observa o
// resultado. Esse literal precisa continuar igual ao CHAVE_BASE de
// DesafioSemana.jsx, senão os dois desincronizam silenciosamente.
const CHAVE_BASE_DESAFIO_SEMANA = "desafioSemana_v1";
const CHAVE_BASE_CONTADOR = "desafioSemanalContador";
const CHAVE_BASE_SEMANAS = "desafioSemanalSemanasCompletadas";

// Sem listener de storage confiável pra escrita na mesma aba (o evento
// nativo "storage" só dispara em OUTRAS abas), então verifica a cada
// segundo se o desafio virou 3/3 — leve o bastante (3 leituras de
// localStorage) pra não pesar, e simples o bastante pra não precisar
// tocar em DesafioSemana.jsx.
const INTERVALO_VERIFICACAO_MS = 1000;

function lerContadorLocal(email) {
  const bruto = Number(localStorage.getItem(chaveUsuario(CHAVE_BASE_CONTADOR, email)));
  return Number.isFinite(bruto) && bruto > 0 ? bruto : 0;
}

function lerSemanasCompletadas(email) {
  try {
    const lista = JSON.parse(localStorage.getItem(chaveUsuario(CHAVE_BASE_SEMANAS, email)) || "[]");
    return Array.isArray(lista) ? lista : [];
  } catch {
    return [];
  }
}

function lerDesafioSemanaConcluidos(email) {
  try {
    return JSON.parse(localStorage.getItem(chaveUsuario(CHAVE_BASE_DESAFIO_SEMANA, email)) || "{}");
  } catch {
    return {};
  }
}

// Semana no formato "YYYY-Www" (ISO 8601), ex: "2026-W21". Cálculo padrão:
// joga a data pra quinta-feira da mesma semana (o dia que sempre cai no
// ano "dono" da semana ISO) e conta quantos blocos de 7 dias separam essa
// quinta do dia 1º de janeiro do ano dela.
function getWeekNumber(data) {
  const d = new Date(Date.UTC(data.getFullYear(), data.getMonth(), data.getDate()));
  const diaSemanaIso = d.getUTCDay() || 7; // domingo (0) vira 7
  d.setUTCDate(d.getUTCDate() + 4 - diaSemanaIso);
  const inicioAno = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const semana = Math.ceil(((d - inicioAno) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(semana).padStart(2, "0")}`;
}

/**
 * Card pequeno e informativo entre "Desafio da Semana" e "Ranking de
 * Presença": conta quantas semanas o aluno já completou o desafio (3/3).
 *
 * Não altera DesafioSemana.jsx — lê direto do mesmo localStorage que ele
 * já escreve ("desafioSemana_v1_<email>") e decide sozinho, aqui dentro,
 * se a semana atual já foi contada. `registrarSemanaCompleta()` só
 * incrementa na primeira vez que uma semana chega a 3/3 (guarda contra
 * "farm": marcar e desmarcar os mesmos itens não conta de novo na mesma
 * semana). Tudo por usuário: trocar de conta mostra 0 de novo.
 */
export default function ContadorDesafioSemanal() {
  const email = useEmailSessao();
  const [contador, setContador] = useState(() => lerContadorLocal(email));
  const [emailAnterior, setEmailAnterior] = useState(email);

  // Troca de conta / logout+login: recarrega o contador do NOVO usuário (0
  // se for conta nova) em vez de arrastar o número de quem usou o navegador
  // antes. Ajusta o estado direto no render (não em efeito) seguindo o
  // padrão recomendado pelo React pra "resetar estado quando uma prop/valor
  // externo muda".
  if (email !== emailAnterior) {
    setEmailAnterior(email);
    setContador(lerContadorLocal(email));
  }

  useEffect(() => {
    function registrarSemanaCompleta() {
      const semanaAtual = getWeekNumber(new Date());
      const semanas = lerSemanasCompletadas(email);
      if (semanas.includes(semanaAtual)) return; // essa semana já foi contada

      const novasSemanas = [...semanas, semanaAtual];
      const novoContador = lerContadorLocal(email) + 1;

      logSalvandoParaUsuario("ContadorDesafioSemanal", email);
      try {
        localStorage.setItem(chaveUsuario(CHAVE_BASE_SEMANAS, email), JSON.stringify(novasSemanas));
        localStorage.setItem(chaveUsuario(CHAVE_BASE_CONTADOR, email), String(novoContador));
      } catch {
        // localStorage indisponível — segue só no estado local dessa sessão.
      }
      setContador(novoContador);
    }

    function verificarConclusao() {
      const concluidos = lerDesafioSemanaConcluidos(email);
      const totalConcluidos = Object.values(concluidos).filter(Boolean).length;
      const totalItens = DESAFIO_SEMANA.itens.length;
      if (totalItens > 0 && totalConcluidos >= totalItens) {
        registrarSemanaCompleta();
      }
    }

    verificarConclusao();
    const intervalo = setInterval(verificarConclusao, INTERVALO_VERIFICACAO_MS);
    // Cobre o caso de outra aba/janela completar o desafio.
    window.addEventListener("storage", verificarConclusao);
    return () => {
      clearInterval(intervalo);
      window.removeEventListener("storage", verificarConclusao);
    };
  }, [email]);

  let texto;
  if (contador === 0) {
    texto = "Você ainda não completou nenhum desafio semanal.";
  } else if (contador === 1) {
    texto = "Você já completou: 1 desafio semanal. 🪷";
  } else {
    texto = `Você já completou: ${contador} desafios semanais. 🔥`;
  }

  return (
    <div className="cm-contador-desafio-semanal">
      <Repeat2 size={14} aria-hidden="true" />
      <span>{texto}</span>
    </div>
  );
}
