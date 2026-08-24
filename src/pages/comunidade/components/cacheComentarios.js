// Cache leve (stale-while-revalidate) pras respostas de comentarios.php —
// usado por DificuldadeDoDia.jsx e ComentariosFeed.jsx pra pintar a lista
// IMEDIATAMENTE de uma visita anterior (<2min) em vez de deixar a área da
// lista em branco esperando o fetch. Mesmo padrão defensivo try/catch que
// usuarioStorage.js já usa pra localStorage (modo privado, quota cheia etc.
// não deve quebrar a página, só faz o cache virar no-op).
// Não é por-usuário de propósito: os dois feeds (DificuldadeDoDia com
// aula_id="dificuldade_do_dia", ComentariosFeed com aula_id="geral") são
// murais compartilhados entre todos os alunos, então o cache pode (e deve)
// ser compartilhado entre visitas do mesmo navegador, não por email.
const TTL_MS = 2 * 60 * 1000; // 2 minutos

export function chaveCacheComentarios(aulaId, page) {
  return `cm_comentarios_${aulaId}_p${page}`;
}

// Devolve os dados cacheados (mesma forma que o backend devolve: {itens,
// total, page, pages}) se existir e ainda estiver dentro do TTL, senão null.
export function lerCacheComentarios(chave) {
  try {
    const bruto = localStorage.getItem(chave);
    if (!bruto) return null;
    const { dados, quando } = JSON.parse(bruto);
    if (!dados || typeof quando !== "number") return null;
    if (Date.now() - quando > TTL_MS) return null;
    return dados;
  } catch {
    return null;
  }
}

export function salvarCacheComentarios(chave, dados) {
  try {
    localStorage.setItem(chave, JSON.stringify({ dados, quando: Date.now() }));
  } catch {
    // localStorage indisponível — ignora, o fetch normal continua sendo a
    // fonte de verdade, só perde o atalho de "pintar na hora".
  }
}
