import { useCallback, useEffect, useState } from "react";
import { Trophy, Check, CheckCircle2, XCircle } from "lucide-react";
import { PROXIMO_ENCONTRO_VIVO } from "../data/mockData";
import DesafioSemana from "./DesafioSemana";
import useMeditacaoHoje from "./useMeditacaoHoje";
import { useEmailSessao } from "./usuarioStorage";
import { snapshotLocalSincrono, buscarReservas, reservarVaga, cancelarReserva } from "./reservasLive";

// Mesmo evento (e mesmo literal, não import — mesmo padrão de acoplamento
// já usado em useSequenciaMeditacao.js) que useMeditacaoHoje.js dispara ao
// marcar presença. O `detail.origem` diferencia clique real de
// reconciliação com o servidor no mount (ver comentário no dispatch).
const EVENTO_ATUALIZOU = "meditacaoHojeAtualizada";

// Mesma leitura síncrona de sessão usada em AulasMeditacaoRaiz.jsx e
// DesafioSemana.jsx, mas pegando o NOME — o Ranking mostra o nome de quem
// logou, nunca o email.
function lerNomeSessao() {
  const sess = JSON.parse(localStorage.getItem("comunidade_session") || "{}");
  return sess.nome || "Você";
}

// E-mail de teste pra dar pra testar reserva sem estar logado (localhost) —
// pedido explícito do cliente.
const EMAIL_TESTE = "teste@meditacaoraiz.com";

