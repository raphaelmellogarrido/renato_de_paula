import { useEffect, useRef, useState } from "react";
import { NavLink } from "react-router-dom";
import { Home, Library, Users, Settings, LogOut, Mail, Shield, ChevronDown, Lock } from "lucide-react";
import useMensagensNaoLidas from "./useMensagensNaoLidas";
import { isAdminEmail } from "./isAdmin";
import HamburgerMenu from "./HamburgerMenu";

function iniciais(nome) {
  return nome
    .split(" ")
    .slice(0, 2)
    .map((parte) => parte[0])
    .join("")
    .toUpperCase();
}

// Comunidades do dropdown do topo (26/08) — hoje só "meditacao" existe de
// verdade; alimentacao/exercicio ficam bloqueadas (cadeado) até o dia em
// que existirem conteúdo/rota próprios. `bloqueada` é o único campo que a
// troca de layout futura precisa olhar pra decidir se navega ou não.
const COMUNIDADES = [
  { id: "meditacao", label: "Meditação", img: "/meditacao.png", bloqueada: false },
  { id: "alimentacao", label: "Alimentação", bloqueada: true },
  { id: "exercicio", label: "Exercício", bloqueada: true },
];

const NAV_ITEMS = [
  { label: "Início", icon: Home, to: "/comunidade", end: true },
  { label: "Aulas", icon: Library, to: "/comunidade/aulas-raiz" },
  // { label: "Meditações da Semana", icon: CalendarDays, to: "/comunidade/meditacoes-semana" },
  // { label: "Ao Vivo", icon: Video, to: "/comunidade/ao-vivo", comBolinha: true },
  // { label: "Comunidade", icon: Users, to: "/comunidade/comunidade" },
  // { label: "Meu Progresso", icon: BarChart3, to: "/comunidade/progresso" },
  { label: "Configurações", icon: Settings, to: "/comunidade/configuracoes" },
];

