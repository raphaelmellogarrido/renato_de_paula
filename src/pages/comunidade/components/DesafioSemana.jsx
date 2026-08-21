import { useEffect, useRef, useState } from "react";
import { Check } from "lucide-react";
import confetti from "canvas-confetti";
import { DESAFIO_SEMANA } from "../data/mockData";
import { useEmailSessao, chaveUsuario, logSalvandoParaUsuario } from "./usuarioStorage";

// PHP externo análogo ao de aulas.php (fora deste repo) — ainda não existe
// no servidor, precisa ser criado espelhando o mesmo contrato:
// GET ?email=... -> { itens: [{ item_id, concluido }] }
// POST { email, item_id, concluido } -> marca/desmarca um item.
const DESAFIO_SEMANA_URL = "https://renatodepaula.com/api/hotmart/desafio-semana.php";
// Base da chave local — SEMPRE passa por chaveUsuario(CHAVE_BASE, email)
// antes de ir pro localStorage. ContadorDesafioSemanal.jsx lê essa mesma
// chave (mesma base + mesmo email) pra saber quando o desafio bateu 3/3;
// mudar esse literal aqui exige mudar lá também.
function getSemanaBRT() {
  const agora = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }));
  const jan1 = new Date(agora.getFullYear(), 0, 1);
  const dias = Math.floor((agora - jan1) / 86400000);
  return `${agora.getFullYear()}-W${Math.ceil((dias + jan1.getDay() + 1) / 7)}`;
}
const CHAVE_BASE = `desafioSemana_v1_${getSemanaBRT()}`;
const DURACAO_CELEBRACAO_MS = 2500;

function carregarLocal(email) {
  try {
    return JSON.parse(localStorage.getItem(chaveUsuario(CHAVE_BASE, email)) || "{}");
  } catch {
    return {};
  }
}

function salvarLocal(email, concluidos) {
  logSalvandoParaUsuario("DesafioSemana", email);
  try {
    localStorage.setItem(chaveUsuario(CHAVE_BASE, email), JSON.stringify(concluidos));
  } catch {
    // localStorage indisponível (modo privado, quota cheia etc.) — segue só
    // em memória, sem travar o clique.
  }
}

function dispararConfete() {
  confetti({
    particleCount: 60,
    spread: 65,
    startVelocity: 22,
    gravity: 0.9,
    scalar: 0.8,
    ticks: 180,
    origin: { y: 0.35 },
    colors: ["#9b7fc7", "#e0b978", "#7c9473", "#f4ede1"],
  });
}

/**
 * "Desafio da Semana" — card da coluna direita do dashboard. Conteúdo vem
 * de DESAFIO_SEMANA.itens (data/mockData.js): pra trocar o desafio toda
 * segunda, só editar aquele array de 3 objetos.
 *
 * Progresso é real, não mock: cada check salva em localStorage (chave
 * "desafioSemana_v1") e sincroniza com o PHP externo — mesmo padrão
 * otimista de AulasMeditacaoRaiz.jsx (atualiza local primeiro, POST
 * depois, e o local sempre manda se o PHP discordar).
 */
