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
      criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `)
  tabelaPronta = true
}

export async function inserirInscricao(email) {
  await garantirTabela()
  await pool.query('INSERT IGNORE INTO inscricoes_meditacao (email) VALUES (?)', [email])
}

export async function listarEmails() {
  await garantirTabela()
  const [linhas] = await pool.query('SELECT email FROM inscricoes_meditacao ORDER BY criado_em ASC')
  return linhas.map((l) => l.email)
}

export async function contarInscricoes() {
  await garantirTabela()
  const [linhas] = await pool.query('SELECT COUNT(*) AS total FROM inscricoes_meditacao')
  return linhas[0].total
}
