// Regra de senha forte usada tanto no cadastro (Login.jsx) quanto na troca
// de senha em Configurações (Configuracoes.jsx) — extraído pra um lugar só
// pra garantir que as duas telas sempre concordem sobre o que é "forte".
const REGEX_ESPECIAL = /[!@#$%^&*()_\-+=[\]{};:'",.<>/?\\|`~]/;

export function checarRequisitosSenha(senha) {
  return {
    comprimento: senha.length >= 8,
    maiuscula: /[A-Z]/.test(senha),
    minuscula: /[a-z]/.test(senha),
    numero: /[0-9]/.test(senha),
    especial: REGEX_ESPECIAL.test(senha),
  };
}

export function senhaEhForte(senha) {
  return Object.values(checarRequisitosSenha(senha)).every(Boolean);
}
