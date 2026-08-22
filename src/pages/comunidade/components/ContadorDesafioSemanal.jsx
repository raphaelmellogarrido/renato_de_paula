import { useEffect, useState } from "react";
import { Repeat2 } from "lucide-react";
import { DESAFIO_SEMANA } from "../data/mockData";
import { useEmailSessao, chaveUsuario } from "./usuarioStorage";

// Lê a MESMA chave que DesafioSemana.jsx já escreve (mesma base + mesmo
// e-mail via chaveUsuario) — não altera aquele componente, só observa o
// resultado. Esse literal precisa continuar igual ao CHAVE_BASE de
// DesafioSemana.jsx, senão os dois desincronizam silenciosamente.
const CHAVE_BASE_DESAFIO_SEMANA = "desafioSemana_v1";

// Sem listener de storage confiável pra escrita na mesma aba (o evento
// nativo "storage" só dispara em OUTRAS abas), então verifica a cada
// segundo se algum check mudou — leve o bastante (1 leitura de
// localStorage) pra não pesar, e simples o bastante pra não precisar
// tocar em DesafioSemana.jsx.
const INTERVALO_VERIFICACAO_MS = 1000;

function lerDesafioSemanaConcluidos(email) {
  try {
    return JSON.parse(localStorage.getItem(chaveUsuario(CHAVE_BASE_DESAFIO_SEMANA, email)) || "{}");
  } catch {
    return {};
  }
}

/**
 * Card pequeno e informativo entre "Desafios da semana" e "Ranking de
 * Presença": mostra quantos dos desafios da semana atual o aluno já
 * completou (0 a N).
 *
 * Não altera DesafioSemana.jsx — lê direto do mesmo localStorage que ele
 * já escreve ("desafioSemana_v1_<email>"), a MESMA contagem que acende os
 * checks lá. Tudo por usuário: trocar de conta mostra 0 de novo.
 */
export default function ContadorDesafioSemanal() {
  const email = useEmailSessao();
  const total = DESAFIO_SEMANA.itens.length;
  const [feitos, setFeitos] = useState(() => {
    const concluidos = lerDesafioSemanaConcluidos(email);
    return Math.min(Object.values(concluidos).filter(Boolean).length, total);
  });
  const [emailAnterior, setEmailAnterior] = useState(email);

  // Troca de conta / logout+login: recarrega a contagem do NOVO usuário em
  // vez de mostrar por um instante o progresso de quem usou o navegador
  // antes. Ajusta o estado direto no render (não em efeito) seguindo o
  // padrão recomendado pelo React pra "resetar estado quando uma prop/valor
  // externo muda".
  if (email !== emailAnterior) {
    setEmailAnterior(email);
    const concluidos = lerDesafioSemanaConcluidos(email);
    setFeitos(Math.min(Object.values(concluidos).filter(Boolean).length, total));
  }

  useEffect(() => {
    function atualizar() {
      const concluidos = lerDesafioSemanaConcluidos(email);
      const totalConcluidos = Object.values(concluidos).filter(Boolean).length;
      setFeitos(Math.min(totalConcluidos, total));
    }

    atualizar();
    const intervalo = setInterval(atualizar, INTERVALO_VERIFICACAO_MS);
    // Cobre o caso de outra aba/janela (ou o próprio DesafioSemana.jsx
    // nesta mesma aba) marcar/desmarcar um item.
    window.addEventListener("storage", atualizar);
    return () => {
      clearInterval(intervalo);
      window.removeEventListener("storage", atualizar);
    };
  }, [email, total]);

  let texto;
  if (feitos === 0) {
    texto = "Você ainda não completou nenhum desafio da semana.";
  } else if (feitos === total) {
    texto = `Você completou todos os ${total} desafios da semana! 🎉`;
  } else {
    texto = `Você completou ${feitos} dos ${total} desafios da semana.`;
  }

  return (
    <div className="cm-contador-desafio-semanal">
      <Repeat2 size={14} aria-hidden="true" />
      <span>{texto}</span>
    </div>
  );
}
