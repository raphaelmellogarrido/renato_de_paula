import { useState } from "react";
import { COUNTRIES } from "../config/countries";

const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? "http://localhost:3001" : "");

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const GENERIC_MAX_DIGITS = 14;
const GENERIC_MIN_DIGITS = 6;

function onlyDigits(value) {
  return value.replace(/\D/g, "");
}

function Contato() {
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    nome: "",
    email: "",
    pais: "BR",
    ddd: "",
    numero: "",
    assunto: "",
    mensagem: "",
  });

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  }

  function handleCountryChange(e) {
    setForm((f) => ({ ...f, pais: e.target.value, ddd: "", numero: "" }));
  }

  function handleDddChange(e) {
    setForm((f) => ({ ...f, ddd: onlyDigits(e.target.value).slice(0, 2) }));
  }

  function handleNumeroChange(e) {
    const country = COUNTRIES.find((c) => c.code === form.pais);
    const max = country.hasDDD ? country.phoneDigits : GENERIC_MAX_DIGITS;
    setForm((f) => ({ ...f, numero: onlyDigits(e.target.value).slice(0, max) }));
  }

  const country = COUNTRIES.find((c) => c.code === form.pais);

  const nomeValid = form.nome.trim().length >= 3;
  const emailValid = EMAIL_REGEX.test(form.email);
  const assuntoValid = form.assunto.trim().length >= 3;
  const mensagemValid = form.mensagem.trim().length >= 10;
  const dddValid = country.hasDDD ? form.ddd.length === 2 : true;
  const numeroValid = country.phoneDigits != null
    ? form.numero.length === country.phoneDigits
    : form.numero.length >= GENERIC_MIN_DIGITS && form.numero.length <= GENERIC_MAX_DIGITS;
  const telefoneValid = country.hasDDD ? dddValid && numeroValid : numeroValid;

  const formValid = nomeValid && emailValid && telefoneValid && assuntoValid && mensagemValid;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!formValid) return;

    setError("");
    setLoading(true);

    const telefone = form.numero ? (country.hasDDD ? `${country.dial} (${form.ddd}) ${form.numero}` : `${country.dial} ${form.numero}`) : "";

    try {
      const res = await fetch(`${API_URL}/api/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: form.nome,
          email: form.email,
          telefone,
          assunto: form.assunto,
          mensagem: form.mensagem,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Falha ao enviar a mensagem.");
      }

      setSent(true);
      setForm({ nome: "", email: "", pais: "BR", ddd: "", numero: "", assunto: "", mensagem: "" });
    } catch (err) {
      setError(err.message || "Não foi possível enviar sua mensagem. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <section className="page-hero">
        <div className="container">
          <span className="eyebrow">Contato</span>
          <h1>Fale conosco</h1>
          <p className="lede" style={{ margin: "0 auto" }}>
            Tem alguma dúvida sobre o programa, o e-book ou a consulta? Envie sua mensagem que retornaremos em breve.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container" style={{ maxWidth: 680, width: "100%", margin: "0 auto" }}>
          <div className="form-card">
            {sent && <div className="success-box">Mensagem enviada com sucesso! Em breve entraremos em contato.</div>}
            {error && <div className="error-box">{error}</div>}

            <form onSubmit={handleSubmit} noValidate>
              <div className="form-row">
                <div className={`field ${nomeValid ? "valid" : ""}`}>
                  <label htmlFor="nome">Nome {nomeValid && <span className="valid-check">✓</span>}</label>
                  <input id="nome" name="nome" type="text" required value={form.nome} onChange={handleChange} placeholder="Seu nome completo" />
                </div>
                <div className={`field ${emailValid ? "valid" : ""}`}>
                  <label htmlFor="email">E-mail {emailValid && <span className="valid-check">✓</span>}</label>
                  <input id="email" name="email" type="email" required value={form.email} onChange={handleChange} placeholder="seu@email.com" />
                </div>
              </div>

              <div className={`field ${telefoneValid ? "valid" : ""}`}>
                <label htmlFor="numero">Telefone {telefoneValid && <span className="valid-check">✓</span>}</label>
                <div className="phone-group">
                  <select value={form.pais} onChange={handleCountryChange} aria-label="País">
                    {COUNTRIES.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.name} ({c.dial})
                      </option>
                    ))}
                  </select>
                  {country.hasDDD && (
                    <div className="input-check-wrap ddd-wrap">
                      <input
                        className={`ddd-input ${dddValid ? 'valid' : ''}`}
                        type="tel"
                        inputMode="numeric"
                        value={form.ddd}
                        onChange={handleDddChange}
                        placeholder="DDD"
                        aria-label="DDD"
                      />
                      {dddValid && <span className="input-check">✓</span>}
                    </div>
                  )}
                  <div className="input-check-wrap numero-wrap">
                    <input
                      id="numero"
                      className={`numero-input ${numeroValid ? 'valid' : ''}`}
                      type="tel"
                      inputMode="numeric"
                      value={form.numero}
                      onChange={handleNumeroChange}
                      placeholder={country.phoneDigits ? `${country.phoneDigits} dígitos` : 'Número'}
                    />
                    {numeroValid && <span className="input-check">✓</span>}
                  </div>
                </div>
              </div>

              <div className={`field ${assuntoValid ? "valid" : ""}`}>
                <label htmlFor="assunto">Assunto {assuntoValid && <span className="valid-check">✓</span>}</label>
                <input id="assunto" name="assunto" type="text" required value={form.assunto} onChange={handleChange} placeholder="Sobre o que deseja falar?" />
              </div>

              <div className={`field ${mensagemValid ? "valid" : ""}`}>
                <label htmlFor="mensagem">Mensagem {mensagemValid && <span className="valid-check">✓</span>}</label>
                <textarea id="mensagem" name="mensagem" rows="5" required value={form.mensagem} onChange={handleChange} placeholder="Escreva sua mensagem..." />
              </div>

              <button type="submit" className="btn btn-primary btn-block" disabled={loading || !formValid}>
                {loading ? "Enviando..." : "Enviar mensagem"}
              </button>
            </form>
          </div>
        </div>
      </section>
    </>
  );
}

export default Contato;
