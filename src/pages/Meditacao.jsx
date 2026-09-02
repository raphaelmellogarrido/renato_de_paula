import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import GuardedVideo from "../components/GuardedVideo";
import PhoneLeadInput from "../components/PhoneLeadInput";
import "./meditacao/MeditacaoV9.css";
import DepoimentosDestaqueSection from "./meditacao/DepoimentosDestaqueSection";
import HistoriaSection from "./meditacao/HistoriaSection";
import PazInteriorSection from "./meditacao/PazInteriorSection";
import CienciaSection from "./meditacao/CienciaSection";
import PrincipioSection from "./meditacao/PrincipioSection";
import QuinzeDiasSection from "./meditacao/QuinzeDiasSection";
import OfertaSection from "./meditacao/OfertaSection";
import GarantiaSection from "./meditacao/GarantiaSection";
import DuvidasSection from "./meditacao/DuvidasSection";

const HOTMART_LINK = "https://go.hotmart.com/I99615540I?dp=1";
const WHATSAPP_DUVIDAS_LINK = "https://wa.me/5521976624767?text=" + encodeURIComponent("Olá! Conheci o Meditação Raiz pelo site e gostaria de tirar uma dúvida antes de começar o treinamento.");
const WHATSAPP_METODOLOGIA_LINK = "https://wa.me/5521976624767?text=" + encodeURIComponent("Olá! Assisti aos 3 vídeos sobre os mitos da meditação e gostaria de saber mais sobre a metodologia do curso.");

// Títulos dos 3 mitos — placeholders combinando com a chamada da intro
// ("esvaziar a mente, ter horas disponíveis, já saber meditar"). Troque
// pelo mito real de cada vídeo quando souber o conteúdo exato.
const MITOS_TITULOS = ["Para meditar, você precisa esvaziar a mente", "Você precisa de muito tempo disponível para meditar", "Você precisa já saber meditar (ou ter talento) para começar"];

// Bolinhas "● ● ○" + "VÍDEO X DE 3" — indicador de progresso da série.
function ProgressoMitos({ passo }) {
  return (
    <div className="mitos-progress">
      <div className="mitos-progress-dots">
        {[1, 2, 3].map((n) => (
          <span key={n} className={`mitos-dot ${n <= passo ? "active" : ""}`} />
        ))}
      </div>
      <span className="mitos-progress-label">Vídeo {passo} de 3</span>
    </div>
  );
}

function BotaoComprarCurso() {
  return (
    <div className="container center" style={{ marginTop: -20, marginBottom: 50 }}>
      <a href={HOTMART_LINK} target="_blank" rel="noreferrer" className="btn btn-primary btn-pill btn-mobile-full">
        Quero aprender a meditar
      </a>
    </div>
  );
}

