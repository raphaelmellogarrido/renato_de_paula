import { useCallback, useEffect, useRef, useState } from "react";
import { Bold, Italic, Smile, Image as ImageIcon, ArrowRight, X, Globe, Lock, ShieldCheck, ChevronDown } from "lucide-react";
import EmojiPicker from "emoji-picker-react";
import { useEmailSessao, lerNomeSessao } from "./usuarioStorage";
import { useComunidadeAuth } from "./useComunidadeAuth";
import { iniciais } from "./comentariosUtils";
import ComentarioCard, { EMAIL_ADMINISTRADOR, EMAIL_ORIENTADOR } from "./ComentarioCard";
import MensagemModal from "./MensagemModal";
import { chaveCacheComentarios, lerCacheComentarios, salvarCacheComentarios, buscarComentarios } from "./cacheComentarios";

const COMENTARIOS_URL = "/api/hotmart/comentarios.php";
const REACAO_URL = "/api/hotmart/comentario-reacao.php";
const UPLOAD_IMAGEM_URL = "/api/hotmart/upload-imagem-comentario.php";
const MENSAGENS_ENVIAR_URL = "/api/mensagens/enviar.php";
// Mesmas regras validadas de novo no servidor (upload-imagem-comentario.php)
// — checar aqui só evita a viagem de rede quando dá pra saber de cara que
// vai falhar.
const TIPOS_FOTO_ACEITOS = ["image/jpeg", "image/png", "image/webp"];
const LIMITE_FOTO_BYTES = 5 * 1024 * 1024; // 5MB
// aula_id fixo — este card não é sobre um vídeo específico, é uma reflexão
// livre do dia, compartilhada entre todos os alunos (não reseta por
// semana/dia, é a mesma tabela permanente de comentarios.php).
const AULA_ID = "dificuldade_do_dia";
// Scroll infinito estilo Instagram (25/08, substituiu a paginação 1/3 de
// 6 em 6): 1º carregamento traz os 20 mais recentes; ao rolar até o
// sentinel no fim da lista (IntersectionObserver, ver mais abaixo), busca
// +10 de cada vez.
const TAMANHO_INICIAL = 20;
const TAMANHO_PAGINA = 10;
// Polling de novidades (pedido do cliente, 26/08): antes disso o feed só
// atualizava quando o PRÓPRIO usuário compartilhava algo (carregarInicial()
// dentro de handleEnviar) — a partilha de outro aluno só aparecia depois de
// um F5. Mesmo "realtime pobre" de useMensagensNaoLidas.js/Mensagens.jsx
// (backend é PHP puro na Hostinger, sem WebSocket). 3s (reduzido de 8s,
// pedido do cliente, 26/08) — mesmo intervalo de MeditandoJunto.jsx
// (INTERVALO_MS), pra resposta a um comentário aparecer pra quem já está
// com o feed aberto quase na hora, não só pra quem respondeu.
const POLL_INTERVALO_MS = 3000;
// Limite visual do textarea: card tem ~700px de largura, fonte 14px (~8px/char,
// ~87 chars/linha) — 2 linhas dariam ~174 chars, mas 140 garante que também
// caiba em 2 linhas no mobile (card mais estreito). Mesmo limite do
// -webkit-line-clamp:2 em cm-comentario-card-texto (ComunidadeApp.css).
const LIMITE_TEXTO = 140;
// Auto-grow do textarea (item 2 do redesign): cresce junto com o texto até
// esse teto, depois vira scroll interno — nunca deixa o card esticar
// infinito nem mostra o handle de arraste do canto (resize:none no CSS).
const ALTURA_MAX_TEXTAREA = 120;
// Mesmo padrão de acoplamento por evento global (literal, não import) já
// usado em useMeditacaoHoje.js/RankingPresenca.jsx/MeditandoJunto.jsx —
// avisa o card "Meditando junto" que uma partilha nova acabou de entrar,
// pra "💬 partilhas hoje" subir sem esperar o próximo tick do polling nem F5.
const EVENTO_PARTILHA_CRIADA = "comunidadePartilhaCriada";

// Toggle de visibilidade da partilha, à esquerda do botão "Compartilhar" —
// mesmos 3 valores que o backend aceita/valida (comentarios.php POST) e
// filtra no GET (só quem pode ver um item chega a recebê-lo, não é só
// escondido no front). 'publico' é sempre o default/1º da lista — mesmo
// comportamento de sempre pra quem nunca mexe no toggle.
const OPCOES_VISIBILIDADE = [
  { valor: "publico", label: "Público", descricao: "Todo mundo vê", Icone: Globe },
  { valor: "privado", label: "Privado", descricao: "Só você vê", Icone: Lock },
  { valor: "orientador", label: "Orientador", descricao: "Só orientadores veem", Icone: ShieldCheck },
];

// Achata um lote de comentários (topo + respostas, 1 nível só — replies não
// têm "onResponder"/podeResponder=false em ComentarioCard, então nunca há
// resposta de resposta) num Set de ids. Usado por verificarNovidades pra
// comparar "quem estava" vs "quem está" entre dois ticks do polling e achar
// o que sumiu (exclusão de outro usuário/admin), ver comentário lá.
function idsDoLote(lista) {
  const ids = new Set();
  for (const c of lista) {
    ids.add(c.id);
    if (Array.isArray(c.respostas)) {
      for (const r of c.respostas) ids.add(r.id);
    }
  }
  return ids;
}

// Fragmento `&email=...` pras 3 URLs de GET de comentarios.php (27/08, reação
// rápida — o backend só devolve `minhaReacao` certo se souber quem está
// perguntando). Vazio quando ainda não resolveu a sessão (useEmailSessao),
// mesmo espírito defensivo do resto do arquivo — nunca manda "email=undefined"
// pra query string.
function paramEmail(email) {
  return email ? `&email=${encodeURIComponent(email)}` : "";
}

// Remove os ids em `idsParaRemover` de `lista`, tanto no topo quanto dentro
// de `respostas` — companheiro de idsDoLote, usado quando verificarNovidades
// detecta que algo sumiu do servidor.
function removerIds(lista, idsParaRemover) {
  return lista
    .filter((c) => !idsParaRemover.has(c.id))
    .map((c) => {
      if (!Array.isArray(c.respostas) || c.respostas.length === 0) return c;
      const respostas = c.respostas.filter((r) => !idsParaRemover.has(r.id));
      return respostas.length === c.respostas.length ? c : { ...c, respostas };
    });
}

