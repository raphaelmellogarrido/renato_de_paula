import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import GuardedVideo from "../components/GuardedVideo";
import { COUNTRIES } from "../config/countries";
import depo1 from "../assets/depo1.jpeg";
import depo2 from "../assets/depo2.jpeg";
import depo3 from "../assets/depo3.jpeg";
import depo4 from "../assets/depo4.jpeg";
import depo5 from "../assets/depo5.jpeg";

const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? "http://localhost:3001" : "");
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const GENERIC_MAX_DIGITS = 14;
const GENERIC_MIN_DIGITS = 6;
const HOTMART_LINK = "https://hotmart.com/pt-br";

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
        Comprar curso de meditação completo
      </a>
    </div>
  );
}

// Vídeo de abertura da /meditacao: começa sozinho, mudo (autoplay só funciona
// mudo na maioria dos navegadores), com um ícone grande pra ativar o som.
// Ao rolar a página e o vídeo sair da tela, ele "flutua" pequeno no canto
// inferior direito e continua tocando — sem recarregar, porque é sempre o
// mesmo elemento <video>, só muda de posição via CSS. Tem os mesmos controles
// do player usado nos outros vídeos (play/pause, volume, tela cheia).
function VideoHeroMeditacao() {
  const videoRef = useRef(null);
  const wrapperRef = useRef(null);
  const slotRef = useRef(null);
  const volumeTimeoutRef = useRef(null);

  const [mudo, setMudo] = useState(true);
  const [flutuante, setFlutuante] = useState(false);
  const [erro, setErro] = useState("");
  const [playing, setPlaying] = useState(false);
  const [volume, setVolume] = useState(1);
  const [volumeAberto, setVolumeAberto] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const el = slotRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => setFlutuante(!entry.isIntersecting), { threshold: 0 });
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
    v.muted = !v.muted;
    setMudo(v.muted);
    abrirVolumeTemporariamente();
  }

  function handleVolumeChange(e) {
    const v = videoRef.current;
    const novoVolume = Number(e.target.value);
    v.volume = novoVolume;
    v.muted = novoVolume === 0;
    setVolume(novoVolume);
    setMudo(v.muted);
    abrirVolumeTemporariamente();
  }

  // Deixa a div em tela cheia, não o <video> em si — evita que o navegador
  // injete controles nativos por cima dos nossos.
  // function handleFullscreen() {
  //   const jaEmFullscreen = document.fullscreenElement || document.webkitFullscreenElement;
  //   if (jaEmFullscreen) {
  //     if (document.exitFullscreen) document.exitFullscreen();
  //     else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
  //     return;
  //   }
  //   const wrapper = wrapperRef.current;
  //   if (wrapper.requestFullscreen) wrapper.requestFullscreen();
  //   else if (wrapper.webkitRequestFullscreen) wrapper.webkitRequestFullscreen();
  // }

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

  function handleVideoError() {
    setErro("Não foi possível carregar o vídeo. Verifique sua conexão e tente novamente.");
  }

  function handleTimeUpdate() {
    setCurrentTime(videoRef.current.currentTime);
  }

  function handleLoadedMetadata() {
    setDuration(videoRef.current.duration || 0);
  }

  // Vídeo promocional, não precisa restringir avanço — diferente do player
  // dos cursos gated, aqui dá pra arrastar livremente pra frente e pra trás.
  function handleSeekBarChange(e) {
    const v = videoRef.current;
    const novoTempo = Number(e.target.value);
    v.currentTime = novoTempo;
    setCurrentTime(novoTempo);
  }

  return (
    <section className="section">
      <div className="container center">
        <h1>Introdução a meditação!</h1>
      </div>
      <div className="container">
        <div className="meditacao-hero-video-slot" ref={slotRef}>
          <div className={`meditacao-hero-video ${flutuante ? "is-floating" : ""}`} ref={wrapperRef}>
            <video
              ref={videoRef}
              src={`${API_URL}/videos/aula_gratuita_meditacao.mp4`}
              autoPlay
              muted={mudo}
              loop
              playsInline
              onClick={togglePlay}
              onPlay={() => setPlaying(true)}
              onPause={() => setPlaying(false)}
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={handleLoadedMetadata}
              onError={handleVideoError}
            />

            <button type="button" className={`guarded-video-toggle ${playing ? "is-playing" : ""}`} onClick={togglePlay} aria-label={playing ? "Pausar" : "Reproduzir"}>
              {playing ? "❚❚" : "▶"}
            </button>

            {mudo && (
              <button type="button" className="meditacao-hero-video-mute" onClick={handleAtivarSom} aria-label="Ativar som">
                🔇
              </button>
            )}

            <div className="guarded-video-controls">
              <div className="guarded-video-buttons-row">
                <div className="guarded-video-volume-group">
                  <button type="button" onClick={toggleMute} aria-label={mudo ? "Ativar som" : "Silenciar"}>
                    {mudo || volume === 0 ? "🔇" : "🔊"}
                  </button>
                  {volumeAberto && <input type="range" className="guarded-video-volume-popup" min="0" max="1" step="0.05" value={mudo ? 0 : volume} onChange={handleVolumeChange} aria-label="Volume" />}
                </div>
                <input type="range" className="guarded-video-seekbar" min="0" max={duration || 0} step="0.1" value={currentTime} onChange={handleSeekBarChange} aria-label="Progresso do vídeo" />
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
      <BotaoComprarCurso />
    </section>
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
      </>
    );
  }

  // Padrão (/meditacao direto): vídeo de abertura + introdução, sem cadastro nem vídeos gated.
  return (
    <>
      <VideoHeroMeditacao />

      {/* Hero 1 — O que é meditação */}
      <section className="hero">
        <div className="container center">
          <span className="eyebrow">Meditação</span>
          <h1>O que é meditação</h1>
          <p className="lede" style={{ margin: "0 auto" }}>
            Meditação é uma prática simples de treinar a atenção e a presença no momento atual. Não exige nenhuma crença específica, nem horas de silêncio absoluto — pode começar com poucos minutos por dia, e ainda assim trazer mais calma, foco e equilíbrio para a rotina.
          </p>
        </div>
      </section>

      {/* Hero 2 — Onde eu aprendi a meditação */}
      <section className="section section-alt">
        <div className="container center" style={{ maxWidth: 720, width: "100%", margin: "0 auto" }}>
          <span className="eyebrow">Minha jornada</span>
          <h2>Onde eu aprendi a meditação</h2>
          <p className="lede" style={{ margin: "0 auto" }}>
            Aprendi as técnicas mais puras de meditação no continente Asiático há 15 anos e passei a última década aplicando essa sabedoria na prática. Hoje, consolidei todo esse aprendizado milenar em um método simples e direto ao ponto para ajudar você a dominar a ansiedade e ter clareza mental.
          </p>
        </div>
      </section>

      <SecaoDepoimentos />
    </>
  );
}

export default Meditacao;
