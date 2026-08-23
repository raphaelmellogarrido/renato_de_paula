import { useEffect, useRef, useState } from "react";
import { Play, Pause } from "lucide-react";

const DURACAO_SEGUNDOS = 180; // 3:00
const TOTAL_BARRAS = 20;
// Alturas fixas (não aleatórias) pra o waveform não "pular" de formato a
// cada re-render — mesma ideia de padrão estático usado em outros lugares
// do dashboard (ex: bolinhas de Sequencia.jsx).
const ALTURAS_BARRAS = [40, 65, 30, 80, 50, 90, 45, 70, 35, 60, 85, 40, 55, 95, 45, 65, 30, 75, 50, 40];

function formatarTempo(segundos) {
  const m = Math.floor(segundos / 60);
  const s = segundos % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

/**
 * "Desafio de 3 minutos" — card da coluna direita do dashboard, entre
 * "Desafio da semana" e "Meditando junto" (ver ColunaEncontros.jsx). Sem
 * áudio real por trás ainda (nenhum arquivo/URL foi definido) — o player é
 * só o cronômetro visual contando 0:00 até 3:00 enquanto o aluno se
 * concentra no som por conta própria; quando existir um áudio de verdade
 * basta trocar o `useEffect` do intervalo por um <audio> de verdade.
 */
function Desafio3Minutos() {
  const [tocando, setTocando] = useState(false);
  const [segundos, setSegundos] = useState(0);
  const intervaloRef = useRef(null);

  useEffect(() => {
    if (!tocando) return undefined;

    intervaloRef.current = setInterval(() => {
      setSegundos((atual) => {
        if (atual + 1 >= DURACAO_SEGUNDOS) {
          setTocando(false);
          return DURACAO_SEGUNDOS;
        }
        return atual + 1;
      });
    }, 1000);

    return () => clearInterval(intervaloRef.current);
  }, [tocando]);

  function alternarPlay() {
    // Terminou (3:00) e clicou de novo — recomeça do zero em vez de ficar
    // travado no fim.
    if (segundos >= DURACAO_SEGUNDOS) {
      setSegundos(0);
      setTocando(true);
      return;
    }
    setTocando((atual) => !atual);
  }

  const percentual = Math.min(100, (segundos / DURACAO_SEGUNDOS) * 100);
  const barraAtiva = Math.round((segundos / DURACAO_SEGUNDOS) * TOTAL_BARRAS);

  return (
    <div className="cm-widget cm-desafio3min">
      <div className="cm-desafio3min-header">
        <span className="cm-desafio3min-eyebrow">
          <span aria-hidden="true">🎧</span> Meditação de bolso
        </span>
        <span className="cm-desafio3min-badge">3 min</span>
      </div>

      <h3 className="cm-desafio3min-titulo">Desafio de 3 minutos</h3>
      <p className="cm-desafio3min-sub">Fique 3 minutos apenas se concentrando no som</p>

      <div className="cm-desafio3min-player">
        <button
          type="button"
          className="cm-desafio3min-play"
          onClick={alternarPlay}
          aria-label={tocando ? "Pausar" : "Tocar"}
        >
          {tocando ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}
        </button>

        <div className="cm-desafio3min-corpo">
          <div className="cm-desafio3min-waveform" aria-hidden="true">
            {ALTURAS_BARRAS.map((altura, i) => (
              <span
                key={i}
                className={`cm-desafio3min-barra ${i < barraAtiva ? "is-ativa" : ""}`}
                style={{ height: `${altura}%` }}
              />
            ))}
          </div>

          <div className="cm-desafio3min-rodape-player">
            <span className="cm-desafio3min-timer">
              {formatarTempo(segundos)} / {formatarTempo(DURACAO_SEGUNDOS)}
            </span>
          </div>

          <div className="cm-desafio3min-progress">
            <div className="cm-desafio3min-progress-fill" style={{ width: `${percentual}%` }} />
          </div>
        </div>
      </div>

      <p className="cm-desafio3min-footer">Com Dr. Renato • Áudio relaxante</p>
    </div>
  );
}

export default Desafio3Minutos;
