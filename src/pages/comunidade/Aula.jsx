import { useMemo } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import GuardedVideo from "../../components/GuardedVideo";
import { DIAS } from "./data/mockData";
import ComentariosFeed from "./components/ComentariosFeed";

// Página de uma aula: player + vídeos do dia + navegação sequencial pelos
// 15 dias + comentários. Reaproveita o GuardedVideo já usado em /meditacao
// (barra que só retrocede, fullscreen custom) só reestilizado via CSS.
function Aula() {
  const { id } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const dia = useMemo(() => DIAS.find((d) => d.id === id), [id]);
  const videoAtivoId = searchParams.get("video") || dia?.videos[0]?.id;
  const videoAtivo = dia?.videos.find((v) => v.id === videoAtivoId) || dia?.videos[0];

  if (!dia) {
    return (
      <div className="cm-aula-page">
        <p>Aula não encontrada.</p>
        <Link to="/comunidade" className="cm-aula-voltar">
          ← Voltar para a biblioteca
        </Link>
      </div>
    );
  }

  function selecionarVideo(videoId) {
    setSearchParams({ video: videoId });
  }

  function irParaProximoVideo() {
    const indiceAtual = dia.videos.findIndex((v) => v.id === videoAtivo.id);
    if (indiceAtual < dia.videos.length - 1) {
      selecionarVideo(dia.videos[indiceAtual + 1].id);
      return;
    }
    const indiceDia = DIAS.findIndex((d) => d.id === dia.id);
    const proximoDia = DIAS[indiceDia + 1];
    if (proximoDia) {
      navigate(`/comunidade/aula/${proximoDia.id}`);
    }
  }

  return (
    <div className="cm-aula-page">
      <Link to="/comunidade" className="cm-aula-voltar">
        ← Voltar para a biblioteca
      </Link>

      <div className="cm-aula-layout">
        <div>
          <div className="cm-aula-header">
            <h1>
              {dia.titulo} — {videoAtivo.titulo}
            </h1>
          </div>

          <div className="cm-player-wrap">
            <GuardedVideo src={videoAtivo.src} label={videoAtivo.titulo} onEnded={irParaProximoVideo} />
          </div>

          <div className="cm-aula-videos-do-dia">
            <h2>Vídeos do {dia.titulo}</h2>
            {dia.videos.map((video) => (
              <button
                key={video.id}
                type="button"
                className={`cm-video-item ${video.id === videoAtivo.id ? "is-ativo" : ""}`}
                onClick={() => selecionarVideo(video.id)}
              >
                <span className="cm-video-item-dot" />
                <span>{video.titulo}</span>
                <span className="cm-video-item-duracao">{video.duracao}</span>
              </button>
            ))}
          </div>

          <ComentariosFeed aulaId={videoAtivo.id} />
        </div>

        <nav className="cm-dias-nav">
          <h3>Sequência de 15 dias</h3>
          <div className="cm-dias-nav-list">
            {DIAS.map((d) => (
              <Link
                key={d.id}
                to={`/comunidade/aula/${d.id}`}
                className={`cm-dias-nav-item ${d.id === dia.id ? "is-ativo" : ""}`}
              >
                {d.titulo}
              </Link>
            ))}
          </div>
        </nav>
      </div>
    </div>
  );
}

export default Aula;
