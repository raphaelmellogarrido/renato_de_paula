import { useEffect, useState } from "react";
import { Check, CheckCircle2, XCircle } from "lucide-react";
import { PROXIMO_ENCONTRO_VIVO } from "../data/mockData";
import DesafioSemana from "./DesafioSemana";
import MeditandoJunto from "./MeditandoJunto";
import { useEmailSessao } from "./usuarioStorage";
import { snapshotLocalSincrono, buscarReservas, reservarVaga, cancelarReserva } from "./reservasLive";

// Mesma leitura síncrona de sessão usada em AulasMeditacaoRaiz.jsx e
// DesafioSemana.jsx, mas pegando o NOME — usado ao reservar vaga no
// encontro (reservarVaga manda o nome pro backend), nunca o email.
function lerNomeSessao() {
  const sess = JSON.parse(localStorage.getItem("comunidade_session") || "{}");
  return sess.nome || "Você";
}

// E-mail de teste pra dar pra testar reserva sem estar logado (localhost) —
// pedido explícito do cliente.
const EMAIL_TESTE = "teste@meditacaoraiz.com";

// Próximo encontro + Desafio da Semana + Meditando junto da coluna 3 do
// dashboard (Ranking de Presença trocou de lugar com Meditando junto,
// pedido do cliente — ver RankingPresenca.jsx/ColunaProgresso.jsx).
// Fragment (sem wrapper) de propósito: quem controla o empilhamento
// vertical (gap:24px) é o `.cm-coluna-direita` em
// Dashboard.jsx/ComunidadeApp.css, então os três `.cm-widget` ficam
// diretos dentro daquele flex column, sem outro wrapper no meio.
function ColunaEncontros() {
  const nome = lerNomeSessao();

  const emailSessao = useEmailSessao();
  const email = emailSessao || EMAIL_TESTE;
  const eventId = PROXIMO_ENCONTRO_VIVO.id;

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

      <MeditandoJunto />
    </>
  );
}

export default ColunaEncontros;
