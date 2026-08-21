import { useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import useComunidadeAuthFake, { limparSessao } from "./components/useComunidadeAuth";
import { useComunidadeAuth as useHotmartAuth } from "./useComunidadeAuth";
import ComunidadeSidebar from "./components/ComunidadeSidebar";
import "./ComunidadeApp.css";

function ComunidadeLayout() {
  const { session, loading } = useComunidadeAuthFake();
  const hotmartStatus = useHotmartAuth();
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

  if (loading || hotmartStatus === "loading") return null;
  if (!session) return null;

  if (hotmartStatus === "negado") {
    return (
      <div className="p-10 text-center flex flex-col items-center justify-center min-h-screen gap-4">
        <h1 className="text-2xl font-bold">Acesso exclusivo para alunos</h1>
        <p>Seu email não tem compra ativa na Hotmart.</p>
        <button onClick={handleSair} className="mt-4 bg-black text-white px-6 py-2 rounded">
          Trocar de conta
        </button>
      </div>
    );
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
