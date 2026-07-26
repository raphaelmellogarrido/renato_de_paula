import 'dotenv/config'
import path from 'node:path'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'
import express from 'express'
import cors from 'cors'
import nodemailer from 'nodemailer'
import { inserirInscricao, listarEmails, contarInscricoes } from './db.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DIST_DIR = path.join(__dirname, '..', 'dist')
// Vídeos grandes (>100MB) ficam fora do Git e do build (dist/ é apagado a
// cada `npm run build`). Servidos à parte para sobreviver a novos deploys.
const VIDEOS_DIR = process.env.VIDEOS_DIR || path.join(__dirname, 'videos')

console.log('--- Diagnóstico VIDEOS_DIR ---')
console.log('VIDEOS_DIR (env):', JSON.stringify(process.env.VIDEOS_DIR))
console.log('VIDEOS_DIR (resolvido):', VIDEOS_DIR)
try {
  const arquivos = fs.readdirSync(VIDEOS_DIR)
  console.log('Conteúdo da pasta:', arquivos)
} catch (err) {
  console.error('Não foi possível ler VIDEOS_DIR:', err.message)
}

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

// Caixa separada para os emails da Meditação (boas-vindas + disparo em
// massa), mantendo contato@ só para o formulário de contato.
const marketingTransporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: Number(process.env.SMTP_PORT) === 465,
  auth: {
    user: process.env.MARKETING_SMTP_USER,
    pass: process.env.MARKETING_SMTP_PASS,
  },
})

// Diagnóstico temporário: usa JSON.stringify para revelar caracteres
// invisíveis (espaço, quebra de linha, etc.) que não aparecem num log
// normal. Remover depois que o problema de autenticação for resolvido.
function inspecionar(valor) {
  if (!valor) return 'undefined/vazio'
  const codigos = [...valor].map((c) => c.charCodeAt(0))
  return `${JSON.stringify(valor)} — tamanho: ${valor.length} — códigos: [${codigos.join(', ')}]`
}

console.log('--- Diagnóstico SMTP ---')
console.log('SMTP_HOST:', JSON.stringify(process.env.SMTP_HOST))
console.log('SMTP_PORT:', JSON.stringify(process.env.SMTP_PORT))
console.log('SMTP_USER:', JSON.stringify(process.env.SMTP_USER))
console.log('SMTP_PASS:', inspecionar(process.env.SMTP_PASS))
console.log('MARKETING_SMTP_PASS:', inspecionar(process.env.MARKETING_SMTP_PASS))
console.log('SMTP_PASS length:', (process.env.SMTP_PASS || '').length, '(esperado: 10)')
console.log('MARKETING_SMTP_USER:', JSON.stringify(process.env.MARKETING_SMTP_USER))
console.log('MARKETING_SMTP_PASS length:', (process.env.MARKETING_SMTP_PASS || '').length, '(esperado: 10)')

transporter.verify((err) => {
  if (err) console.error('Verificação SMTP (contato) falhou:', err.message)
  else console.log('Verificação SMTP (contato): OK')
})
marketingTransporter.verify((err) => {
  if (err) console.error('Verificação SMTP (marketing) falhou:', err.message)
  else console.log('Verificação SMTP (marketing): OK')
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

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

app.post('/api/meditacao/inscrever', async (req, res) => {
  const { email } = req.body || {}

  if (!email || !EMAIL_REGEX.test(email)) {
    return res.status(400).json({ error: 'Informe um email válido.' })
  }

  const emailNormalizado = email.trim().toLowerCase()

  try {
    await inserirInscricao(emailNormalizado)
    res.json({ ok: true })
  } catch (err) {
    console.error('Erro ao salvar inscrição:', err)
    return res.status(500).json({ error: 'Não foi possível salvar seu email. Tente novamente.' })
  }

  // Email de boas-vindas — não bloqueia a resposta nem falha o cadastro
  // caso o envio dê problema (o cadastro em si já foi salvo com sucesso).
  try {
    await marketingTransporter.sendMail({
      from: `"Dr. Renato de Paula" <${process.env.MARKETING_SMTP_USER}>`,
      to: emailNormalizado,
      subject: 'Seu cadastro foi confirmado — bem-vindo(a)!',
      html: `
        <p>Olá,</p>
        <p>Fico feliz em saber que você deu esse primeiro passo. Começar a meditar é simples, mas nem sempre fácil — e o fato de você estar aqui já diz muito sobre o cuidado que você tem com a sua própria mente.</p>
        <p>Seu cadastro foi confirmado com sucesso. A partir de agora, é só aguardar: assim que uma nova live de meditação for marcada, você será um dos primeiros a saber, com data, horário e link de acesso direto no seu email.</p>
        <p>Enquanto isso, as aulas gravadas já estão liberadas para você em <a href="https://renatodepaula.com/meditacao">renatodepaula.com/meditacao</a>.</p>
        <p>Até breve,<br>Dr. Renato Silva de Paula</p>
      `,
    })
  } catch (err) {
    console.error('Erro ao enviar email de boas-vindas:', err)
  }
})

// Rota protegida: dispara um email para todos os inscritos na lista de meditação.
// Uso: POST com { secret, assunto, mensagem } no corpo, secret = ADMIN_SECRET do .env.
app.post('/api/meditacao/enviar', async (req, res) => {
  const { secret, assunto, mensagem } = req.body || {}

  if (!process.env.ADMIN_SECRET || secret !== process.env.ADMIN_SECRET) {
    return res.status(401).json({ error: 'Não autorizado.' })
  }
  if (!assunto || !mensagem) {
    return res.status(400).json({ error: 'Assunto e mensagem são obrigatórios.' })
  }

  try {
    const emails = await listarEmails()
    if (emails.length === 0) {
      return res.json({ ok: true, enviados: 0 })
    }

    await marketingTransporter.sendMail({
      from: `"Dr. Renato de Paula" <${process.env.MARKETING_SMTP_USER}>`,
      to: process.env.MARKETING_SMTP_USER,
      bcc: emails,
      subject: assunto,
      html: String(mensagem).replace(/\n/g, '<br>'),
    })

    res.json({ ok: true, enviados: emails.length })
  } catch (err) {
    console.error('Erro ao enviar broadcast:', err)
    res.status(500).json({ error: 'Falha ao enviar os emails.' })
  }
})

app.get('/api/meditacao/contagem', async (req, res) => {
  try {
    const total = await contarInscricoes()
    res.json({ total })
  } catch (err) {
    console.error('Erro ao consultar inscrições:', err)
    res.status(500).json({ error: 'Falha ao consultar.' })
  }
})

app.use('/videos', express.static(VIDEOS_DIR))

app.use(express.static(DIST_DIR))

app.get('/*splat', (req, res) => {
  res.sendFile(path.join(DIST_DIR, 'index.html'))
})

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`)
})
