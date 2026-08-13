import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import GuardedVideo from "../components/GuardedVideo";
import { COUNTRIES } from "../config/countries";
import depo1 from "../assets/depo1.jpeg";
import depo2 from "../assets/depo2.jpeg";
import depo3 from "../assets/depo3.jpeg";
import depo4 from "../assets/depo4.jpeg";
import depo5 from "../assets/depo5.jpeg";
import "./meditacao/MeditacaoV9.css";
import HistoriaSection from "./meditacao/HistoriaSection";
import CienciaSection from "./meditacao/CienciaSection";
import PrincipioSection from "./meditacao/PrincipioSection";
import VidaCotidianaSection from "./meditacao/VidaCotidianaSection";
import MetodoSection from "./meditacao/MetodoSection";
import QuinzeDiasSection from "./meditacao/QuinzeDiasSection";
import EntregaSection from "./meditacao/EntregaSection";
import OfertaSection from "./meditacao/OfertaSection";
import GarantiaSection from "./meditacao/GarantiaSection";
import DuvidasSection from "./meditacao/DuvidasSection";

const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? "http://localhost:3001" : "");
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const GENERIC_MAX_DIGITS = 14;
const GENERIC_MIN_DIGITS = 6;
const HOTMART_LINK = "https://go.hotmart.com/I99615540I?dp=1";
const YOUTUBE_VIDEO_ID = "zvdum8Ks0yA";
const WHATSAPP_DUVIDAS_LINK = "https://wa.me/5521976624767?text=" + encodeURIComponent("Olá! Conheci o Meditação Raiz pelo site e gostaria de tirar uma dúvida antes de começar o treinamento.");

// Nomes provisórios — trocar pelos nomes reais das pessoas nos depoimentos.
const DEPOIMENTOS = [
  { foto: depo1, nome: "Wictor Bernardo" },
  { foto: depo2, nome: "Allan Sommer" },
  { foto: depo3, nome: "Diandra" },
  { foto: depo4, nome: "Vinícius Mendes" },
  { foto: depo5, nome: "Doce biscuit" },
];

function onlyDigits(value) {
  return value.replace(/\D/g, "");
}

function BotaoComprarCurso() {
  return (
    <div className="container center" style={{ marginTop: 40, marginBottom: 24 }}>
      <a href={HOTMART_LINK} target="_blank" rel="noreferrer" className="btn btn-primary btn-pill btn-mobile-full">
        Comece a meditar
      </a>
    </div>
  );
}

// Vídeo de abertura da /meditacao: um vídeo do YouTube pilotado pela IFrame
// API (pra manter os mesmos controles customizados de antes), começa sozinho,
// mudo (autoplay só funciona mudo na maioria dos navegadores). Ao rolar a
// página e o vídeo sair da tela, ele "flutua" pequeno no canto inferior
// direito e continua tocando — sem recarregar, porque é sempre o mesmo
// player, só muda de posição via CSS. Tem um botão de fechar quando está
// flutuando, e os mesmos controles do player usado nos outros vídeos
// (play/pause, volume, tela cheia).
function carregarYouTubeApi(aoCarregar) {
  if (window.YT && window.YT.Player) {
    aoCarregar();
    return;
  }
  window.__ytCallbacks = window.__ytCallbacks || [];
  window.__ytCallbacks.push(aoCarregar);
  if (window.__ytApiLoading) return;
  window.__ytApiLoading = true;
  const tagAnterior = document.querySelector('script[src="https://www.youtube.com/iframe_api"]');
  if (!tagAnterior) {
    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    document.head.appendChild(tag);
  }
  const callbackAnterior = window.onYouTubeIframeAPIReady;
  window.onYouTubeIframeAPIReady = () => {
    if (typeof callbackAnterior === "function") callbackAnterior();
    const callbacks = window.__ytCallbacks || [];
    window.__ytCallbacks = [];
    callbacks.forEach((cb) => cb());
  };
}

