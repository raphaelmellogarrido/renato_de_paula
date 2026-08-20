import { useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import useComunidadeAuth, { limparSessao } from "./components/useComunidadeAuth";
import ComunidadeSidebar from "./components/ComunidadeSidebar";
import "./ComunidadeApp.css";

// Shell de toda a área /comunidade: sidebar esquerda fixa + conteúdo da
// rota filha. Bloqueia acesso sem sessão (fake, Fase 1) e marca a área
// como noindex — nenhuma alteração é feita ao site principal aqui.
function ComunidadeLayout() {
  const { session, loading } = useComunidadeAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const meta = document.createElement("meta");
    meta.name = "robots";
    meta.content = "noindex, nofollow";
    document.head.appendChild(meta);
    return () => document.head.removeChild(meta);
  }, []);

  useEffect(() => {
    if (!loading && !session) {
      navigate("/comunidade/login", { replace: true });
    }
  }, [loading, session, navigate]);

  function handleSair() {
    limparSessao();
    navigate("/comunidade/login", { replace: true });
  }

  if (loading || !session) return null;

  return (
    <div className="comunidade-app cm-shell">
      <ComunidadeSidebar session={session} onSair={handleSair} />
      <div className="cm-content">
        <Outlet />
      </div>
    </div>
  );
}

export default ComunidadeLayout;
