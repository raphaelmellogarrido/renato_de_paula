import { Flame, Check } from "lucide-react";
import { useSequenciaMeditacao } from "./useSequenciaMeditacao";

// Card "Sequência" da coluna 3 do dashboard — 100% funcional, não clicável.
// Toda vez que o botão "Meditei hoje" (BotaoMediteiHoje) marca o dia, esse
// card recalcula sozinho (via evento, ver useSequenciaMeditacao.js): streak
// real com quebra por dia faltando e as 7 bolinhas Seg-Dom da semana atual.
// Percentual/mensagem lúdica saíram do card (pedido do cliente) — o hook
// ainda calcula esses campos, só não são mais usados aqui.
function Sequencia() {
  const { streak, bolinhas } = useSequenciaMeditacao();

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

      <div className="cm-consistencia-box">
        <span>🧘</span> A consistência é o segredo!
      </div>
    </div>
  );
}

export default Sequencia;
