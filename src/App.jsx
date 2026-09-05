import { Suspense, lazy } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import ScrollToTop from "./components/ScrollToTop";
import MetaPixelTracker from "./components/MetaPixelTracker";
import Home from "./pages/Home";
import "./App.css";

const Contato = lazy(() => import("./pages/Contato"));
const Meditacao = lazy(() => import("./pages/Meditacao"));
const AdminMeditacao = lazy(() => import("./pages/AdminMeditacao"));

function App() {
  return (
    <>
      <ScrollToTop />
      <MetaPixelTracker />
      <Navbar />
      <main>
        <Suspense fallback={null}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/meditacao" element={<Meditacao />} />
            <Route path="/mitos" element={<Meditacao />} />
            {/* Sem AdminGuard: a comunidade (login/sessão que alimentava o
                gate por e-mail) foi aposentada em 05/09 — ver
                _ARQUIVO_MORTO_2026-09-04/. A proteção de dados real sempre
                foi o ADMIN_SECRET que o próprio AdminMeditacao.jsx pede
                (header X-Admin-Secret, checado com hash_equals no PHP);
                isso não mudou. */}
            <Route path="/admin" element={<AdminMeditacao />} />
            {/* Link antigo: o redirect "de verdade" (301, HTTP) é feito no
                .htaccess pra navegação direta (digitar/abrir a URL). Esta
                rota é só um fallback client-side — cobre quem já está com o
                SPA carregado e também o dev server (`npm run dev`), que não
                lê o .htaccess. */}
            <Route path="/admin-meditacao" element={<Navigate to="/admin" replace />} />
            <Route path="/contato" element={<Contato />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </main>
      <Footer />
    </>
  );
}

export default App;
