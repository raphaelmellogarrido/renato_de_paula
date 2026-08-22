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
  // Identifica o evento nas reservas (ver components/reservasLive.js) — muda
  // junto se um dia este encontro virar outra data/horário.
  id: "aterramento-15-mai-7h",
  titulo: "Aterramento Matinal",
  quando: "Qui, 15 Mai · 7:00 - 7:30 (Brasília)",
  anfitriao: "com Dr. Renato",
  avatar: "https://i.pravatar.cc/100?img=12",
};

// Desafio da Semana: card da sidebar do dashboard (ver components/DesafioSemana.jsx).
// Pra trocar o conteúdo toda segunda-feira, só editar os 3 objetos abaixo —
// nada de código precisa mudar. O "concluído" de cada aluno não mora mais
// aqui: é estado real, salvo em localStorage + sincronizado com o PHP
// (mesmo padrão do progresso das aulas em AulasMeditacaoRaiz.jsx).
export const DESAFIO_SEMANA = {
  tituloWidget: "Desafios da semana",
  itens: [
    { id: "manha-sem-celular", titulo: "Uma manhã sem celular", subtitulo: "5 min ao acordar sem pegar no celular" },
    { id: "respiracao-consciente", titulo: "Respiração consciente", subtitulo: "3 respirações profundas antes do almoço" },
    { id: "escuta-atenta", titulo: "Escuta atenta", subtitulo: "Ouça alguém por 2 min sem interromper hoje" },
  ],
};

// Ranking de Presença zerado pra teste (ver components/ColunaEncontros.jsx):
// mostra só o usuário atual, com os dias vindos do streak real do botão
// "Meditei hoje" (localStorage "meditacaoHoje_streak") — sem mocks de
// outros alunos.

// SEQUENCIA (mock) foi removido: o card "Sequência" agora é 100% funcional,
// calculado em components/useSequenciaMeditacao.js a partir do histórico
// real de "Meditei hoje" (ver components/Sequencia.jsx).

export const PROGRESSO_SEMANA = {
  resumo: "Você meditou 4h18 esta semana",
  minutosFeitos: 258,
  metaMinutos: 360,
};

// Chips de filtro da Biblioteca de Meditações — linguagem humana (não
// clínica) combinada de propósito com `tag` de cada item de
// VIDEOS_BIBLIOTECA (ver Dashboard.jsx). `categoria` (dentro de
// cada vídeo) é o rótulo clínico curto que aparece no badge sobre a foto —
// as duas coisas divergem por design: o chip de filtro fala como gente, o
// badge da capa continua objetivo.
export const FILTROS = ["Todas", "Quando aperta", "Pra dormir", "Pra focar"];

// "Biblioteca de Meditações" — grid de exatamente 3 vídeos, dimensionada de
// propósito para preencher a área "biblioteca" (coluna 1 + coluna 2) da
// última linha do dashboard sem sobrar espaço em branco (ver
// ComunidadeApp.css: `grid-template-areas`). `src` é placeholder (arquivo
// ainda não existe) — troca antes do lançamento público, mesmo espírito dos
// vídeos placeholder dos Dias 1-15. Fotos de capa: 3 fotos reais do Dr.
// Renato (public/meditacoes/, copiadas dos originais em public/ com nomes
// ASCII pra evitar problemas de encoding de URL) — grading unificado
// (warm tint + overlay preto) fica todo em CSS, ver
// `.cm-card-biblioteca-capa` em ComunidadeApp.css. `posicaoFoto` ajusta o
// enquadramento do crop 4:3 pra manter o rosto visível em cada foto
// (as 3 são retrato, o card é paisagem).
export const VIDEOS_BIBLIOTECA = [
  {
    id: "bib-ansiedade",
    titulo: "SOS Ansiedade - Respiração pra voltar",
    categoria: "Ansiedade",
    tag: "Quando aperta",
    frase: "Quando o peito aperta",
    duracao: "12min",
    src: "/videos/ansiedade.mp4",
    imagem: "/meditacoes/sos-ansiedade.jpg",
    posicaoFoto: "center 15%",
  },
  {
    id: "bib-sono",
    titulo: "Ritual da Noite - Sono Profundo",
    categoria: "Sono",
    tag: "Pra dormir",
    frase: "Quando o sono não vem",
    duracao: "18min",
    src: "/videos/sono.mp4",
    imagem: "/meditacoes/ritual-noite.jpg",
    posicaoFoto: "center 35%",
  },
  {
    id: "bib-foco",
    titulo: "Voltar ao Foco - Manhã sem neblina",
    categoria: "Foco",
    tag: "Pra focar",
    frase: "Quando a manhã não decola",
    duracao: "10min",
    src: "/videos/foco.mp4",
    imagem: "/meditacoes/foco-manha.jpg",
    posicaoFoto: "center 15%",
  },
];

// Feed da comunidade (Clube Presença) — 100% real agora, vem de
// GET /api/comunidade/posts (ver components/FeedComunidade.jsx). Removido
// o mock fixo que sempre mostrava os mesmos 4 posts fake pra todo mundo.
