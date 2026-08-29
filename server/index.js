import "dotenv/config";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import express from "express";
import cors from "cors";
import nodemailer from "nodemailer";
import { inserirInscricao, listarEmails, listarInscricoes, contarInscricoes, excluirInscricao, registrarEnvio, listarHistorico } from "./db.js";
import { TITULOS_AULAS_RAIZ, ARQUIVOS_OCULTOS_AULAS_RAIZ } from "../src/lib/titulosAulasRaiz.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST_DIR = path.join(__dirname, "..", "dist");
// Vídeos grandes (>100MB) ficam fora do Git e do build (dist/ é apagado a
// cada `npm run build`). Servidos à parte para sobreviver a novos deploys.
const VIDEOS_DIR = process.env.VIDEOS_DIR || path.join(__dirname, "videos");
// Mesmo padrão do VIDEOS_DIR acima: os 49 vídeos do curso Meditação Raiz
// ficam numa pasta fora do Git e fora da pasta do app (em produção,
// CURSO_RAIZ_DIR aponta pra /home/.../domains/renatodepaula.com/curso-meditacao-raiz,
// ao lado de public_html — ver HANDOFF.md).
const CURSO_RAIZ_DIR = process.env.CURSO_RAIZ_DIR || path.join(__dirname, "curso-meditacao-raiz");

try {
  fs.readdirSync(VIDEOS_DIR);
} catch (err) {
  console.error("Não foi possível ler VIDEOS_DIR:", err.message);
}

try {
  fs.readdirSync(CURSO_RAIZ_DIR);
} catch (err) {
  console.error("Não foi possível ler CURSO_RAIZ_DIR:", err.message);
}

const app = express();
app.use(cors());
app.use(express.json());

// Health check - usado pelo cron pra nunca hibernar
app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "ok", uptime: process.uptime() });
});

const PORT = process.env.PORT || 3001;
const TO_EMAIL = process.env.TO_EMAIL || "contacto@codigoecafe.com";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: Number(process.env.SMTP_PORT) === 465,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

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
});

transporter.verify((err) => {
  if (err) console.error("Verificação SMTP (contato) falhou:", err.message);
  else console.log("Verificação SMTP (contato): OK");
});
marketingTransporter.verify((err) => {
  if (err) console.error("Verificação SMTP (marketing) falhou:", err.message);
  else console.log("Verificação SMTP (marketing): OK");
});

app.post("/api/contact", async (req, res) => {
  const { nome, email, telefone, assunto, mensagem } = req.body || {};

  if (!nome || !email || !assunto || !mensagem) {
    return res.status(400).json({ error: "Campos obrigatórios faltando." });
  }

  try {
    await transporter.sendMail({
      from: `"Site Dr. Renato" <${process.env.SMTP_USER}>`,
      to: TO_EMAIL,
      replyTo: email,
      subject: `[Contato do site] ${assunto}`,
      text: `Nome: ${nome}\nEmail: ${email}\nTelefone: ${telefone || "-"}\nAssunto: ${assunto}\n\nMensagem:\n${mensagem}`,
      html: `
        <h2>Nova mensagem pelo site</h2>
        <p><strong>Nome:</strong> ${nome}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Telefone:</strong> ${telefone || "-"}</p>
        <p><strong>Assunto:</strong> ${assunto}</p>
        <p><strong>Mensagem:</strong></p>
        <p>${String(mensagem).replace(/\n/g, "<br>")}</p>
      `,
    });

    res.json({ ok: true });
  } catch (err) {
    console.error("Erro ao enviar email:", err);
    res.status(500).json({ error: "Falha ao enviar a mensagem. Tente novamente mais tarde." });
  }
});

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

