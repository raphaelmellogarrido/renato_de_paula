import { Suspense, lazy } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import ScrollToTop from "./components/ScrollToTop";
import MetaPixelTracker from "./components/MetaPixelTracker";
import Home from "./pages/Home";
import "./App.css";
// import "./pages/comunidade/Login.css";

const Contato = lazy(() => import("./pages/Contato"));
const Meditacao = lazy(() => import("./pages/Meditacao"));
const AdminMeditacao = lazy(() => import("./pages/AdminMeditacao"));
const ComunidadeLayout = lazy(() => import("./pages/comunidade/ComunidadeLayout"));
const ComunidadeLogin = lazy(() => import("./pages/comunidade/Login"));
const ComunidadeDashboard = lazy(() => import("./pages/comunidade/Dashboard"));
const ComunidadeAula = lazy(() => import("./pages/comunidade/Aula"));
const ComunidadeAulasRaiz = lazy(() => import("./pages/comunidade/AulasMeditacaoRaiz"));
const ComunidadeConfiguracoes = lazy(() => import("./pages/comunidade/Configuracoes"));
const EsqueceuSenha = lazy(() => import("./pages/comunidade/EsqueceuSenha"));
const RedefinirSenha = lazy(() => import("./pages/comunidade/RedefinirSenha"));

// Rotas de recuperação de senha (/esqueceu-senha, /redefinir-senha) ficam
// fora do prefixo /comunidade (o link do email usa
// renatodepaula.com/redefinir-senha?token=... direto), mas são a mesma
// telinha cheia (cm-login-page) do login — por isso entram aqui também pra
// esconder Navbar/Footer do site.
const ROTAS_TELA_CHEIA_COMUNIDADE = ["/comunidade", "/esqueceu-senha", "/redefinir-senha"];

function App() {
  const location = useLocation();
  const isComunidade = ROTAS_TELA_CHEIA_COMUNIDADE.some((rota) => location.pathname === rota || location.pathname.startsWith(rota + "/"));

  return (
    <>
      <ScrollToTop />
      <MetaPixelTracker />
      {!isComunidade && <Navbar />}
      <main>
        <Suspense fallback={null}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/meditacao" element={<Meditacao />} />
            <Route path="/mitos" element={<Meditacao />} />
            <Route path="/admin" element={<AdminMeditacao />} />
            {/* Link antigo: o redirect "de verdade" (301, HTTP) é feito no
                .htaccess pra navegação direta (digitar/abrir a URL). Esta
                rota é só um fallback client-side — cobre quem já está com o
                SPA carregado (ex: veio de outra página da comunidade) e
                também o dev server (`npm run dev`), que não lê o .htaccess. */}
            <Route path="/admin-meditacao" element={<Navigate to="/admin" replace />} />
            <Route path="/contato" element={<Contato />} />
            <Route path="/comunidade/login" element={<ComunidadeLogin />} />
            <Route path="/esqueceu-senha" element={<EsqueceuSenha />} />
            <Route path="/redefinir-senha" element={<RedefinirSenha />} />
            <Route path="/comunidade" element={<ComunidadeLayout />}>
              <Route index element={<ComunidadeDashboard />} />
              <Route path="aulas-raiz" element={<ComunidadeAulasRaiz />} />
              <Route path="aula/:id" element={<ComunidadeAula />} />
              <Route path="configuracoes" element={<ComunidadeConfiguracoes />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </main>
      {!isComunidade && <Footer />}
    </>
  );
}

export default App;