export default function DesafioSemana() {
  const itens = DESAFIO_SEMANA.itens;
  const email = useEmailSessao();
  const [concluidos, setConcluidos] = useState(() => carregarLocal(email));
  const [celebrando, setCelebrando] = useState(false);

  // Controla a celebração: só dispara na transição pra 3/3, nunca ao
  // recarregar a página já completa, e libera de novo se algum item for
  // desmarcado.
  const jaCelebrouRef = useRef(false);
  const montouRef = useRef(false);
  const [emailAnterior, setEmailAnterior] = useState(email);

  // Troca de conta / logout+login: recarrega do zero pra chave do NOVO
  // usuário — mostra os 3 itens desmarcados se for conta nova, em vez de
  // arrastar o progresso de quem usou o navegador antes. Ajusta o estado
  // direto no render (não em efeito) seguindo o padrão recomendado pelo
  // React pra "resetar estado quando uma prop/valor externo muda".
  if (email !== emailAnterior) {
    setEmailAnterior(email);
    setConcluidos(carregarLocal(email));
  }

  // Refs não podem ser alterados durante o render (só em efeitos/handlers) —
  // por isso o reset deles fica num efeito separado, sem nenhum setState
  // dentro, só pra não escapar do padrão acima.
  useEffect(() => {
    jaCelebrouRef.current = false;
    montouRef.current = false;
  }, [email]);

  // Mescla com o PHP externo — nunca sobrescreve uma marca local já feita,
  // só complementa (mesma regra da tela de aulas).
  useEffect(() => {
    if (!email) return;

    fetch(`${DESAFIO_SEMANA_URL}?email=${encodeURIComponent(email)}`)
      .then((r) => r.json())
      .then((data) => {
        const lista = Array.isArray(data?.itens) ? data.itens : [];
        setConcluidos((atual) => {
          const mesclado = { ...atual };
          for (const item of lista) {
            if (!item.item_id || mesclado[item.item_id]) continue;
            mesclado[item.item_id] = !!item.concluido;
          }
          salvarLocal(email, mesclado);
          return mesclado;
        });
      })
      .catch(() => {
        // PHP externo indisponível ou ainda não existe — segue só com o
        // que já está salvo local, sem travar a página.
      });
  }, [email]);

  const totalConcluidos = itens.reduce((soma, item) => soma + (concluidos[item.id] ? 1 : 0), 0);
  const completo = itens.length > 0 && totalConcluidos === itens.length;
  const percentual = itens.length ? Math.round((totalConcluidos / itens.length) * 100) : 0;

  useEffect(() => {
    if (!montouRef.current) {
      montouRef.current = true;
      // Se já chegou completo do localStorage/PHP, não celebra de novo —
      // só marca como "já celebrado" pra não disparar no primeiro render.
      jaCelebrouRef.current = completo;
      return;
    }
    if (completo && !jaCelebrouRef.current) {
      jaCelebrouRef.current = true;
      setCelebrando(true);
      dispararConfete();
      const timer = setTimeout(() => setCelebrando(false), DURACAO_CELEBRACAO_MS);
      return () => clearTimeout(timer);
    }
    if (!completo) {
      jaCelebrouRef.current = false;
    }
  }, [completo]);

  function toggleItem(id) {
    const novoValor = !concluidos[id];

    setConcluidos((atual) => {
      const novo = { ...atual, [id]: novoValor };
      salvarLocal(email, novo);
      return novo;
    });

    if (!email) return;
    fetch(DESAFIO_SEMANA_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, item_id: id, concluido: novoValor }),
    }).catch((err) => {
      console.error("Não foi possível sincronizar o Desafio da Semana com o servidor:", err);
    });
  }

  return (
    <div className="cm-widget cm-grid-desafio">
      <h3>{DESAFIO_SEMANA.tituloWidget}</h3>

      {celebrando ? (
        <DesafioCelebracao />
      ) : (
        <>
          {itens.map((item) => {
            const concluido = !!concluidos[item.id];
            return (
              <div className="cm-desafio-item" key={item.id}>
                <button type="button" className={`cm-desafio-check ${concluido ? "is-concluido" : ""}`} onClick={() => toggleItem(item.id)} aria-pressed={concluido} aria-label={concluido ? `Desmarcar "${item.titulo}"` : `Marcar "${item.titulo}"`}>
                  {concluido && <Check size={12} strokeWidth={3} />}
                </button>
                <div>
                  <strong>{item.titulo}</strong>
                  <span>{item.subtitulo}</span>
                </div>
              </div>
            );
          })}
          <div className="cm-desafio-progress">
            <div className="cm-desafio-progress-fill" style={{ width: `${percentual}%` }} />
          </div>
        </>
      )}
    </div>
  );
}

// Substitui o checklist por 2.5s quando o aluno completa os 3 itens: os
// checks "viram" a flor de lótus se abrindo, com o card de celebração.
function DesafioCelebracao() {
  return (
    <div className="cm-desafio-celebracao">
      <span className="cm-desafio-celebracao-lotus" aria-hidden="true">
        🪷
      </span>
      <p className="cm-desafio-celebracao-titulo">Desafio completo! Você cultivou presença essa semana 🪷</p>
    </div>
  );
}
