import mysql from 'mysql2/promise'

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 5,
})

let tabelaPronta = false

async function garantirTabela() {
  if (tabelaPronta) return
  await pool.query(`
    CREATE TABLE IF NOT EXISTS inscricoes_meditacao (
      id INT AUTO_INCREMENT PRIMARY KEY,
      email VARCHAR(255) NOT NULL UNIQUE,
      telefone VARCHAR(30),
      criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `)
  // Cobre tabelas criadas antes da coluna telefone existir.
  try {
    await pool.query('ALTER TABLE inscricoes_meditacao ADD COLUMN telefone VARCHAR(30)')
  } catch (err) {
    if (err.code !== 'ER_DUP_FIELDNAME') throw err
  }
  tabelaPronta = true
}

export async function inserirInscricao(email, telefone) {
  await garantirTabela()
  await pool.query(
    'INSERT INTO inscricoes_meditacao (email, telefone) VALUES (?, ?) ON DUPLICATE KEY UPDATE telefone = VALUES(telefone)',
    [email, telefone || null]
  )
}

export async function listarInscricoes() {
  await garantirTabela()
  const [linhas] = await pool.query('SELECT email, telefone, criado_em FROM inscricoes_meditacao ORDER BY criado_em ASC')
  return linhas
}

export async function listarEmails() {
  const linhas = await listarInscricoes()
  return linhas.map((l) => l.email)
}

export async function contarInscricoes() {
  await garantirTabela()
  const [linhas] = await pool.query('SELECT COUNT(*) AS total FROM inscricoes_meditacao')
  return linhas[0].total
}
