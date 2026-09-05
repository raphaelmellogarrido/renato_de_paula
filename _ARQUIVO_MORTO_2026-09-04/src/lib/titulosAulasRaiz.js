// Mapeamento fixo: nome do arquivo (como está em curso-meditacao-raiz) →
// título exibido na UI. Importado tanto pelo backend (server/index.js, pra
// montar o catálogo via GET /api/aulas-raiz) quanto, se necessário, pelo
// front — arquivo JS puro, sem JSX, então funciona nos dois contextos ESM.
export const TITULOS_AULAS_RAIZ = {
  "dia0.1.mp4": "Boas Vindas",
  "dia0.2.mp4": "Estrutura do Curso + Motivacional",
  "dia0.3.mp4": "Introdução (não pule!)",

  "dia1.1.mp4": "1a Meditação do dia",
  "dia1.2.mp4": "1o Mito: Meditação é pra relaxar?",
  "dia1.4.mp4": "2a Meditação do dia",

  "dia2.1.mp4": "1a Meditação (5 min)",
  "dia2.2.mp4": "2o Mito: É necessário parar de pensar?",
  "dia2.3.mp4": "2a Meditação (5 min)",

  "dia3.1.mp4": "1a Meditação do dia",
  "dia3.2.mp4": "3o Mito: O que é o ambiente perfeito para meditar?",
  "dia3.3.mp4": "2a Meditação (5 min)",

  "dia4.1.mp4": "1a Meditação (10 min)",
  "dia4.2.mp4": "4o Mito: É preciso me MANTER concentrado?",
  "dia4.3.mp4": "2a Meditação (10 min)",

  "dia5.1.mp4": "1a Meditação (10 min)",
  "dia5.2.mp4": "5o Mito: Tudo que me faz concentrar é meditação?",
  "dia5.3.mp4": "2a Meditação (10 min)",

  "dia6.1.mp4": "1a Meditação (10 min)",
  "dia6.2.mp4": "O exercício fundamental da meditação",
  "dia6.3.mp4": "2a Meditação (10 min)",

  "dia7.1.mp4": "1a Meditação (15 min)",
  "dia7.2.mp4": "Como lidar com o pensamento 'reentrante'(ruminativo)",
  "dia7.3.mp4": "2a Meditação (15 min)",

  "dia8.1.mp4": "1a Meditação (15 min)",
  "dia8.2.mp4": "Segredos do AMBIENTE meditativo",
  "dia8.3.mp4": "2a Meditação (15 min)",

  "dia9.1.mp4": "1a Meditação (15 min)",
  "dia9.2.mp4": "O que é a concentração verdadeira?",
  "dia9.3.mp4": "2a Meditação (15 min)",

  "dia10.1.mp4": "1a Meditação (20 min)",
  "dia10.2.mp4": "O poder do estímulo de baixa intensidade",
  "dia10.3.mp4": "2a Meditação (20 min)",

  "dia11.1.mp4": "1a Meditação (20 min)",
  "dia11.2.mp4": "Refinando a técnica",
  "dia11.3.mp4": "2a Meditação (20 min)",

  "dia12.1.mp4": "1a Meditação (20 min)",
  "dia12.2.mp4": "O tempo em meditação",
  "dia12.3.mp4": "2a Meditação (20 min)",

  "dia13.1.mp4": "1a Meditação (25 min)",
  "dia13.2.mp4": "Postura e posição",
  "dia13.3.mp4": "2a Meditação (25 min)",

  "dia14.1.mp4": "1a Meditação (25 min)",
  "dia14.2.mp4": "Onde meditar/onde não meditar",
  "dia14.3.mp4": "2a Meditação (25min)",

  "dia15.1.mp4": "1a Meditação (25 min)",
  "dia15.2.mp4": "Ciclos da mente + dias insuportáveis",
  "dia15.3.mp4": "2a Meditação (25 min)",
}

// Arquivos que devem sumir do catálogo mesmo que o .mp4 continue existindo
// em CURSO_RAIZ_DIR no servidor (vídeos são enviados direto por FTP na
// Hostinger, não vivem neste repo — não dá pra simplesmente apagar o
// arquivo por aqui). server/index.js pula qualquer arquivo desta lista ao
// montar o catálogo em GET /api/aulas-raiz.
export const ARQUIVOS_OCULTOS_AULAS_RAIZ = new Set([
  "dia1.3.mp4", // "2a Meditação do dia (parte 1)" — parte 2 (dia1.4.mp4) virou "2a Meditação do dia"
])
