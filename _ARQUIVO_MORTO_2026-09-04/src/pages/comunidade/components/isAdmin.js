// Lista dos e-mails com acesso admin dentro da comunidade (menu /comunidade/admin
// e rota /admin). Mesma lista usada no back-end em
// public/api/hotmart/comentarios.php (DELETE, `$admins`) — mantidas em
// arquivos separados porque JS e PHP não compartilham constante direto;
// mudar uma lista sem mudar a outra deixa as duas fora de sincronia.
export const ADMIN_EMAILS = ["raphaelmellogarrido@gmail.com", "rsp.ren@gmail.com"];

export function isAdminEmail(email) {
  const e = (email || "").toLowerCase().trim();
  return ADMIN_EMAILS.includes(e);
}
