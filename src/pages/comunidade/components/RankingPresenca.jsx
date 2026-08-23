import { useCallback, useEffect, useState } from "react";
import { Trophy } from "lucide-react";
import useMeditacaoHoje from "./useMeditacaoHoje";
import { useEmailSessao, EVENTO_SESSAO_MUDOU } from "./usuarioStorage";

// Mesmo evento (e mesmo literal, não import — mesmo padrão de acoplamento
// já usado em useSequenciaMeditacao.js/MeditandoJunto.jsx) que
// useMeditacaoHoje.js dispara ao marcar presença. O `detail.origem`
// diferencia clique real de reconciliação com o servidor no mount (ver
// comentário no dispatch, em useMeditacaoHoje.js).
const EVENTO_ATUALIZOU = "meditacaoHojeAtualizada";

// Mesma leitura síncrona de sessão usada em AulasMeditacaoRaiz.jsx e
// DesafioSemana.jsx, mas pegando o NOME — o Ranking mostra o nome de quem
// logou, nunca o email.
function lerNomeSessao() {
  const sess = JSON.parse(localStorage.getItem("comunidade_session") || "{}");
  return sess.nome || "Você";
}

// Mesmo e-mail de teste de ColunaEncontros.jsx, pra dar pra testar o
// Ranking sem estar logado (localhost) — pedido explícito do cliente.
const EMAIL_TESTE = "teste@meditacaoraiz.com";

