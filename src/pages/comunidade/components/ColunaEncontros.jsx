import { useEffect, useState } from "react";
import { Trophy, Check, CheckCircle2, XCircle } from "lucide-react";
import { PROXIMO_ENCONTRO_VIVO } from "../data/mockData";
import DesafioSemana from "./DesafioSemana";
import ContadorDesafioSemanal from "./ContadorDesafioSemanal";
import useMeditacaoHoje from "./useMeditacaoHoje";
import { useEmailSessao } from "./usuarioStorage";
import { snapshotLocalSincrono, buscarReservas, reservarVaga, cancelarReserva } from "./reservasLive";

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

// Próximo encontro (linha 1) + Desafio da Semana (linha 2) + Ranking (linha 3)
// da coluna 4 do dashboard. Fragment (sem wrapper) de propósito: cada
// widget cai numa linha diferente do grid definido em `.cm-main` (ver
// ComunidadeApp.css), então os três `.cm-widget` têm que ser filhos
// diretos do grid, não agrupados dentro de um `<aside>`.
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

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3200);
    return () => clearTimeout(t);
  }, [toast]);

  // Mesmo padrão de AbortController+8s de useSequenciaMeditacao.js: se
  // ranking.php demorar ou falhar, desiste e o widget usa o fallback (só a
  // linha do usuário atual) em vez de travar a página.
  useEffect(() => {
    let cancelado = false;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    fetch("/api/hotmart/presenca/ranking.php", { signal: controller.signal })
      .then((r) => r.json())
      .then((dados) => {
        if (!cancelado && Array.isArray(dados) && dados.length) {
          setRanking(dados);
        }
      })
      .catch(() => {
        // ranking.php indisponível/lento — mantém o fallback.
      })
      .finally(() => clearTimeout(timeoutId));

    return () => {
      cancelado = true;
      controller.abort();
      clearTimeout(timeoutId);
    };
  }, []);

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

        {encontro.link_live ? (
          <a
            href={encontro.link_live}
            target="_blank"
            rel="noreferrer"
            className="cm-encontro-link-btn"
          >
            Entrar na live
          </a>
        ) : (
          <button type="button" className="cm-encontro-link-btn" disabled>
            Em breve
          </button>
        )}

        {toast && (
          <div className={`cm-encontro-toast ${toast.tipo === "erro" ? "is-erro" : "is-sucesso"}`} role="status">
            {toast.tipo === "erro" ? <XCircle size={16} /> : <CheckCircle2 size={16} />}
            {toast.texto}
          </div>
        )}
      </div>

      {/* Wrapper ocupa sozinho a célula "desafio" da grade (ver .cm-main em
          ComunidadeApp.css) empilhando os dois cards — assim o contador cai
          exatamente entre "Desafio da Semana" e "Ranking de Presença" sem
          precisar mexer nas linhas/áreas do grid principal. */}
      <div className="cm-grid-desafio cm-desafio-coluna">
        <DesafioSemana />
        <ContadorDesafioSemanal />
      </div>

      <div className="cm-widget cm-widget-escuro cm-grid-ranking">
        <h3>
          <Trophy size={16} /> Ranking de Presença
        </h3>
        {ranking
          ? ranking.map((item, i) => {
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
