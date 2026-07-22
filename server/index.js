import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import nodemailer from 'nodemailer'

const app = express()
app.use(cors())
app.use(express.json())

const PORT = process.env.PORT || 3001
const TO_EMAIL = process.env.TO_EMAIL || 'contacto@codigoecafe.com'

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: Number(process.env.SMTP_PORT) === 465,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

app.post('/api/contact', async (req, res) => {
  const { nome, email, telefone, assunto, mensagem } = req.body || {}

  if (!nome || !email || !assunto || !mensagem) {
    return res.status(400).json({ error: 'Campos obrigatórios faltando.' })
  }

  try {
    await transporter.sendMail({
      from: `"Site Dr. Renato" <${process.env.SMTP_USER}>`,
      to: TO_EMAIL,
      replyTo: email,
      subject: `[Contato do site] ${assunto}`,
      text: `Nome: ${nome}\nEmail: ${email}\nTelefone: ${telefone || '-'}\nAssunto: ${assunto}\n\nMensagem:\n${mensagem}`,
      html: `
        <h2>Nova mensagem pelo site</h2>
        <p><strong>Nome:</strong> ${nome}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Telefone:</strong> ${telefone || '-'}</p>
        <p><strong>Assunto:</strong> ${assunto}</p>
        <p><strong>Mensagem:</strong></p>
        <p>${String(mensagem).replace(/\n/g, '<br>')}</p>
      `,
    })

    res.json({ ok: true })
  } catch (err) {
    console.error('Erro ao enviar email:', err)
    res.status(500).json({ error: 'Falha ao enviar a mensagem. Tente novamente mais tarde.' })
  }
})

app.listen(PORT, () => {
  console.log(`Servidor de contato rodando em http://localhost:${PORT}`)
})
