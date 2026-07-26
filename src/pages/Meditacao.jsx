import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import GuardedVideo from "../components/GuardedVideo";

const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? "http://localhost:3001" : "");
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function Meditacao() {
  const { hash } = useLocation();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("idle");
  const [erro, setErro] = useState("");

  const [inscrito, setInscrito] = useState(() => localStorage.getItem("meditacao_inscrito") === "true");
  const [video1Assistido, setVideo1Assistido] = useState(() => localStorage.getItem("meditacao_video1_assistido") === "true");
  const [video2Assistido, setVideo2Assistido] = useState(() => localStorage.getItem("meditacao_video2_assistido") === "true");

  useEffect(() => {
    if (!hash) return;
    const el = document.querySelector(hash);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [hash]);

  const emailValido = EMAIL_REGEX.test(email);

  async function handleCadastrar(e) {
    e.preventDefault();
    if (!emailValido) return;

    setStatus("enviando");
    setErro("");

    try {
      const res = await fetch(`${API_URL}/api/meditacao/inscrever`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Falha ao cadastrar.");
      }

      setStatus("sucesso");
      setEmail("");
      localStorage.setItem("meditacao_inscrito", "true");
      setInscrito(true);
    } catch (err) {
      setStatus("erro");
      setErro(err.message || "Não foi possível cadastrar. Tente novamente.");
    }
  }

  function handleVideo1Ended() {
    localStorage.setItem("meditacao_video1_assistido", "true");
    setVideo1Assistido(true);
  }

  function handleVideo2Ended() {
    localStorage.setItem("meditacao_video2_assistido", "true");
    setVideo2Assistido(true);
  }

  return (
    <>
      {/* Hero 1 — O que é meditação */}
      <section className="hero">
        <div className="container center">
          <span className="eyebrow">Meditação</span>
          <h1>O que é meditação</h1>
          <p className="lede" style={{ margin: "0 auto" }}>
            Meditação é uma prática simples de treinar a atenção e a presença no momento atual. Não exige nenhuma crença específica, nem horas de silêncio absoluto — pode começar com poucos minutos por dia, e ainda assim trazer mais calma, foco e equilíbrio para a rotina.
          </p>
        </div>
      </section>

      {/* Hero 2 — Onde eu aprendi a meditação */}
      <section className="section section-alt">
        <div className="container center" style={{ maxWidth: 720, width: "100%", margin: "0 auto" }}>
          <span className="eyebrow">Minha jornada</span>
          <h2>Onde eu aprendi a meditação</h2>
          <p className="lede" style={{ margin: "0 auto" }}>
            Aprendi as técnicas mais puras de meditação no continente Asiático há 15 anos e passei a última década aplicando essa sabedoria na prática. Hoje, consolidei todo esse aprendizado milenar em um método simples e direto ao ponto para ajudar você a dominar a ansiedade e ter clareza mental.
          </p>
        </div>
      </section>

      {/* Hero 3 — Cadastro para lives */}
      <section id="cadastro-live" className="section">
        <div className="container" style={{ maxWidth: 560, width: "100%", margin: "0 auto" }}>
          <div className="form-card center">
            <h2>Cadastre seu email para liberar as aulas grátis e receber convites para as lives de meditação</h2>
            <p className="triagem-ajuda">Avisos sobre as próximas lives de meditação, direto no seu email.</p>

            {status === "sucesso" && <div className="success-box">Cadastro feito com sucesso! Suas aulas foram liberadas abaixo.</div>}
            {status === "erro" && <div className="error-box">{erro}</div>}

            {!inscrito && (
              <form onSubmit={handleCadastrar} noValidate>
                <div className={`field ${emailValido ? "valid" : ""}`}>
                  <label htmlFor="email-live">E-mail {emailValido && <span className="valid-check">✓</span>}</label>
                  <input id="email-live" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="seu@email.com" />
                </div>
                <button type="submit" className="btn btn-primary btn-block" disabled={!emailValido || status === "enviando"}>
                  {status === "enviando" ? "Cadastrando e liberando video..." : "Cadastrar e liberar vídeos"}
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* Hero 4 — Aulas liberadas após cadastro */}
      {inscrito && (
        <section className="section section-alt">
          <div className="container center" style={{ marginBottom: 24 }}>
            <span className="eyebrow">Aulas liberadas</span>
            <h2>Suas aulas de meditação</h2>
            <p className="lede" style={{ margin: "0 auto" }}>
              Assista na ordem — cada aula libera a próxima ao final.
            </p>
          </div>
          <div className="container guarded-video-list" style={{ maxWidth: 860, width: "100%", margin: "0 auto" }}>
            <GuardedVideo src={`${API_URL}/videos/mito1.mp4`} label="Aula 1" onEnded={handleVideo1Ended} />
            {video1Assistido && <GuardedVideo src={`${API_URL}/videos/mito2.mp4`} label="Aula 2" onEnded={handleVideo2Ended} />}
            {video2Assistido && <GuardedVideo src={`${API_URL}/videos/mito3.mp4`} label="Aula 3" />}
          </div>
        </section>
      )}
    </>
  );
}

export default Meditacao;
