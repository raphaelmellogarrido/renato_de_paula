// Helpers compartilhados entre ComentariosFeed.jsx e DificuldadeDoDia.jsx —
// os dois consomem o mesmo formato de resposta de comentarios.php.

export function iniciais(nome) {
  return (nome || "Aluno")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0])
    .join("")
    .toUpperCase();
}

// created_at já vem em horário de Brasília (mysql `SET time_zone = '-03:00'`
// em _conexao.php) — reformata a string direto, sem passar por Date()/fuso
// do navegador, senão duplica o offset (mesmo bug de fuso já corrigido em
// useMeditacaoHoje.js).
export function formatarDataBr(datetimeStr) {
  const [data, hora] = String(datetimeStr || "").split(" ");
  if (!data) return "";
  const [ano, mes, dia] = data.split("-");
  return `${dia}/${mes}/${ano}${hora ? " às " + hora.slice(0, 5) : ""}`;
}
