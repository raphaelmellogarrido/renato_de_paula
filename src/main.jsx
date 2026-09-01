import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./index.css";
import App from "./App.jsx";
import { agendarScriptsTerceiros, iniciarTrackingDeVideo } from "./utils/loadThirdParty";
// import "./pages/comunidade/Login.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
);

// Meta Pixel + Google tag: só depois do primeiro paint (ver loadThirdParty.js)
agendarScriptsTerceiros();

// Tracking de progresso de vídeo (25/50/75/95%): não adia, pro vídeo com
// autoPlay não perder o começo do progresso.
iniciarTrackingDeVideo();
