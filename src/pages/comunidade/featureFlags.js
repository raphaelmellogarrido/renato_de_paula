// Flags de lançamento da comunidade (Clube Presença). Fase 1: só liga/desliga
// comportamento de UI com dados mockados — nada aqui persiste em backend.

// true = durante o beta, todo aluno do curso anual vira "Membro Fundador"
// da comunidade de graça (usado pra popular o produto novo antes do
// lançamento público).
export const COMMUNITY_BETA_ENABLED = true;

// false = quem não é aluno do curso vê a comunidade como "Em Construção"
// com lista de espera. Quando virar true, todo mundo entra.
export const COMMUNITY_PUBLIC_LAUNCH = false;

// Regra única de acesso — usada tanto no Dashboard (feed) quanto em
// qualquer outro lugar que precise decidir se libera a comunidade.
export function temAcessoComunidade(session) {
  if (COMMUNITY_PUBLIC_LAUNCH) return true;
  return COMMUNITY_BETA_ENABLED && !!session?.isAlunoCurso;
}
