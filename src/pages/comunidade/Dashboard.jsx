import ColunaProgresso from "./components/ColunaProgresso";
import ColunaEncontros from "./components/ColunaEncontros";
import DificuldadeDoDia from "./components/DificuldadeDoDia";

// Dashboard: grid único de 3 colunas (a 4ª, sidebar esquerda, é resolvida
// por fora em ComunidadeLayout) — cada coluna é um filho direto do grid
// definido em .cm-main (ver ComunidadeApp.css), empilhando seu próprio
// conteúdo com flexbox por dentro, SEM linha de grid compartilhada entre
// colunas (era isso que quebrava o alinhamento: conteúdo alto de uma
// coluna empurrava pra baixo o conteúdo de outra que "dividia a linha").
// `align-items: stretch` no grid + `.cm-grid-feed{height:100%}` +
// `.cm-duvida{flex:1}` fazem a coluna 1 esticar até a altura das colunas
// 2/3 (a maior das três), e `margin-top:auto` no último widget de
// .cm-coluna-meio/.cm-coluna-direita cola ele no rodapé se um dia for a
// coluna 1 que ficar mais alta — assim as 3 colunas sempre terminam na
// mesma linha embaixo (ver ComunidadeApp.css).
// Coluna 1 é sempre a Comunidade agora (o switch Curso/Comunidade foi
// removido — produto virou um bundle único pago, sem view alternativa) —
// só tem "Sua prática hoje" (DificuldadeDoDia): pergunta + form + lista de
// comentários (ou o empty state "Seja o primeiro...", dentro do PRÓPRIO
// card, nunca como card separado — ver DificuldadeDoDia.jsx). O
// FeedComunidade (posts.php, feed de presença com curtidas) foi tirado
// daqui a pedido do cliente: era um 2º card branco solto embaixo deste,
// sempre vazio (tabela de posts nunca teve registro), o "card fantasma"
// do print. Componente continua existindo em FeedComunidade.jsx, só não é
// mais montado aqui. Coluna 2 (.cm-coluna-meio) é o botão "Já meditei
// hoje" (BotaoMediteiHoje, dentro de ColunaProgresso) + Sequência + Sua
// Jornada + Ranking de Presença (RankingPresenca). Coluna 3
// (.cm-coluna-direita) é Próximo encontro + Desafio da semana + Meditando
// junto (ColunaEncontros) — Ranking e Meditando junto trocaram de coluna a
// pedido do cliente. Biblioteca de
// Meditações foi removida a pedido do cliente. Sem accordion por Dia
// nesta versão (removido a pedido do cliente); DIAS continua existindo só
// para abrir a "meditação de hoje" e alimentar /comunidade/aula/:id.
function Dashboard() {
  return (
    <div className="cm-main">
      <div className="cm-grid-feed cm-feed-empilhado">
        <DificuldadeDoDia />
      </div>

      <div className="cm-coluna-meio">
        <ColunaProgresso />
      </div>

      <div className="cm-coluna-direita">
        <ColunaEncontros />
      </div>

      {/* Versão mobile do card "Posso ajudar?" (o da sidebar some no
          celular, ver ComunidadeSidebar.jsx) — solta aqui como último item
          direto de .cm-main pra virar o último card da lista no grid
          mobile via order:99 (ver ComunidadeApp.css). */}
      <div
        className="cm-ajuda-card cm-ajuda-card--mobile"
        onClick={() => window.open("https://wa.me/5521976624767?text=Olá, preciso de ajuda na Comunidade Meditação Raiz", "_blank")}
      >
        <div className="cm-ajuda-icone">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20.52 3.48A11.94 11.94 0 0 0 12.04 0C5.5 0 .2 5.3.2 11.85c0 2.09.55 4.13 1.6 5.93L0 24l6.4-1.68a11.86 11.86 0 0 0 5.64 1.44h.01c6.54 0 11.85-5.3 11.85-11.85 0-3.17-1.23-6.14-3.38-8.43ZM12.05 21.6h-.01a9.8 9.8 0 0 1-5-1.37l-.36-.21-3.8 1 1.01-3.7-.23-.38a9.75 9.75 0 0 1-1.5-5.18c0-5.4 4.4-9.79 9.8-9.79 2.62 0 5.08 1.02 6.93 2.87a9.72 9.72 0 0 1 2.87 6.92c0 5.4-4.4 9.79-9.8 9.79Zm5.37-7.34c-.29-.15-1.74-.86-2.01-.96-.27-.1-.47-.15-.66.15-.2.29-.76.96-.93 1.16-.17.2-.34.22-.63.07-.29-.15-1.24-.46-2.36-1.46-.87-.78-1.46-1.74-1.63-2.03-.17-.3-.02-.45.13-.6.13-.13.29-.34.44-.51.15-.17.2-.29.29-.49.1-.2.05-.37-.02-.51-.08-.15-.66-1.6-.91-2.2-.24-.58-.48-.5-.66-.5h-.56c-.2 0-.51.07-.78.37-.27.29-1.02 1-1.02 2.44s1.05 2.83 1.2 3.03c.15.2 2.06 3.16 5 4.43.7.3 1.24.48 1.67.62.7.22 1.34.19 1.84.12.56-.08 1.74-.71 1.98-1.4.25-.68.25-1.27.17-1.4-.07-.13-.26-.2-.55-.35Z" />
          </svg>
        </div>
        <div className="cm-ajuda-texto">
          <strong>Posso ajudar?</strong>
          <span>Tire suas dúvidas no WhatsApp</span>
        </div>
        <div className="cm-ajuda-seta">↗</div>
      </div>
    </div>
  );
}

export default Dashboard;
