import { useCallback, useEffect, useRef, useState } from "react";
import { Send } from "lucide-react";
import { useEmailSessao, useAvatarUrlSessao, lerNomeSessao } from "./components/usuarioStorage";
import { EMAIL_ADMINISTRADOR } from "./components/ComentarioCard";
import { EVENTO_MENSAGENS_ATUALIZOU } from "./components/useMensagensNaoLidas";
import { formatarDataBr, iniciais } from "./components/comentariosUtils";

const LISTAR_URL = "/api/mensagens/listar.php";
const ENVIAR_URL = "/api/mensagens/enviar.php";
const MARCAR_LIDA_URL = "/api/mensagens/marcar_lida.php";

// Página /comunidade/mensagens (Tarefa 2) — chat estilo WhatsApp com a
// equipe (admin/orientador). Mantém a mesma sidebar de sempre
// (ComunidadeLayout.jsx renderiza <Outlet/> ao lado dela — nenhum layout
// especial precisa ser feito aqui, só o conteúdo da coluna direita).
// Ao abrir, marca tudo como lido (marcar_lida.php) e avisa o card
// "Mensagens" da sidebar pra sumir o badge na hora, sem esperar o próximo
// tick do polling de 30s (useMensagensNaoLidas.js).
function Mensagens() {
  const email = useEmailSessao();
  const avatarUrlSessao = useAvatarUrlSessao();
  const [itens, setItens] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);
  const fimRef = useRef(null);

  const carregar = useCallback(() => {
    if (!email) return;
    fetch(`${LISTAR_URL}?email=${encodeURIComponent(email)}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((dados) => {
        if (Array.isArray(dados?.itens)) setItens(dados.itens);
        setCarregando(false);
      })
      .catch((err) => {
        console.error("[Clube Presença] falha ao carregar mensagens:", err);
        setCarregando(false);
      });
  }, [email]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  // Realtime "pobre" (sem WebSocket): repolla o thread a cada 3s enquanto a
  // página está aberta, pra mensagem nova da equipe aparecer sem precisar
  // de F5. carregar() já é cache: no-store, então sempre pega o estado
  // atual do banco; se a resposta chegar fora de ordem (POST lento
  // atravessando um tick do polling) não tem problema, o próximo tick de 3s
  // corrige sozinho.
  useEffect(() => {
    if (!email) return;
    const id = setInterval(carregar, 3000);
    return () => clearInterval(id);
  }, [email, carregar]);

  // Marca como lida assim que a página abre (uma vez, não a cada refetch de
  // carregar() — senão uma mensagem que chegasse enquanto o aluno já está
  // com a página aberta seria marcada como lida sem ele nem ver).
  useEffect(() => {
    if (!email) return;
    fetch(MARCAR_LIDA_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    })
      .then(() => window.dispatchEvent(new CustomEvent(EVENTO_MENSAGENS_ATUALIZOU)))
      .catch(() => {
        // se falhar, o badge da sidebar só continua mostrando a contagem
        // antiga até o próximo polling — não trava a leitura do chat.
      });
  }, [email]);

  // Rola pro fim da conversa (mensagem mais recente) sempre que a lista
  // muda — mesmo comportamento de qualquer chat estilo WhatsApp.
  useEffect(() => {
    fimRef.current?.scrollIntoView({ block: "end" });
  }, [itens]);

  // Responde pro remetente da última mensagem RECEBIDA (normalmente o
  // admin/orientador que iniciou a conversa) — se ainda não recebeu
  // nenhuma (caso raro, aluno abrindo a página sem nunca ter sido
  // contatado), cai no e-mail do Administrador como destino padrão.
  function destinatarioPadrao() {
    const recebidas = itens.filter((m) => m.para_email?.toLowerCase() === email?.toLowerCase());
    const ultima = recebidas[recebidas.length - 1];
    return ultima?.de_email || EMAIL_ADMINISTRADOR;
  }

  async function handleEnviar(e) {
    e.preventDefault();
    const valor = texto.trim();
    if (!valor || !email || enviando) return;

    const paraEmail = destinatarioPadrao();
    // Optimistic update: mostra a mensagem na hora, sem esperar o
    // round-trip do POST nem o próximo tick do polling de 3s. id string
    // (não colide com id numérico do banco) só pra existir uma `key` React
    // e pra dar pra remover essa entrada específica se o envio falhar.
    const idOtimista = `otimista-${Date.now()}`;
    const mensagemOtimista = {
      id: idOtimista,
      de_email: email,
      de_nome: nomeSessao,
      de_avatar_url: avatarUrlSessao || null,
      para_email: paraEmail,
      mensagem: valor,
      lida: false,
      created_at: new Date().toISOString(),
    };
    setItens((prev) => [...prev, mensagemOtimista]);
    setTexto("");
    setEnviando(true);
    try {
      const resposta = await fetch(ENVIAR_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ de_email: email, para_email: paraEmail, mensagem: valor }),
      });
      const data = await resposta.json();
      if (data?.erro) throw new Error(data.erro);
      // Troca a otimista pela lista real do banco (pega o id/created_at
      // definitivos e qualquer mensagem que tenha chegado nesse meio-tempo).
      carregar();
    } catch (err) {
      console.error("[Clube Presença] falha ao enviar mensagem:", err);
      window.alert("Não foi possível enviar a mensagem.");
      // Remove a bolha otimista (nunca chegou ao servidor de verdade) e
      // devolve o texto pro campo, pro aluno não perder o que escreveu.
      setItens((prev) => prev.filter((m) => m.id !== idOtimista));
      setTexto(valor);
    } finally {
      setEnviando(false);
    }
  }

  const nomeSessao = lerNomeSessao();

  return (
    <div className="cm-mensagens-page">
      <div className="cm-config-header">
        <h1>Mensagens</h1>
        <p>Converse diretamente com a equipe da Meditação Raiz</p>
      </div>

      <div className="cm-mensagens-chat">
        {carregando && <p className="cm-mensagens-vazio">Carregando conversa...</p>}

        {!carregando && itens.length === 0 && (
          <p className="cm-mensagens-vazio">Nenhuma mensagem ainda. Quando a equipe entrar em contato, a conversa aparece aqui.</p>
        )}

        {!carregando && itens.length > 0 && (
          <div className="cm-mensagens-lista">
            {itens.map((msg) => {
              const souEuQueEnviei = msg.de_email?.toLowerCase() === email?.toLowerCase();
              // Nome e foto de quem enviou já vêm prontos do back
              // (listar.php faz LEFT JOIN em alunos) — nunca mais hardcoda
              // "Administrador"/"Orientador" aqui; se o remetente mudar o
              // nome/foto em /configurações, a próxima leitura já reflete.
              // A bolha "eu" continua usando avatarUrlSessao/nomeSessao (não
              // msg.de_avatar_url/de_nome) pra refletir uma troca feita em
              // /configurações na hora, sem esperar o próximo tick do
              // polling de 3s.
              const nomeRemetente = souEuQueEnviei ? "Você" : msg.de_nome || "Equipe";
              const avatarUrl = souEuQueEnviei ? avatarUrlSessao : msg.de_avatar_url || "";
              const nomeParaIniciais = souEuQueEnviei ? nomeSessao : nomeRemetente;
              return (
                <div key={msg.id} className={`cm-mensagem-bolha-linha ${souEuQueEnviei ? "is-eu" : "is-equipe"}`}>
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="" className="cm-mensagem-avatar cm-mensagem-avatar-img" />
                  ) : (
                    <div className="cm-mensagem-avatar">{iniciais(nomeParaIniciais)}</div>
                  )}
                  <div className="cm-mensagem-corpo">
                    <span className="cm-mensagem-nome">{nomeRemetente}</span>
                    <div className="cm-mensagem-bolha">
                      <p>{msg.mensagem}</p>
                      <span className="cm-mensagem-bolha-hora">{formatarDataBr(msg.created_at)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={fimRef} />
          </div>
        )}
      </div>

      <form className="cm-mensagens-form" onSubmit={handleEnviar}>
        <input
          type="text"
          placeholder={`Escreva como ${nomeSessao.split(" ")[0]}...`}
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          maxLength={2000}
          disabled={enviando}
        />
        <button type="submit" aria-label="Enviar mensagem" disabled={!texto.trim() || enviando}>
          <Send size={18} />
        </button>
      </form>
    </div>
  );
}

export default Mensagens;