app.post("/api/meditacao/inscrever", async (req, res) => {
  const { email, telefone } = req.body || {};

  if (!email || !EMAIL_REGEX.test(email)) {
    return res.status(400).json({ error: "Informe um email válido." });
  }

  const emailNormalizado = email.trim().toLowerCase();

  try {
    await inserirInscricao(emailNormalizado, telefone ? telefone.trim() : null);
    res.json({ ok: true });
  } catch (err) {
    console.error("Erro ao salvar inscrição:", err);
    return res.status(500).json({ error: "Não foi possível salvar seu email. Tente novamente." });
  }

  // Email de boas-vindas — não bloqueia a resposta nem falha o cadastro
  // caso o envio dê problema (o cadastro em si já foi salvo com sucesso).
  try {
    await marketingTransporter.sendMail({
      from: `"Dr. Renato de Paula" <${process.env.MARKETING_SMTP_USER}>`,
      to: emailNormalizado,
      subject: "Seu cadastro foi confirmado — bem-vindo(a)!",
      html: `
        <p>Olá,</p>
        <p>Fico feliz em saber que você deu esse primeiro passo. Começar a meditar é simples, mas nem sempre fácil — e o fato de você estar aqui já diz muito sobre o cuidado que você tem com a sua própria mente.</p>
        <p>Seu cadastro foi confirmado com sucesso. A partir de agora, é só aguardar: assim que uma nova live de meditação for marcada, você será um dos primeiros a saber, com data, horário e link de acesso direto no seu email.</p>
        <p>Enquanto isso, as aulas gravadas já estão liberadas para você em <a href="https://renatodepaula.com/mitos">renatodepaula.com/mitos</a>.</p>
        <p>Até breve,<br>Dr. Renato Silva de Paula</p>
      `,
    });
  } catch (err) {
    console.error("Erro ao enviar email de boas-vindas:", err);
  }
});

// Rota protegida: dispara um email para todos os inscritos na lista de meditação.
// Uso: POST com { secret, assunto, mensagem } no corpo, secret = ADMIN_SECRET do .env.
app.post("/api/meditacao/enviar", async (req, res) => {
  const { secret, assunto, mensagem } = req.body || {};

  if (!process.env.ADMIN_SECRET || secret !== process.env.ADMIN_SECRET) {
    return res.status(401).json({ error: "Não autorizado." });
  }
  if (!assunto || !mensagem) {
    return res.status(400).json({ error: "Assunto e mensagem são obrigatórios." });
  }

  try {
    const emails = await listarEmails();
    if (emails.length === 0) {
      return res.json({ ok: true, enviados: 0 });
    }

    await marketingTransporter.sendMail({
      from: `"Dr. Renato de Paula" <${process.env.MARKETING_SMTP_USER}>`,
      to: process.env.MARKETING_SMTP_USER,
      bcc: emails,
      subject: assunto,
      html: String(mensagem).replace(/\n/g, "<br>"),
    });

    await registrarEnvio(assunto, mensagem, emails.length);

    res.json({ ok: true, enviados: emails.length });
  } catch (err) {
    console.error("Erro ao enviar broadcast:", err);
    res.status(500).json({ error: "Falha ao enviar os emails." });
  }
});

// Rota protegida: lista email + telefone + data de cadastro de todos os inscritos.
// Uso: POST com { secret } no corpo, secret = ADMIN_SECRET do .env.
app.post("/api/meditacao/listar", async (req, res) => {
  const { secret } = req.body || {};

  if (!process.env.ADMIN_SECRET || secret !== process.env.ADMIN_SECRET) {
    return res.status(401).json({ error: "Não autorizado." });
  }

  try {
    const inscricoes = await listarInscricoes();
    res.json({ inscricoes });
  } catch (err) {
    console.error("Erro ao listar inscrições:", err);
    res.status(500).json({ error: "Falha ao consultar." });
  }
});

// Rota protegida: remove um inscrito (não recebe mais nenhum email).
// Uso: POST com { secret, email } no corpo, secret = ADMIN_SECRET do .env.
app.post("/api/meditacao/excluir", async (req, res) => {
  const { secret, email } = req.body || {};

  if (!process.env.ADMIN_SECRET || secret !== process.env.ADMIN_SECRET) {
    return res.status(401).json({ error: "Não autorizado." });
  }
  if (!email) {
    return res.status(400).json({ error: "Informe o email a remover." });
  }

  try {
    await excluirInscricao(email);
    res.json({ ok: true });
  } catch (err) {
    console.error("Erro ao excluir inscrição:", err);
    res.status(500).json({ error: "Falha ao excluir." });
  }
});

// Rota protegida: histórico de mensagens em massa já enviadas.
// Uso: POST com { secret } no corpo, secret = ADMIN_SECRET do .env.
app.post("/api/meditacao/historico", async (req, res) => {
  const { secret } = req.body || {};

  if (!process.env.ADMIN_SECRET || secret !== process.env.ADMIN_SECRET) {
    return res.status(401).json({ error: "Não autorizado." });
  }

  try {
    const historico = await listarHistorico();
    res.json({ historico });
  } catch (err) {
    console.error("Erro ao listar histórico:", err);
    res.status(500).json({ error: "Falha ao consultar." });
  }
});

