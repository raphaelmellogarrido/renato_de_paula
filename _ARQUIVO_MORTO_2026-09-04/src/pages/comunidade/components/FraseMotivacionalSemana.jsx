import { useEffect, useState } from "react";

// Texto padrão enquanto get_frase_semana.php não respondeu (ou falhou, ou
// a tabela ainda está vazia) — mesmo padrão de "valor inicial só pra não
// ficar em branco" usado em DesafioSemana.jsx/ColunaEncontros.jsx.
const FRASE_PADRAO = "Cada momento de presença é uma semente de transformação.";
const SUBFRASE_PADRAO = "frase teste";

/**
 * Card "Frase Motivacional da Semana" — substitui o antigo "Ranking de
 * Presença" no fim da coluna 3 do dashboard (ver ColunaEncontros.jsx).
 * Conteúdo (frase/subfrase) vem de public/api/get_frase_semana.php,
 * editável em /admin via public/api/update_frase_semana.php.
 */
function FraseMotivacionalSemana() {
  const [frase, setFrase] = useState(FRASE_PADRAO);
  const [subfrase, setSubfrase] = useState(SUBFRASE_PADRAO);

  useEffect(() => {
    let cancelado = false;
    fetch("/api/get_frase_semana.php")
      .then((r) => r.json())
      .then((dados) => {
        if (cancelado || !dados?.ok) return;
        if (dados.frase) setFrase(dados.frase);
        if (dados.subfrase) setSubfrase(dados.subfrase);
      })
      .catch(() => {
        // get_frase_semana.php indisponível — segue com o texto padrão,
        // sem travar a página.
      });
    return () => {
      cancelado = true;
    };
  }, []);

  return (
    <div className="cm-widget cm-frase-semana cm-grid-frase">
      <span className="cm-frase-aspas" aria-hidden="true">
        “
      </span>
      <p className="cm-frase-texto">{frase}</p>
      <p className="cm-frase-subtexto">{subfrase}</p>
    </div>
  );
}

export default FraseMotivacionalSemana;
