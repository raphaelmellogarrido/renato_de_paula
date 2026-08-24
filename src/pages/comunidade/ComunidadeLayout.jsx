import { useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import useComunidadeAuth, { limparSessao } from "./components/useComunidadeAuth";
import ComunidadeSidebar from "./components/ComunidadeSidebar";
import "./ComunidadeApp.css";

// Shell de toda a area /comunidade
// Auth já foi checada antes de chegar aqui (ver RotaComunidade em App.jsx,
// que decide sem sessão -> /comunidade/login sem nem carregar este chunk).
// O check abaixo fica só como defesa (ex: sessão expirar durante a troca de
// aba) — não é mais o caminho normal de redirect.
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

  if (loading) return null;
  if (!session) return null;

  function handleSair() {
    limparSessao();
    navigate("/comunidade/login", { replace: true });
  }

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
