import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import GuardedVideo from "../components/GuardedVideo";
import { COUNTRIES } from "../config/countries";

const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? "http://localhost:3001" : "");
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const GENERIC_MAX_DIGITS = 14;
const GENERIC_MIN_DIGITS = 6;
const HOTMART_LINK = "https://hotmart.com/pt-br";

function onlyDigits(value) {
  return value.replace(/\D/g, "");
}

function BotaoComprarCurso() {
  return (
    <div className="container center" style={{ marginTop: 40, marginBottom: 24 }}>
      <a href={HOTMART_LINK} target="_blank" rel="noreferrer" className="btn btn-primary btn-pill btn-mobile-full">
        Comprar curso de meditação completo
      </a>
    </div>
  );
}

function Meditacao() {
  const { hash, state } = useLocation();
  const variante = state?.variante;
  const [email, setEmail] = useState("");
  const [pais, setPais] = useState("BR");
  const [ddd, setDdd] = useState("");
  const [numero, setNumero] = useState("");
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
  const country = COUNTRIES.find((c) => c.code === pais);
  const dddValido = country.hasDDD ? ddd.length === 2 : true;
  const numeroValido = country.phoneDigits != null
    ? numero.length === country.phoneDigits
    : numero.length >= GENERIC_MIN_DIGITS && numero.length <= GENERIC_MAX_DIGITS;
  const telefonePreenchido = numero.length > 0;
  const telefoneValido = country.hasDDD ? dddValido && numeroValido : numeroValido;
  const formValido = emailValido;

  function handleDddChange(e) {
    setDdd(onlyDigits(e.target.value).slice(0, 2));
  }

  function handleNumeroChange(e) {
    const max = country.hasDDD ? country.phoneDigits : GENERIC_MAX_DIGITS;
    setNumero(onlyDigits(e.target.value).slice(0, max));
  }

  async function handleCadastrar(e) {
    e.preventDefault();
    if (!formValido) return;

    setStatus("enviando");
    setErro("");

    const telefone = numero ? (country.hasDDD ? `${country.dial} (${ddd}) ${numero}` : `${country.dial} ${numero}`) : "";

    try {
      const res = await fetch(`${API_URL}/api/meditacao/inscrever`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, telefone }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Falha ao cadastrar.");
      }

      setStatus("sucesso");
      setEmail("");
      setDdd("");
      setNumero("");
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

  // Variante /curso: só o vídeo gratuito + explicação + botão de compra.
  if (variante === "curso") {
    return (
      <>
        <section className="hero">
          <div className="container center">
            <span className="eyebrow">Meditação</span>
            <h1>Aula gratuita de meditação</h1>
            <p className="lede" style={{ margin: "0 auto" }}>
              A meditação é uma das ferramentas mais simples e eficazes para treinar a atenção, reduzir reações automáticas e trazer mais clareza pro dia a dia. Nessa aula gratuita, você já sai com uma
              prática que pode aplicar hoje mesmo.
            </p>
          </div>
        </section>
        <div className="container guarded-video-list" style={{ maxWidth: 860, width: "100%", margin: "32px auto 0" }}>
          <GuardedVideo src={`${API_URL}/videos/aula_gratuita_meditacao.mp4`} label="Aula gratuita" />
        </div>
        <BotaoComprarCurso />
      </>
    );
  }

  // Variante /mitos: só o cadastro + os 3 vídeos, sem a introdução.
  if (variante === "mitos") {
    return (
      <>
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

                  <div className={`field ${telefonePreenchido && telefoneValido ? "valid" : ""}`}>
                    <label htmlFor="numero-live">
                      Telefone <span style={{ fontWeight: 400, opacity: 0.7 }}>(opcional)</span>{" "}
                      {telefonePreenchido && telefoneValido && <span className="valid-check">✓</span>}
                    </label>
                    <div className="phone-group">
                      <select
                        value={pais}
                        onChange={(e) => {
                          setPais(e.target.value);
                          setDdd("");
                          setNumero("");
                        }}
                        aria-label="País"
                      >
                        {COUNTRIES.map((c) => (
                          <option key={c.code} value={c.code}>
                            {c.name} ({c.dial})
                          </option>
                        ))}
                      </select>
                      {country.hasDDD && (
                        <div className="input-check-wrap ddd-wrap">
                          <input
                            className={`ddd-input ${dddValido ? "valid" : ""}`}
                            type="tel"
                            inputMode="numeric"
                            value={ddd}
                            onChange={handleDddChange}
                            placeholder="DDD"
                            aria-label="DDD"
                          />
                          {dddValido && <span className="input-check">✓</span>}
                        </div>
                      )}
                      <div className="input-check-wrap numero-wrap">
                        <input
                          id="numero-live"
                          className={`numero-input ${numeroValido ? "valid" : ""}`}
                          type="tel"
                          inputMode="numeric"
                          value={numero}
                          onChange={handleNumeroChange}
                          placeholder={country.phoneDigits ? `${country.phoneDigits} dígitos` : "Número"}
                        />
                        {numeroValido && <span className="input-check">✓</span>}
                      </div>
                    </div>
                  </div>

                  <button type="submit" className="btn btn-primary btn-block" disabled={!formValido || status === "enviando"}>
                    {status === "enviando" ? "Cadastrando e liberando video..." : "Cadastrar e liberar vídeos"}
                  </button>
                </form>
              )}
            </div>
          </div>
        </section>

        {inscrito && (
          <section className="section section-alt">
            <div className="container center" style={{ marginBottom: 24 }}>
              <span className="eyebrow">Aulas liberadas</span>
              <h2>Suas aulas de meditação</h2>
              <p className="lede" style={{ margin: "0 auto" }}>
                Assista na ordem — cada aula libera a próxima ao final, 3 no total.
              </p>
            </div>
            <div className="container guarded-video-list" style={{ maxWidth: 860, width: "100%", margin: "0 auto" }}>
              <GuardedVideo src={`${API_URL}/videos/mito1.mp4`} label="Mito 1" onEnded={handleVideo1Ended} />
              {video1Assistido && <GuardedVideo src={`${API_URL}/videos/mito2.mp4`} label="Mito 2" onEnded={handleVideo2Ended} />}
              {video2Assistido && <GuardedVideo src={`${API_URL}/videos/mito3.mp4`} label="Mito 3" />}
            </div>
          </section>
        )}

        <BotaoComprarCurso />
      </>
    );
  }

  // Padrão (/meditacao direto): só a introdução, sem cadastro nem vídeos.
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
    </>
  );
}

export default Meditacao;
