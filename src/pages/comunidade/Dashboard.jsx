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
// Jornada + Meditando junto. Coluna 3 (.cm-coluna-direita) é Próximo
// encontro + Desafio da semana + Ranking (ColunaEncontros). Biblioteca de
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
    </div>
  );
}

export default Dashboard;