app.get("/api/meditacao/contagem", async (req, res) => {
  try {
    const total = await contarInscricoes();
    res.json({ total });
  } catch (err) {
    console.error("Erro ao consultar inscrições:", err);
    res.status(500).json({ error: "Falha ao consultar." });
  }
});

app.use("/videos", express.static(VIDEOS_DIR));
app.use("/curso-meditacao-raiz", express.static(CURSO_RAIZ_DIR));

// Catálogo do curso Meditação Raiz: monta a lista de dias/vídeos direto do
// que existe em CURSO_RAIZ_DIR (nada de cadastro manual em banco) — o nome
// do arquivo (ex: "dia1.2.mp4") é a única fonte de verdade sobre o que
// existe, a ordem e o dia; o título vem do mapa fixo em titulosAulasRaiz.js.
const REGEX_ARQUIVO_AULA_RAIZ = /^dia(\d+)\.(\d+)\.mp4$/i;

app.get("/api/aulas-raiz", (req, res) => {
  let arquivos;
  try {
    arquivos = fs.readdirSync(CURSO_RAIZ_DIR);
  } catch (err) {
    console.error("Erro ao listar CURSO_RAIZ_DIR:", err.message);
    return res.status(500).json({ error: "Não foi possível carregar as aulas." });
  }

  const porDia = new Map();

  for (const arquivo of arquivos) {
    if (ARQUIVOS_OCULTOS_AULAS_RAIZ.has(arquivo)) continue;
    const match = arquivo.match(REGEX_ARQUIVO_AULA_RAIZ);
    if (!match) continue;
    const diaNumero = Number(match[1]);
    const ordem = Number(match[2]);
    if (!porDia.has(diaNumero)) porDia.set(diaNumero, []);
    porDia.get(diaNumero).push({
      arquivo,
      ordem,
      titulo: TITULOS_AULAS_RAIZ[arquivo] || arquivo,
      url: `/curso-meditacao-raiz/${arquivo}`,
    });
  }

  const dias = Array.from(porDia.entries())
    .sort(([diaA], [diaB]) => diaA - diaB)
    .map(([diaNumero, videos]) => ({
      dia: diaNumero,
      titulo: `Dia ${diaNumero}`,
      videos: videos.sort((a, b) => a.ordem - b.ordem),
    }));

  res.json({ dias });
});

// Assets do build (dist/assets/...) têm hash no nome — mudam de nome quando
// o conteúdo muda, então podem ser cacheados "para sempre". index.html (e
// arquivos soltos da pasta public/, como robots.txt) não têm hash e são
// pequenos, então ficam com cache curto pra sempre pegar a versão atual.
app.use(
  express.static(DIST_DIR, {
    setHeaders: (res, filePath) => {
      if (filePath.endsWith("index.html")) {
        res.setHeader("Cache-Control", "no-cache");
      } else if (filePath.includes(`${path.sep}assets${path.sep}`)) {
        res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
      } else {
        res.setHeader("Cache-Control", "public, max-age=3600");
      }
    },
  }),
);

// Fallback do SPA: usa app.use sem path (em vez de um padrão coringa tipo
// '/*splat') porque isso depende da versão exata do path-to-regexp/Express
// instalada — em produção esse padrão não estava casando com nada e todas
// as rotas do React (exceto "/") caíam num 404. app.use sem path casa
// qualquer requisição não tratada antes, sem ambiguidade de sintaxe.
//
// Usa fs.readFileSync + res.send em vez de res.sendFile: no ambiente da
// Hostinger, res.sendFile (biblioteca `send`) lançava "NotFoundError" mesmo
// com o arquivo existindo (confirmado via fs.existsSync). Lendo o arquivo
// direto com fs puro evita esse mecanismo problemático.
const INDEX_HTML_PATH = path.join(DIST_DIR, "index.html");
let indexHtml;
try {
  indexHtml = fs.readFileSync(INDEX_HTML_PATH, "utf-8");
  console.log("index.html carregado em memória, tamanho:", indexHtml.length);
} catch (err) {
  console.error("Não foi possível ler index.html:", err.message);
}

app.use((req, res) => {
  if (indexHtml) {
    res.type("html").send(indexHtml);
  } else {
    res.status(500).send("index.html não encontrado no servidor.");
  }
});

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
