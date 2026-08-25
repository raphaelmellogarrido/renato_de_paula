import { useCallback, useEffect, useRef, useState } from "react";
import { Send } from "lucide-react";
import { useEmailSessao, useAvatarUrlSessao, lerNomeSessao } from "./components/usuarioStorage";
import { EMAIL_ADMINISTRADOR, EMAIL_ORIENTADOR } from "./components/ComentarioCard";
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

    setEnviando(true);
    try {
      const resposta = await fetch(ENVIAR_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ de_email: email, para_email: destinatarioPadrao(), mensagem: valor }),
      });
      const data = await resposta.json();
      if (data?.erro) throw new Error(data.erro);
      setTexto("");
      carregar();
    } catch (err) {
      console.error("[Clube Presença] falha ao enviar mensagem:", err);
      window.alert("Não foi possível enviar a mensagem.");
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
              // Não há foto de perfil da equipe salva em mensagens_privadas
              // (thread é só de_email/para_email, sem JOIN em alunos como
              // comentarios.php faz) — só o remetente "eu" tem avatarUrl de
              // verdade, o lado equipe sempre cai nas iniciais, igual ao
              // fallback de ComentarioCard quando avatar_url vem nulo.
              const nomeRemetente = souEuQueEnviei
                ? "Você"
                : msg.de_email?.toLowerCase() === EMAIL_ORIENTADOR
                ? "Orientador"
                : "Administrador";
              const avatarUrl = souEuQueEnviei ? avatarUrlSessao : "";
              return (
                <div key={msg.id} className={`cm-mensagem-bolha-linha ${souEuQueEnviei ? "is-eu" : "is-equipe"}`}>
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="" className="cm-mensagem-avatar cm-mensagem-avatar-img" />
                  ) : (
                    <div className="cm-mensagem-avatar">{iniciais(souEuQueEnviei ? nomeSessao : nomeRemetente)}</div>
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