// Próximo encontro + Desafio da Semana + Ranking da coluna 3 do dashboard.
// Fragment (sem wrapper) de propósito: quem controla o empilhamento
// vertical (gap:24px) é o `.cm-coluna-direita` em
// Dashboard.jsx/ComunidadeApp.css, então os três `.cm-widget` ficam
// diretos dentro daquele flex column, sem outro wrapper no meio.
function ColunaEncontros() {
  // Fallback enquanto o ranking.php não respondeu (ou falhou): só o usuário
  // atual, com os dias vindo do mesmo streak do botão "Meditei hoje".
  const { streak } = useMeditacaoHoje();
  const nome = lerNomeSessao();

  const emailSessao = useEmailSessao();
  const email = emailSessao || EMAIL_TESTE;
  const eventId = PROXIMO_ENCONTRO_VIVO.id;

  // Ranking GLOBAL de verdade — vem de ranking.php (todo mundo que já
  // marcou presença, não só quem está logado agora). `null` = ainda
  // carregando ou o fetch falhou; nesse caso o widget cai pro fallback
  // (só a linha do usuário atual) em vez de ficar em branco.
  const [ranking, setRanking] = useState(null);

  // Valor inicial 100% síncrono (cache local), pra não esperar a rede antes
  // do primeiro render — mesmo padrão de useEmailSessao(). O useEffect
  // abaixo reconcilia com o back-end real assim que a resposta chegar.
  const [reserva, setReserva] = useState(() => snapshotLocalSincrono(eventId, email));
  const [processando, setProcessando] = useState(false);
  const [toast, setToast] = useState(null); // { tipo: "sucesso" | "erro", texto }

  // Travado por padrão até o primeiro fetch resolver — mesmo raciocínio do
  // default 0 no banco (public/api/hotmart/_conexao.php): nunca libera
  // sozinho antes do professor confirmar em /admin (seção "Controle da
  // Live").
  const [liveLiberada, setLiveLiberada] = useState(false);

  // Título/data/horário/linhas/link editáveis pelo admin (/admin,
  // seção "Encontro ao Vivo") — vem de public/api/encontro.php. Valor
  // inicial é o mesmo texto hard-coded de sempre, só reorganizado nesse
  // formato, pra o card nunca ficar em branco enquanto o fetch não resolve
  // (ou se a chamada falhar, ex: `npm run dev` local sem PHP rodando —
  // mesmo motivo documentado em reservasLive.js).
  const [encontro, setEncontro] = useState({
    titulo: PROXIMO_ENCONTRO_VIVO.titulo,
    data_texto: "Qui, 15 Mai",
    horario: "7:00 - 7:30",
    linha1: "20 min de prática guiada",
    linha2: "Perguntas ao vivo no final",
    linha3: "Replay disponível por 48h",
    link_live: "",
  });

  useEffect(() => {
    let cancelado = false;
    buscarReservas(eventId, email).then((snap) => {
      if (!cancelado) setReserva(snap);
    });
    return () => {
      cancelado = true;
    };
  }, [eventId, email]);

  useEffect(() => {
    let cancelado = false;
    fetch("/api/encontro.php")
      .then((r) => r.json())
      .then((dados) => {
        if (!cancelado && dados?.ok) {
          setEncontro((atual) => ({ ...atual, ...dados }));
        }
      })
      .catch(() => {
        // Sem PHP disponível (dev local) — mantém o conteúdo padrão acima.
      });
    return () => {
      cancelado = true;
    };
  }, []);

  // Controle da Live (público, sem auth) — checa a cada 30s se o professor
  // liberou o botão "Entrar na live" em /admin. Fetch imediato no mount pra
  // não esperar 30s pro primeiro render já vir correto.
  useEffect(() => {
    let cancelado = false;

    function verificarLive() {
      fetch("/api/live/status.php")
        .then((r) => r.json())
        .then((dados) => {
          if (!cancelado && dados?.ok) {
            setLiveLiberada(!!dados.liberada);
          }
        })
        .catch(() => {
          // Sem PHP disponível (dev local) — mantém o estado travado padrão.
        });
    }

    verificarLive();
    const intervalo = setInterval(verificarLive, 30000);
    return () => {
      cancelado = true;
      clearInterval(intervalo);
    };
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3200);
    return () => clearTimeout(t);
  }, [toast]);

  // Extraído em função (useCallback, sem deps — só usa o setter estável do
  // useState) porque tem dois gatilhos agora: 1x no mount, e de novo logo
  // depois de marcar presença (efeito abaixo), pra reconciliar o bump
  // otimista com o valor real do banco sem precisar de F5. Mesmo padrão de
  // AbortController+8s de useSequenciaMeditacao.js: se ranking.php demorar
  // ou falhar, desiste e o widget usa o fallback (só a linha do usuário
  // atual) em vez de travar a página.
  const buscarRanking = useCallback(() => {
    let cancelado = false;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    // cache: "no-store" — depois de marcar presença o cache em disco do
    // ranking.php já foi invalidado no servidor (ver presenca.php), mas
    // isso evita também que algum cache HTTP intermediário (navegador/CDN)
    // devolva uma cópia velha bem na hora que a gente mais precisa do
    // valor fresco.
    fetch("/api/hotmart/presenca/ranking.php", { signal: controller.signal, cache: "no-store" })
      .then((r) => r.json())
      .then((dados) => {
        if (!cancelado && Array.isArray(dados) && dados.length) {
          setRanking(dados);
        }
      })
      .catch(() => {
        // ranking.php indisponível/lento — mantém o que já tinha (ou o fallback).
      })
      .finally(() => clearTimeout(timeoutId));

    return () => {
      cancelado = true;
      controller.abort();
      clearTimeout(timeoutId);
    };
  }, []);

  useEffect(() => buscarRanking(), [buscarRanking]);

  // Sobe quem clicou em "Já meditei hoje" no Ranking na hora, sem esperar
  // rede: bump otimista de +1 dia (ou entra no ranking com 1 dia, se ainda
  // não tinha presença nenhuma) e reordena — cumpre o "menos de 1s"
  // pedido, já que não depende do round-trip do POST nem do cache de
  // 5min do ranking.php. Só reage a origem "clique": o mesmo evento também
  // dispara na reconciliação com o servidor ao montar (useMeditacaoHoje.js)
  // e ali o fetch de ranking já busca o valor certo — bump ali duplicaria
  // a contagem.
  useEffect(() => {
    function aoAtualizarPresenca(evento) {
      if (evento?.detail?.origem !== "clique") return;

      setRanking((atual) => {
        if (!Array.isArray(atual)) return atual; // ainda não carregou — nada pra atualizar, fica no fallback até o fetch do mount resolver
        const emailLower = email.toLowerCase().trim();
        const jaEstava = atual.some((item) => (item.email || "").toLowerCase().trim() === emailLower);
        const atualizado = jaEstava
          ? atual.map((item) =>
              (item.email || "").toLowerCase().trim() === emailLower
                ? { ...item, dias: (Number(item.dias) || 0) + 1 }
                : item
            )
          : [...atual, { email, nome, dias: 1 }];

        return [...atualizado].sort(
          (a, b) => (Number(b.dias) || 0) - (Number(a.dias) || 0) || String(a.nome || "").localeCompare(String(b.nome || ""))
        );
      });

      // Confirma com o valor real do banco pouco depois de o bump otimista
      // já ter aparecido na tela — dá tempo do POST em presenca.php
      // terminar (e invalidar o cache do ranking.php) antes de buscar de novo.
      setTimeout(buscarRanking, 1200);
    }

    window.addEventListener(EVENTO_ATUALIZOU, aoAtualizarPresenca);
    return () => window.removeEventListener(EVENTO_ATUALIZOU, aoAtualizarPresenca);
  }, [email, nome, buscarRanking]);

  async function handleReservarClique() {
    if (processando) return;
    setProcessando(true);
    try {
      if (reserva.euReservei) {
        const snap = await cancelarReserva(eventId, email);
        setReserva(snap);
        setToast({ tipo: "sucesso", texto: "Reserva cancelada" });
      } else {
        const snap = await reservarVaga(eventId, email, nome);
        setReserva(snap);
        setToast({ tipo: "sucesso", texto: "Vaga reservada!" });
      }
    } catch {
      setToast({ tipo: "erro", texto: "Não foi possível atualizar sua reserva" });
    } finally {
      // Mínimo de 500ms com o botão desabilitado pra não deixar duplo clique
      // disparar duas requisições (pedido explícito do cliente).
      setTimeout(() => setProcessando(false), 500);
    }
  }

  return (
    <>
      <div className="cm-widget cm-encontro-vivo cm-grid-encontro">
        <h3>
          <span className="cm-dot-pulse" aria-hidden="true" /> Próximo encontro ao vivo
        </h3>
        <div className="cm-encontro-caixa">
          <strong className="cm-encontro-titulo">{encontro.titulo}</strong>
          <span className="cm-encontro-quando">
            {encontro.data_texto} · {encontro.horario}
          </span>
          <div className="cm-encontro-anfitriao">
            <img src={PROXIMO_ENCONTRO_VIVO.avatar} alt="" />
            <span>{PROXIMO_ENCONTRO_VIVO.anfitriao}</span>
          </div>

          <div className="cm-encontro-divisor" role="separator" />

          <ul className="cm-encontro-lista">
            {[encontro.linha1, encontro.linha2, encontro.linha3].filter(Boolean).map((linha, i) => (
              <li key={i}>
                <Check size={13} strokeWidth={3} className="cm-encontro-check" aria-hidden="true" />
                {linha}
              </li>
            ))}
          </ul>

          {reserva.total === 0 ? (
            <span className="cm-encontro-social-texto cm-encontro-social-vazio">Seja o primeiro a reservar sua vaga</span>
          ) : (
            <div className="cm-encontro-social">
              <div className="cm-encontro-avatares" aria-hidden="true">
                {reserva.usuarios.map((u, i) => (
                  <span key={i} className="cm-encontro-avatar-bolinha">
                    {u.inicial}
                  </span>
                ))}
              </div>
              <span className="cm-encontro-social-texto">
                {reserva.total === 1 ? "1 pessoa reservou" : `${reserva.total} pessoas reservaram`}
              </span>
            </div>
          )}
        </div>
        <button
          type="button"
          className={`cm-btn-primary cm-encontro-btn ${reserva.euReservei ? "is-reservado" : ""}`}
          onClick={handleReservarClique}
          disabled={processando}
        >
          {reserva.euReservei ? (
            <>
              <span className="cm-encontro-btn-normal">
                <Check size={14} strokeWidth={3} className="cm-encontro-btn-check" aria-hidden="true" /> Vaga reservada
              </span>
              <span className="cm-encontro-btn-hover">Cancelar reserva</span>
            </>
          ) : (
            "Reservar minha vaga"
          )}
        </button>

        {/* Trava separada do link_live: o professor pode deixar o link já
            configurado e só liberar o botão na hora do encontro (Controle
            da Live, /admin). Mesma classe do botão "Reservar minha vaga"
            (cm-btn-primary cm-encontro-btn) pra ficarem visualmente
            idênticos quando liberado; is-travado sobrescreve pro cinza
            desabilitado enquanto o professor não libera. */}
        {liveLiberada && encontro.link_live ? (
          <a
            href={encontro.link_live}
            target="_blank"
            rel="noreferrer"
            className="cm-btn-primary cm-encontro-btn"
          >
            Entrar na live
          </a>
        ) : (
          <button type="button" className="cm-btn-primary cm-encontro-btn is-travado" disabled>
            {liveLiberada ? "Em breve" : "Aguardando liberação do professor"}
          </button>
        )}

        {toast && (
          <div className={`cm-encontro-toast ${toast.tipo === "erro" ? "is-erro" : "is-sucesso"}`} role="status">
            {toast.tipo === "erro" ? <XCircle size={16} /> : <CheckCircle2 size={16} />}
            {toast.texto}
          </div>
        )}
      </div>

      <DesafioSemana />

      <div className="cm-widget cm-widget-escuro cm-grid-ranking">
        <h3>
          <Trophy size={16} /> Ranking de Presença
        </h3>
        {ranking
          ? ranking.slice(0, 5).map((item, i) => {
              const souEu = !!item.email && item.email.toLowerCase().trim() === email.toLowerCase().trim();
              const dias = Number(item.dias) || 0;
              return (
                <div className={`cm-ranking-item ${souEu ? "is-voce" : ""}`} key={item.email || i}>
                  <span className="cm-ranking-esquerda">
                    <span className="cm-ranking-pos">#{i + 1}</span>
                    <span className="cm-ranking-nome">{item.nome || item.email}</span>
                  </span>
                  <span className="cm-ranking-dias">
                    {dias} dia{dias === 1 ? "" : "s"}
                  </span>
                </div>
              );
            })
          : (
            <div className="cm-ranking-item is-voce">
              <span className="cm-ranking-esquerda">
                <span className="cm-ranking-pos">#1</span>
                <span className="cm-ranking-nome">{nome}</span>
              </span>
              <span className="cm-ranking-dias">
                {streak} dia{streak === 1 ? "" : "s"}
              </span>
            </div>
          )}
      </div>
    </>
  );
}

export default ColunaEncontros;
