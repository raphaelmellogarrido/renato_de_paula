// Dados mockados da Fase 1 (só UI) — sem backend, sem persistência real.
// Estrutura espelha os prints do Hotmart Club: 16 dias (Dia 0 a Dia 15),
// 48 conteúdos no total (3 vídeos por dia), Dia 0 com os 3 vídeos reais
// informados pelo cliente. Os demais dias usam vídeos placeholder até os
// arquivos definitivos serem enviados.

export const CURSO = {
  titulo: "Meditação Raiz",
  subtitulo: "Construa em 15 dias uma rotina de meditação",
  totalConteudos: 48,
};

// Cada vídeo carrega uma "tag" temática (usada nos cards com imagem da
// biblioteca) — não são categorias reais do curso, só uma forma visual de
// diferenciar os 3 tipos de conteúdo de cada dia, no espírito lúdico da
// referência (Ansiedade/Sono/Foco).
function diaPlaceholder(numero) {
  return [
    {
      id: `dia-${numero}-guiada`,
      titulo: `Meditação guiada — Dia ${numero}`,
      duracao: "10:00",
      src: `/videos/comunidade/dia-${numero}-guiada.mp4`,
      tag: "Guiada",
    },
    {
      id: `dia-${numero}-reflexao`,
      titulo: "Reflexão do dia",
      duracao: "03:15",
      src: `/videos/comunidade/dia-${numero}-reflexao.mp4`,
      tag: "Reflexão",
    },
    {
      id: `dia-${numero}-pratica`,
      titulo: "Prática respiratória",
      duracao: "05:40",
      src: `/videos/comunidade/dia-${numero}-pratica.mp4`,
      tag: "Respiração",
    },
  ];
}

export const DIAS = [
  {
    id: "dia-0",
    numero: 0,
    titulo: "Dia 0",
    progresso: 0,
    videos: [
      { id: "boas-vindas", titulo: "Boas Vindas", duracao: "04:30", src: "/videos/comunidade/dia-0-boas-vindas.mp4", tag: "Boas-vindas" },
      { id: "estrutura", titulo: "Estrutura do Curso + Motivacional", duracao: "05:24", src: "/videos/comunidade/dia-0-estrutura.mp4", tag: "Metodologia" },
      { id: "introducao", titulo: "Introdução (não pule!)", duracao: "08:49", src: "/videos/comunidade/dia-0-introducao.mp4", tag: "Fundamentos" },
    ],
  },
  ...Array.from({ length: 15 }, (_, i) => {
    const numero = i + 1;
    return {
      id: `dia-${numero}`,
      numero,
      titulo: `Dia ${numero}`,
      progresso: 0,
      videos: diaPlaceholder(numero),
    };
  }),
];

// `isAlunoCurso` decide se a pessoa é aluna do curso anual (Hotmart) — usado
// pela regra de negócio do Clube Presença: aluno do curso = "Membro
// Fundador" da comunidade de graça durante o beta (ver featureFlags.js).
// O segundo usuário (sem curso) existe só pra dar pra testar visualmente o
// estado bloqueado ("Em Construção") sem precisar mexer em código.
export const MOCK_USUARIOS = [
  { email: "teste@meditacaoraiz.com", nome: "Aluno Teste", expiraEm: "2027-08-20", isAlunoCurso: true },
  { email: "visitante@meditacaoraiz.com", nome: "Visitante Teste", expiraEm: "2027-08-20", isAlunoCurso: false },
];

export const COMENTARIOS = [
  { id: 1, autor: "Marina Alves", texto: "Comecei ontem e já sinto diferença na ansiedade! Obrigada pelo curso.", quandoAtras: "2 dias atrás" },
  { id: 2, autor: "João Pedro Lima", texto: "A explicação do Dia 0 foi ótima, deixou tudo bem claro antes de começar.", quandoAtras: "3 dias atrás" },
  { id: 3, autor: "Beatriz Santos", texto: "Alguém mais sentiu sono durante a prática? É normal no começo?", quandoAtras: "5 dias atrás" },
  { id: 4, autor: "Ricardo Nunes", texto: "Terceira vez que tento criar o hábito e essa é a primeira vez que sinto que vou conseguir.", quandoAtras: "1 semana atrás" },
  { id: 5, autor: "Fernanda Costa", texto: "O áudio de reflexão complementa muito bem o vídeo principal.", quandoAtras: "1 semana atrás" },
];

export const EVENTOS = [
  { id: 1, titulo: "Live de perguntas e respostas", quando: "Qui, 28 de agosto · 19h" },
  { id: 2, titulo: "Roda de meditação em grupo", quando: "Dom, 31 de agosto · 09h" },
];

// Widget "Próximo encontro ao vivo" da sidebar — um card único em destaque
// (substitui a lista de EVENTOS ali), com CTA de reserva decorativo. Avatar
// via pravatar.cc (placeholder fake, mesmo espírito dos hotlinks do Unsplash
// já usados na Biblioteca — trocar por foto real do Dr. Renato antes do
// lançamento público).
export const PROXIMO_ENCONTRO_VIVO = {
  titulo: "Aterramento Matinal",
  quando: "Qui, 15 Mai · 7:00 - 7:30 (Brasília)",
  anfitriao: "com Dr. Renato",
  avatar: "https://i.pravatar.cc/100?img=12",
};

