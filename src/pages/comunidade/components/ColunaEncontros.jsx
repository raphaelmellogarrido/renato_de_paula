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
  // Ranking "de teste": só o usuário atual, com os dias vindo do mesmo
  // streak do botão "Meditei hoje" — marcar presença é o único gatilho que
  // sobe esse número (o Desafio da Semana não mexe aqui).
  const { streak } = useMeditacaoHoje();
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
          <strong className="cm-encontro-titulo">{PROXIMO_ENCONTRO_VIVO.titulo}</strong>
          <span className="cm-encontro-quando">{PROXIMO_ENCONTRO_VIVO.quando}</span>
          <div className="cm-encontro-anfitriao">
            <img src={PROXIMO_ENCONTRO_VIVO.avatar} alt="" />
            <span>{PROXIMO_ENCONTRO_VIVO.anfitriao}</span>
          </div>

          <div className="cm-encontro-divisor" role="separator" />

          <ul className="cm-encontro-lista">
            <li>
              <Check size={13} strokeWidth={3} className="cm-encontro-check" aria-hidden="true" />
              20 min de prática guiada
            </li>
            <li>
              <Check size={13} strokeWidth={3} className="cm-encontro-check" aria-hidden="true" />
              Perguntas ao vivo no final
            </li>
            <li>
              <Check size={13} strokeWidth={3} className="cm-encontro-check" aria-hidden="true" />
              Replay disponível por 48h
            </li>
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
        <div className="cm-ranking-item is-voce">
          <span className="cm-ranking-esquerda">
            <span className="cm-ranking-pos">#1</span>
            <span className="cm-ranking-nome">{nome}</span>
          </span>
          <span className="cm-ranking-dias">
            {streak} dia{streak === 1 ? "" : "s"}
          </span>
        </div>
      </div>
    </>
  );
}

export default ColunaEncontros;
