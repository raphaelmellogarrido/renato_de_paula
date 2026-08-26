import { useEffect, useRef, useState } from "react";
import { Search } from "lucide-react";
import { iniciais } from "./comentariosUtils";

const LISTAR_ALUNOS_URL = "/api/mensagens/listar_alunos.php";

// Barra de busca de usuários (Tarefa 2, 26/08) — só renderizada por
// Mensagens.jsx quando quem está logado é admin/orientador
// (EMAIL_ADMINISTRADOR/EMAIL_ORIENTADOR, ver ComentarioCard.jsx). Deixa a
// equipe abrir o thread de QUALQUER aluno a partir de /comunidade/mensagens,
// não só responder pelo modal "Enviar mensagem para @Nome" de dentro de um
// comentário existente (DificuldadeDoDia.jsx/ComentariosFeed.jsx).
//
// Lista completa (listar_alunos.php) é buscada uma única vez, no primeiro
// foco do campo — filtro por nome depois disso é 100% client-side (poucas
// dezenas de alunos, não precisa bater no servidor a cada tecla).
//
// Props:
//   onSelecionar (aluno) => void — aluno { nome, email, avatar_url }
function BuscaUsuarios({ onSelecionar }) {
  const [busca, setBusca] = useState("");
  const [alunos, setAlunos] = useState([]);
  const [carregando, setCarregando] = useState(false);
  const [aberto, setAberto] = useState(false);
  const buscouRef = useRef(false); // trava contra refetch a cada foco (só o 1º dispara o GET)
  const raizRef = useRef(null);

  function carregarAlunos() {
    if (buscouRef.current) return;
    buscouRef.current = true;
    setCarregando(true);
    fetch(LISTAR_ALUNOS_URL, { cache: "no-store" })
      .then((r) => r.json())
      .then((dados) => {
        if (Array.isArray(dados?.itens)) setAlunos(dados.itens);
      })
      .catch((err) => {
        console.error("[Clube Presença] falha ao carregar lista de usuários:", err);
        buscouRef.current = false; // libera tentar de novo no próximo foco
      })
      .finally(() => setCarregando(false));
  }

  // Fecha o dropdown ao clicar fora — mesmo padrão de qualquer combobox.
  useEffect(() => {
    function aoClicarFora(e) {
      if (raizRef.current && !raizRef.current.contains(e.target)) setAberto(false);
    }
    document.addEventListener("mousedown", aoClicarFora);
    return () => document.removeEventListener("mousedown", aoClicarFora);
  }, []);

  const buscaNormalizada = busca.trim().toLowerCase();
  const filtrados = buscaNormalizada
    ? alunos.filter((a) => (a.nome || "").toLowerCase().includes(buscaNormalizada))
    : alunos;

  function selecionar(aluno) {
    onSelecionar(aluno);
    setBusca("");
    setAberto(false);
  }

  return (
    <div className="cm-busca-usuarios" ref={raizRef}>
      <div className="cm-busca-usuarios-barra">
        <Search size={16} className="cm-busca-usuarios-icone" />
        <input
          type="text"
          placeholder="Buscar usuários..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          onFocus={() => {
            carregarAlunos();
            setAberto(true);
          }}
        />
      </div>

      {aberto && (
        <div className="cm-busca-usuarios-lista">
          {carregando && <p className="cm-busca-usuarios-vazio">Carregando...</p>}
          {!carregando && filtrados.length === 0 && (
            <p className="cm-busca-usuarios-vazio">Nenhum usuário encontrado.</p>
          )}
          {!carregando &&
            filtrados.map((aluno) => (
              <button
                type="button"
                key={aluno.email}
                className="cm-busca-usuarios-item"
                onClick={() => selecionar(aluno)}
              >
                {aluno.avatar_url ? (
                  <img src={aluno.avatar_url} alt="" className="cm-busca-usuarios-avatar cm-busca-usuarios-avatar-img" />
                ) : (
                  <div className="cm-busca-usuarios-avatar">{iniciais(aluno.nome)}</div>
                )}
                <span>{aluno.nome}</span>
              </button>
            ))}
        </div>
      )}
    </div>
  );
}

export default BuscaUsuarios;
