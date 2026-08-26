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

// Apaga TODAS as páginas cacheadas de um mural (todas as chaves
// cm_comentarios_{aulaId}_p*) — usado depois de um DELETE bem-sucedido
// (ComentariosFeed.jsx) pra evitar que um refetch dentro do TTL de 2min
// pinte de novo, mesmo que brevemente, uma página cacheada que ainda inclui
// o comentário recém-excluído. DificuldadeDoDia.jsx não precisa disso: seu
// handleExcluir já ignora completamente o cache e busca direto do servidor
// (buscarPrimeiraPagina), sobrescrevendo o cache na sequência.
export function limparCacheComentarios(aulaId) {
  try {
    const prefixo = `cm_comentarios_${aulaId}_p`;
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const chave = localStorage.key(i);
      if (chave && chave.startsWith(prefixo)) localStorage.removeItem(chave);
    }
  } catch {
    // localStorage indisponível — nada pra limpar, mesmo espírito try/catch
    // do resto deste arquivo.
  }
}

async function tentarBuscarJson(url, options) {
  const r = await fetch(url, options);
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return await r.json(); // corpo não-JSON (ex: página de erro do PHP em vez de {erro:...}) também cai aqui
}

// Busca JSON em comentarios.php com 1 retry automático (800ms) se a resposta
// vier com status de erro ou corpo que não é JSON válido. Existe por causa
// de um 500 real na 1ª visita da sessão: o dashboard dispara ~4 fetches ao
// mesmo tempo e, antes do marcador de setup existir em _conexao.php, duas
// dessas requests podiam colidir dentro de garantirEstruturaClube() e derrubar
// a request com 500 — sem isso, DificuldadeDoDia.jsx/ComentariosFeed.jsx
// liam a resposta quebrada, caíam no .catch e mostravam "Seja o primeiro a
// comentar" pra um mural que já tinha comentários (só reaparecia com F5,
// quando a corrida já tinha sido resolvida pela request anterior). Quem
// chama decide o que fazer se as 2 tentativas falharem — ver os catch em
// DificuldadeDoDia.jsx/ComentariosFeed.jsx, que preservam o cache/skeleton
// em vez de zerar a lista.
export async function buscarComentarios(url, options) {
  try {
    return await tentarBuscarJson(url, options);
  } catch {
    await new Promise((resolve) => setTimeout(resolve, 800));
    return await tentarBuscarJson(url, options); // 2ª falha propaga pro .catch de quem chamou
  }
}
