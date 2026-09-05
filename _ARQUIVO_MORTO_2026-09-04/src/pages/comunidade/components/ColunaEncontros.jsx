import { useEffect, useMemo, useState } from "react";
import { Check, CheckCircle2, XCircle } from "lucide-react";
import { PROXIMO_ENCONTRO_VIVO } from "../data/mockData";
import DesafioSemana from "./DesafioSemana";
import FraseMotivacionalSemana from "./FraseMotivacionalSemana";
import { useEmailSessao } from "./usuarioStorage";
import { snapshotLocalSincrono, buscarReservas, reservarVaga, cancelarReserva } from "./reservasLive";

// Meses abreviados em pt-BR, como o admin digita em data_texto (ex: "Sab, 5
// Set") — ver seção "Encontro ao Vivo" em AdminMeditacao.jsx. Só as 3
// primeiras letras importam pro match abaixo.
const MESES_PT = {
  jan: 0, fev: 1, mar: 2, abr: 3, mai: 4, jun: 5,
  jul: 6, ago: 7, set: 8, out: 9, nov: 10, dez: 11,
};

// data_texto/horario são texto livre editado pelo admin (sem campo de data
// real no banco — ver public/api/admin/encontro.php), então o timer precisa
// interpretar esse texto pra achar a data/hora alvo. Tenta extrair "5 Set"
// de data_texto e "20:00" (primeiro horário) de horario; se o formato fugir
// do padrão, devolve null e o timer simplesmente não aparece (mesmo
// raciocínio defensivo do resto do arquivo: nunca quebra o card).
function parseAlvoEncontro(dataTexto, horario) {
  const matchData = /(\d{1,2})\s*[ºo°]?\s*(?:de\s+)?([A-Za-zçÇ]{3,})/.exec(dataTexto || "");
  const matchHora = /(\d{1,2}):(\d{2})/.exec(horario || "");
  if (!matchData || !matchHora) return null;

  const dia = parseInt(matchData[1], 10);
  const mes = MESES_PT[matchData[2].slice(0, 3).toLowerCase()];
  const hora = parseInt(matchHora[1], 10);
  const minuto = parseInt(matchHora[2], 10);
  if (mes === undefined || Number.isNaN(dia)) return null;

  // Horário de Brasília é UTC-3 fixo (sem horário de verão desde 2019) —
  // offset explícito na string ISO, pra não depender do fuso do navegador
  // do aluno.
  function montar(ano) {
    const iso = `${ano}-${String(mes + 1).padStart(2, "0")}-${String(dia).padStart(2, "0")}T${String(hora).padStart(2, "0")}:${String(minuto).padStart(2, "0")}:00-03:00`;
    return new Date(iso);
  }

  const agora = Date.now();
  const anoAtual = new Date().getFullYear();
  let alvo = montar(anoAtual);
  // Já passou há mais de 1 dia: o admin provavelmente ainda não trocou pro
  // próximo ano na virada — assume o ano seguinte em vez de mostrar uma
  // data no passado.
  if (alvo.getTime() < agora - 24 * 60 * 60 * 1000) {
    alvo = montar(anoAtual + 1);
  }
  return alvo;
}

// Timer real "Começa em Xd Yh e Zm" abaixo da data/horário e acima do
// anfitrião. Recalcula a cada 30s (granularidade de minuto na tela, então
// não precisa de segundo a segundo) e some sozinho quando o horário chega
// — nesse ponto o botão "Entrar na live"/Controle da Live já assume.
function EncontroTimer({ dataTexto, horario }) {
  const [agora, setAgora] = useState(() => Date.now());

  useEffect(() => {
    const intervalo = setInterval(() => setAgora(Date.now()), 30000);
    return () => clearInterval(intervalo);
  }, []);

  const alvo = useMemo(() => parseAlvoEncontro(dataTexto, horario), [dataTexto, horario]);
  if (!alvo) return null;

  const diffMin = Math.floor((alvo.getTime() - agora) / 60000);
  if (diffMin <= 0) return null;

  const dias = Math.floor(diffMin / (60 * 24));
  const horas = Math.floor((diffMin % (60 * 24)) / 60);
  const minutos = diffMin % 60;

  const texto =
    dias > 0
      ? `${String(dias).padStart(2, "0")} dia${dias === 1 ? "" : "s"} ${horas}h e ${minutos}m`
      : horas > 0
        ? `${horas}h e ${minutos}m`
        : `${minutos}m`;

  return <span className="cm-encontro-timer">Começa em {texto}</span>;
}

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

// Próximo encontro + Desafio da Semana + Frase Motivacional da Semana da
// coluna 3 do dashboard. O último widget era o Ranking de Presença
// (RankingPresenca.jsx, arquivo mantido no disco mas sem uso — ranking.php
// continua vivo, ainda é consumido por useSequenciaMeditacao.js pro
// percentil de Sequencia.jsx), trocado por pedido do cliente. Fragment
// (sem wrapper) de
// propósito: quem controla o empilhamento vertical (gap:20px) é o
// `.cm-coluna-direita` em Dashboard.jsx/ComunidadeApp.css, então os três
// `.cm-widget` ficam diretos dentro daquele flex column, sem outro
// wrapper no meio.
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

  // Repete a cada 3s pra pegar em quase tempo real quando o admin muda
  // dia/horário em /admin (seção "Encontro ao Vivo") — pedido explícito do
  // cliente. Fetch imediato no mount (mesmo padrão do Controle da Live
  // logo abaixo) pra não esperar o primeiro intervalo pro card já vir
  // atualizado.
  useEffect(() => {
    let cancelado = false;

    function buscarEncontro() {
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
    }

    buscarEncontro();
    const intervalo = setInterval(buscarEncontro, 3000);
    return () => {
      cancelado = true;
      clearInterval(intervalo);
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
          <EncontroTimer dataTexto={encontro.data_texto} horario={encontro.horario} />
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

      <FraseMotivacionalSemana />
    </>
  );
}

export default ColunaEncontros;