export const DESAFIO_SEMANA = {
  tituloWidget: "Desafio de Maio",
  titulo: "Presença Consciente — 21 dias",
  itens: [
    { id: 1, titulo: "Manhã sem celular", subtitulo: "5 min ao acordar", concluido: true },
    { id: 2, titulo: "Respiração 4-4-6", subtitulo: "Antes de dormir", concluido: true },
    { id: 3, titulo: "Escuta atenta", subtitulo: "Em uma conversa hoje", concluido: false },
  ],
  participantes: 128,
};

export const RANKING = [
  { posicao: 1, nome: "Você", diasSeguidos: 7 },
  { posicao: 2, nome: "Marina Alves", diasSeguidos: 12 },
  { posicao: 3, nome: "Rafael Lima", diasSeguidos: 10 },
  { posicao: 4, nome: "Clara Mendes", diasSeguidos: 9 },
];

// Sequência de dias seguidos meditando — mostrada como 7 bolinhas (Seg a
// Dom) na sidebar direita, igual à referência.
export const SEQUENCIA = {
  diasSeguidos: 7,
  percentualConsistencia: 12,
  semana: [
    { label: "S", concluido: true },
    { label: "T", concluido: true },
    { label: "Q", concluido: true },
    { label: "Q", concluido: true },
    { label: "S", concluido: true },
    { label: "S", concluido: true },
    { label: "D", concluido: true },
  ],
};

export const PROGRESSO_SEMANA = {
  resumo: "Você meditou 4h18 esta semana",
  minutosFeitos: 258,
  metaMinutos: 360,
};

// Chips de filtro da Biblioteca de Meditações — cruzam com a tag de cada
// item de VIDEOS_BIBLIOTECA (ver ComunidadeTopBar/Dashboard).
export const FILTROS = ["Todas", "Ansiedade", "Sono", "Foco"];

// "Biblioteca de Meditações" — grid de exatamente 3 vídeos, dimensionada de
// propósito para preencher a área "biblioteca" (coluna 1 + coluna 2) da
// última linha do dashboard sem sobrar espaço em branco (ver
// ComunidadeApp.css: `grid-template-areas`). `src` é placeholder (arquivo
// ainda não existe) — troca antes do lançamento público, mesmo espírito dos
// vídeos placeholder dos Dias 1-15. Fotos de capa via Unsplash (hotlink
// direto, URLs validadas) — trocar por assets próprios/licenciados antes do
// lançamento público.
export const VIDEOS_BIBLIOTECA = [
  {
    id: "bib-ansiedade",
    titulo: "Respiração para Ansiedade",
    tag: "Ansiedade",
    duracao: "12min",
    nivel: "Iniciante",
    praticas: "2.4k",
    src: "/videos/ansiedade.mp4",
    imagem: "https://images.unsplash.com/photo-1493836512294-502baa1986e2?auto=format&fit=crop&w=800&q=60",
  },
  {
    id: "bib-sono",
    titulo: "Sono Profundo",
    tag: "Sono",
    duracao: "18min",
    nivel: "Iniciante",
    praticas: "3.1k",
    src: "/videos/sono.mp4",
    imagem: "https://images.unsplash.com/photo-1495360010541-f48722b34f7d?auto=format&fit=crop&w=800&q=60",
  },
  {
    id: "bib-foco",
    titulo: "Foco Matinal",
    tag: "Foco",
    duracao: "10min",
    nivel: "Iniciante",
    praticas: "1.6k",
    src: "/videos/foco.mp4",
    imagem: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=800&q=60",
  },
];

// Feed da comunidade (Clube Presença) — mural fake, mostrado só para quem
// tem acesso liberado (ver featureFlags.js / temAcessoComunidade).
export const FEED_COMUNIDADE = [
  {
    id: 1,
    autor: "Dr. Renato de Paula",
    quando: "Hoje",
    texto: "Bem-vindos ao Clube Presença! Esse é o espaço da nossa comunidade — lives semanais, encontros guiados e trocas entre quem está construindo o hábito da meditação. Comecem se apresentando aqui 🌿",
    curtidas: 34,
  },
  {
    id: 2,
    autor: "Marina Alves",
    quando: "3h atrás",
    texto: "Primeira live foi incrível, já ficou marcado na agenda pra próxima semana!",
    curtidas: 12,
  },
  {
    id: 3,
    autor: "Rafael Lima",
    quando: "1 dia atrás",
    texto: "Alguém mais topa um encontro de meditação em grupo pela manhã, além do oficial?",
    curtidas: 8,
  },
  {
    id: 4,
    autor: "Clara Mendes",
    quando: "2 dias atrás",
    texto: "O encontro de aterramento de quinta mudou minha semana. Recomendo demais.",
    curtidas: 21,
  },
];
