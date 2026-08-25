import { NavLink } from "react-router-dom";
import { Home, Library, Users, Settings, Leaf, LogOut } from "lucide-react";

function iniciais(nome) {
  return nome
    .split(" ")
    .slice(0, 2)
    .map((parte) => parte[0])
    .join("")
    .toUpperCase();
}

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
  const nome = session?.nome || "Aluno";
  // Saudação usa "Primeiro nome" (Configuracoes.jsx) quando salvo — sem
  // isso a sidebar ficava presa na 1ª palavra de "Nome e sobrenome" mesmo
  // depois de editar "Primeiro nome" separadamente. Iniciais continuam
  // vindo do nome completo, que é outro campo.
  const primeiroNome = session?.primeiroNome || nome.split(" ")[0];

  return (
    <aside className="cm-sidebar-left">
      <div className="cm-sidebar-brand">
        <span className="cm-sidebar-brand-icon">
          <Leaf size={18} />
        </span>
        <div>
          <strong>Meditação raiz</strong>
          <span>POR DR. RENATO DE PAULA</span>
        </div>
      </div>

      <nav className="cm-sidebar-nav">
        {NAV_ITEMS.map((item) => (
          <NavLink key={item.label} to={item.to} end={item.end} aria-label={item.label} className={({ isActive }) => `cm-sidebar-nav-item ${isActive ? "is-ativo" : ""}`}>
            <item.icon size={18} strokeWidth={1.8} />
            <span>{item.label}</span>
            {item.comBolinha && <span className="cm-sidebar-dot" aria-hidden="true" />}
          </NavLink>
        ))}
      </nav>

      <div className="cm-sidebar-footer">
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
          {session?.avatarUrl ? (
            <img src={session.avatarUrl} alt="" className="cm-sidebar-avatar cm-sidebar-avatar-img" />
          ) : (
            <div className="cm-sidebar-avatar">{iniciais(nome)}</div>
          )}
          <div className="cm-sidebar-user-info">
            <strong>Olá, {primeiroNome}</strong>
            <span className="cm-badge-membro">Membro da comunidade</span>
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