// Card "Sua prática hoje" — único conteúdo da coluna 1 do dashboard
// (.cm-grid-feed/.cm-feed-empilhado, ver Dashboard.jsx/ComunidadeApp.css),
// sempre visível (não depende mais de nenhum switch/view). Sem overlay:
// pergunta + textarea + os comentários de todos os alunos, mesmo backend de
// ComentariosFeed.jsx com aula_id fixo. Scroll infinito estilo Instagram
// (20 iniciais, +10 ao rolar — ver TAMANHO_INICIAL/TAMANHO_PAGINA acima),
// não mais a paginação 1/3 de 6 em 6. Vazio (nenhum comentário ainda) mostra
// "Seja o primeiro..." DENTRO deste mesmo card, nunca como card separado
// (era isso que o FeedComunidade fazia, empilhado embaixo deste — removido
// de Dashboard.jsx a pedido do cliente).
function DificuldadeDoDia() {
  const email = useEmailSessao();
  // session.avatarUrl/session.nome — mesma fonte reativa (comunidade_session
  // no localStorage) que ComunidadeSidebar.jsx usa pro avatar da sidebar, já
  // atualizada na hora por Configuracoes.jsx sem precisar de reload.
  const { session } = useComunidadeAuth();
  const [itens, setItens] = useState([]);
  const [carregandoInicial, setCarregandoInicial] = useState(true); // true = ainda não resolveu o 1º fetch nem achou cache
  const [offset, setOffset] = useState(0); // quantos itens já estão carregados — próximo fetch pede a partir daqui
  const [hasMore, setHasMore] = useState(true); // vem do backend (comentarios.php); false esconde o sentinel e mostra "Você chegou ao fim"
  const [carregandoMais, setCarregandoMais] = useState(false); // true enquanto busca o próximo lote de +10 (mostra os 3 skeletons no fim da lista)
  const sentinelRef = useRef(null); // div vazia no fim da lista — observada pelo IntersectionObserver abaixo
  // Container com scroll PRÓPRIO (.cm-duvida .cm-comentarios-lista no CSS,
  // max-height + overflow-y:auto) — não é o scroll da página. Esta coluna do
  // dashboard tem altura esticada (flex:1) pra bater com as colunas 2 e 3
  // (ver .cm-grid-feed .cm-duvida em ComunidadeApp.css); antes disso era
  // seguro porque a lista sempre tinha exatamente N comentários (paginação
  // fixa de 6). Com scroll infinito o total cresce sem limite, então o feed
  // rola DENTRO de uma altura travada em vez de esticar a coluna pra sempre
  // (o que deixaria "Sua Jornada"/"Desafios da semana", nas colunas ao lado,
  // com um vão vazio gigante embaixo). root do IntersectionObserver aponta
  // pra este elemento (não a viewport) — é o scroll dele que dispara o +10.
  const listaRef = useRef(null);
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [foto, setFoto] = useState(null); // File selecionado, ainda não enviado
  const [fotoPreview, setFotoPreview] = useState(""); // object URL local, só pro preview
  const [fotoErro, setFotoErro] = useState("");
  const [emojiAberto, setEmojiAberto] = useState(false);
  // Toggle "Público/Privado/Orientador" (à esquerda de "Compartilhar") —
  // reseta pra 'publico' a cada envio bem-sucedido (ver handleEnviar), pra
  // uma escolha de "Privado" numa partilha não vazar sem querer pra
  // próxima (esquecida ligada).
  const [visibilidade, setVisibilidade] = useState("publico");
  const [visibilidadeAberto, setVisibilidadeAberto] = useState(false);
  const visibilidadePopoverRef = useRef(null);
  const visibilidadeBotaoRef = useRef(null);
  // Modal "Enviar mensagem para @Nome" (Tarefa 2) — guarda o COMENTÁRIO
  // clicado (não só o email) porque MensagemModal.jsx usa comentario.nome
  // no título. null = modal fechado.
  const [destinatarioMensagem, setDestinatarioMensagem] = useState(null);
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);
  const emojiPopoverRef = useRef(null);
  const emojiBotaoRef = useRef(null);
  // guarda o object URL atual num ref (além do state) só pra revogar no
  // unmount sem precisar re-registrar o efeito a cada foto trocada. Nunca
  // mutar ref durante o render (lint react-hooks/refs) — sincroniza no
  // efeito abaixo.
  const fotoPreviewRef = useRef("");
  useEffect(() => {
    fotoPreviewRef.current = fotoPreview;
  }, [fotoPreview]);

  const emailAtualNormalizado = (email || "").toLowerCase().trim();
  const souAdmin = emailAtualNormalizado === EMAIL_ADMINISTRADOR;
  const souOrientador = emailAtualNormalizado === EMAIL_ORIENTADOR;
  const podeExcluir = souAdmin || souOrientador;

  // Busca a 1ª página direto do servidor (sem pintar cache antes) e substitui
  // `itens` inteiro pelo que voltou — é a fonte de verdade "de verdade", sem
  // filter local. Extraído de carregarInicial pra handleExcluir poder chamar
  // só essa parte (refetch completo pós-delete, ver comentário lá) sem
  // reexibir o cache velho por cima do que acabou de ser excluído.
  const buscarPrimeiraPagina = useCallback(() => {
    const chave = chaveCacheComentarios(AULA_ID, 1, email);
    return buscarComentarios(`${COMENTARIOS_URL}?aula_id=${AULA_ID}&limit=${TAMANHO_INICIAL}&offset=0${paramEmail(email)}`).then((dados) => {
      const novos = Array.isArray(dados?.itens) ? dados.itens : [];
      setItens(novos);
      setOffset(novos.length);
      setHasMore(Boolean(dados?.hasMore));
      salvarCacheComentarios(chave, dados);
      return dados;
    });
  }, [email]);

  // 1º carregamento (20 mais recentes) — stale-while-revalidate igual antes:
  // se tiver cache de visita recente (<2min), pinta ele JÁ (sem esperar
  // rede) e ainda assim busca fresco em background. Cache é do mural inteiro
  // (não por email): ver cacheComentarios.js. Só o 1º lote é cacheado —
  // lotes seguintes (carregarMais) são scroll infinito de verdade, não faz
  // sentido guardar em cache um "page 2" que só existiu naquela sessão.
  const carregarInicial = useCallback(() => {
    const chave = chaveCacheComentarios(AULA_ID, 1, email);
    const cache = lerCacheComentarios(chave);
    if (cache) {
      const itensCache = Array.isArray(cache.itens) ? cache.itens : [];
      setItens(itensCache);
      setOffset(itensCache.length);
      setHasMore(Boolean(cache.hasMore));
      setCarregandoInicial(false);
    }

    buscarPrimeiraPagina()
      .then(() => setCarregandoInicial(false))
      .catch((err) => {
        console.error("[Clube Presença] falha ao carregar 'Sua prática hoje' (após retry):", err);
        // Nunca zera itens aqui: já tentamos 2x (buscarComentarios já faz 1
        // retry). Se havia cache, ele continua pintado (carregandoInicial já
        // virou false no bloco acima); se não havia, carregandoInicial
        // continua true e a tela fica no skeleton — nunca mostra "Seja o
        // primeiro a comentar" por causa de uma falha transitória (era isso
        // que fazia o mural aparecer vazio no primeiro load e só corrigir
        // com F5).
      });
  }, [buscarPrimeiraPagina, email]);

  // +10 comentários quando o sentinel entra na viewport. Usa `offset`/
  // `hasMore`/`carregandoMais` do estado (não refs) de propósito: essa
  // função é recriada a cada mudança deles, e o efeito do IntersectionObserver
  // logo abaixo depende dela — então o observer sempre chama a versão com os
  // valores atuais, sem precisar de ref pra "furar" o closure.
  const carregarMais = useCallback(() => {
    if (carregandoMais || !hasMore) return;
    setCarregandoMais(true);

    buscarComentarios(`${COMENTARIOS_URL}?aula_id=${AULA_ID}&limit=${TAMANHO_PAGINA}&offset=${offset}${paramEmail(email)}`)
      .then((dados) => {
        const novos = Array.isArray(dados?.itens) ? dados.itens : [];
        setItens((atual) => [...atual, ...novos]);
        setOffset((atual) => atual + novos.length);
        setHasMore(Boolean(dados?.hasMore));
      })
      .catch((err) => {
        console.error("[Clube Presença] falha ao carregar mais comentários:", err);
        // hasMore fica como estava — se ainda for true, o sentinel continua
        // observado e uma próxima entrada na viewport tenta de novo.
      })
      .finally(() => setCarregandoMais(false));
  }, [offset, hasMore, carregandoMais, email]);

  useEffect(() => {
    carregarInicial();
  }, [carregarInicial]);

  // Ref com os itens atuais só pra verificarNovidades() saber quais ids já
  // estão na tela sem precisar depender de `itens` (senão o setInterval
  // abaixo teria que ser recriado a cada novo comentário). Mesmo padrão de
  // fotoPreviewRef logo abaixo.
  const itensRef = useRef([]);
  useEffect(() => {
    itensRef.current = itens;
  }, [itens]);
  // true durante uma exclusão em andamento (do handleExcluir até o refetch
  // completo terminar) — pausa o polling de verificarNovidades pra ele não
  // buscar exatamente nesse intervalo, ver comentário no setInterval abaixo.
  // Ref (não state): só controla um branch dentro do callback do
  // setInterval, não precisa re-renderizar nada.
  const isDeletingRef = useRef(false);
  // true enquanto um fetch de verificarNovidades já está em voo — trava
  // NOVOS ticks do polling até este resolver (bug real 26/08: "comentário
  // aleatório aparece no topo pro usuário comum quando o admin exclui algo,
  // pro admin fica perfeito"). isDeletingRef acima só protege quem está
  // excluindo (o próprio admin/dono); um usuário passivo só OLHANDO o feed
  // (like o Breno no relato) continua com seu polling rodando normalmente
  // durante a exclusão de outra pessoa — sem essa trava, um tick que demorou
  // mais que POLL_INTERVALO_MS (rede lenta) podia resolver DEPOIS de um tick
  // mais novo já ter aplicado a remoção: a resposta atrasada ainda trazia o
  // comentário (snapshot de ANTES do DELETE), mas `itensRef.current` nesse
  // meio-tempo já não tinha mais ele — o filtro `!idsAtuais.has(c.id)`
  // achava "isso é novo" e reinseria o comentário já excluído de volta no
  // topo. Travando ticks sobrepostos, cada resposta sempre reflete o estado
  // imediatamente anterior a ela mesma, nunca um estado já ultrapassado por
  // um tick mais recente.
  const pollEmVooRef = useRef(false);
  // Ids (topo + respostas) vistos no último tick que ENXERGOU essa mesma
  // janela do servidor (offset=0, os TAMANHO_INICIAL mais recentes) —
  // baseline pra detectar exclusão de outro usuário/admin, ver
  // verificarNovidades abaixo. Some vazio até o 1º tick resolver: nesse tick
  // inicial nada é considerado "removido" (não tem baseline ainda pra
  // comparar), só popula o ref pro próximo.
  const idsConhecidosRef = useRef(new Set());

  // Busca os mais recentes (mesma página do 1º carregamento) e reconcilia
  // com o que já está na tela: (a) enfia no TOPO só o que ainda não está na
  // lista — é assim que a partilha de OUTRO aluno aparece sozinha, sem F5;
  // (b) remove da lista quem sumiu dessa mesma janela desde o tick anterior
  // — é assim que uma exclusão feita pelo admin some do feed de quem está
  // vendo, sem precisar de F5 (pedido do cliente, 26/08: antes só o próprio
  // admin via a lista atualizar, via o refetch de handleExcluir); (c)
  // re-sincroniza `respostas` de comentários-raiz que JÁ estavam na tela —
  // sem isso, quando alguém respondia um comentário que outro aluno já tinha
  // carregado, a resposta nunca aparecia pra esse outro aluno (o id do pai
  // já estava em idsAtuais, então nunca caía no ramo "novos" acima; só quem
  // respondeu via na hora, via o carregarInicial() do próprio handleResponder);
  // (d) re-sincroniza o TEXTO de comentários-raiz e respostas já na tela que
  // foram editados (Tarefa edição, 26/08) — handleEditar já atualiza local na
  // hora pra quem editou, isso aqui é só pra quem MAIS está vendo o feed
  // enxergar a edição sem F5.
  // Pedido do cliente 26/08: resposta a um comentário do feed "Sua prática
  // hoje" precisa aparecer pra quem está vendo em poucos segundos. Só mexe
  // nessa janela (os TAMANHO_INICIAL mais recentes) — itens carregados via
  // scroll infinito (carregarMais) ficam de fora da checagem, mesma
  // limitação que já existia pra detecção de novidades. Nunca reseta `itens`
  // inteiro (jogaria fora o que o scroll infinito já carregou pra baixo); só
  // soma/subtrai o que mudou. offset acompanha só o topo (respostas não
  // contam pra paginação) pra carregarMais continuar batendo com o backend.
  const verificarNovidades = useCallback(() => {
    pollEmVooRef.current = true;
    buscarComentarios(`${COMENTARIOS_URL}?aula_id=${AULA_ID}&limit=${TAMANHO_INICIAL}&offset=0${paramEmail(email)}`)
      .then((dados) => {
        const recentes = Array.isArray(dados?.itens) ? dados.itens : [];
        const recentesPorId = new Map(recentes.map((c) => [c.id, c]));
        const idsAtuais = new Set(itensRef.current.map((c) => c.id));
        const novos = recentes.filter((c) => !idsAtuais.has(c.id));

        const idsRecentes = idsDoLote(recentes);
        const idsRemovidos = new Set(
          [...idsConhecidosRef.current].filter((id) => !idsRecentes.has(id))
        );
        idsConhecidosRef.current = idsRecentes;

        if (idsRemovidos.size > 0) {
          // só ids de TOPO contam pro offset — respostas removidas não mexem
          // na paginação.
          const toposRemovidos = itensRef.current.filter((c) => idsRemovidos.has(c.id)).length;
          if (toposRemovidos > 0) setOffset((atual) => Math.max(0, atual - toposRemovidos));
        }
        if (novos.length > 0) setOffset((atual) => atual + novos.length);

        setItens((atual) => {
          let mudou = novos.length > 0 || idsRemovidos.size > 0;
          const semExcluidos = idsRemovidos.size > 0 ? removerIds(atual, idsRemovidos) : atual;
          // Troca `respostas` pela versão fresca do servidor sempre que a
          // lista de ids mudou (nova resposta chegou, ou uma foi excluída
          // direto por essa via em vez de via idsRemovidos acima) — compara
          // por ids em vez de só length pra pegar o caso raro de uma
          // resposta ser excluída e outra chegar no mesmo tick (length bate,
          // ids não).
          const comRespostasAtualizadas = semExcluidos.map((c) => {
            const fresco = recentesPorId.get(c.id);
            if (!fresco) return c; // fora da janela dos recentes — não mexe
            const respostasAtuais = Array.isArray(c.respostas) ? c.respostas : [];
            const respostasFrescas = Array.isArray(fresco.respostas) ? fresco.respostas : [];
            const idsAtuaisResp = respostasAtuais.map((r) => r.id).join(",");
            const idsFrescosResp = respostasFrescas.map((r) => r.id).join(",");
            // Edição (pedido do cliente 26/08): compara o TEXTO, não só os
            // ids — sem isso uma edição só aparecia pra quem editou
            // (handleEditar já atualiza local na hora), outros alunos só
            // veriam a mudança com F5. Cobre tanto o comentário raiz quanto
            // cada resposta dele (mesma janela dos ids que já bate).
            const textoRaizMudou = fresco.comentario !== c.comentario;
            const algumTextoRespostaMudou =
              idsAtuaisResp === idsFrescosResp &&
              respostasAtuais.some((r, i) => r.comentario !== respostasFrescas[i]?.comentario);
            // Reação rápida (27/08, mesmo espírito da edição acima): pega a
            // reação de OUTRO aluno em até ~3s sem F5. JSON.stringify nas
            // contagens é suficiente aqui (objeto pequeno e fixo, 3 chaves) —
            // não precisa de comparação campo a campo.
            const reacoesRaizMudou = JSON.stringify(fresco.reacoes) !== JSON.stringify(c.reacoes) || fresco.minhaReacao !== c.minhaReacao;
            const algumaReacaoRespostaMudou =
              idsAtuaisResp === idsFrescosResp &&
              respostasAtuais.some((r, i) => {
                const fr = respostasFrescas[i];
                return !fr || JSON.stringify(fr.reacoes) !== JSON.stringify(r.reacoes) || fr.minhaReacao !== r.minhaReacao;
              });
            if (
              idsAtuaisResp === idsFrescosResp &&
              !textoRaizMudou &&
              !algumTextoRespostaMudou &&
              !reacoesRaizMudou &&
              !algumaReacaoRespostaMudou
            )
              return c;
            mudou = true;
            return { ...c, comentario: fresco.comentario, reacoes: fresco.reacoes, minhaReacao: fresco.minhaReacao, respostas: respostasFrescas };
          });
          if (!mudou) return atual; // mesma referência — React não re-renderiza à toa
          return novos.length > 0 ? [...novos, ...comRespostasAtualizadas] : comRespostasAtualizadas;
        });
      })
      .catch(() => {
        // falha silenciosa — só não pega a novidade/exclusão/resposta dessa
        // vez, o próximo tick de 3s tenta de novo. Nunca derruba o feed já
        // pintado por causa disso, nem atualiza idsConhecidosRef (baseline
        // só avança quando o fetch realmente resolve).
      })
      .finally(() => {
        pollEmVooRef.current = false;
      });
  }, [email]);

  useEffect(() => {
    if (carregandoInicial) return; // só depois do 1º carregamento resolver
    const id = setInterval(() => {
      if (document.hidden) return; // aba em background não gasta rede
      // Bug de corrida (26/08): sem essa trava, um tick do poll que já
      // estava em voo (ou pegou o banco num instante entre o DELETE e o
      // commit) podia devolver o comentário recém-excluído, achar que era
      // "novo" (não está mais em itensRef, já foi filtrado) e enfiar ele de
      // volta no topo do feed. Pausa aqui, refetch completo em
      // handleExcluir garante a lista real assim que a exclusão confirma.
      if (isDeletingRef.current) return;
      // Trava contra tick sobreposto — ver comentário na declaração de
      // pollEmVooRef acima. Se o tick anterior ainda não resolveu, pula esta
      // vez; o próximo intervalo de 3s tenta de novo com o estado já mais
      // atual.
      if (pollEmVooRef.current) return;
      verificarNovidades();
    }, POLL_INTERVALO_MS);
    return () => clearInterval(id);
  }, [carregandoInicial, verificarNovidades]);

  // Observa o sentinel (div vazia no fim da lista) e dispara carregarMais()
  // quando ele entra na área visível — automático, sem botão "Carregar
  // mais". `root: listaRef.current` é o que faz a detecção ser relativa ao
  // scroll INTERNO da lista (.cm-comentarios-lista, com overflow-y:auto),
  // não ao scroll da página — sem isso o sentinel ficaria "sempre visível"
  // assim que a lista aparecesse na tela (ela é curta, cabe toda na
  // viewport) e carregaria tudo de uma vez em vez de aos poucos. Só observa
  // enquanto hasMore for true (sentinel nem é renderizado quando false, ver
  // JSX). Recriar o observer a cada mudança de carregarMais é barato aqui
  // (lista pequena, poucas dezenas de comentários) e evita bug de closure
  // preso no offset antigo.
  useEffect(() => {
    if (!hasMore) return;
    const alvo = sentinelRef.current;
    if (!alvo) return;

    const observer = new IntersectionObserver(
      (entradas) => {
        if (entradas[0]?.isIntersecting) carregarMais();
      },
      { root: listaRef.current, threshold: 0.1 }
    );
    observer.observe(alvo);
    return () => observer.disconnect();
  }, [carregarMais, hasMore]);

  // Revoga o object URL do preview no unmount (troca/remoção de foto já se
  // revoga sozinha em handleSelecionarFoto/handleRemoverFoto).
  useEffect(() => {
    return () => {
      if (fotoPreviewRef.current) URL.revokeObjectURL(fotoPreviewRef.current);
    };
  }, []);

  // Auto-grow (item 2): mede o conteúdo real do textarea (scrollHeight) e
  // ajusta a altura até ALTURA_MAX_TEXTAREA — depois disso o CSS
  // (overflow-y:auto) assume o scroll interno. "auto" antes de medir é
  // necessário pra scrollHeight refletir corretamente quando o texto ENCOLHE
  // (apagar linhas), senão a altura só cresce e nunca volta.
  const ajustarAlturaTextarea = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, ALTURA_MAX_TEXTAREA)}px`;
  }, []);

  useEffect(() => {
    ajustarAlturaTextarea();
  }, [texto, ajustarAlturaTextarea]);

  // Fecha o popover de emoji ao clicar fora dele (e fora do botão que abre)
  // ou ao apertar Esc — mesmo padrão de fechar-no-Esc de ImageLightbox.jsx.
  useEffect(() => {
    if (!emojiAberto) return;

    function aoClicarFora(e) {
      if (emojiPopoverRef.current?.contains(e.target)) return;
      if (emojiBotaoRef.current?.contains(e.target)) return;
      setEmojiAberto(false);
    }
    function aoTeclar(e) {
      if (e.key === "Escape") setEmojiAberto(false);
    }
    document.addEventListener("mousedown", aoClicarFora);
    document.addEventListener("keydown", aoTeclar);
    return () => {
      document.removeEventListener("mousedown", aoClicarFora);
      document.removeEventListener("keydown", aoTeclar);
    };
  }, [emojiAberto]);

  // Fecha o popover de visibilidade ao clicar fora ou apertar Esc — mesmo
  // padrão do popover de emoji logo acima.
  useEffect(() => {
    if (!visibilidadeAberto) return;

    function aoClicarFora(e) {
      if (visibilidadePopoverRef.current?.contains(e.target)) return;
      if (visibilidadeBotaoRef.current?.contains(e.target)) return;
      setVisibilidadeAberto(false);
    }
    function aoTeclar(e) {
      if (e.key === "Escape") setVisibilidadeAberto(false);
    }
    document.addEventListener("mousedown", aoClicarFora);
    document.addEventListener("keydown", aoTeclar);
    return () => {
      document.removeEventListener("mousedown", aoClicarFora);
      document.removeEventListener("keydown", aoTeclar);
    };
  }, [visibilidadeAberto]);

  // Insere `trecho` na posição do cursor (ou substitui a seleção atual),
  // respeitando LIMITE_TEXTO, e recoloca o cursor logo depois do trecho
  // inserido. Base compartilhada por B/I (envolve seleção com marcador) e
  // pelo picker de emoji (insere sem marcador, cursorDepois = fim do emoji).
  function inserirNoCursor(antes, meio, depois = "") {
    const el = textareaRef.current;
    const inicio = el?.selectionStart ?? texto.length;
    const fim = el?.selectionEnd ?? texto.length;
    const selecionado = texto.slice(inicio, fim);
    const novoTrecho = `${antes}${selecionado}${meio}${depois}`;
    const novoTexto = texto.slice(0, inicio) + novoTrecho + texto.slice(fim);
    if (novoTexto.length > LIMITE_TEXTO) return; // mesmo teto do maxLength manual

    setTexto(novoTexto);
    const novoCursor = inicio + antes.length + selecionado.length + meio.length;
    // Precisa esperar o re-render (novo value) antes de mover o cursor —
    // setSelectionRange no mesmo tick ainda vê o value antigo.
    requestAnimationFrame(() => {
      el?.focus();
      el?.setSelectionRange(novoCursor, novoCursor);
    });
  }

  // B/I: envolve a seleção com o marcador de markdown dos dois lados; sem
  // seleção, insere o par vazio com o cursor entre eles.
  function aplicarMarcador(marcador) {
    inserirNoCursor(marcador, marcador);
  }

  // onEmojiClick da lib (emoji-picker-react): recebe o objeto emojiData, não
  // o caractere direto — `.emoji` é o unicode. Não fecha o popover depois de
  // inserir (mesmo comportamento do WhatsApp): deixa escolher vários emojis
  // seguidos sem reabrir. Fecha só via clique fora/Esc (efeito acima).
  function inserirEmoji(emojiData) {
    inserirNoCursor(emojiData.emoji, "");
  }

  function handleSelecionarFoto(e) {
    const arquivo = e.target.files?.[0];
    e.target.value = ""; // permite escolher o mesmo arquivo de novo depois de remover
    if (!arquivo) return;

    if (!TIPOS_FOTO_ACEITOS.includes(arquivo.type)) {
      setFotoErro("Use uma imagem JPG, PNG ou WEBP.");
      return;
    }
    if (arquivo.size > LIMITE_FOTO_BYTES) {
      setFotoErro("A imagem deve ter no máximo 5MB.");
      return;
    }

    if (fotoPreviewRef.current) URL.revokeObjectURL(fotoPreviewRef.current);
    setFotoErro("");
    setFoto(arquivo);
    setFotoPreview(URL.createObjectURL(arquivo));
  }

  function handleRemoverFoto() {
    if (fotoPreviewRef.current) URL.revokeObjectURL(fotoPreviewRef.current);
    setFoto(null);
    setFotoPreview("");
    setFotoErro("");
  }

  async function handleEnviar(e) {
    e.preventDefault();
    const valor = texto.trim();
    if (!valor || !email || enviando) return;

    setEnviando(true);
    try {
      let imageToken = "";
      if (foto) {
        const formData = new FormData();
        formData.append("imagem", foto);
        const respostaUpload = await fetch(UPLOAD_IMAGEM_URL, { method: "POST", body: formData });
        const dadosUpload = await respostaUpload.json();
        if (dadosUpload?.erro) throw new Error(dadosUpload.erro);
        // v2 (bug 26/08, foto sumindo): upload-imagem-comentario.php agora
        // grava o blob em staging (comentario_imagens_pendentes) em vez de
        // arquivo em disco, e devolve um token em vez de url — o POST
        // abaixo migra esse blob pra dentro do comentário de verdade.
        imageToken = dadosUpload?.token || "";
      }

      const resposta = await fetch(COMENTARIOS_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, nome: lerNomeSessao(), aula_id: AULA_ID, comentario: valor, image_token: imageToken, visibilidade }),
      });
      const data = await resposta.json();
      if (data?.erro) throw new Error(data.erro);

      setTexto("");
      setVisibilidade("publico"); // nunca deixa "Privado"/"Orientador" ligado pra próxima partilha sem querer
      handleRemoverFoto();
      carregarInicial(); // comentário novo entra no topo — refaz o 1º lote do zero
      window.dispatchEvent(new CustomEvent(EVENTO_PARTILHA_CRIADA));
    } catch (err) {
      console.error("[Clube Presença] falha ao compartilhar:", err);
    } finally {
      setEnviando(false);
    }
  }

  // Botão "Responder" (Tarefa 1) — reusa o mesmo endpoint de comentário
  // normal, só que com parent_id. Refaz o 1º lote do zero (carregarInicial)
  // em vez de tentar inserir a resposta manualmente no array local: o
  // comentário pai pode não estar mais nos `itens` atuais se a lista já
  // rolou (scroll infinito), e um refetch garante que a resposta apareça
  // aninhada certinha vinda do backend, mesma fonte de verdade do resto.
  async function handleResponder(parentId, texto) {
    const resposta = await fetch(COMENTARIOS_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, nome: lerNomeSessao(), aula_id: AULA_ID, comentario: texto, parent_id: parentId }),
    });
    const data = await resposta.json();
    if (data?.erro) throw new Error(data.erro);
    carregarInicial();
  }

  // Editar comentário (pedido do cliente, 26/08: "como em rede social", só o
  // próprio dono edita — checagem de verdade é no backend, PUT em
  // comentarios.php, mas ComentarioCard já nem mostra o lápis pra quem não é
  // o autor). Atualiza local otimisticamente em vez de refazer
  // carregarInicial(): edição não muda ordenação nem paginação, só o texto de
  // UM item (raiz ou dentro de `respostas`) — refetch completo seria
  // desperdício. `id` pode ser tanto de um comentário raiz quanto de uma
  // resposta, então checa os dois níveis.
  async function handleEditar(id, novoTexto) {
    const resposta = await fetch(`${COMENTARIOS_URL}?id=${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, comentario: novoTexto }),
    });
    const data = await resposta.json();
    if (data?.erro) throw new Error(data.erro);

    setItens((atual) =>
      atual.map((c) => {
        if (c.id === id) return { ...c, comentario: novoTexto };
        if (Array.isArray(c.respostas) && c.respostas.some((r) => r.id === id)) {
          return { ...c, respostas: c.respostas.map((r) => (r.id === id ? { ...r, comentario: novoTexto } : r)) };
        }
        return c;
      })
    );
  }

  // Acha um comentário (raiz OU resposta) pelo id nos `itens` atuais — usado
  // por handleReagir abaixo pra saber o `reacoes`/`minhaReacao` de ANTES,
  // antes de aplicar a atualização otimista.
  function encontrarComentario(id) {
    for (const c of itensRef.current) {
      if (c.id === id) return c;
      const resposta = (c.respostas || []).find((r) => r.id === id);
      if (resposta) return resposta;
    }
    return null;
  }

  // Aplica um `patch` ({reacoes, minhaReacao}) no comentário `id`, seja ele
  // raiz ou dentro de `respostas` — mesma busca nos 2 níveis de handleEditar
  // acima (reaproveitada em vez de duplicada, aqui e no revert do catch de
  // handleReagir).
  function aplicarReacaoLocal(id, patch) {
    setItens((atual) =>
      atual.map((c) => {
        if (c.id === id) return { ...c, ...patch };
        if (Array.isArray(c.respostas) && c.respostas.some((r) => r.id === id)) {
          return { ...c, respostas: c.respostas.map((r) => (r.id === id ? { ...r, ...patch } : r)) };
        }
        return c;
      })
    );
  }

  // Reação rápida (🙏 ❤️ 🔥, pedido do cliente 27/08) — tocar no mesmo emoji
  // já escolhido remove (toggle off), tocar em outro troca; nunca mais de 1
  // reação por pessoa por comentário, mesma regra que o backend garante
  // (UNIQUE comentario_id+email em comentario_reacoes, ver _conexao.php).
  // Atualização otimista local primeiro (calculada do mesmo jeito que o
  // servidor calcularia) pro toque parecer instantâneo; a resposta do
  // servidor SUBSTITUI esse cálculo pelo estado real (fonte de verdade —
  // cobre a corrida de reagir em 2 abas/dispositivos quase ao mesmo tempo).
  // Se o POST falhar, reverte pro estado de antes (mesmo espírito de
  // handleEditar, mas sem alert — reação é leve demais pra interromper com
  // um popup, ComentarioCard só loga o erro).
  async function handleReagir(id, emoji) {
    const anterior = encontrarComentario(id);
    const reacoesAnteriores = anterior?.reacoes || { "🙏": 0, "❤️": 0, "🔥": 0 };
    const minhaAnterior = anterior?.minhaReacao ?? null;

    const novasReacoes = { ...reacoesAnteriores };
    if (minhaAnterior) novasReacoes[minhaAnterior] = Math.max(0, (novasReacoes[minhaAnterior] || 0) - 1);
    const novaMinha = minhaAnterior === emoji ? null : emoji;
    if (novaMinha) novasReacoes[novaMinha] = (novasReacoes[novaMinha] || 0) + 1;
    aplicarReacaoLocal(id, { reacoes: novasReacoes, minhaReacao: novaMinha });

    try {
      const resposta = await fetch(REACAO_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ comentario_id: id, email, emoji }),
      });
      const data = await resposta.json();
      if (data?.erro) throw new Error(data.erro);
      aplicarReacaoLocal(id, { reacoes: data.contagens, minhaReacao: data.minhaReacao });
    } catch (err) {
      aplicarReacaoLocal(id, { reacoes: reacoesAnteriores, minhaReacao: minhaAnterior });
      throw err; // ComentarioCard loga (console.error) e limpa o estado de "reagindo"
    }
  }

  // Modal "Enviar mensagem para @Nome" (Tarefa 2) — só chamado quando
  // podeExcluir (admin/orientador) já autorizou o clique no nome (ver
  // podeEnviarMensagem passado pro ComentarioCard abaixo).
  async function handleEnviarMensagem(texto) {
    const resposta = await fetch(MENSAGENS_ENVIAR_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ de_email: email, para_email: destinatarioMensagem.email, mensagem: texto }),
    });
    const data = await resposta.json();
    if (data?.erro) throw new Error(data.erro);
  }

  // Exclui por ID (não por índice — nunca depende de posição no array, que
  // muda a cada refetch/scroll). Trava o polling de novidades (isDeletingRef)
  // ANTES do DELETE ir pro servidor e só libera DEPOIS que o refetch completo
  // da 1ª página já pintou a lista real — evita o bug de corrida onde o
  // comentário excluído reaparecia "fixo" no topo (ver comentário no
  // setInterval de verificarNovidades). Refetch do servidor em vez de filter
  // local por dois motivos: (1) é a mesma garantia contra a corrida acima —
  // o próprio handleExcluir já resolve com o estado real, não precisa
  // esperar o próximo tick do poll pra confirmar; (2) fonte de verdade única,
  // sem risco de filter local e servidor divergirem silenciosamente.
  async function handleExcluir(id) {
    if (!window.confirm("Excluir este comentário?")) return;

    isDeletingRef.current = true;
    try {
      const resposta = await fetch(`${COMENTARIOS_URL}?id=${id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await resposta.json();
      if (data?.erro) throw new Error(data.erro);

      await buscarPrimeiraPagina();
    } catch (err) {
      console.error("[Clube Presença] falha ao excluir comentário:", err);
      window.alert("Não foi possível excluir o comentário.");
    } finally {
      isDeletingRef.current = false;
    }
  }

  const vazio = !carregandoInicial && itens.length === 0 && !hasMore;
  const nomeSessao = session?.nome || lerNomeSessao();
  const opcaoVisibilidadeAtual = OPCOES_VISIBILIDADE.find((o) => o.valor === visibilidade) || OPCOES_VISIBILIDADE[0];

  return (
    <div className="cm-duvida">
      {/* Cabeçalho: avatar redondo pequeno (não estica a linha, só
          acompanha a altura das 3 linhas de texto ao lado — flex
          align-items:center faz a centralização vertical, ver
          .cm-duvida-cabecalho no CSS) + eyebrow/título/subtítulo. */}
      <div className="cm-duvida-cabecalho">
        {session?.avatarUrl ? (
          <img src={session.avatarUrl} alt="" className="cm-duvida-avatar cm-duvida-avatar-img" />
        ) : (
          <div className="cm-duvida-avatar">{iniciais(nomeSessao)}</div>
        )}
        <div className="cm-duvida-cabecalho-textos">
          <span className="cm-duvida-eyebrow">Sua prática hoje</span>
          <h2 className="cm-duvida-titulo">Qual foi sua dificuldade ao meditar hoje?</h2>
          <p className="cm-duvida-sub">Compartilhe aqui. Sua experiência pode acolher outra pessoa.</p>
        </div>
      </div>

      <form className="cm-duvida-form" onSubmit={handleEnviar}>
        <textarea
          ref={textareaRef}
          className="cm-duvida-textarea"
          placeholder="Hoje eu senti..."
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          rows={3}
          maxLength={LIMITE_TEXTO}
        />

        {fotoPreview && (
          <div className="cm-duvida-foto-preview">
            <img src={fotoPreview} alt="Pré-visualização da foto anexada" />
            <button type="button" className="cm-duvida-foto-remover" aria-label="Remover foto" onClick={handleRemoverFoto}>
              <X size={12} strokeWidth={3} />
            </button>
          </div>
        )}

        {fotoErro && <p className="cm-duvida-foto-erro">{fotoErro}</p>}

        <div className="cm-toolbar">
          <button type="button" className="cm-toolbar-btn" aria-label="Negrito" title="Negrito" onClick={() => aplicarMarcador("**")}>
            <Bold size={18} />
          </button>
          <button type="button" className="cm-toolbar-btn" aria-label="Itálico" title="Itálico" onClick={() => aplicarMarcador("*")}>
            <Italic size={18} />
          </button>
          <button
            ref={emojiBotaoRef}
            type="button"
            className={`cm-toolbar-btn cm-btn-emoji ${emojiAberto ? "is-ativo" : ""}`}
            aria-label="Inserir emoji"
            title="Inserir emoji"
            onClick={() => setEmojiAberto((v) => !v)}
          >
            <Smile size={18} />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="cm-duvida-anexar-input"
            onChange={handleSelecionarFoto}
            tabIndex={-1}
          />
          <button
            type="button"
            className="cm-toolbar-btn"
            aria-label="Anexar foto"
            title="Anexar foto"
            disabled={enviando}
            onClick={() => fileInputRef.current?.click()}
          >
            <ImageIcon size={18} />
          </button>

          {emojiAberto && (
            // lib completa (emoji-picker-react) em vez dos 20 emojis fixos de
            // antes — busca + categorias, mesmo espírito do picker do
            // WhatsApp. CSS próprio da lib (classes cm-* internas, não
            // Tailwind); .cm-duvida-emoji-popover só cuida do posicionamento
            // (ver ComunidadeApp.css).
            <div className="cm-duvida-emoji-popover" ref={emojiPopoverRef}>
              <EmojiPicker onEmojiClick={inserirEmoji} height={350} width={300} previewConfig={{ showPreview: false }} />
            </div>
          )}
        </div>

        <div className="cm-duvida-form-acoes">
          <span className="cm-duvida-contador">
            {texto.length}/{LIMITE_TEXTO}
          </span>
          {/* Toggle + "Compartilhar" agrupados à direita (pedido do cliente:
              toggle no lado esquerdo do botão) — o contador continua sozinho
              à esquerda via justify-content:space-between em -form-acoes. */}
          <div className="cm-duvida-form-acoes-direita">
            <div className="cm-duvida-visibilidade">
              <button
                ref={visibilidadeBotaoRef}
                type="button"
                className={`cm-duvida-visibilidade-btn ${visibilidadeAberto ? "is-ativo" : ""}`}
                aria-label={`Visibilidade da partilha: ${opcaoVisibilidadeAtual.label}`}
                title={`Visibilidade: ${opcaoVisibilidadeAtual.label} — ${opcaoVisibilidadeAtual.descricao}`}
                onClick={() => setVisibilidadeAberto((v) => !v)}
              >
                <opcaoVisibilidadeAtual.Icone size={14} />
                <span>{opcaoVisibilidadeAtual.label}</span>
                <ChevronDown size={13} />
              </button>

              {visibilidadeAberto && (
                <div className="cm-duvida-visibilidade-popover" ref={visibilidadePopoverRef}>
                  {OPCOES_VISIBILIDADE.map((opcao) => (
                    <button
                      key={opcao.valor}
                      type="button"
                      className={`cm-duvida-visibilidade-opcao ${visibilidade === opcao.valor ? "is-selecionada" : ""}`}
                      onClick={() => {
                        setVisibilidade(opcao.valor);
                        setVisibilidadeAberto(false);
                      }}
                    >
                      <opcao.Icone size={15} />
                      <span className="cm-duvida-visibilidade-opcao-textos">
                        <span className="cm-duvida-visibilidade-opcao-label">{opcao.label}</span>
                        <span className="cm-duvida-visibilidade-opcao-desc">{opcao.descricao}</span>
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button type="submit" className="cm-duvida-enviar" disabled={!texto.trim() || !email || enviando}>
              {enviando ? "Enviando..." : "Compartilhar"}
              {!enviando && <ArrowRight size={15} />}
            </button>
          </div>
        </div>
      </form>

      <div className="cm-duvida-divider" />

      {carregandoInicial && (
        // Skeleton só aparece se não havia cache pra pintar de cara
        // (carregarInicial() já preenche itens a partir do cache antes do
        // fetch resolver, e nesse caso carregandoInicial já vira false
        // direto) — nunca mais deixa a área da lista em branco esperando a
        // rede. Formato "com avatar + linhas" (SkeletonMensagem abaixo), não
        // o skeleton simples de ComentariosFeed.jsx.
        <div className="cm-comentarios-lista" aria-hidden="true">
          {[0, 1, 2].map((i) => (
            <SkeletonMensagem key={i} />
          ))}
        </div>
      )}

      {!carregandoInicial && vazio && <p className="cm-duvida-vazio">Seja o primeiro a comentar</p>}

      {!carregandoInicial && !vazio && (
        // ref aqui (não num wrapper à parte): é ESTE elemento que tem o
        // scroll interno (max-height + overflow-y:auto, CSS) e serve de
        // `root` pro IntersectionObserver — sentinel/skeletons/"fim" têm
        // que estar dentro dele, senão o observer não os enxerga como
        // descendentes do root.
        <div className="cm-comentarios-lista" ref={listaRef}>
          {itens.map((comentario) => (
            <ComentarioCard
              key={comentario.id}
              comentario={comentario}
              podeExcluir={podeExcluir}
              emailAtual={email}
              onExcluir={handleExcluir}
              onResponder={handleResponder}
              podeEnviarMensagem={podeExcluir}
              onIniciarMensagem={setDestinatarioMensagem}
              onEditar={handleEditar}
              onReagir={handleReagir}
            />
          ))}
          {carregandoMais && [0, 1, 2].map((i) => <SkeletonMensagem key={`mais-${i}`} />)}
          {/* Scroll infinito: sem botão "Carregar mais" — o sentinel
              dispara carregarMais() sozinho ao entrar na área visível do
              scroll interno (ver useEffect do IntersectionObserver acima).
              Só existe enquanto hasMore. */}
          {hasMore && <div ref={sentinelRef} className="cm-comentarios-sentinela" aria-hidden="true" />}
          {!hasMore && <p className="cm-comentarios-fim">Você chegou ao fim</p>}
        </div>
      )}

      {destinatarioMensagem && (
        <MensagemModal
          destinatario={destinatarioMensagem}
          onEnviar={handleEnviarMensagem}
          onClose={() => setDestinatarioMensagem(null)}
        />
      )}
    </div>
  );
}

// Placeholder de UM comentário enquanto carrega — avatar redondo + 2 linhas
// cinzas, shimmer (ver .cm-comentario-skeleton-msg* em ComunidadeApp.css).
// Componente à parte só porque aparece em 2 lugares (1º load e carregarMais)
// com o mesmo JSX.
function SkeletonMensagem() {
  return (
    <div className="cm-comentario-skeleton-msg" aria-hidden="true">
      <div className="cm-comentario-skeleton-msg-avatar" />
      <div className="cm-comentario-skeleton-msg-linhas">
        <div className="cm-comentario-skeleton-msg-linha" />
        <div className="cm-comentario-skeleton-msg-linha" />
      </div>
    </div>
  );
}

export default DificuldadeDoDia;
