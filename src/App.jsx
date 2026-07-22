import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import ScrollToTop from "./components/ScrollToTop";
import MetaPixelTracker from "./components/MetaPixelTracker";
import Home from "./pages/Home";
import Cursos from "./pages/Cursos";
import Consulta from "./pages/Consulta";
import Sobre from "./pages/Sobre";
import Contato from "./pages/Contato";
import "./App.css";

function App() {
  return (
    <BrowserRouter basename="/renato-de-paula">
      <>
        <ScrollToTop />
        <MetaPixelTracker />
        <Navbar />
        <main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/cursos" element={<Cursos />} />
            <Route path="/consulta" element={<Consulta />} />
            <Route path="/sobre" element={<Sobre />} />
            <Route path="/contato" element={<Contato />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        <Footer />
      </>
    </BrowserRouter>
  );
}

export default App;
