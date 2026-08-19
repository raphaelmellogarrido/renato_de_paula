import { useEffect, useRef, useState } from 'react'

// Player com barra de progresso que só permite retroceder (nunca avançar) —
// bloqueia tentativas de pular pra frente além do ponto já assistido. Não é
// infalível contra alguém mexendo no devtools, mas impede o "pular vídeo" casual.
function GuardedVideo({ src, onEnded, label, autoPlay = false }) {
  const videoRef = useRef(null)
  const wrapperRef = useRef(null)
  const maxTimeRef = useRef(0)
  const volumeTimeoutRef = useRef(null)
  const [playing, setPlaying] = useState(false)
  const [erro, setErro] = useState('')
  const [volume, setVolume] = useState(1)
  // Autoplay só funciona mudo na maioria dos navegadores — começa mudo e
  // mostra um botão pra ativar o som, em vez de tentar tocar com som e falhar.
  const [muted, setMuted] = useState(autoPlay)
  const [volumeAberto, setVolumeAberto] = useState(false)
  const [fullscreen, setFullscreen] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)

  useEffect(() => {
    if (!autoPlay) return
    const v = videoRef.current
    const resultado = v?.play()
    if (resultado?.catch) resultado.catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    function handleFullscreenChange() {
      const ativo = document.fullscreenElement || document.webkitFullscreenElement
      const dentro = ativo === wrapperRef.current
      setFullscreen(dentro)
      // Ao sair da tela cheia, libera a orientação — senão a página inteira
      // fica presa em modo paisagem depois que o vídeo fecha.
      if (!dentro && screen.orientation?.unlock) {
        screen.orientation.unlock()
      }
    }
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange)
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange)
    }
  }, [])

  useEffect(() => () => clearTimeout(volumeTimeoutRef.current), [])

  function handleTimeUpdate() {
    const v = videoRef.current
    setCurrentTime(v.currentTime)
    if (v.currentTime > maxTimeRef.current) {
      maxTimeRef.current = v.currentTime
    }
  }

  function handleLoadedMetadata() {
    setDuration(videoRef.current.duration || 0)
  }

  // Rede de segurança extra: mesmo com a barra visível só permitindo
  // retroceder, mantemos esse bloqueio para tentativas de avanço que não
  // passem pelo onChange da barra (ex: controles de mídia do sistema).
  function handleSeeking() {
    const v = videoRef.current
    if (v.currentTime > maxTimeRef.current + 0.5) {
      v.currentTime = maxTimeRef.current
    }
  }

  // Barra de progresso: só permite arrastar pra trás (rever algo perdido).
  // Tentativas de avançar são ignoradas — como o value é controlado pelo
  // estado currentTime, a barra "volta" sozinha pra posição real.
  function handleSeekBarChange(e) {
    const v = videoRef.current
    const novoTempo = Number(e.target.value)
    if (novoTempo <= v.currentTime) {
      v.currentTime = novoTempo
      setCurrentTime(novoTempo)
    }
  }

  function abrirVolumeTemporariamente() {
    setVolumeAberto(true)
    clearTimeout(volumeTimeoutRef.current)
    volumeTimeoutRef.current = setTimeout(() => setVolumeAberto(false), 2500)
  }

  function togglePlay() {
    const v = videoRef.current
    setErro('')

    if (v.paused) {
      const resultado = v.play()
      if (resultado?.catch) {
        resultado.catch((err) => {
          console.error('Erro ao reproduzir vídeo:', err)
          setErro('Não foi possível reproduzir o vídeo. Toque novamente ou tente com outra conexão.')
        })
      }
    } else {
      v.pause()
    }
  }

  function handleVideoError() {
    const v = videoRef.current
    console.error('Erro ao carregar vídeo:', v?.error)
    setErro('Não foi possível carregar o vídeo. Verifique sua conexão e tente novamente.')
  }

  function toggleMute() {
    const v = videoRef.current
    v.muted = !v.muted
    setMuted(v.muted)
    abrirVolumeTemporariamente()
  }

  function handleAtivarSom(e) {
    e.stopPropagation()
    const v = videoRef.current
    v.muted = false
    setMuted(false)
    abrirVolumeTemporariamente()
  }

  function handleVolumeChange(e) {
    const v = videoRef.current
    const novoVolume = Number(e.target.value)
    v.volume = novoVolume
    v.muted = novoVolume === 0
    setVolume(novoVolume)
    setMuted(v.muted)
    abrirVolumeTemporariamente()
  }

  // Deixa a DIV que envolve o vídeo em tela cheia, não o <video> em si.
  // Se o próprio elemento <video> entrar em fullscreen, o navegador injeta
  // controles nativos por cima (incluindo a barra de progresso, que
  // permite pular o vídeo) — algo que não conseguimos desativar via
  // atributo. Colocando a div em fullscreen, só os nossos controles
  // customizados aparecem.
  function handleFullscreen() {
    const jaEmFullscreen = document.fullscreenElement || document.webkitFullscreenElement
    if (jaEmFullscreen) {
      if (document.exitFullscreen) document.exitFullscreen()
      else if (document.webkitExitFullscreen) document.webkitExitFullscreen()
      return
    }
    const wrapper = wrapperRef.current
    if (wrapper.requestFullscreen) wrapper.requestFullscreen()
    else if (wrapper.webkitRequestFullscreen) wrapper.webkitRequestFullscreen()
  }

  // Botão só do mobile: entra em tela cheia e força a orientação paisagem,
  // mesmo que o bloqueio de rotação do celular esteja ativado no sistema.
  // iOS Safari não suporta screen.orientation.lock — nesse caso a tela
  // cheia já ajuda, e a rotação física do aparelho funciona normalmente.
  async function handleGirarTela() {
    try {
      const wrapper = wrapperRef.current
      if (!document.fullscreenElement && !document.webkitFullscreenElement) {
        if (wrapper.requestFullscreen) await wrapper.requestFullscreen()
        else if (wrapper.webkitRequestFullscreen) wrapper.webkitRequestFullscreen()
      }
      if (screen.orientation?.lock) {
        await screen.orientation.lock('landscape')
      }
    } catch (err) {
      console.error('Não foi possível girar a tela:', err)
    }
  }

  return (
    <div className="guarded-video" ref={wrapperRef}>
      {label && <span className="guarded-video-label">{label}</span>}
      <video
        ref={videoRef}
        src={src}
        controls={false}
        controlsList="nodownload noplaybackrate"
        disablePictureInPicture
        playsInline
        autoPlay={autoPlay}
        muted={muted}
        preload="metadata"
        onContextMenu={(e) => e.preventDefault()}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onSeeking={handleSeeking}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={onEnded}
        onError={handleVideoError}
        onClick={togglePlay}
      />
      <button
        type="button"
        className={`guarded-video-toggle ${playing ? 'is-playing' : ''}`}
        onClick={togglePlay}
        aria-label={playing ? 'Pausar' : 'Reproduzir'}
      >
        {playing ? '❚❚' : '▶'}
      </button>
      {autoPlay && muted && (
        <button type="button" className="meditacao-hero-video-mute" onClick={handleAtivarSom} aria-label="Ativar som">
          🔇
        </button>
      )}
      <div className="guarded-video-controls">
        <div className="guarded-video-buttons-row">
          <div className="guarded-video-volume-group">
            <button type="button" onClick={toggleMute} aria-label={muted ? 'Ativar som' : 'Silenciar'}>
              {muted || volume === 0 ? '🔇' : '🔊'}
            </button>
            {volumeAberto && (
              <input
                type="range"
                className="guarded-video-volume-popup"
                min="0"
                max="1"
                step="0.05"
                value={muted ? 0 : volume}
                onChange={handleVolumeChange}
                aria-label="Volume"
              />
            )}
          </div>
          <input
            type="range"
            className="guarded-video-seekbar"
            min="0"
            max={duration || 0}
            step="0.1"
            value={currentTime}
            onChange={handleSeekBarChange}
            aria-label="Progresso do vídeo — só é possível retroceder"
          />
          <button
            type="button"
            className="guarded-video-rotate"
            onClick={handleGirarTela}
            aria-label="Girar tela para assistir na horizontal"
          >
            ⟲
          </button>
          <button type="button" onClick={handleFullscreen} aria-label={fullscreen ? 'Sair da tela cheia' : 'Tela cheia'}>
            {fullscreen ? '⤡' : '⛶'}
          </button>
        </div>
      </div>
      {erro && <div className="error-box guarded-video-erro">{erro}</div>}
    </div>
  )
}

export default GuardedVideo
