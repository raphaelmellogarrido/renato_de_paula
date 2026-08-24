import { useEffect, useMemo, useRef, useState } from "react";
import { Check, Lock } from "lucide-react";
import GuardedVideo from "../../components/GuardedVideo";
import ComentariosFeed from "./components/ComentariosFeed";
import JornadaProgress from "./components/JornadaProgress";
import { useEmailSessao, chaveUsuario, logSalvandoParaUsuario } from "./components/usuarioStorage";
import { podeAssistir, calcularMaxDiaCompleto, calcularUltimoDiaCompletadoData, isoLocal } from "./components/progressoDias";

const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? "http://localhost:3001" : "");

// Progresso por usuário: sincroniza com public/api/hotmart/aulas-raiz/progresso.php
// (tabela própria progresso_aulas_raiz, chaveada por email + nome do
// arquivo, ex: "dia1.2.mp4") — separado do PHP/tabela do curso antigo
// Hotmart (aula_id INTEIRO), que não reconhecia esse formato de id.
// Também guardamos tudo no localStorage como cache instantâneo, pra pintar
// a tela sem esperar rede e pra "Marcar como concluída" nunca travar se o
// PHP estiver fora do ar.
const PROGRESSO_AULAS_RAIZ_URL = "/api/hotmart/aulas-raiz/progresso.php";
const LIMIAR_AUTO_CONCLUIDA = 0.9;

// Cache leve (stale-while-revalidate) do catálogo de dias/vídeos — não é
// por-usuário (o catálogo é o mesmo pra todo mundo, vem do sistema de
// arquivos em CURSO_RAIZ_DIR via server/index.js, não muda com frequência).
// Evita a tela "Carregando suas aulas..." numa navegação repetida: pinta o
// catálogo da visita anterior (<2min) na hora, atualiza em background.
const CHAVE_CACHE_CATALOGO = "cm_catalogo_aulas_raiz";
const TTL_CACHE_CATALOGO_MS = 2 * 60 * 1000;

function lerCatalogoCache() {
  try {
    const bruto = localStorage.getItem(CHAVE_CACHE_CATALOGO);
    if (!bruto) return null;
    const { dias, quando } = JSON.parse(bruto);
    if (!Array.isArray(dias) || typeof quando !== "number") return null;
    if (Date.now() - quando > TTL_CACHE_CATALOGO_MS) return null;
    return dias;
  } catch {
    return null;
  }
}

function salvarCatalogoCache(dias) {
  try {
    localStorage.setItem(CHAVE_CACHE_CATALOGO, JSON.stringify({ dias, quando: Date.now() }));
  } catch {
    // localStorage indisponível — sem cache, sem drama, o fetch normal segue.
  }
}

// Extrai o número do dia a partir do nome do arquivo ("dia1.2.mp4" -> 1),
// mesmo padrão de regex que JornadaProgress.jsx já usa pra agrupar
// TITULOS_AULAS_RAIZ por dia.
function diaDoArquivo(arquivo) {
  return Number(arquivo.match(/^dia(\d+)\./)?.[1]) || 0;
}

// Texto do toast/placeholder por `motivo` de bloqueio — mensagens exatas
// pedidas pelo cliente (ver progressoDias.js pra quando cada motivo ocorre).
function mensagemBloqueio(motivo, dia) {
  if (motivo === "calendario") {
    return `Você já completou seu dia hoje! Volte amanhã para liberar o Dia ${dia}.`;
  }
  if (motivo === "ordem") {
    return "Assista o vídeo anterior para liberar.";
  }
  if (motivo === "sequencia") {
    return `Complete os dias anteriores para desbloquear o Dia ${dia}.`;
  }
  if (motivo === "verificando") {
    return "Não foi possível confirmar seu progresso. Recarregue a página.";
  }
  return "Vídeo bloqueado.";
}

// Mesma base de chave usada em useProgressoAulasRaiz.js — precisa
// continuar igual nos dois arquivos, senão a página de aulas e o widget
// "Sua Jornada" do dashboard não veem o mesmo progresso.
const CHAVE_BASE_PROGRESSO = "comunidade_progresso_aulas_raiz";

