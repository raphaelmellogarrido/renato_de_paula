import { useRef, useState } from 'react'

// Player sem barra de progresso: bloqueia tentativas de avançar (seek)
// além do ponto máximo já assistido. Não é infalível contra alguém
// mexendo no devtools, mas impede o "pular vídeo" casual.
function GuardedVideo({ src, onEnded, label }) {
  const videoRef = useRef(null)
  const maxTimeRef = useRef(0)
  const [playing, setPlaying] = useState(false)

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
    if (v.paused) {
      v.play()
    } else {
      v.pause()
    }
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
    </div>
  )
}

export default GuardedVideo
