import { useEffect, useState } from "react";

// Mesma fonte de verdade de AulasMeditacaoRaiz.jsx (localStorage + PHP
// externo aulas.php), só que em modo leitura: usado por widgets fora da
// página de aulas (ex: o card "Sua Jornada" do dashboard) que só exibem o
// progresso, sem marcar/desmarcar nada. Não duplica a lógica de
// marcar/desmarcar — essa continua vivendo só em AulasMeditacaoRaiz.jsx.
const HOTMART_AULAS_URL = "https://renatodepaula.com/api/hotmart/aulas.php";

function chaveLocalStorage(email) {
  return `comunidade_progresso_aulas_raiz_${email}`;
}

function carregarProgressoLocal(email) {
  try {
    return JSON.parse(localStorage.getItem(chaveLocalStorage(email)) || "{}");
  } catch {
    return {};
  }
}

function salvarProgressoLocal(email, progresso) {
  try {
    localStorage.setItem(chaveLocalStorage(email), JSON.stringify(progresso));
  } catch {
    // localStorage indisponível — ignora, o PHP externo continua sendo a
    // fonte de verdade nessa sessão.
  }
}

function lerEmailSessao() {
  const sess = JSON.parse(localStorage.getItem("comunidade_session") || "{}");
  return sess.email || localStorage.getItem("user_email") || "";
}

export function useProgressoAulasRaiz() {
  const [email] = useState(lerEmailSessao);
  const [progressoPorArquivo, setProgressoPorArquivo] = useState(() =>
    email ? carregarProgressoLocal(email) : {},
  );

  useEffect(() => {
    if (!email) return;

    fetch(`${HOTMART_AULAS_URL}?email=${encodeURIComponent(email)}`)
      .then((r) => r.json())
      .then((data) => {
        const lista = Array.isArray(data?.aulas) ? data.aulas : [];
        setProgressoPorArquivo((atual) => {
          const mesclado = { ...atual };
          for (const item of lista) {
            const chave = item.arquivo || item.aula_id;
            if (!chave || mesclado[chave]?.assistida) continue;
            mesclado[chave] = { assistida: !!item.assistida, progresso: item.progresso || 0 };
          }
          salvarProgressoLocal(email, mesclado);
          return mesclado;
        });
      })
      .catch(() => {
        // PHP externo indisponível — segue só com o que já está no
        // localStorage, sem travar o widget.
      });
  }, [email]);

  return progressoPorArquivo;
}

export default useProgressoAulasRaiz;