function carregarProgressoLocal(email) {
  try {
    return JSON.parse(localStorage.getItem(chaveUsuario(CHAVE_BASE_PROGRESSO, email)) || "{}");
  } catch {
    return {};
  }
}

function salvarProgressoLocal(email, progresso) {
  logSalvandoParaUsuario("AulasMeditacaoRaiz", email);
  try {
    localStorage.setItem(chaveUsuario(CHAVE_BASE_PROGRESSO, email), JSON.stringify(progresso));
  } catch {
    // localStorage indisponível (modo privado, quota cheia etc.) — ignora
    // silenciosamente, o PHP externo continua sendo a fonte de verdade.
  }
}

export default function AulasMeditacaoRaiz() {
  // Nasce preenchido com o cache (se houver e ainda válido) pra pintar o
  // catálogo na hora — ver CHAVE_CACHE_CATALOGO acima. `loading` já começa
  // false nesse caso: não faz sentido mostrar "Carregando suas aulas..."
  // por cima de um catálogo que já está na tela.
  const [dias, setDias] = useState(() => lerCatalogoCache() || []);
  const [diaSelecionado, setDiaSelecionado] = useState(null);
  const [videoAtivoArquivo, setVideoAtivoArquivo] = useState(null);
  const email = useEmailSessao();
  const [progressoPorArquivo, setProgressoPorArquivo] = useState(() =>
    email ? carregarProgressoLocal(email) : {},
  );
  const [loading, setLoading] = useState(() => lerCatalogoCache() === null);
  const [erroCatalogo, setErroCatalogo] = useState(false);
  // progressoCarregado: true quando o GET de progresso já resolveu (ou não
  // há sessão, então não há o que esperar) — usado tanto pra segurar a
  // renderização (evita flash no Dia 0 antes de "pular" pra aula certa)
  // quanto pra liberar o cálculo de "continuar de onde parou" (alvoResumo).
  const [progressoCarregado, setProgressoCarregado] = useState(!email);
  // hojeServidor: data de HOJE segundo o servidor (fuso Brasília, vem no GET
  // de progresso.php) — referência usada por podeAssistir em vez do relógio
  // do navegador (ver progressoDias.js). progressoVerificado: true SÓ quando
  // esse GET respondeu com sucesso nesta sessão do componente — diferente de
  // progressoCarregado, que também vira true no timeout/erro (pra tela de
  // loading não travar pra sempre). Sem essa confirmação, podeAssistir trava
  // qualquer liberação por passagem de calendário (fail-closed em vez de
  // fail-open) — ver comentário grande no useEffect de progresso abaixo.
  const [hojeServidor, setHojeServidor] = useState(null);
  const [progressoVerificado, setProgressoVerificado] = useState(false);

  const marcados85Ref = useRef(new Set());
  const [emailAnterior, setEmailAnterior] = useState(email);
  const [toast, setToast] = useState(null);

  // Mesmo padrão de toast local já usado em Configuracoes.jsx e
  // ColunaEncontros.jsx (sem componente compartilhado no projeto).
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3200);
    return () => clearTimeout(t);
  }, [toast]);

  function mostrarToast(texto) {
    setToast(texto);
  }

  // Troca de conta / logout+login: recarrega do zero pra chave do NOVO
  // usuário (mostra tudo desmarcado se for conta nova). Ajusta o estado
  // direto no render (não em efeito) seguindo o padrão recomendado pelo
  // React pra "resetar estado quando uma prop/valor externo muda".
  if (email !== emailAnterior) {
    setEmailAnterior(email);
    setProgressoPorArquivo(email ? carregarProgressoLocal(email) : {});
    setProgressoCarregado(!email);
    setProgressoVerificado(false);
  }

  // Refs não podem ser alterados durante o render (só em efeitos/handlers) —
  // por isso libera o ref de auto-conclusão em 90% num efeito separado,
  // senão um vídeo já assistido pela conta anterior não marcaria sozinho de
  // novo pra essa conta nova.
  useEffect(() => {
    marcados85Ref.current = new Set();
  }, [email]);

  // Catálogo real: vem do backend, que lê a pasta curso-meditacao-raiz e já
  // resolve os títulos via lib/titulosAulasRaiz.js. Não depende de nenhum
  // cadastro manual em banco. Não decide aqui em qual vídeo pousar — isso
  // fica pro efeito de "continuar de onde parou" logo abaixo, que também
  // precisa do progresso carregado antes de escolher.
  useEffect(() => {
    // AbortController com timeout de 8s: se o backend travar, desiste e
    // libera a tela (com a mensagem de erro) em vez de deixar
    // "Carregando suas aulas..." pra sempre. finally garante setLoading(false)
    // em qualquer desfecho (sucesso, erro de rede ou timeout).
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);
    // Snapshot do cache ANTES do fetch — decide se um erro de rede pode
    // aparecer como tela de erro (sem cache) ou deve só manter o catálogo já
    // pintado na tela (com cache), sem interromper quem já está navegando.
    const tinhaCache = lerCatalogoCache() !== null;

    fetch(`${API_URL}/api/aulas-raiz`, { signal: controller.signal })
      .then((r) => r.json())
      .then((data) => {
        const listaDias = Array.isArray(data?.dias) ? data.dias : [];
        setDias(listaDias);
        salvarCatalogoCache(listaDias);
      })
      .catch((err) => {
        console.error("Erro ao carregar catálogo de aulas-raiz:", err);
        if (!tinhaCache) setErroCatalogo(true);
      })
      .finally(() => {
        clearTimeout(timeoutId);
        setLoading(false);
      });

    return () => {
      controller.abort();
      clearTimeout(timeoutId);
    };
  }, []);

  // Progresso: o estado já nasce carregado do localStorage (garante que uma
  // marca local nunca "some", mesmo antes desse efeito rodar). Aqui só
  // tentamos mesclar com o PHP existente — o merge nunca sobrescreve uma
  // marca local já concluída, só complementa.
  useEffect(() => {
    if (!email) return;

    // Mesmo padrão do fetch do catálogo acima: timeout de 8s via
    // AbortController, e finally garante setProgressoCarregado(true) mesmo
    // se o PHP travar — sem isso a tela ficaria presa em "Carregando suas
    // aulas..." (guarda lá embaixo, no render) esperando um progresso que
    // nunca chega.
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    fetch(`${PROGRESSO_AULAS_RAIZ_URL}?email=${encodeURIComponent(email)}`, { signal: controller.signal })
      .then((r) => r.json())
      .then((data) => {
        const lista = Array.isArray(data?.aulas) ? data.aulas : [];
        setProgressoPorArquivo((atual) => {
          const mesclado = { ...atual };
          for (const item of lista) {
            const chave = item.arquivo;
            if (!chave) continue;
            // Servidor é a fonte de verdade (cobre outro navegador/dispositivo,
            // inclusive uma desmarcação feita lá) — não preserva o valor local.
            // completado_em alimenta o bloqueio por dia/calendário (ver
            // progressoDias.js) — precisa da data real em que o vídeo foi
            // concluído, não só se está concluído.
            mesclado[chave] = { assistida: !!item.assistida, progresso: item.progresso || 0, completado_em: item.completado_em || null };
          }
          salvarProgressoLocal(email, mesclado);
          return mesclado;
        });
        // Data de "hoje" segundo o SERVIDOR (não o navegador) — ver doc de
        // podeAssistir em progressoDias.js. Só marca verificado=true aqui,
        // dentro do .then de sucesso: se o GET falhar/der timeout, o bloqueio
        // por calendário precisa continuar fechado (ver .catch abaixo).
        if (data?.hoje) setHojeServidor(data.hoje);
        setProgressoVerificado(true);
      })
      .catch(() => {
        // PHP indisponível ou lento (abort do timeout) — segue só com o que
        // já está no localStorage, sem travar a página. NÃO marca
        // progressoVerificado=true aqui de propósito: sem confirmação do
        // servidor, podeAssistir trava qualquer liberação por calendário em
        // vez de assumir que está tudo liberado (fail-closed).
      })
      .finally(() => {
        clearTimeout(timeoutId);
        setProgressoCarregado(true);
      });

    return () => {
      controller.abort();
      clearTimeout(timeoutId);
    };
  }, [email]);

  // "Continuar de onde parou": primeira aula ainda não concluída, na ordem
  // real do curso (Dia 0 -> Dia 15). Se todas já foram assistidas, cai na
  // última. Calculado como valor derivado (não em efeito com setState —
  // dispara "cascading renders" no lint de hooks) e só usado como FALLBACK
  // enquanto diaSelecionado/videoAtivoArquivo ainda são null: assim que o
  // usuário clica numa aula da lista (ou troca de dia), o estado explícito
  // passa a mandar e esse cálculo deixa de ter efeito — não quebra a
  // navegação manual.
  const alvoResumo = useMemo(() => {
    if (!dias.length || !progressoCarregado) return null;
    const ordemAulas = dias.flatMap((d) => d.videos.map((v) => ({ dia: d.dia, arquivo: v.arquivo })));
    const proximaNaoAssistida = ordemAulas.find((a) => !progressoPorArquivo[a.arquivo]?.assistida);
    return proximaNaoAssistida || ordemAulas[ordemAulas.length - 1] || null;
  }, [dias, progressoCarregado, progressoPorArquivo]);

  const diaEfetivo = diaSelecionado ?? alvoResumo?.dia ?? null;
  const videoArquivoEfetivo = videoAtivoArquivo ?? alvoResumo?.arquivo ?? null;

  const diaAtual = useMemo(() => dias.find((d) => d.dia === diaEfetivo), [dias, diaEfetivo]);
  const videos = useMemo(() => diaAtual?.videos || [], [diaAtual]);
  const videoAtivo = useMemo(
    () => videos.find((v) => v.arquivo === videoArquivoEfetivo) || videos[0],
    [videos, videoArquivoEfetivo],
  );

  // Maior dia 100% completo e data (local) em que isso aconteceu — as duas
  // bases pras regras de calendário do podeAssistir logo abaixo (ver
  // progressoDias.js pro cálculo em si).
  const maxDiaCompleto = useMemo(
    () => calcularMaxDiaCompleto(dias, progressoPorArquivo),
    [dias, progressoPorArquivo],
  );
  const ultimoDiaCompletadoData = useMemo(
    () => calcularUltimoDiaCompletadoData(dias, progressoPorArquivo, maxDiaCompleto),
    [dias, progressoPorArquivo, maxDiaCompleto],
  );

  // Bloqueio por DIA (não por vídeo, ver progressoDias.js): dia inteiro
  // libera de uma vez (em ordem interna), Dia 0 -> Dia 1 pode ser feito no
  // mesmo dia, e a partir daí só libera 1 dia novo por dia de calendário.
  // Mapa: arquivo -> { liberado, motivo }.
  const bloqueioPorArquivo = useMemo(() => {
    const mapa = {};
    for (const diaObj of dias) {
      diaObj.videos.forEach((video, videoIndex) => {
        mapa[video.arquivo] = podeAssistir(diaObj.dia, videoIndex, {
          dias,
          progressoPorArquivo,
          maxDiaCompleto,
          ultimoDiaCompletadoData,
          hojeServidor,
          verificado: progressoVerificado,
        });
      });
    }

    // Pedido explícito do cliente: "testar com console.log(podeAssistir)" —
    // loga o resultado calculado pros vídeos do dia atualmente selecionado.
    const diaObjAtual = dias.find((d) => d.dia === diaEfetivo);
    diaObjAtual?.videos.forEach((video, videoIndex) => {
      console.log("[podeAssistir]", {
        dia: diaEfetivo,
        videoIndex,
        arquivo: video.arquivo,
        maxDiaCompleto,
        ultimoDiaCompletadoData,
        resultado: mapa[video.arquivo],
      });
    });

    return mapa;
  }, [dias, progressoPorArquivo, maxDiaCompleto, ultimoDiaCompletadoData, diaEfetivo, hojeServidor, progressoVerificado]);

  const bloqueioVideoAtivo = videoAtivo ? bloqueioPorArquivo[videoAtivo.arquivo] : null;

  function marcarConcluida(arquivoParam, posicaoParam = 0) {
    const arquivo = arquivoParam || videoAtivo?.arquivo;
    if (!arquivo || !email) return;

    // Otimista: atualiza local + localStorage já, sem esperar o PHP responder.
    // completado_em local (data de hoje) pra o bloqueio por dia liberar o
    // próximo dia sem precisar esperar a resposta do servidor.
    setProgressoPorArquivo((atual) => {
      const novo = { ...atual, [arquivo]: { assistida: true, progresso: 100, completado_em: isoLocal(new Date()) } };
      salvarProgressoLocal(email, novo);
      return novo;
    });

    fetch(PROGRESSO_AULAS_RAIZ_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        arquivo,
        dia: diaDoArquivo(arquivo),
        progresso: 100,
        posicao: Math.round(posicaoParam),
        completou: true,
      }),
    }).catch((err) => {
      console.error("Não foi possível sincronizar progresso com o servidor:", err);
    });
  }

  // Inverso de marcarConcluida: some com a marca local (some do check na
  // lista e some da Jornada, que lê o mesmo estado) e avisa o PHP externo.
  // Também libera o ref de auto-conclusão em 90%, senão o vídeo nunca mais
  // marcaria sozinho se o aluno assistir de novo.
  function desmarcarConcluida(arquivoParam) {
    const arquivo = arquivoParam || videoAtivo?.arquivo;
    if (!arquivo || !email) return;

    marcados85Ref.current.delete(arquivo);

    setProgressoPorArquivo((atual) => {
      if (!atual[arquivo]) return atual;
      const novo = { ...atual };
      delete novo[arquivo];
      salvarProgressoLocal(email, novo);
      return novo;
    });

    fetch(PROGRESSO_AULAS_RAIZ_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, arquivo, dia: diaDoArquivo(arquivo), progresso: 0, posicao: 0, completou: false }),
    }).catch((err) => {
      console.error("Não foi possível sincronizar remoção de progresso com o servidor:", err);
    });
  }

  // Único handler que o checkbox circular de cada aula chama: decide, pelo
  // estado atual, se marca ou desmarca — reaproveita as duas funções acima
  // (mesmo localStorage + mesmo POST pro PHP), só unifica o clique.
  function toggleConcluida(arquivo) {
    const concluida = !!progressoPorArquivo[arquivo]?.assistida;
    if (concluida) desmarcarConcluida(arquivo);
    else marcarConcluida(arquivo);
  }

  function handleTimeUpdatePlayer(currentTime, duration) {
    if (!duration || !videoAtivo) return;
    const arquivo = videoAtivo.arquivo;
    if (marcados85Ref.current.has(arquivo)) return;
    if (currentTime / duration >= LIMIAR_AUTO_CONCLUIDA) {
      marcados85Ref.current.add(arquivo);
      marcarConcluida(arquivo, currentTime);
    }
  }

  function selecionarVideo(arquivo) {
    const bloqueio = bloqueioPorArquivo[arquivo];
    if (bloqueio && !bloqueio.liberado) {
      mostrarToast(mensagemBloqueio(bloqueio.motivo, diaEfetivo));
      return; // mantém na tela atual, não abre o player
    }
    setVideoAtivoArquivo(arquivo);
  }

  // Avanço automático ao fim do vídeo — não passa pelo gate de
  // selecionarVideo (mexe direto no estado) pra nunca disparar o toast de
  // bloqueio numa transição automática. Na prática o próximo vídeo já está
  // liberado (o atual acabou de bater no limiar de auto-conclusão antes do
  // onEnded disparar); a guarda no render do player continua como rede de
  // segurança pra qualquer condição de corrida.
  function irParaProximoVideo() {
    const indiceAtual = videos.findIndex((v) => v.arquivo === videoAtivo?.arquivo);
    if (indiceAtual > -1 && indiceAtual < videos.length - 1) {
      setVideoAtivoArquivo(videos[indiceAtual + 1].arquivo);
      return;
    }
    const indiceDia = dias.findIndex((d) => d.dia === diaEfetivo);
    const proximoDia = dias[indiceDia + 1];
    if (proximoDia) {
      setDiaSelecionado(proximoDia.dia);
      setVideoAtivoArquivo(proximoDia.videos[0]?.arquivo || null);
    }
  }

  function handleTrocarDia(e) {
    const novoDia = Number(e.target.value);
    const dia = dias.find((d) => d.dia === novoDia);
    setDiaSelecionado(novoDia);
    setVideoAtivoArquivo(dia?.videos[0]?.arquivo || null);
  }

  if (loading) return <div style={{ padding: 40 }}>Carregando suas aulas...</div>;

  if (erroCatalogo || !dias.length) {
    return (
      <div style={{ padding: 40 }}>
        Nenhum vídeo encontrado em curso-meditacao-raiz. Em produção, confirme se a variável de
        ambiente CURSO_RAIZ_DIR está configurada no painel da Hostinger (ver HANDOFF.md).
      </div>
    );
  }

  // Catálogo já chegou, mas o progresso do usuário ainda não (alvoResumo
  // depende dele) — segura a tela de carregando pra não pintar o Dia 0 por
  // uma fração de segundo antes de "pular" pra aula certa.
  if (!progressoCarregado) return <div style={{ padding: 40 }}>Carregando suas aulas...</div>;

  return (
    <div className="cm-aula-page">
      <div className="cm-aula-header">
        <h1>Aulas Meditação Raiz</h1>
        <p style={{ color: "#6B6B6B", fontSize: "14px", fontWeight: 400, marginTop: "4px" }}>
          Continue de onde parou. Sua presença é o que importa.
        </p>
      </div>

      <div className="cm-aula-layout">
        <div>
          <div className="cm-player-wrap">
            {videoAtivo && bloqueioVideoAtivo?.liberado ? (
              <GuardedVideo
                key={videoAtivo.arquivo}
                src={`${API_URL}${videoAtivo.url}`}
                label={videoAtivo.titulo}
                onEnded={irParaProximoVideo}
                onTimeUpdate={handleTimeUpdatePlayer}
                permitirAvancar
              />
            ) : videoAtivo ? (
              <div className="cm-video-bloqueado-placeholder">
                <Lock size={28} />
                <p>{mensagemBloqueio(bloqueioVideoAtivo?.motivo, diaEfetivo)}</p>
              </div>
            ) : (
              <div style={{ color: "white", display: "flex", alignItems: "center", justifyContent: "center", aspectRatio: "16/9" }}>
                Sem vídeo
              </div>
            )}
          </div>

          <ComentariosFeed />
        </div>

        <div className="cm-aula-sidebar">
          <div className="cm-aula-videos-do-dia">
            <div className="cm-aula-videos-do-dia-cabecalho">
              <h2>{diaAtual?.titulo}</h2>
              <select className="cm-dia-select" value={diaEfetivo ?? ""} onChange={handleTrocarDia}>
                {dias.map((d) => (
                  <option key={d.dia} value={d.dia}>
                    {d.titulo}
                  </option>
                ))}
              </select>
            </div>

            {videos.map((video) => {
              const concluida = !!progressoPorArquivo[video.arquivo]?.assistida;
              const bloqueio = bloqueioPorArquivo[video.arquivo];
              const bloqueado = !!bloqueio && !bloqueio.liberado;
              return (
                <div
                  key={video.arquivo}
                  className={`cm-video-item ${video.arquivo === videoAtivo?.arquivo ? "is-ativo" : ""} ${bloqueado ? "is-bloqueado" : ""}`}
                >
                  <button
                    type="button"
                    className="cm-video-item-titulo"
                    onClick={() => selecionarVideo(video.arquivo)}
                    aria-disabled={bloqueado}
                  >
                    {bloqueado ? (
                      <Lock size={14} className="cm-video-item-lock" />
                    ) : (
                      <span className={`cm-video-item-dot ${concluida ? "is-concluido" : ""}`} />
                    )}
                    <span>{video.titulo}</span>
                  </button>
                  <button
                    type="button"
                    className={`cm-video-check ${concluida ? "is-concluido" : ""}`}
                    onClick={() => toggleConcluida(video.arquivo)}
                    disabled={bloqueado}
                    aria-pressed={concluida}
                    aria-label={concluida ? `Desmarcar "${video.titulo}" como concluída` : `Marcar "${video.titulo}" como concluída`}
                  >
                    {concluida && <Check size={14} strokeWidth={3} />}
                  </button>
                </div>
              );
            })}

            <p className="cm-video-legenda">✓ marcado automaticamente ao atingir 90% do vídeo</p>
          </div>

          <JornadaProgress progressoPorArquivo={progressoPorArquivo} hojeServidor={hojeServidor} />
        </div>
      </div>

      {toast && (
        <div className="cm-aula-toast" role="status">
          <Lock size={16} />
          {toast}
        </div>
      )}
    </div>
  );
}