function ComunidadeSidebar({ session, onSair }) {
  // Card "Mensagens" (Tarefa 2) — sempre visível (é o único jeito de reabrir
  // o histórico de conversa depois de já ter lido tudo), só o BADGE
  // vermelho é condicional a contagem >0. Ver useMensagensNaoLidas.js.
  const mensagensNaoLidas = useMensagensNaoLidas();
  // Item "Admin" só aparece pros 2 e-mails admin (ver isAdmin.js) — não
  // é proteção real (sessão da comunidade é client-side), só esconde o
  // atalho de quem não é admin. Ver AdminGuard.jsx pra proteção da rota.
  const admin = isAdminEmail(session?.email);
  const nome = session?.nome || "Aluno";
  // Saudação usa "Primeiro nome" (Configuracoes.jsx) quando salvo — sem
  // isso a sidebar ficava presa na 1ª palavra de "Nome e sobrenome" mesmo
  // depois de editar "Primeiro nome" separadamente. Iniciais continuam
  // vindo do nome completo, que é outro campo.
  const primeiroNome = session?.primeiroNome || nome.split(" ")[0];

  // Dropdown de comunidade (26/08) — comunidadeAtiva fica pronta pro dia em
  // que "trocar de comunidade" virar de verdade trocar o layout inteiro (ex.:
  // renderizar <ComunidadeAlimentacao> em vez de <ComunidadeSidebar>+rotas
  // atuais); hoje só "meditacao" é selecionável, então o valor nunca muda.
  const [comunidadeAtiva] = useState("meditacao");
  const [seletorAberto, setSeletorAberto] = useState(false);
  const seletorRef = useRef(null);
  const comunidadeInfo = COMUNIDADES.find((c) => c.id === comunidadeAtiva) ?? COMUNIDADES[0];

  // Fecha o dropdown ao clicar fora ou apertar Esc — mesmo padrão do popover
  // de emoji em DificuldadeDoDia.jsx.
  useEffect(() => {
    if (!seletorAberto) return;
    function aoClicarFora(e) {
      if (seletorRef.current?.contains(e.target)) return;
      setSeletorAberto(false);
    }
    function aoTeclar(e) {
      if (e.key === "Escape") setSeletorAberto(false);
    }
    document.addEventListener("mousedown", aoClicarFora);
    document.addEventListener("keydown", aoTeclar);
    return () => {
      document.removeEventListener("mousedown", aoClicarFora);
      document.removeEventListener("keydown", aoTeclar);
    };
  }, [seletorAberto]);

  return (
    <aside className="cm-sidebar-left">
      <div className="cm-comunidade-seletor" ref={seletorRef}>
        <button type="button" className="cm-comunidade-seletor-btn" onClick={() => setSeletorAberto((v) => !v)} aria-expanded={seletorAberto} aria-haspopup="true">
          <img src={comunidadeInfo.img} alt="" className="cm-comunidade-seletor-img" />
          <span className="cm-comunidade-seletor-label">{comunidadeInfo.label}</span>
          <ChevronDown size={16} strokeWidth={2} className={`cm-comunidade-seletor-seta ${seletorAberto ? "is-aberta" : ""}`} />
        </button>

        {seletorAberto && (
          <div className="cm-comunidade-dropdown" role="menu">
            {COMUNIDADES.filter((c) => c.id !== comunidadeAtiva).map((c) => (
              <div key={c.id} className="cm-comunidade-dropdown-item" aria-disabled={c.bloqueada}>
                <Lock size={14} strokeWidth={2} />
                <span>{c.label}</span>
                <Lock size={14} strokeWidth={2} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Só visível <=768px (ComunidadeApp.css) — brand/nav/footer viram
          display:none nessa faixa e este botão + o avatar do rodapé (só
          ele, o resto do card do usuário também some) sobram como os 2
          únicos elementos do topbar. Ver HamburgerMenu.jsx. */}
      <HamburgerMenu session={session} onSair={onSair} mensagensNaoLidas={mensagensNaoLidas} />

      <nav className="cm-sidebar-nav">
        {NAV_ITEMS.map((item) => (
          <NavLink key={item.label} to={item.to} end={item.end} aria-label={item.label} className={({ isActive }) => `cm-sidebar-nav-item ${isActive ? "is-ativo" : ""}`}>
            <item.icon size={18} strokeWidth={1.8} />
            <span>{item.label}</span>
            {item.comBolinha && <span className="cm-sidebar-dot" aria-hidden="true" />}
          </NavLink>
        ))}

        {admin && (
          <NavLink to="/comunidade/admin" aria-label="Admin" className={({ isActive }) => `cm-sidebar-nav-item ${isActive ? "is-ativo" : ""}`}>
            <Shield size={18} strokeWidth={1.8} />
            <span>Admin</span>
          </NavLink>
        )}

        {/* Só aparece no celular/tablet (ver .cm-sidebar-nav-whatsapp no
            @media de ComunidadeApp.css) — some no desktop, onde o card
            "Posso ajudar?" completo abaixo (cm-ajuda-card--desktop) já
            cobre o mesmo atalho. Fica logo depois de "Configurações" por
            ser o último item de NAV_ITEMS acima. */}
        <button type="button" className="cm-sidebar-nav-whatsapp" aria-label="Tire suas dúvidas no WhatsApp" title="Tire suas dúvidas no WhatsApp" onClick={() => window.open("https://wa.me/5521976624767?text=Olá, preciso de ajuda na Comunidade Meditação Raiz", "_blank")}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20.52 3.48A11.94 11.94 0 0 0 12.04 0C5.5 0 .2 5.3.2 11.85c0 2.09.55 4.13 1.6 5.93L0 24l6.4-1.68a11.86 11.86 0 0 0 5.64 1.44h.01c6.54 0 11.85-5.3 11.85-11.85 0-3.17-1.23-6.14-3.38-8.43ZM12.05 21.6h-.01a9.8 9.8 0 0 1-5-1.37l-.36-.21-3.8 1 1.01-3.7-.23-.38a9.75 9.75 0 0 1-1.5-5.18c0-5.4 4.4-9.79 9.8-9.79 2.62 0 5.08 1.02 6.93 2.87a9.72 9.72 0 0 1 2.87 6.92c0 5.4-4.4 9.79-9.8 9.79Zm5.37-7.34c-.29-.15-1.74-.86-2.01-.96-.27-.1-.47-.15-.66.15-.2.29-.76.96-.93 1.16-.17.2-.34.22-.63.07-.29-.15-1.24-.46-2.36-1.46-.87-.78-1.46-1.74-1.63-2.03-.17-.3-.02-.45.13-.6.13-.13.29-.34.44-.51.15-.17.2-.29.29-.49.1-.2.05-.37-.02-.51-.08-.15-.66-1.6-.91-2.2-.24-.58-.48-.5-.66-.5h-.56c-.2 0-.51.07-.78.37-.27.29-1.02 1-1.02 2.44s1.05 2.83 1.2 3.03c.15.2 2.06 3.16 5 4.43.7.3 1.24.48 1.67.62.7.22 1.34.19 1.84.12.56-.08 1.74-.71 1.98-1.4.25-.68.25-1.27.17-1.4-.07-.13-.26-.2-.55-.35Z" />
          </svg>
        </button>
      </nav>

      <div className="cm-sidebar-footer">
        <NavLink to="/comunidade/mensagens" className="cm-ajuda-card cm-mensagens-card">
          <div className="cm-ajuda-icone">
            <Mail size={18} />
            {mensagensNaoLidas > 0 && (
              <span className="cm-mensagens-badge" aria-label={`${mensagensNaoLidas} mensagens não lidas`}>
                {mensagensNaoLidas > 9 ? "9+" : mensagensNaoLidas}
              </span>
            )}
          </div>
          <div className="cm-ajuda-texto">
            <strong>Mensagens</strong>
            <span>{mensagensNaoLidas > 0 ? "Você tem novas mensagens" : "Converse com a equipe"}</span>
          </div>
        </NavLink>

        <div className="cm-ajuda-card cm-ajuda-card--desktop" onClick={() => window.open("https://wa.me/5521976624767?text=Olá, preciso de ajuda na Comunidade Meditação Raiz", "_blank")}>
          <div className="cm-ajuda-icone">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20.52 3.48A11.94 11.94 0 0 0 12.04 0C5.5 0 .2 5.3.2 11.85c0 2.09.55 4.13 1.6 5.93L0 24l6.4-1.68a11.86 11.86 0 0 0 5.64 1.44h.01c6.54 0 11.85-5.3 11.85-11.85 0-3.17-1.23-6.14-3.38-8.43ZM12.05 21.6h-.01a9.8 9.8 0 0 1-5-1.37l-.36-.21-3.8 1 1.01-3.7-.23-.38a9.75 9.75 0 0 1-1.5-5.18c0-5.4 4.4-9.79 9.8-9.79 2.62 0 5.08 1.02 6.93 2.87a9.72 9.72 0 0 1 2.87 6.92c0 5.4-4.4 9.79-9.8 9.79Zm5.37-7.34c-.29-.15-1.74-.86-2.01-.96-.27-.1-.47-.15-.66.15-.2.29-.76.96-.93 1.16-.17.2-.34.22-.63.07-.29-.15-1.24-.46-2.36-1.46-.87-.78-1.46-1.74-1.63-2.03-.17-.3-.02-.45.13-.6.13-.13.29-.34.44-.51.15-.17.2-.29.29-.49.1-.2.05-.37-.02-.51-.08-.15-.66-1.6-.91-2.2-.24-.58-.48-.5-.66-.5h-.56c-.2 0-.51.07-.78.37-.27.29-1.02 1-1.02 2.44s1.05 2.83 1.2 3.03c.15.2 2.06 3.16 5 4.43.7.3 1.24.48 1.67.62.7.22 1.34.19 1.84.12.56-.08 1.74-.71 1.98-1.4.25-.68.25-1.27.17-1.4-.07-.13-.26-.2-.55-.35Z" />
            </svg>
          </div>
          <div className="cm-ajuda-texto">
            <strong>Posso ajudar?</strong>
            <span>Tire suas dúvidas no WhatsApp</span>
          </div>
        </div>

        <div className="cm-sidebar-user-card">
          {session?.avatarUrl ? <img src={session.avatarUrl} alt="" className="cm-sidebar-avatar cm-sidebar-avatar-img" /> : <div className="cm-sidebar-avatar">{iniciais(nome)}</div>}
          <div className="cm-sidebar-user-info">
            <strong>Olá, {primeiroNome}</strong>
            <span className="cm-badge-membro">Membro</span>
          </div>
          <button type="button" className="cm-sidebar-logout" onClick={onSair} aria-label="Sair da comunidade" title="Sair da comunidade">
            <LogOut size={15} />
            <span>Sair</span>
          </button>
        </div>
        <p className="cm-sidebar-copy">© 2026 Comunidade meditação raiz</p>
      </div>
    </aside>
  );
}

export default ComunidadeSidebar;
