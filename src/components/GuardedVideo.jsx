import { useRef, useState } from 'react'

// Player sem barra de progresso: bloqueia tentativas de avançar (seek)
// além do ponto máximo já assistido. Não é infalível contra alguém
// mexendo no devtools, mas impede o "pular vídeo" casual.
function GuardedVideo({ src, onEnded, label }) {
  const videoRef = useRef(null)
  const wrapperRef = useRef(null)
  const maxTimeRef = useRef(0)
  const [playing, setPlaying] = useState(false)
  const [erro, setErro] = useState('')
  const [volume, setVolume] = useState(1)
  const [muted, setMuted] = useState(false)

  function handleTimeUpdate() {
    const v = videoRef.current
    if (v.currentTime > maxTimeRef.current) {
      maxTimeRef.current = v.currentTime
    }
  }

  function handleSeeking() {
    const v = videoRef.current
    if (v.currentTime > maxTimeRef.current + 0.5) {
      v.currentTime = maxTimeRef.current
    }
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
  }

  function handleVolumeChange(e) {
    const v = videoRef.current
    const novoVolume = Number(e.target.value)
    v.volume = novoVolume
    v.muted = novoVolume === 0
    setVolume(novoVolume)
    setMuted(v.muted)
  }

  // Deixa a DIV que envolve o vídeo em tela cheia, não o <video> em si.
  // Se o próprio elemento <video> entrar em fullscreen, o navegador injeta
  // controles nativos por cima (incluindo a barra de progresso, que
  // permite pular o vídeo) — algo que não conseguimos desativar via
  // atributo. Colocando a div em fullscreen, só os nossos controles
  // customizados aparecem.
  function handleFullscreen() {
    const wrapper = wrapperRef.current
    if (wrapper.requestFullscreen) wrapper.requestFullscreen()
    else if (wrapper.webkitRequestFullscreen) wrapper.webkitRequestFullscreen()
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
        preload="metadata"
        onContextMenu={(e) => e.preventDefault()}
        onTimeUpdate={handleTimeUpdate}
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
      <div className="guarded-video-controls">
        <button type="button" onClick={toggleMute} aria-label={muted ? 'Ativar som' : 'Silenciar'}>
          {muted || volume === 0 ? '🔇' : '🔊'}
        </button>
        <input
          type="range"
          min="0"
          max="1"
          step="0.05"
          value={muted ? 0 : volume}
          onChange={handleVolumeChange}
          aria-label="Volume"
        />
        <button type="button" onClick={handleFullscreen} aria-label="Tela cheia">
          ⛶
        </button>
      </div>
      {erro && <div className="error-box guarded-video-erro">{erro}</div>}
    </div>
  )
}

export default GuardedVideo