// Vídeo de abertura da /meditacao: arquivo próprio (servido pelo backend em
// /videos), sem nenhuma marca de terceiro. Começa sozinho, mudo (autoplay só
// funciona mudo na maioria dos navegadores). Ao rolar a página e o vídeo sair
// da tela, ele "flutua" pequeno no canto inferior direito e continua tocando
// — sem recarregar, porque é sempre o mesmo elemento <video>, só muda de
// posição via CSS. Tem um botão de fechar quando está flutuando, e os mesmos
// controles do player usado nos outros vídeos (play/pause, volume, tela
// cheia).
function VideoHeroMeditacao() {
  const videoRef = useRef(null);
  const wrapperRef = useRef(null);
  const slotRef = useRef(null);
  const volumeTimeoutRef = useRef(null);

  const [mudo, setMudo] = useState(true);
  const [visivel, setVisivel] = useState(true);
  const [flutuanteFechado, setFlutuanteFechado] = useState(false);
  const [erro, setErro] = useState("");
  const [playing, setPlaying] = useState(false);
  const [volume, setVolume] = useState(1);
  const [volumeAberto, setVolumeAberto] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);

  const flutuante = !visivel && !flutuanteFechado;

  useEffect(() => {
    const el = slotRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        setVisivel(entry.isIntersecting);
        if (entry.isIntersecting) setFlutuanteFechado(false);
      },
      { threshold: 0 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    function handleFullscreenChange() {
      const ativo = document.fullscreenElement || document.webkitFullscreenElement;
      const dentro = ativo === wrapperRef.current;
      setFullscreen(dentro);
      if (!dentro && screen.orientation?.unlock) screen.orientation.unlock();
    }
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("webkitfullscreenchange", handleFullscreenChange);
    };
  }, []);

  useEffect(() => () => clearTimeout(volumeTimeoutRef.current), []);

  function abrirVolumeTemporariamente() {
    setVolumeAberto(true);
    clearTimeout(volumeTimeoutRef.current);
    volumeTimeoutRef.current = setTimeout(() => setVolumeAberto(false), 2500);
  }

  function togglePlay() {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      const resultado = v.play();
      if (resultado?.catch) resultado.catch(() => setErro("Não foi possível reproduzir o vídeo. Toque novamente ou tente com outra conexão."));
    } else {
      v.pause();
    }
  }

  function handleAtivarSom(e) {
    e.stopPropagation();
    const v = videoRef.current;
    if (v) v.muted = false;
    setMudo(false);
    abrirVolumeTemporariamente();
  }

  function toggleMute() {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setMudo(v.muted);
    abrirVolumeTemporariamente();
  }

  function handleVolumeChange(e) {
    const novoVolume = Number(e.target.value);
    const v = videoRef.current;
    if (v) {
      v.volume = novoVolume;
      v.muted = novoVolume === 0;
    }
    setVolume(novoVolume);
    setMudo(novoVolume === 0);
    abrirVolumeTemporariamente();
  }

  // Deixa a div em tela cheia, não o player em si — evita que o navegador
  // injete controles nativos por cima dos nossos.
  function handleFullscreen() {
    const jaEmFullscreen = document.fullscreenElement || document.webkitFullscreenElement;
    if (jaEmFullscreen) {
      if (document.exitFullscreen) document.exitFullscreen();
      else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
      return;
    }
    const wrapper = wrapperRef.current;

    // Função auxiliar para travar a orientação na horizontal
    const travarHorizontal = () => {
      if (screen.orientation && screen.orientation.lock) {
        screen.orientation.lock("landscape").catch(() => {
          // Alguns navegadores/dispositivos podem ignorar o bloqueio de orientação
        });
      }
    };

    if (wrapper.requestFullscreen) {
      wrapper
        .requestFullscreen()
        .then(travarHorizontal)
        .catch(() => {});
    } else if (wrapper.webkitRequestFullscreen) {
      wrapper.webkitRequestFullscreen();
      travarHorizontal();
    }
  }

  function handleFechar(e) {
    e.stopPropagation();
    videoRef.current?.pause();
    setFlutuanteFechado(true);
  }

  function handleVideoError() {
    setErro("Não foi possível carregar o vídeo. Verifique sua conexão e tente novamente.");
  }

  return (
    <section className="section">
      <div className="container center">
        <h2>Precisei buscar meu tratamento fora da medicina que estudei na faculdade</h2>
      </div>
      <div className="container">
        <div className="meditacao-hero-video-slot" ref={slotRef}>
          <div className={`meditacao-hero-video ${flutuante ? "is-floating" : ""}`} ref={wrapperRef}>
            <video ref={videoRef} id="video-meditacao" src="/api/stream.php?f=meditacao.mp4" autoPlay muted={mudo} loop playsInline onClick={togglePlay} onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onError={handleVideoError} />

            <button type="button" className={`guarded-video-toggle ${playing ? "is-playing" : ""}`} onClick={togglePlay} aria-label={playing ? "Pausar" : "Reproduzir"}>
              {playing ? "❚❚" : "▶"}
            </button>

            {mudo && (
              <button type="button" className="meditacao-hero-video-mute" onClick={handleAtivarSom} aria-label="Ativar som">
                🔇
              </button>
            )}

            {flutuante && (
              <button type="button" className="meditacao-hero-video-close" onClick={handleFechar} aria-label="Fechar vídeo">
                ✕
              </button>
            )}

            <div className="guarded-video-controls">
              <div className="guarded-video-buttons-row" style={{ justifyContent: "space-between" }}>
                <div className="guarded-video-volume-group">
                  <button type="button" onClick={toggleMute} aria-label={mudo ? "Ativar som" : "Silenciar"}>
                    {mudo || volume === 0 ? "🔇" : "🔊"}
                  </button>
                  {volumeAberto && <input type="range" className="guarded-video-volume-popup" min="0" max="1" step="0.05" value={mudo ? 0 : volume} onChange={handleVolumeChange} aria-label="Volume" />}
                </div>
                <button type="button" onClick={handleFullscreen} aria-label={fullscreen ? "Sair da tela cheia" : "Tela cheia"}>
                  {fullscreen ? "⤡" : "⛶"}
                </button>
              </div>
            </div>
          </div>
        </div>
        {erro && (
          <div className="error-box" style={{ marginTop: 12 }}>
            {erro}
          </div>
        )}
        <div className="container center">
          <span className="eyebrow">Assista esse vídeo que talvez haja algo na minha história que se conecte com a sua</span>
        </div>
      </div>
    </section>
  );
}

