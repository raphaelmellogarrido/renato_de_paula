// Regra de acesso à Comunidade (Clube Presença). Produto virou um bundle
// único pago (curso + comunidade, R$49,90/mês) — não existe mais curso
// avulso grátis. A única trava real que existe hoje é o login
// (`alunos.status='ativo'`, ver public/api/hotmart/login.php): quem
// consegue logar já comprou o curso antigo na Hotmart, então já é, na
// prática, um dos primeiros membros do produto novo. Por isso qualquer
// sessão autenticada libera a Comunidade — não existe mais a flag de beta
// (`isAlunoCurso`) que nunca era setada pela sessão real e deixava a
// Comunidade sempre bloqueada pra todo mundo (bug antigo).
//
// Quando o Stripe recorrente existir (próxima task), essa função passa a
// checar a assinatura de verdade em vez de só "está logado".
export function temAcessoComunidade(session) {
  return !!session;
}
