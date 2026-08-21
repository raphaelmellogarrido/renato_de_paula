import { useEffect, useMemo, useRef, useState } from "react";
import { Check } from "lucide-react";
import GuardedVideo from "../../components/GuardedVideo";
import ComentariosFeed from "./components/ComentariosFeed";
import JornadaProgress from "./components/JornadaProgress";
import { useEmailSessao, chaveUsuario, logSalvandoParaUsuario } from "./components/usuarioStorage";

const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? "http://localhost:3001" : "");

// Progresso por usuário: hoje sincroniza com um PHP fora deste repo
// (https://renatodepaula.com/api/hotmart/aulas.php), que não temos como
// inspecionar/editar. Como o catálogo passou a vir do sistema de arquivos,
// usamos o nome do arquivo (ex: "dia1.2.mp4") como aula_id — mas também
// guardamos tudo no localStorage como rede de segurança, pra "Marcar como
// concluída" nunca falhar silenciosamente caso aquele PHP não reconheça
// esse formato de id.
const HOTMART_AULAS_URL = "https://renatodepaula.com/api/hotmart/aulas.php";
const LIMIAR_AUTO_CONCLUIDA = 0.85;

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
  const [dias, setDias] = useState([]);
  const [diaSelecionado, setDiaSelecionado] = useState(null);
  const [videoAtivoArquivo, setVideoAtivoArquivo] = useState(null);
  const email = useEmailSessao();
  const [progressoPorArquivo, setProgressoPorArquivo] = useState(() =>
    email ? carregarProgressoLocal(email) : {},
  );
  const [loading, setLoading] = useState(true);
  const [erroCatalogo, setErroCatalogo] = useState(false);

  const marcados85Ref = useRef(new Set());
  const [emailAnterior, setEmailAnterior] = useState(email);

  // Troca de conta / logout+login: recarrega do zero pra chave do NOVO
  // usuário (mostra tudo desmarcado se for conta nova). Ajusta o estado
  // direto no render (não em efeito) seguindo o padrão recomendado pelo
  // React pra "resetar estado quando uma prop/valor externo muda".
  if (email !== emailAnterior) {
    setEmailAnterior(email);
    setProgressoPorArquivo(email ? carregarProgressoLocal(email) : {});
  }

  // Refs não podem ser alterados durante o render (só em efeitos/handlers) —
  // por isso libera o ref de auto-conclusão em 85% num efeito separado,
  // senão um vídeo já assistido pela conta anterior não marcaria sozinho de
  // novo pra essa conta nova.
  useEffect(() => {
    marcados85Ref.current = new Set();
  }, [email]);

  // Catálogo real: vem do backend, que lê a pasta curso-meditacao-raiz e já
  // resolve os títulos via lib/titulosAulasRaiz.js. Não depende de nenhum
  // cadastro manual em banco.
  useEffect(() => {
    fetch(`${API_URL}/api/aulas-raiz`)
      .then((r) => r.json())
      .then((data) => {
        const listaDias = Array.isArray(data?.dias) ? data.dias : [];
        setDias(listaDias);
        if (listaDias.length) {
          setDiaSelecionado(listaDias[0].dia);
          setVideoAtivoArquivo(listaDias[0].videos[0]?.arquivo || null);
        }
      })
      .catch((err) => {
        console.error("Erro ao carregar catálogo de aulas-raiz:", err);
        setErroCatalogo(true);
      })
      .finally(() => setLoading(false));
  }, []);

  // Progresso: o estado já nasce carregado do localStorage (garante que uma
  // marca local nunca "some", mesmo antes desse efeito rodar). Aqui só
  // tentamos mesclar com o PHP existente — o merge nunca sobrescreve uma
  // marca local já concluída, só complementa.
  useEffect(() => {
    if (!email) return;

    fetch(`${HOTMART_AULAS_URL}?email=${encodeURIComponent(email)}`)
      .then((r) => r.json())
      .then((data) => {
        const lista = Array.isArray(data?.aulas) ? data.aulas : [];
        setProgressoPorArquivo((atual) => {
          const mesclado = { ...atual };
          for (const item of lista) {
            const chave = item.arquivo || item.aula_id;
            if (!chave || mesclado[chave]?.assistida) continue;
            mesclado[chave] = { assistida: !!item.assistida, progresso: item.progresso || 0 };
          }
          salvarProgressoLocal(email, mesclado);
          return mesclado;
        });
      })
      .catch(() => {
        // PHP externo indisponível ou não reconhece o formato — segue só
        // com o que já está no localStorage, sem travar a página.
      });
  }, [email]);

  const diaAtual = useMemo(() => dias.find((d) => d.dia === diaSelecionado), [dias, diaSelecionado]);
  const videos = useMemo(() => diaAtual?.videos || [], [diaAtual]);
  const videoAtivo = useMemo(
    () => videos.find((v) => v.arquivo === videoAtivoArquivo) || videos[0],
    [videos, videoAtivoArquivo],
  );

  function marcarConcluida(arquivoParam) {
    const arquivo = arquivoParam || videoAtivo?.arquivo;
    if (!arquivo || !email) return;

    // Otimista: atualiza local + localStorage já, sem esperar o PHP responder.
    setProgressoPorArquivo((atual) => {
      const novo = { ...atual, [arquivo]: { assistida: true, progresso: 100 } };
      salvarProgressoLocal(email, novo);
      return novo;
    });

    fetch(HOTMART_AULAS_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, aula_id: arquivo, progresso: 100, completou: true }),
    }).catch((err) => {
      console.error("Não foi possível sincronizar progresso com o servidor:", err);
    });
  }

  // Inverso de marcarConcluida: some com a marca local (some do check na
  // lista e some da Jornada, que lê o mesmo estado) e avisa o PHP externo.
  // Também libera o ref de auto-conclusão em 85%, senão o vídeo nunca mais
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

    fetch(HOTMART_AULAS_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, aula_id: arquivo, progresso: 0, completou: false }),
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
      marcarConcluida(arquivo);
    }
  }

  function selecionarVideo(arquivo) {
    setVideoAtivoArquivo(arquivo);
  }

  function irParaProximoVideo() {
    const indiceAtual = videos.findIndex((v) => v.arquivo === videoAtivo?.arquivo);
    if (indiceAtual > -1 && indiceAtual < videos.length - 1) {
      selecionarVideo(videos[indiceAtual + 1].arquivo);
      return;
    }
    const indiceDia = dias.findIndex((d) => d.dia === diaSelecionado);
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

  return (
    <div className="cm-aula-page">
      <div className="cm-aula-header">
        <h1>Aulas Meditação Raiz</h1>
        <p style={{ color: "#6b7280" }}>Sua jornada real — progresso salvo no seu perfil {email}</p>
      </div>

      <div className="cm-aula-layout">
        <div>
          <div className="cm-player-wrap">
            {videoAtivo ? (
              <GuardedVideo
                key={videoAtivo.arquivo}
                src={`${API_URL}${videoAtivo.url}`}
                label={videoAtivo.titulo}
                onEnded={irParaProximoVideo}
                onTimeUpdate={handleTimeUpdatePlayer}
                permitirAvancar
              />
            ) : (
              <div style={{ color: "white", display: "flex", alignItems: "center", justifyContent: "center", aspectRatio: "16/9" }}>
                Sem vídeo
              </div>
            )}
          </div>

          <ComentariosFeed key={`dia-${diaSelecionado}`} />
        </div>

        <div className="cm-aula-sidebar">
          <div className="cm-aula-videos-do-dia">
            <div className="cm-aula-videos-do-dia-cabecalho">
              <h2>{diaAtual?.titulo}</h2>
              <select className="cm-dia-select" value={diaSelecionado ?? ""} onChange={handleTrocarDia}>
                {dias.map((d) => (
                  <option key={d.dia} value={d.dia}>
                    {d.titulo}
                  </option>
                ))}
              </select>
            </div>

            {videos.map((video) => {
              const concluida = !!progressoPorArquivo[video.arquivo]?.assistida;
              return (
                <div key={video.arquivo} className={`cm-video-item ${video.arquivo === videoAtivo?.arquivo ? "is-ativo" : ""}`}>
                  <button type="button" className="cm-video-item-titulo" onClick={() => selecionarVideo(video.arquivo)}>
                    <span className={`cm-video-item-dot ${concluida ? "is-concluido" : ""}`} />
                    <span>{video.titulo}</span>
                  </button>
                  <button
                    type="button"
                    className={`cm-video-check ${concluida ? "is-concluido" : ""}`}
                    onClick={() => toggleConcluida(video.arquivo)}
                    aria-pressed={concluida}
                    aria-label={concluida ? `Desmarcar "${video.titulo}" como concluída` : `Marcar "${video.titulo}" como concluída`}
                  >
                    {concluida && <Check size={14} strokeWidth={3} />}
                  </button>
                </div>
              );
            })}

            <p className="cm-video-legenda">✓ marcado automaticamente ao atingir 85% do vídeo</p>
          </div>

          <JornadaProgress progressoPorArquivo={progressoPorArquivo} />
        </div>
      </div>
    </div>
  );
}
