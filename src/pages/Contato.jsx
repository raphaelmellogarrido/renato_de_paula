import { useState } from 'react'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

function Contato() {
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    nome: '',
    email: '',
    telefone: '',
    assunto: '',
    mensagem: '',
  })

  function handleChange(e) {
    const { name, value } = e.target
    setForm((f) => ({ ...f, [name]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch(`${API_URL}/api/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Falha ao enviar a mensagem.')
      }

      setSent(true)
      setForm({ nome: '', email: '', telefone: '', assunto: '', mensagem: '' })
    } catch (err) {
      setError(err.message || 'Não foi possível enviar sua mensagem. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <section className="page-hero">
        <div className="container">
          <span className="eyebrow">Contato</span>
          <h1>Fale conosco</h1>
          <p className="lede" style={{ margin: '0 auto' }}>
            Tem alguma dúvida sobre o programa, o e-book ou a consulta? Envie sua
            mensagem que retornaremos em breve.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container" style={{ maxWidth: 680, width: '100%', margin: '0 auto' }}>
          <div className="form-card">
            {sent && (
              <div className="success-box">
                Mensagem enviada com sucesso! Em breve entraremos em contato.
              </div>
            )}
            {error && <div className="error-box">{error}</div>}

            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="field">
                  <label htmlFor="nome">Nome</label>
                  <input
                    id="nome"
                    name="nome"
                    type="text"
                    required
                    value={form.nome}
                    onChange={handleChange}
                    placeholder="Seu nome completo"
                  />
                </div>
                <div className="field">
                  <label htmlFor="email">E-mail</label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={form.email}
                    onChange={handleChange}
                    placeholder="seu@email.com"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="field">
                  <label htmlFor="telefone">Telefone</label>
                  <input
                    id="telefone"
                    name="telefone"
                    type="tel"
                    value={form.telefone}
                    onChange={handleChange}
                    placeholder="(00) 00000-0000"
                  />
                </div>
                <div className="field">
                  <label htmlFor="assunto">Assunto</label>
                  <input
                    id="assunto"
                    name="assunto"
                    type="text"
                    required
                    value={form.assunto}
                    onChange={handleChange}
                    placeholder="Sobre o que deseja falar?"
                  />
                </div>
              </div>

              <div className="field">
                <label htmlFor="mensagem">Mensagem</label>
                <textarea
                  id="mensagem"
                  name="mensagem"
                  rows="5"
                  required
                  value={form.mensagem}
                  onChange={handleChange}
                  placeholder="Escreva sua mensagem..."
                />
              </div>

              <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
                {loading ? 'Enviando...' : 'Enviar mensagem'}
              </button>
            </form>
          </div>
        </div>
      </section>
    </>
  )
}

export default Contato
