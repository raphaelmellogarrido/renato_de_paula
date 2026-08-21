import { useEffect, useState } from "react";
import { useEmailSessao, chaveUsuario, logSalvandoParaUsuario } from "./usuarioStorage";

// Mesma fonte de verdade de AulasMeditacaoRaiz.jsx (localStorage + PHP
// aulas-raiz/progresso.php, tabela progresso_aulas_raiz), só que em modo
// leitura: usado por widgets fora da página de aulas (ex: o card "Sua
// Jornada" do dashboard) que só exibem o progresso, sem marcar/desmarcar
// nada. Não duplica a lógica de marcar/desmarcar — essa continua vivendo
// só em AulasMeditacaoRaiz.jsx.
const PROGRESSO_AULAS_RAIZ_URL = "/api/hotmart/aulas-raiz/progresso.php";
// Mesma base de chave usada em AulasMeditacaoRaiz.jsx — precisa continuar
// igual nos dois arquivos, senão um não vê o progresso salvo pelo outro.
const CHAVE_BASE = "comunidade_progresso_aulas_raiz";

function carregarProgressoLocal(email) {
  try {
    return JSON.parse(localStorage.getItem(chaveUsuario(CHAVE_BASE, email)) || "{}");
  } catch {
    return {};
  }
}

function salvarProgressoLocal(email, progresso) {
  logSalvandoParaUsuario("ProgressoAulasRaiz (widget)", email);
  try {
    localStorage.setItem(chaveUsuario(CHAVE_BASE, email), JSON.stringify(progresso));
  } catch {
    // localStorage indisponível — ignora, o PHP externo continua sendo a
    // fonte de verdade nessa sessão.
  }
}

export function useProgressoAulasRaiz() {
  const email = useEmailSessao();
  const [progressoPorArquivo, setProgressoPorArquivo] = useState(() =>
    email ? carregarProgressoLocal(email) : {},
  );
  const [emailAnterior, setEmailAnterior] = useState(email);

  // Troca de conta / logout+login: recarrega do zero pra chave do NOVO
  // usuário (mostra a Jornada zerada se for conta nova). Ajusta o estado
  // direto no render (não em efeito) seguindo o padrão recomendado pelo
  // React pra "resetar estado quando uma prop/valor externo muda".
  if (email !== emailAnterior) {
    setEmailAnterior(email);
    setProgressoPorArquivo(email ? carregarProgressoLocal(email) : {});
  }

  useEffect(() => {
    if (!email) return;

    fetch(`${PROGRESSO_AULAS_RAIZ_URL}?email=${encodeURIComponent(email)}`)
      .then((r) => r.json())
      .then((data) => {
        const lista = Array.isArray(data?.aulas) ? data.aulas : [];
        setProgressoPorArquivo((atual) => {
          const mesclado = { ...atual };
          for (const item of lista) {
            const chave = item.arquivo;
            if (!chave || mesclado[chave]?.assistida) continue;
            mesclado[chave] = { assistida: !!item.assistida, progresso: item.progresso || 0 };
          }
          salvarProgressoLocal(email, mesclado);
          return mesclado;
        });
      })
      .catch(() => {
        // PHP indisponível — segue só com o que já está no localStorage,
        // sem travar o widget.
      });
  }, [email]);

  return progressoPorArquivo;
}

export default useProgressoAulasRaiz;