// Botões fixos no canto inferior esquerdo (Hotmart + WhatsApp), presentes
// nas duas variantes da página (/meditacao e /mitos).
function BarraFixaMeditacao() {
  return (
    <div className="mr-fixed-bar">
      <a href={HOTMART_LINK} target="_blank" rel="noreferrer" className="mr-fixed-btn">
        Quero aprender a meditar
      </a>
      <a href={WHATSAPP_DUVIDAS_LINK} target="_blank" rel="noreferrer" className="mr-fixed-btn mr-fixed-btn-whatsapp">
        <svg viewBox="0 0 32 32" aria-hidden="true">
          <path d="M16 3a12 12 0 00-10.4 18L4 29l8.2-1.5A12 12 0 1016 3zm6.9 17.3c-.3.8-1.8 1.5-2.5 1.6-.7.1-1.5.2-2.4-.1-.6-.2-1.4-.5-2.4-.9-4.2-1.8-6.9-6-7.1-6.3-.2-.3-1.7-2.2-1.7-4.2 0-2 .9-3 1.3-3.4.4-.4.9-.5 1.2-.5h.9c.3 0 .7-.1 1 .8.4 1 .9 2.5 1 2.7.1.2.2.5 0 .8-.1.3-.2.5-.4.7-.2.2-.5.6-.7.8-.2.2-.5.5-.2 1 .3.5 1.2 2 2.6 3.2 1.8 1.6 3.3 2.1 3.8 2.3.5.2.8.2 1.1-.1.3-.3 1.2-1.4 1.5-1.9.3-.5.6-.4 1-.2.4.1 2.4 1.1 2.8 1.3.4.2.7.3.8.5.1.2.1 1-.2 1.9z" />
        </svg>
        Tire suas Dúvidas
      </a>
    </div>
  );
}

