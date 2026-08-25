import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Bold, Italic, Smile, Image as ImageIcon, ArrowRight, X } from "lucide-react";
import { useEmailSessao, lerNomeSessao } from "./usuarioStorage";
import { useComunidadeAuth } from "./useComunidadeAuth";
import { iniciais } from "./comentariosUtils";
import ComentarioCard, { EMAIL_ADMINISTRADOR, EMAIL_ORIENTADOR } from "./ComentarioCard";
import { chaveCacheComentarios, lerCacheComentarios, salvarCacheComentarios, buscarComentarios } from "./cacheComentarios";

const COMENTARIOS_URL = "/api/hotmart/comentarios.php";
const UPLOAD_IMAGEM_URL = "/api/hotmart/upload-imagem-comentario.php";
// Mesmas regras validadas de novo no servidor (upload-imagem-comentario.php)
// — checar aqui só evita a viagem de rede quando dá pra saber de cara que
// vai falhar.
const TIPOS_FOTO_ACEITOS = ["image/jpeg", "image/png", "image/webp"];
const LIMITE_FOTO_BYTES = 5 * 1024 * 1024; // 5MB
// aula_id fixo — este card não é sobre um vídeo específico, é uma reflexão
// livre do dia, compartilhada entre todos os alunos (não reseta por
// semana/dia, é a mesma tabela permanente de comentarios.php).
const AULA_ID = "dificuldade_do_dia";
const POR_PAGINA = 6; // era 7 — ajuste fino de altura (23/08) pra alinhar o final das 3 colunas de /comunidade
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

// 20 emojis temáticos (meditação/natureza/quietude) pro popover do item 4 —
// mesmo espírito visual do resto do app (sálvia, folhas, luz).
const EMOJIS_MEDITACAO = [
  "🧘", "🧘‍♀️", "🧘‍♂️", "🙏", "🕉️",
  "🪷", "🌿", "🍃", "🌸", "☀️",
  "🌙", "⭐", "✨", "💫", "🌊",
  "🔥", "💚", "🌱", "🦋", "🕊️",
];