function VideoHeroMeditacao() {
  const playerDivRef = useRef(null);
  const playerRef = useRef(null);
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
    let destruido = false;

    function criarPlayer() {
      if (destruido || !playerDivRef.current) return;
      playerRef.current = new window.YT.Player(playerDivRef.current, {
        videoId: YOUTUBE_VIDEO_ID,
        width: "100%",
        height: "100%",
        playerVars: {
          autoplay: 1,
          mute: 1,
          controls: 0,
          rel: 0,
          modestbranding: 1,
          playsinline: 1,
          loop: 1,
          playlist: YOUTUBE_VIDEO_ID,
          iv_load_policy: 3,
          disablekb: 1,
          origin: window.location.origin,
        },
        events: {
          onReady: (e) => {
            if (destruido) return;
            e.target.playVideo();
          },
          onStateChange: (e) => {
            setPlaying(e.data === window.YT.PlayerState.PLAYING);
          },
          onError: () => setErro("Não foi possível carregar o vídeo. Verifique sua conexão e tente novamente."),
        },
      });
    }

    carregarYouTubeApi(criarPlayer);

    return () => {
      destruido = true;
      try {
        playerRef.current?.destroy();
      } catch {
        // player já pode ter sido destruído
      }
    };
  }, []);

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
    const p = playerRef.current;
    if (!p) return;
    if (p.getPlayerState() === window.YT.PlayerState.PLAYING) p.pauseVideo();
    else p.playVideo();
  }

  function handleAtivarSom(e) {
    e.stopPropagation();
    const p = playerRef.current;
    p?.unMute();
    p?.setVolume(volume * 100 || 100);
    setMudo(false);
    abrirVolumeTemporariamente();
  }

  function toggleMute() {
    const p = playerRef.current;
    if (!p) return;
    if (mudo) {
      p.unMute();
      setMudo(false);
    } else {
      p.mute();
      setMudo(true);
    }
    abrirVolumeTemporariamente();
  }

  function handleVolumeChange(e) {
    const novoVolume = Number(e.target.value);
    const p = playerRef.current;
    if (p) {
      p.setVolume(novoVolume * 100);
      if (novoVolume === 0) p.mute();
      else p.unMute();
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
    playerRef.current?.pauseVideo();
    setFlutuanteFechado(true);
  }

  return (
    <section className="section">
      <div className="container center">
        <img src="/icone.jpeg" className="meditacao-hero-icon" alt="" />
        <span className="eyebrow">O começo</span>
        <h2>Do Zero à Meditação: O Primeiro Passo Real</h2>
      </div>
      <div className="container">
        <div className="meditacao-hero-video-slot" ref={slotRef}>
          <div className={`meditacao-hero-video ${flutuante ? "is-floating" : ""}`} ref={wrapperRef}>
            <div ref={playerDivRef} />

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
        Comece a meditar
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

// Hero de depoimentos: 5 fotos padronizadas, com nome embaixo de cada uma.
// Clicar numa foto abre ela em tamanho grande, num lightbox simples.
function SecaoDepoimentos() {
  const [aberto, setAberto] = useState(null);

  function irParaAnterior() {
    setAberto((i) => (i > 0 ? i - 1 : i));
  }

  function irParaProximo() {
    setAberto((i) => (i < DEPOIMENTOS.length - 1 ? i + 1 : i));
  }

  useEffect(() => {
    if (aberto === null) return;
    function handleKey(e) {
      if (e.key === "Escape") setAberto(null);
      if (e.key === "ArrowLeft") irParaAnterior();
      if (e.key === "ArrowRight") irParaProximo();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [aberto]);

  return (
    <section className="section">
      <div className="container center" style={{ marginBottom: 32 }}>
        <span className="eyebrow">Depoimentos</span>
        <h2>Quem já praticou, recomenda</h2>
      </div>
      <div className="container depoimentos-grid">
        {DEPOIMENTOS.map((d, i) => (
          <button type="button" key={d.nome} className="depoimento-item" onClick={() => setAberto(i)}>
            <img src={d.foto} alt={`Depoimento de ${d.nome}`} />
            <span className="depoimento-nome">{d.nome}</span>
          </button>
        ))}
      </div>

      {aberto !== null && (
        <div className="depoimento-lightbox" onClick={() => setAberto(null)}>
          <button type="button" className="depoimento-lightbox-close" onClick={() => setAberto(null)} aria-label="Fechar">
            ✕
          </button>
          <button
            type="button"
            className="depoimento-lightbox-seta depoimento-lightbox-seta-esquerda"
            disabled={aberto === 0}
            onClick={(e) => {
              e.stopPropagation();
              irParaAnterior();
            }}
            aria-label="Depoimento anterior"
          >
            ‹
          </button>
          <img src={DEPOIMENTOS[aberto].foto} alt={`Depoimento de ${DEPOIMENTOS[aberto].nome}`} onClick={(e) => e.stopPropagation()} />
          <button
            type="button"
            className="depoimento-lightbox-seta depoimento-lightbox-seta-direita"
            disabled={aberto === DEPOIMENTOS.length - 1}
            onClick={(e) => {
              e.stopPropagation();
              irParaProximo();
            }}
            aria-label="Próximo depoimento"
          >
            ›
          </button>
          <span className="depoimento-lightbox-nome">{DEPOIMENTOS[aberto].nome}</span>
        </div>
      )}
    </section>
  );
}

function Meditacao() {
  const { hash, state } = useLocation();
  const variante = state?.variante;
  const [email, setEmail] = useState("");
  const [pais, setPais] = useState("BR");
  const [ddd, setDdd] = useState("");
  const [numero, setNumero] = useState("");
  const [status, setStatus] = useState("idle");
  const [erro, setErro] = useState("");

  const [inscrito, setInscrito] = useState(() => localStorage.getItem("meditacao_inscrito") === "true");
  const [video1Assistido, setVideo1Assistido] = useState(() => localStorage.getItem("meditacao_video1_assistido") === "true");
  const [video2Assistido, setVideo2Assistido] = useState(() => localStorage.getItem("meditacao_video2_assistido") === "true");

  useEffect(() => {
    if (!hash) return;
    const el = document.querySelector(hash);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [hash]);

  const emailValido = EMAIL_REGEX.test(email);
  const country = COUNTRIES.find((c) => c.code === pais);
  const dddValido = country.hasDDD ? ddd.length === 2 : true;
  const numeroValido = country.phoneDigits != null ? numero.length === country.phoneDigits : numero.length >= GENERIC_MIN_DIGITS && numero.length <= GENERIC_MAX_DIGITS;
  const telefonePreenchido = numero.length > 0;
  const telefoneValido = country.hasDDD ? dddValido && numeroValido : numeroValido;
  const formValido = emailValido;

  function handleDddChange(e) {
    setDdd(onlyDigits(e.target.value).slice(0, 2));
  }

  function handleNumeroChange(e) {
    const max = country.hasDDD ? country.phoneDigits : GENERIC_MAX_DIGITS;
    setNumero(onlyDigits(e.target.value).slice(0, max));
  }

  async function handleCadastrar(e) {
    e.preventDefault();
    if (!formValido) return;

    setStatus("enviando");
    setErro("");

    const telefone = numero ? (country.hasDDD ? `${country.dial} (${ddd}) ${numero}` : `${country.dial} ${numero}`) : "";

    try {
      const res = await fetch(`${API_URL}/api/meditacao/inscrever`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, telefone }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Falha ao cadastrar.");
      }

      setStatus("sucesso");
      setEmail("");
      setDdd("");
      setNumero("");
      localStorage.setItem("meditacao_inscrito", "true");
      setInscrito(true);
    } catch (err) {
      setStatus("erro");
      setErro(err.message || "Não foi possível cadastrar. Tente novamente.");
    }
  }

  function handleVideo1Ended() {
    localStorage.setItem("meditacao_video1_assistido", "true");
    setVideo1Assistido(true);
  }

  function handleVideo2Ended() {
    localStorage.setItem("meditacao_video2_assistido", "true");
    setVideo2Assistido(true);
  }

  // Variante /mitos: só o cadastro + os 3 vídeos, sem a introdução.
  if (variante === "mitos") {
    return (
      <>
        <section id="cadastro-live" className="section">
          <div className="container" style={{ maxWidth: 560, width: "100%", margin: "0 auto" }}>
            <div className="form-card center">
              <h2>Cadastre seu email para liberar as aulas grátis e receber convites para as lives de meditação</h2>
              <p className="triagem-ajuda">Avisos sobre as próximas lives de meditação, direto no seu email.</p>

              {status === "sucesso" && <div className="success-box">Cadastro feito com sucesso! Suas aulas foram liberadas abaixo.</div>}
              {status === "erro" && <div className="error-box">{erro}</div>}

              {!inscrito && (
                <form onSubmit={handleCadastrar} noValidate>
                  <div className={`field ${emailValido ? "valid" : ""}`}>
                    <label htmlFor="email-live">E-mail {emailValido && <span className="valid-check">✓</span>}</label>
                    <input id="email-live" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="seu@email.com" />
                  </div>

                  <div className={`field ${telefonePreenchido && telefoneValido ? "valid" : ""}`}>
                    <label htmlFor="numero-live">
                      Telefone <span style={{ fontWeight: 400, opacity: 0.7 }}>(opcional)</span> {telefonePreenchido && telefoneValido && <span className="valid-check">✓</span>}
                    </label>
                    <div className="phone-group">
                      <select
                        value={pais}
                        onChange={(e) => {
                          setPais(e.target.value);
                          setDdd("");
                          setNumero("");
                        }}
                        aria-label="País"
                      >
                        {COUNTRIES.map((c) => (
                          <option key={c.code} value={c.code}>
                            {c.name} ({c.dial})
                          </option>
                        ))}
                      </select>
                      {country.hasDDD && (
                        <div className="input-check-wrap ddd-wrap">
                          <input className={`ddd-input ${dddValido ? "valid" : ""}`} type="tel" inputMode="numeric" value={ddd} onChange={handleDddChange} placeholder="DDD" aria-label="DDD" />
                          {dddValido && <span className="input-check">✓</span>}
                        </div>
                      )}
                      <div className="input-check-wrap numero-wrap">
                        <input id="numero-live" className={`numero-input ${numeroValido ? "valid" : ""}`} type="tel" inputMode="numeric" value={numero} onChange={handleNumeroChange} placeholder={country.phoneDigits ? `${country.phoneDigits} dígitos` : "Número"} />
                        {numeroValido && <span className="input-check">✓</span>}
                      </div>
                    </div>
                  </div>

                  <button type="submit" className="btn btn-primary btn-block" disabled={!formValido || status === "enviando"}>
                    {status === "enviando" ? "Cadastrando e liberando video..." : "Cadastrar e liberar vídeos"}
                  </button>
                </form>
              )}
            </div>
          </div>
        </section>

        {inscrito && (
          <section className="section section-alt">
            <div className="container center" style={{ marginBottom: 24 }}>
              <span className="eyebrow">Aulas liberadas</span>
              <h2>Suas aulas de meditação</h2>
              <p className="lede" style={{ margin: "0 auto" }}>
                Assista na ordem — cada aula libera a próxima ao final, 3 no total.
              </p>
            </div>
            <div className="container guarded-video-list" style={{ maxWidth: 860, width: "100%", margin: "0 auto" }}>
              <GuardedVideo src={`${API_URL}/videos/mito1.mp4`} label="Mito 1" onEnded={handleVideo1Ended} />
              {video1Assistido && <GuardedVideo src={`${API_URL}/videos/mito2.mp4`} label="Mito 2" onEnded={handleVideo2Ended} />}
              {video2Assistido && <GuardedVideo src={`${API_URL}/videos/mito3.mp4`} label="Mito 3" />}
            </div>
          </section>
        )}

        <BotaoComprarCurso />
        <BarraFixaMeditacao />
      </>
    );
  }

  // Padrão (/meditacao direto): vídeo de abertura + página de vendas completa.
  return (
    <>
      {/* Hero 1 — vídeo do YouTube */}
      <VideoHeroMeditacao />

      {/* Hero 2 — depoimentos */}
      <SecaoDepoimentos />

      <div className="mr-scope">
        {/* Hero 3 — história */}
        <HistoriaSection />
        {/* Hero 4 — pesquisa científica */}
        <CienciaSection />
        {/* Hero 5 — princípio-raiz */}
        <PrincipioSection />
        {/* Hero 6 — o treino não termina junto com a sessão */}
        <VidaCotidianaSection />
        {/* Hero 7 — a ordem que organiza o treinamento */}
        <MetodoSection />
        {/* Hero 8 — progressão estruturada (15 dias) */}
        <QuinzeDiasSection />
        {/* Hero 9 — clareza antes de comprar */}
        <EntregaSection />
        {/* Hero 10 — comece agora o Meditação Raiz */}
        <OfertaSection hotmartLink={HOTMART_LINK} />
        {/* Hero 11 — garantia */}
        <GarantiaSection />
        {/* Hero 12 — perguntas frequentes */}
        <DuvidasSection />
      </div>

      <BarraFixaMeditacao />
    </>
  );
}

export default Meditacao;