function Meditacao() {
  const { hash, pathname } = useLocation();
  const variante = pathname === "/mitos" ? "mitos" : undefined;

  const [hasLead, setHasLead] = useState(() => !!localStorage.getItem("lead_whatsapp"));
  const [showGate, setShowGate] = useState(false);
  const justUnlockedRef = useRef(false);
  const mito2SectionRef = useRef(null);

  const [video1Assistido, setVideo1Assistido] = useState(() => localStorage.getItem("meditacao_video1_assistido") === "true");
  const [video2Assistido, setVideo2Assistido] = useState(() => localStorage.getItem("meditacao_video2_assistido") === "true");
  const [video3Assistido, setVideo3Assistido] = useState(() => localStorage.getItem("meditacao_video3_assistido") === "true");

  useEffect(() => {
    if (!hash) return;
    const el = document.querySelector(hash);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [hash]);

  // Só rola a tela na transição real dentro da sessão (após o submit do
  // lead) — quem já tem hasLead salvo do localStorage e recarrega a página
  // não é jogado pra baixo sozinho.
  useEffect(() => {
    if (hasLead && justUnlockedRef.current) {
      mito2SectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      justUnlockedRef.current = false;
    }
  }, [hasLead]);

  // Dispara a gate "Desbloqueio Consciente" a 95% do Mito 1 — não espera
  // o vídeo terminar. GuardedVideo já expõe onTimeUpdate(currentTime,
  // duration) com esse mesmo padrão de threshold (usado em
  // /comunidade/aulas-raiz pra marcar aula concluída aos 90%).
  function handleMito1Progress(currentTime, duration) {
    if (hasLead || showGate || !duration) return;
    if (currentTime / duration >= 0.95) setShowGate(true);
  }

  // Fire-and-forget, mesmo padrão de /api/video-log.php com keepalive usado
  // em src/utils/loadThirdParty.js — a liberação do vídeo não pode depender
  // da rede.
  function handleLeadSubmit({ whatsapp, country }) {
    localStorage.setItem("lead_whatsapp", whatsapp);
    localStorage.setItem("lead_country", country);

    fetch("/api/video-log.php", {
      method: "POST",
      keepalive: true,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ video: "lead-capturado", pct: 100, page: "/mitos", whatsapp, country }),
    }).catch(() => {});

    justUnlockedRef.current = true;
    setHasLead(true);
  }

  function handleVideo1Ended() {
    localStorage.setItem("meditacao_video1_assistido", "true");
    setVideo1Assistido(true);
  }

  function handleVideo2Ended() {
    localStorage.setItem("meditacao_video2_assistido", "true");
    setVideo2Assistido(true);
  }

  function handleVideo3Ended() {
    localStorage.setItem("meditacao_video3_assistido", "true");
    setVideo3Assistido(true);
  }

  // Variante /mitos: landing page de funil, uma única sequência guiada —
  // só o estágio atual fica visível por vez (não os 3 players de uma vez).
  // Vídeo 1 toca sem gate nenhum (clique pra dar play, com som — autoplay
  // com som é bloqueado pelos navegadores de qualquer forma). A 95% do
  // progresso, a gate "Desbloqueio Consciente" aparece abaixo do player —
  // captura o WhatsApp e libera o vídeo 2 (com scroll + autoplay). Vídeo 3
  // libera sozinho ao final do 2, sem gate novo. No final dos 3, os dois
  // CTAs (curso e metodologia).
  if (variante === "mitos") {
    const progressoSalvo = video1Assistido || hasLead;

    return (
      <>
        <section className="section">
          <div className="container center mitos-intro">
            <span className="eyebrow">Série gratuita • 3 vídeos</span>
            <h1>3 mitos sobre meditação que podem estar impedindo você de começar</h1>
            <p className="lede" style={{ margin: "0 auto" }}>
              Você não precisa esvaziar a mente, ter horas disponíveis ou já saber meditar. Nesta série rápida, vou mostrar o que realmente importa para começar.
            </p>
            {progressoSalvo && !video3Assistido && <p className="mitos-welcome-back">Bem-vindo(a) de volta — continue de onde parou.</p>}
          </div>

          <div className="container guarded-video-list" style={{ maxWidth: 860, width: "100%", margin: "0 auto" }}>
            <div className="center" style={{ marginBottom: 18 }}>
              <ProgressoMitos passo={1} />
              <h3 className="mitos-video-title">Mito #1 — "{MITOS_TITULOS[0]}"</h3>
            </div>
            <GuardedVideo id="mito-1" src="/api/stream.php?f=mito1.mp4" label="Mito 1" onEnded={handleVideo1Ended} onTimeUpdate={handleMito1Progress} />
            {!video1Assistido && !showGate && <p className="mitos-lock-hint center">🔒 Assista até o final para liberar o próximo conteúdo</p>}

            <AnimatePresence>
              {showGate && !hasLead && (
                <motion.div
                  className="desbloqueio-consciente"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                >
                  <div className="desbloqueio-consciente-inner">
                    <h3 className="desbloqueio-consciente-titulo">Mito #1 desvendado ✓</h3>
                    <p className="desbloqueio-consciente-subtitulo">Você já entendeu por que a inquietação não é sua culpa.</p>
                    <p className="desbloqueio-consciente-pergunta">Quer desbloquear o Mito #2 agora?</p>
                    <p className="desbloqueio-consciente-teaser">No próximo eu te mostro por que "você precisa de muito tempo disponível para meditar" é a maior mentira — e como 5 minutos já mudam seu dia.</p>
                    <PhoneLeadInput onSubmit={handleLeadSubmit} />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </section>

        {hasLead && (
          <section className="section" ref={mito2SectionRef}>
            <div className="container center" style={{ marginBottom: 18 }}>
              <p className="mitos-unlocked">Muito bem. Seu próximo vídeo está liberado.</p>
              <ProgressoMitos passo={2} />
              <h3 className="mitos-video-title">Mito #2 — "{MITOS_TITULOS[1]}"</h3>
            </div>
            <div className="container guarded-video-list" style={{ maxWidth: 860, width: "100%", margin: "0 auto" }}>
              <GuardedVideo id="mito-2" src="/api/stream.php?f=mito2.mp4" label="Mito 2" autoPlay onEnded={handleVideo2Ended} />
            </div>
          </section>
        )}

        {video2Assistido && (
          <section className="section">
            <div className="container center" style={{ marginBottom: 18 }}>
              <ProgressoMitos passo={3} />
              <h3 className="mitos-video-title">Último mito — "{MITOS_TITULOS[2]}"</h3>
              <p className="mitos-lede-small">Você chegou ao último vídeo da série.</p>
            </div>
            <div className="container guarded-video-list" style={{ maxWidth: 860, width: "100%", margin: "0 auto" }}>
              <GuardedVideo id="mito-3" src="/api/stream.php?f=mito3.mp4" label="Mito 3" onEnded={handleVideo3Ended} />
            </div>
          </section>
        )}

        {video3Assistido && (
          <section className="section center">
            <div className="container" style={{ maxWidth: 640, width: "100%", margin: "0 auto" }}>
              <p>Agora você já sabe o que não precisa fazer para meditar. O próximo passo é aprender o que fazer.</p>
              <p>Se você quer transformar a meditação em uma prática simples, possível e consistente no seu dia a dia, conheça o método que preparei para conduzir você passo a passo.</p>
              <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap", marginTop: 20 }}>
                <a href={HOTMART_LINK} target="_blank" rel="noreferrer" className="btn btn-primary btn-pill btn-mobile-full">
                  Quero aprender a meditar →
                </a>
                <a href={WHATSAPP_METODOLOGIA_LINK} target="_blank" rel="noreferrer" className="btn btn-pill btn-mobile-full" style={{ border: "2px solid var(--border)" }}>
                  Conhecer a metodologia do curso
                </a>
              </div>
            </div>
          </section>
        )}

        <BarraFixaMeditacao />
      </>
    );
  }

  // Padrão (/meditacao direto): vídeo de abertura + página de vendas completa.
  return (
    <>
      {/* Hero 1 — vídeo do YouTube */}
      <VideoHeroMeditacao />
      <BotaoComprarCurso />

      <div className="mr-scope">
        {/* Hero 2 — depoimentos em destaque */}
        <DepoimentosDestaqueSection />
        {/* Hero 3 — história */}
        <HistoriaSection />
        {/* Hero 4 — paz interior se pratica */}
        <PazInteriorSection />
        {/* Hero 5 — princípio-raiz */}
        <PrincipioSection />
        {/* Hero 6 — pesquisa científica */}
        <CienciaSection />
        {/* Hero 7 — progressão estruturada (15 dias) */}
        <QuinzeDiasSection />
        {/* Hero 8 — comece agora o Meditação Raiz */}
        <OfertaSection hotmartLink={HOTMART_LINK} />
        {/* Hero 9 — garantia */}
        <GarantiaSection />
        {/* Hero 10 — perguntas frequentes */}
        <DuvidasSection />
      </div>

      <BarraFixaMeditacao />
    </>
  );
}

export default Meditacao;
