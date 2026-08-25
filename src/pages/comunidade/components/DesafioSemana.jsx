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
// Conteúdo (título/descrição) dos 3 itens, editável pelo admin em
// /admin — não confundir com DESAFIO_SEMANA_URL acima, que é só
// o progresso de CHECK do aluno. Público, sem auth, mesmo padrão de
// public/api/encontro.php.
const DESAFIOS_SEMANA_CONFIG_URL = "/api/desafios-semana.php";
// Base da chave local — SEMPRE passa por chaveUsuario(CHAVE_BASE, email)
// antes de ir pro localStorage.
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
 * "Desafio da Semana" — card da coluna direita do dashboard. Conteúdo
 * (título/descrição dos 3 itens) vem de public/api/desafios-semana.php,
 * editável em /admin; DESAFIO_SEMANA.itens (data/mockData.js) é
 * só o valor inicial antes do fetch resolver.
 *
 * Progresso é real, não mock: cada check salva em localStorage (chave
 * "desafioSemana_v1") e sincroniza com o PHP externo — mesmo padrão
 * otimista de AulasMeditacaoRaiz.jsx (atualiza local primeiro, POST
 * depois, e o local sempre manda se o PHP discordar).
 */
export default function DesafioSemana() {
  // Conteúdo (título/subtítulo de cada item) começa com o mock — mesmo
  // padrão de "valor inicial só pra não ficar em branco" usado em
  // ColunaEncontros.jsx — e é substituído pelo conteúdo real assim que o
  // fetch abaixo resolver.
  const [itens, setItens] = useState(DESAFIO_SEMANA.itens);
  const email = useEmailSessao();
  const [concluidos, setConcluidos] = useState(() => carregarLocal(email));
  const [celebrando, setCelebrando] = useState(false);

  // Título/descrição editáveis pelo admin (/admin-meditacao, seção
  // "Desafio da Semana") — vem de public/api/desafios-semana.php. Já
  // chega ordenado por `ordem` do SQL, não precisa reordenar aqui.
  useEffect(() => {
    let cancelado = false;
    fetch(DESAFIOS_SEMANA_CONFIG_URL)
      .then((r) => r.json())
      .then((data) => {
        const lista = Array.isArray(data?.itens) ? data.itens : [];
        if (!cancelado && lista.length) {
          setItens(lista.map((i) => ({ id: i.id, titulo: i.titulo, subtitulo: i.descricao })));
        }
      })
      .catch(() => {
        // desafios-semana.php indisponível — segue com o mock, sem travar
        // a página.
      });
    return () => {
      cancelado = true;
    };
  }, []);

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
  // só complementa (mesma regra da tela de aulas). EXCETO quando o admin
  // resetou a semana (botão "Resetar desafios da semana" em /admin, bug
  // reportado 25/08): resetadoEm vem do servidor e muda a cada reset; se for
  // diferente do que este navegador guardou da última vez (_resetadoEm,
  // salvo junto dos itens no mesmo objeto de localStorage), o progresso
  // local está stale e é descartado ANTES do merge — senão um check marcado
  // antes do reset nunca some daqui, já que a linha dele em desafio_semana
  // simplesmente não existe mais pra "corrigir" o valor local.
  useEffect(() => {
    if (!email) return;

    fetch(`${DESAFIO_SEMANA_URL}?email=${encodeURIComponent(email)}`)
      .then((r) => r.json())
      .then((data) => {
        const lista = Array.isArray(data?.itens) ? data.itens : [];
        const resetadoEm = data?.resetadoEm || null;
        setConcluidos((atual) => {
          const stale = resetadoEm && atual._resetadoEm && atual._resetadoEm !== resetadoEm;
          const mesclado = stale ? { _resetadoEm: resetadoEm } : { ...atual, _resetadoEm: resetadoEm || atual._resetadoEm };
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

  // Mesma contagem que acende os checks acima (totalConcluidos/itens) — nunca
  // um state separado. Antes disso vinha de outro componente
  // (ContadorDesafioSemanal.jsx) que lia uma chave de localStorage diferente
  // (sem o sufixo da semana) e por isso dessincronizava do checklist: os
  // checks apareciam marcados mas o texto dizia "0 completos".
  let statusTexto;
  if (totalConcluidos === 0) {
    statusTexto = "Você ainda não completou nenhum desafio da semana.";
  } else if (completo) {
    statusTexto = "Parabéns! Você completou todos os desafios da semana 🎉";
  } else {
    statusTexto = `Você completou ${totalConcluidos} de ${itens.length} desafios da semana.`;
  }

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

      {/* Checklist continua montado (só fica coberto pela celebração) —
          é ele quem define a altura do card o tempo todo. Se fosse
          desmontado e trocado pelo <DesafioCelebracao/>, o conteúdo mais
          curto da celebração encolhia o card durante a animação e ele
          "pulava" de volta ao tamanho normal quando ela sumia. */}
      <div className="cm-desafio-corpo">
        <div aria-hidden={celebrando || undefined}>
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
          <p className="cm-desafio-status">{statusTexto}</p>
        </div>

        {celebrando && <DesafioCelebracao />}
      </div>
    </div>
  );
}

// Overlay que cobre o checklist por 2.5s quando o aluno completa os 3
// itens: os checks "viram" a flor de lótus se abrindo, com o card de
// celebração. Fica em position:absolute (ver .cm-desafio-celebracao) por
// cima do checklist — nunca substitui o conteúdo no fluxo, senão o card
// encolhe/pula de tamanho durante a animação.
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
