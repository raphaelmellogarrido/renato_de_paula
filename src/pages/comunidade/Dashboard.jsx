import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { Play, SkipBack, SkipForward, Volume2, Clock, Sparkles } from "lucide-react";
import { DIAS, VIDEOS_BIBLIOTECA, FILTROS } from "./data/mockData";
import { temAcessoComunidade } from "./featureFlags";
import useComunidadeAuth from "./components/useComunidadeAuth";
import ColunaProgresso from "./components/ColunaProgresso";
import ColunaEncontros from "./components/ColunaEncontros";
import ComunidadeTopBar from "./components/ComunidadeTopBar";
import CardBiblioteca from "./components/CardBiblioteca";
import FeedComunidade from "./components/FeedComunidade";

const meditacaoDeHoje = DIAS[0].videos[0];
const HERO_FOTO = "https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=1400&q=70";

// Dashboard: grid único de 3 colunas (a 4ª, sidebar esquerda, é resolvida
// por fora em ComunidadeLayout) usando `grid-template-areas` nomeadas (ver
// ComunidadeApp.css) — cada card ocupa a área com seu nome, não uma célula
// linha/coluna numérica solta. Hero e Biblioteca (coluna 1) cobrem as
// mesmas 2 linhas onde Sequência+Progresso e Próximo+Desafio ficam
// empilhados nas colunas 2 e 3 — é isso que evita sobrar espaço em branco
// quando um lado é mais alto que o outro. Título + filtros da Biblioteca
// ficam DENTRO do mesmo bloco da grade de vídeos (não numa linha própria),
// pelo mesmo motivo. Sem accordion por Dia nesta versão (removido a pedido
// do cliente); DIAS continua existindo só para abrir a "meditação de hoje"
// e alimentar /comunidade/aula/:id.
function Dashboard() {
  const { session } = useComunidadeAuth();
  const [view, setView] = useState("curso");
  const [busca, setBusca] = useState("");
  const [filtroAtivo, setFiltroAtivo] = useState("Todas");
  const navigate = useNavigate();

  function abrirMeditacaoDeHoje() {
    navigate(`/comunidade/aula/dia-0?video=${meditacaoDeHoje.id}`);
  }

  const termoBusca = busca.trim().toLowerCase();
  const videosFiltrados = VIDEOS_BIBLIOTECA.filter((item) => {
    const casaFiltro = filtroAtivo === "Todas" || item.tag === filtroAtivo;
    const casaBusca =
      !termoBusca || item.titulo.toLowerCase().includes(termoBusca) || item.tag.toLowerCase().includes(termoBusca);
    return casaFiltro && casaBusca;
  });

  return (
    <div className="cm-main">
      <ComunidadeTopBar view={view} onViewChange={setView} busca={busca} onBuscaChange={setBusca} />

      {view === "curso" ? (
        <>
          <section
            className="cm-hero cm-hero-foto cm-grid-hero"
            style={{ backgroundImage: `url(${HERO_FOTO})` }}
            onClick={abrirMeditacaoDeHoje}
            role="button"
            tabIndex={0}
          >
            <div className="cm-hero-conteudo">
              <div className="cm-hero-topo">
                <span className="cm-hero-eyebrow">
                  <Sparkles size={13} /> Continue sua jornada
                </span>
                <span className="cm-hero-duracao">
                  <Clock size={13} /> {meditacaoDeHoje.duracao}
                </span>
              </div>
              <h1>Respiração para voltar ao centro</h1>
              <p>Uma prática guiada pelo Dr. Renato para acalmar o sistema nervoso e recomeçar o dia com presença.</p>

              <div className="cm-hero-player" onClick={(e) => e.stopPropagation()}>
                <button type="button" className="cm-hero-player-btn" aria-label="Voltar 15s" tabIndex={-1}>
                  <SkipBack size={16} />
                </button>
                <button type="button" className="cm-hero-player-play" onClick={abrirMeditacaoDeHoje} aria-label="Assistir">
                  <Play size={18} fill="currentColor" />
                </button>
                <button type="button" className="cm-hero-player-btn" aria-label="Avançar 15s" tabIndex={-1}>
                  <SkipForward size={16} />
                </button>
                <span className="cm-hero-player-tempo">3:06</span>
                <div className="cm-progress-track cm-hero-player-track">
                  <div className="cm-progress-fill" style={{ width: "26%" }} />
                </div>
                <span className="cm-hero-player-tempo">12:00</span>
                <Volume2 size={16} className="cm-hero-player-vol" />
              </div>
            </div>
          </section>

          <div className="cm-grid-biblioteca-videos">
            <div className="cm-biblioteca-header">
              <h2 className="cm-section-title">Biblioteca de Meditações</h2>
              <div className="cm-biblioteca-filtros">
                {FILTROS.map((filtro) => (
                  <button
                    type="button"
                    key={filtro}
                    className={`cm-filtro-chip ${filtroAtivo === filtro ? "is-ativo" : ""}`}
                    onClick={() => setFiltroAtivo(filtro)}
                  >
                    {filtro}
                  </button>
                ))}
              </div>
            </div>

            {videosFiltrados.length > 0 ? (
              <div className="cm-grid-biblioteca">
                {videosFiltrados.map((item) => (
                  <CardBiblioteca key={item.id} item={item} />
                ))}
              </div>
            ) : (
              <p className="cm-biblioteca-vazio">Nenhuma meditação encontrada para esse filtro/busca.</p>
            )}
          </div>
        </>
      ) : (
        <div className="cm-grid-feed">
          <FeedComunidade liberado={temAcessoComunidade(session)} souFundador={!!session?.isAlunoCurso} />
        </div>
      )}

      <ColunaProgresso />
      <ColunaEncontros />
    </div>
  );
}

export default Dashboard;