// Card "Sua prática hoje" — único conteúdo da coluna 1 do dashboard
// (.cm-grid-feed/.cm-feed-empilhado, ver Dashboard.jsx/ComunidadeApp.css),
// sempre visível (não depende mais de nenhum switch/view). Sem foto, sem
// overlay: pergunta + textarea + os 7 comentários mais recentes de todos
// os alunos, paginados — mesmo backend de ComentariosFeed.jsx, só com
// aula_id fixo e per_page=7 em vez de 10. Vazio (nenhum comentário ainda)
// mostra "Seja o primeiro..." DENTRO deste mesmo card, nunca como card
// separado (era isso que o FeedComunidade fazia, empilhado embaixo deste —
// removido de Dashboard.jsx a pedido do cliente). Paginado de 6 em 6.
function DificuldadeDoDia() {
  const email = useEmailSessao();
  // session.avatarUrl/session.nome — mesma fonte reativa (comunidade_session
  // no localStorage) que ComunidadeSidebar.jsx usa pro avatar da sidebar, já
  // atualizada na hora por Configuracoes.jsx sem precisar de reload.
  const { session } = useComunidadeAuth();
  const [itens, setItens] = useState([]);
  const [total, setTotal] = useState(null); // null = ainda carregando a 1ª vez
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [foto, setFoto] = useState(null); // File selecionado, ainda não enviado
  const [fotoPreview, setFotoPreview] = useState(""); // object URL local, só pro preview
  const [fotoErro, setFotoErro] = useState("");
  const [emojiAberto, setEmojiAberto] = useState(false);
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

  const carregar = useCallback((paginaAlvo) => {
    // Stale-while-revalidate: se tiver cache de visita recente (<2min) pra
    // essa página, pinta ele JÁ (sem esperar rede) e ainda assim busca fresco
    // em background — evita a área da lista ficar em branco por segundos
    // numa visita repetida. Cache é do mural inteiro (não por email): ver
    // cacheComentarios.js.
    const chave = chaveCacheComentarios(AULA_ID, paginaAlvo);
    const cache = lerCacheComentarios(chave);
    if (cache) {
      setItens(Array.isArray(cache.itens) ? cache.itens : []);
      setTotal(Number.isFinite(cache.total) ? cache.total : 0);
      setPage(Number.isFinite(cache.page) ? cache.page : paginaAlvo);
      setPages(Number.isFinite(cache.pages) ? Math.max(1, cache.pages) : 1);
    }

    buscarComentarios(`${COMENTARIOS_URL}?aula_id=${AULA_ID}&page=${paginaAlvo}&per_page=${POR_PAGINA}`)
      .then((dados) => {
        setItens(Array.isArray(dados?.itens) ? dados.itens : []);
        setTotal(Number.isFinite(dados?.total) ? dados.total : 0);
        setPage(Number.isFinite(dados?.page) ? dados.page : paginaAlvo);
        setPages(Number.isFinite(dados?.pages) ? Math.max(1, dados.pages) : 1);
        salvarCacheComentarios(chave, dados);
      })
      .catch((err) => {
        console.error("[Clube Presença] falha ao carregar 'Sua prática hoje' (após retry):", err);
        // Nunca zera itens/total aqui: já tentamos 2x (buscarComentarios já
        // faz 1 retry). Se havia cache, ele continua pintado; se não havia,
        // total continua null e a tela fica no skeleton — nunca mostra
        // "Seja o primeiro a comentar" por causa de uma falha transitória
        // (era isso que fazia o mural aparecer vazio no primeiro load e só
        // corrigir com F5).
      });
  }, []);

  useEffect(() => {
    carregar(1);
  }, [carregar]);

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

  function inserirEmoji(emoji) {
    inserirNoCursor(emoji, "");
    setEmojiAberto(false);
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
      let imageUrl = "";
      if (foto) {
        const formData = new FormData();
        formData.append("imagem", foto);
        const respostaUpload = await fetch(UPLOAD_IMAGEM_URL, { method: "POST", body: formData });
        const dadosUpload = await respostaUpload.json();
        if (dadosUpload?.erro) throw new Error(dadosUpload.erro);
        imageUrl = dadosUpload?.url || "";
      }

      const resposta = await fetch(COMENTARIOS_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, nome: lerNomeSessao(), aula_id: AULA_ID, comentario: valor, image_url: imageUrl }),
      });
      const data = await resposta.json();
      if (data?.erro) throw new Error(data.erro);

      setTexto("");
      handleRemoverFoto();
      carregar(1); // comentário novo entra no topo — sempre volta pra página 1
      window.dispatchEvent(new CustomEvent(EVENTO_PARTILHA_CRIADA));
    } catch (err) {
      console.error("[Clube Presença] falha ao compartilhar:", err);
    } finally {
      setEnviando(false);
    }
  }

  function handleExcluir(id) {
    if (!window.confirm("Excluir este comentário?")) return;

    fetch(`${COMENTARIOS_URL}?id=${id}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data?.erro) throw new Error(data.erro);
        setItens((atual) => atual.filter((c) => c.id !== id));
        setTotal((atual) => (typeof atual === "number" ? Math.max(0, atual - 1) : atual));
      })
      .catch((err) => {
        console.error("[Clube Presença] falha ao excluir comentário:", err);
        window.alert("Não foi possível excluir o comentário.");
      });
  }

  const carregando = total === null;
  const vazio = total === 0;
  const nomeSessao = session?.nome || lerNomeSessao();

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

        <div className="cm-duvida-toolbar">
          <button type="button" className="cm-duvida-toolbar-btn" aria-label="Negrito" title="Negrito" onClick={() => aplicarMarcador("**")}>
            <Bold size={16} />
          </button>
          <button type="button" className="cm-duvida-toolbar-btn" aria-label="Itálico" title="Itálico" onClick={() => aplicarMarcador("*")}>
            <Italic size={16} />
          </button>
          <button
            ref={emojiBotaoRef}
            type="button"
            className={`cm-duvida-toolbar-btn ${emojiAberto ? "is-ativo" : ""}`}
            aria-label="Inserir emoji"
            title="Inserir emoji"
            onClick={() => setEmojiAberto((v) => !v)}
          >
            <Smile size={16} />
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
            className="cm-duvida-toolbar-btn"
            aria-label="Anexar foto"
            title="Anexar foto"
            disabled={enviando}
            onClick={() => fileInputRef.current?.click()}
          >
            <ImageIcon size={16} />
          </button>

          {emojiAberto && (
            <div className="cm-duvida-emoji-popover" ref={emojiPopoverRef}>
              <div className="cm-duvida-emoji-grid">
                {EMOJIS_MEDITACAO.map((emoji) => (
                  <button key={emoji} type="button" className="cm-duvida-emoji-btn" onClick={() => inserirEmoji(emoji)}>
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="cm-duvida-form-acoes">
          <span className="cm-duvida-contador">
            {texto.length}/{LIMITE_TEXTO}
          </span>
          <button type="submit" className="cm-duvida-enviar" disabled={!texto.trim() || !email || enviando}>
            {enviando ? "Enviando..." : "Compartilhar"}
            {!enviando && <ArrowRight size={15} />}
          </button>
        </div>
      </form>

      <div className="cm-duvida-divider" />

      {carregando && (
        // Skeleton só aparece se não havia cache pra pintar de cara (carregar()
        // já preenche itens/total a partir do cache antes do fetch resolver,
        // então nesse caso `carregando` já vira false direto) — nunca mais
        // deixa a área da lista em branco enquanto espera a rede.
        <div className="cm-comentarios-lista" aria-hidden="true">
          {[0, 1, 2].map((i) => (
            <div className="cm-comentario-skeleton" key={i} />
          ))}
        </div>
      )}

      {!carregando && vazio && <p className="cm-duvida-vazio">Seja o primeiro a comentar</p>}

      {!carregando && !vazio && (
        <div className="cm-comentarios-lista">
          {itens.map((comentario) => (
            <ComentarioCard key={comentario.id} comentario={comentario} podeExcluir={podeExcluir} onExcluir={handleExcluir} />
          ))}
        </div>
      )}

      {!carregando && !vazio && (
        <div className="cm-duvida-paginacao">
          <button type="button" aria-label="Página anterior" disabled={page <= 1} onClick={() => carregar(page - 1)}>
            <ChevronLeft size={16} />
          </button>
          <span>
            {page} / {pages}
          </span>
          <button
            type="button"
            aria-label="Próxima página"
            disabled={page >= pages || pages <= 1}
            onClick={() => carregar(page + 1)}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
}

export default DificuldadeDoDia;
