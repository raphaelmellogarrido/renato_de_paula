import { useCallback, useEffect, useState } from "react";

const PULSO_URL = "/api/comunidade/pulso.php";
const INTERVALO_MS = 60000; // mesmo TTL do Cache-Control do endpoint
// Mesmo evento (mesmo literal, não import — mesmo padrão de acoplamento já
// usado em useSequenciaMeditacao.js e ColunaEncontros.jsx) que
// useMeditacaoHoje.js dispara ao marcar presença.
const EVENTO_ATUALIZOU = "meditacaoHojeAtualizada";

// Card "Meditando junto" — coluna do meio do dashboard, logo abaixo de
// "Sua Jornada" (ver ColunaProgresso.jsx), no lugar do quadrado vazio que
// sobrava ali. 3 linhas 100% reais vindas de public/api/comunidade/pulso.php,
// nada mockado. Mesmo padrão de polling de ColunaEncontros.jsx
// (verificarLive): fetch imediato no mount + setInterval de 60s, pra bater
// com o Cache-Control do PHP.
function MeditandoJunto() {
  // null = ainda carregando a 1ª vez (ou o fetch falhou) — o card some
  // nesse estado em vez de mostrar zeros que não são reais ainda.
  const [pulso, setPulso] = useState(null);

  // useCallback (sem deps — só usa o setter estável do useState) porque
  // além do polling de 60s, também é chamado logo depois de "Já meditei
  // hoje" ser clicado (efeito abaixo), pra o 🌿 "pessoas meditaram hoje"
  // subir sem esperar o próximo tick do intervalo nem F5.
  const carregar = useCallback(() => {
    // cache: "no-store" — o endpoint manda Cache-Control: public,
    // max-age=60 de propósito pro polling normal, mas isso faria o
    // navegador devolver uma cópia velha do cache HTTP dele mesmo bem na
    // hora que a gente busca de novo por causa do clique.
    fetch(PULSO_URL, { cache: "no-store" })
      .then((r) => r.json())
      .then((dados) => {
        if (dados?.ok) setPulso(dados);
      })
      .catch(() => {
        // pulso.php indisponível (ex: dev local sem PHP rodando) — mantém
        // o último valor conhecido, ou some se ainda não tinha nenhum.
      });
  }, []);

  useEffect(() => {
    carregar();
    const intervalo = setInterval(carregar, INTERVALO_MS);
    return () => clearInterval(intervalo);
  }, [carregar]);

  // Mesmo evento que o Ranking (ColunaEncontros.jsx) escuta. Aqui não
  // precisa filtrar por origem "clique": mesmo na reconciliação de mount
  // (origem "reconciliacao") refazer esse fetch é só redundante, nunca
  // incorreto — o pulso é uma contagem agregada, não um bump por usuário.
  useEffect(() => {
    function aoAtualizarPresenca() {
      // Pequeno atraso pra dar tempo do POST em presenca.php terminar (e
      // invalidar o cache de pulso.php) antes de buscar de novo.
      setTimeout(carregar, 1200);
    }
    window.addEventListener(EVENTO_ATUALIZOU, aoAtualizarPresenca);
    return () => window.removeEventListener(EVENTO_ATUALIZOU, aoAtualizarPresenca);
  }, [carregar]);

  if (!pulso) return null;

  const { meditaram_hoje: meditaramHoje, partilhas_hoje: partilhasHoje, total_sequencia: totalSequencia, maior_sequencia: maiorSequencia, qtd_7_mais: qtd7Mais } = pulso;

  return (
    <div className="cm-widget cm-widget-escuro cm-grid-pulso">
      <h3>
        <span aria-hidden="true">🧘</span> Meditando junto
      </h3>

      <div className="cm-pulso-linha">
        <span aria-hidden="true">🌿</span>
        <span>
          {meditaramHoje} {meditaramHoje === 1 ? "pessoa meditou" : "pessoas meditaram"} hoje
        </span>
      </div>

      <div className="cm-pulso-linha">
        <span aria-hidden="true">💬</span>
        <span>
          {partilhasHoje} {partilhasHoje === 1 ? "partilha" : "partilhas"} hoje
        </span>
      </div>

      <div className="cm-pulso-linha">
        <span aria-hidden="true">🔥</span>
        {totalSequencia === 0 ? (
          <span>Ninguém em sequência hoje, seja o primeiro!</span>
        ) : (
          <span>
            {totalSequencia} em sequência · maior: {maiorSequencia} dia{maiorSequencia === 1 ? "" : "s"}
            <span className="cm-pulso-sub">
              {qtd7Mais} com 7+ dia{qtd7Mais === 1 ? "" : "s"}
            </span>
          </span>
        )}
      </div>
    </div>
  );
}

export default MeditandoJunto;
