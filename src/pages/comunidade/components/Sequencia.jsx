import { Flame, Award, Check } from "lucide-react";
import { useSequenciaMeditacao } from "./useSequenciaMeditacao";

// Card "Sequência" da coluna 3 do dashboard — 100% funcional, não clicável.
// Toda vez que o botão "Meditei hoje" (ComunidadeTopBar) marca o dia, esse
// card recalcula sozinho (via evento, ver useSequenciaMeditacao.js): streak
// real com quebra por dia faltando, as 7 bolinhas Seg-Dom da semana atual,
// percentual de consistência e a mensagem lúdica do dia que começou.
function Sequencia() {
  const { streak, bolinhas, percentual, ludico } = useSequenciaMeditacao();

  return (
    <div className="cm-widget cm-widget-sequencia cm-grid-sequencia">
      <div className="cm-widget-topo">
        <h3>
          <span className="cm-icone-badge cm-icone-fogo">
            <Flame size={15} />
          </span>
          Sequência
        </h3>
        <span className="cm-pill-suave">Esta semana</span>
      </div>

      <div className="cm-sequencia-numero">
        {streak === 0 && <span className="cm-sequencia-numero-frase">Você não tem uma sequência</span>}
        {streak === 1 && <span className="cm-sequencia-numero-frase">Você meditou 1 dia</span>}
        {streak >= 2 && (
          <>
            {streak} <span>dias seguidos</span>
          </>
        )}
      </div>

      <div className="cm-sequencia-dias">
        {bolinhas.map((dia) => (
          <div className="cm-sequencia-dia" key={dia.iso}>
            <span className={`cm-sequencia-bolinha ${dia.concluido ? "is-concluido" : ""}`}>{dia.concluido && <Check size={13} strokeWidth={3} />}</span>
            <span className="cm-sequencia-label">{dia.label}</span>
          </div>
        ))}
      </div>

      <div className="cm-sequencia-badge">
        <Award size={14} />
        {streak === 0 ? "Comece hoje e entre no ranking" : `Você está entre os ${percentual}% mais consistentes`}
      </div>

      {ludico && (
        <div className="cm-sequencia-ludico">
          <span className="cm-sequencia-ludico-tag">{ludico.badge}</span>
          <p className="cm-sequencia-ludico-texto">{ludico.texto}</p>
        </div>
      )}
    </div>
  );
}

export default Sequencia;