// Card "Ranking de Presença" — era o último widget da coluna 3
// (ColunaEncontros), virou componente próprio (mesmo padrão de
// MeditandoJunto.jsx) pra poder trocar de lugar com o Meditando junto:
// agora é o último widget da coluna 2 (ver ColunaProgresso.jsx), pedido do
// cliente.
function RankingPresenca() {
  // Fallback enquanto o ranking.php não respondeu (ou falhou): só o usuário
  // atual, com os dias vindo do mesmo streak do botão "Meditei hoje".
  const { streak } = useMeditacaoHoje();

  const emailSessao = useEmailSessao();
  const email = emailSessao || EMAIL_TESTE;

  // Nome exibido no Ranking. Começa com a mesma leitura síncrona de sempre
  // (comunidade_session.nome) e depois passa a escutar "storage",
  // "perfil-atualizado" (disparado por Configuracoes.jsx ao salvar) e o
  // evento de troca de sessão (login/logout) pra trocar na hora, sem
  // esperar minutos pelo próximo fetch do ranking.php nem um F5. É
  // EVENTO_SESSAO_MUDOU (usuarioStorage.js) em vez do literal "sessao-mudou"
  // porque é esse o evento que login/logout realmente disparam neste app.
  const [nome, setNome] = useState(lerNomeSessao);

  useEffect(() => {
    function atualizar() {
      setNome(localStorage.getItem("userName") || lerNomeSessao());
    }
    window.addEventListener("storage", atualizar);
    window.addEventListener("perfil-atualizado", atualizar);
    window.addEventListener(EVENTO_SESSAO_MUDOU, atualizar);
    return () => {
      window.removeEventListener("storage", atualizar);
      window.removeEventListener("perfil-atualizado", atualizar);
      window.removeEventListener(EVENTO_SESSAO_MUDOU, atualizar);
    };
  }, []);

  // Ranking GLOBAL de verdade — vem de ranking.php (todo mundo que já
  // marcou presença, não só quem está logado agora). `null` = ainda
  // carregando ou o fetch falhou; nesse caso o widget cai pro fallback (só
  // a linha do usuário atual) em vez de ficar em branco.
  const [ranking, setRanking] = useState(null);

  // Extraído em função (useCallback, sem deps — só usa o setter estável do
  // useState) porque tem dois gatilhos: 1x no mount, e de novo logo depois
  // de marcar presença (efeito abaixo), pra reconciliar o bump otimista com
  // o valor real do banco sem precisar de F5. Mesmo padrão de
  // AbortController+8s de useSequenciaMeditacao.js: se ranking.php demorar
  // ou falhar, desiste e o widget usa o fallback (só a linha do usuário
  // atual) em vez de travar a página.
  const buscarRanking = useCallback(() => {
    let cancelado = false;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    // cache: "no-store" — depois de marcar presença o cache em disco do
    // ranking.php já foi invalidado no servidor (ver presenca.php), mas
    // isso evita também que algum cache HTTP intermediário (navegador/CDN)
    // devolva uma cópia velha bem na hora que a gente mais precisa do
    // valor fresco.
    fetch("/api/hotmart/presenca/ranking.php", { signal: controller.signal, cache: "no-store" })
      .then((r) => r.json())
      .then((dados) => {
        if (!cancelado && Array.isArray(dados) && dados.length) {
          setRanking(dados);
        }
      })
      .catch(() => {
        // ranking.php indisponível/lento — mantém o que já tinha (ou o fallback).
      })
      .finally(() => clearTimeout(timeoutId));

    return () => {
      cancelado = true;
      controller.abort();
      clearTimeout(timeoutId);
    };
  }, []);

  useEffect(() => buscarRanking(), [buscarRanking]);

  // Sobe quem clicou em "Já meditei hoje" no Ranking na hora, sem esperar
  // rede: bump otimista de +1 dia (ou entra no ranking com 1 dia, se ainda
  // não tinha presença nenhuma) e reordena — cumpre o "menos de 1s" pedido,
  // já que não depende do round-trip do POST nem do cache de 5min do
  // ranking.php. Só reage a origem "clique": o mesmo evento também dispara
  // na reconciliação com o servidor ao montar (useMeditacaoHoje.js) e ali o
  // fetch de ranking já busca o valor certo — bump ali duplicaria a
  // contagem.
  useEffect(() => {
    function aoAtualizarPresenca(evento) {
      if (evento?.detail?.origem !== "clique") return;

      setRanking((atual) => {
        if (!Array.isArray(atual)) return atual; // ainda não carregou — nada pra atualizar, fica no fallback até o fetch do mount resolver
        const emailLower = email.toLowerCase().trim();
        const jaEstava = atual.some((item) => (item.email || "").toLowerCase().trim() === emailLower);
        const atualizado = jaEstava
          ? atual.map((item) =>
              (item.email || "").toLowerCase().trim() === emailLower
                ? { ...item, dias: (Number(item.dias) || 0) + 1 }
                : item
            )
          : [...atual, { email, nome, dias: 1 }];

        return [...atualizado].sort(
          (a, b) => (Number(b.dias) || 0) - (Number(a.dias) || 0) || String(a.nome || "").localeCompare(String(b.nome || ""))
        );
      });

      // Confirma com o valor real do banco pouco depois de o bump otimista
      // já ter aparecido na tela — dá tempo do POST em presenca.php
      // terminar (e invalidar o cache do ranking.php) antes de buscar de novo.
      setTimeout(buscarRanking, 1200);
    }

    window.addEventListener(EVENTO_ATUALIZOU, aoAtualizarPresenca);
    return () => window.removeEventListener(EVENTO_ATUALIZOU, aoAtualizarPresenca);
  }, [email, nome, buscarRanking]);

  return (
    <div className="cm-widget cm-widget-escuro cm-grid-ranking">
      <h3>
        <Trophy size={16} /> Ranking de Presença
      </h3>
      {ranking
        ? ranking.slice(0, 5).map((item, i) => {
            const souEu = !!item.email && item.email.toLowerCase().trim() === email.toLowerCase().trim();
            const dias = Number(item.dias) || 0;
            return (
              <div className={`cm-ranking-item ${souEu ? "is-voce" : ""}`} key={item.email || i}>
                <span className="cm-ranking-esquerda">
                  <span className="cm-ranking-pos">#{i + 1}</span>
                  {/* souEu usa o `nome` reativo (state acima) em vez de item.nome
                      pra refletir uma troca de nome recém-salva na hora, sem
                      esperar o próximo fetch do ranking.php confirmar. */}
                  <span className="cm-ranking-nome">{souEu ? nome : item.nome || item.email}</span>
                </span>
                <span className="cm-ranking-dias">
                  {dias} dia{dias === 1 ? "" : "s"}
                </span>
              </div>
            );
          })
        : (
          <div className="cm-ranking-item is-voce">
            <span className="cm-ranking-esquerda">
              <span className="cm-ranking-pos">#1</span>
              <span className="cm-ranking-nome">{nome}</span>
            </span>
            <span className="cm-ranking-dias">
              {streak} dia{streak === 1 ? "" : "s"}
            </span>
          </div>
        )}
    </div>
  );
}

export default RankingPresenca;
