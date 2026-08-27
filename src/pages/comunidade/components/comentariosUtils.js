// Helpers compartilhados entre ComentariosFeed.jsx e DificuldadeDoDia.jsx —
// os dois consomem o mesmo formato de resposta de comentarios.php.

import { Globe, Lock, ShieldCheck } from "lucide-react";

// Toggle "Público/Privado/Orientador" do composer (DificuldadeDoDia.jsx) e
// selinho/menu de visibilidade de cada comentário já publicado
// (ComentarioCard.jsx, 27/08) — mesmos 3 valores que o backend aceita/valida
// (comentarios.php POST/PUT) e filtra no GET (só quem pode ver um item chega
// a recebê-lo, não é só escondido no front). 'publico' é sempre o
// default/1º da lista. Extraído pra cá (antes vivia só em DificuldadeDoDia.jsx)
// pra ComentarioCard.jsx usar a mesma lista/ícones no menu de troca de
// visibilidade, sem duplicar.
export const OPCOES_VISIBILIDADE = [
  { valor: "publico", label: "Público", descricao: "Todo mundo vê", Icone: Globe },
  { valor: "privado", label: "Privado", descricao: "Só você vê", Icone: Lock },
  { valor: "orientador", label: "Orientador", descricao: "Você e o orientador veem", Icone: ShieldCheck },
];

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
