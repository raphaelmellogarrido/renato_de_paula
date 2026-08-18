import { Suspense, lazy } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import ScrollToTop from "./components/ScrollToTop";
import MetaPixelTracker from "./components/MetaPixelTracker";
import Home from "./pages/Home";
// import Cursos from "./pages/Cursos";
// import Consulta from "./pages/Consulta";
// import Sobre from "./pages/Sobre";
// import Triagem from "./pages/Triagem";
import "./App.css";

// Carregadas sob demanda: quem cai na home (a maioria) não precisa baixar o
// código dessas páginas de cara — reduz o JS inicial carregado.
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
            {/* <Route path="/cursos" element={<Cursos />} /> */}
            {/* <Route path="/consulta" element={<Consulta />} /> */}
            {/* <Route path="/triagem" element={<Triagem />} /> */}
            <Route path="/meditacao" element={<Meditacao />} />
            <Route path="/mitos" element={<Navigate to="/meditacao" replace state={{ variante: "mitos" }} />} />
            <Route path="/admin-meditacao" element={<AdminMeditacao />} />
            {/* <Route path="/sobre" element={<Sobre />} /> */}
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
