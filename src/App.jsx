import { Suspense, lazy } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import ScrollToTop from "./components/ScrollToTop";
import MetaPixelTracker from "./components/MetaPixelTracker";
import Home from "./pages/Home";
import "./App.css";

const Contato = lazy(() => import("./pages/Contato"));
const Meditacao = lazy(() => import("./pages/Meditacao"));
const AdminMeditacao = lazy(() => import("./pages/AdminMeditacao"));
const ComunidadeLayout = lazy(() => import("./pages/comunidade/ComunidadeLayout"));
const ComunidadeLogin = lazy(() => import("./pages/comunidade/Login"));
const ComunidadeDashboard = lazy(() => import("./pages/comunidade/Dashboard"));
const ComunidadeAula = lazy(() => import("./pages/comunidade/Aula"));
const ComunidadeAulasRaiz = lazy(() => import("./pages/comunidade/AulasMeditacaoRaiz"));
const ComunidadeConfiguracoes = lazy(() => import("./pages/comunidade/Configuracoes"));

function App() {
  const location = useLocation();
  const isComunidade = location.pathname.startsWith("/comunidade");

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
            <Route path="/admin-meditacao" element={<AdminMeditacao />} />
            <Route path="/contato" element={<Contato />} />
            <Route path="/comunidade/login" element={<ComunidadeLogin />} />
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
