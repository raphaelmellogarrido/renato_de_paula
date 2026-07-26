import { useRef, useState } from 'react'

// Player sem barra de progresso: bloqueia tentativas de avançar (seek)
// além do ponto máximo já assistido. Não é infalível contra alguém
// mexendo no devtools, mas impede o "pular vídeo" casual.
function GuardedVideo({ src, onEnded, label }) {
  const videoRef = useRef(null)
  const maxTimeRef = useRef(0)
  const [playing, setPlaying] = useState(false)
  const [erro, setErro] = useState('')

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

  return (
    <div className="guarded-video">
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
      {erro && <div className="error-box guarded-video-erro">{erro}</div>}
    </div>
  )
}

export default GuardedVideo
