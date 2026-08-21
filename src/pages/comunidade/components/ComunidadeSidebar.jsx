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
  { label: "Comunidade", icon: Users, to: "/comunidade/comunidade" },
  // { label: "Meu Progresso", icon: BarChart3, to: "/comunidade/progresso" },
  { label: "Configurações", icon: Settings, to: "/comunidade/configuracoes" },
];

function ComunidadeSidebar({ session, onSair }) {
  const nome = session?.nome || "Aluno";

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
          <NavLink key={item.label} to={item.to} end={item.end} className={({ isActive }) => `cm-sidebar-nav-item ${isActive ? "is-ativo" : ""}`}>
            <item.icon size={18} strokeWidth={1.8} />
            <span>{item.label}</span>
            {item.comBolinha && <span className="cm-sidebar-dot" aria-hidden="true" />}
          </NavLink>
        ))}
      </nav>

      <div className="cm-sidebar-footer">
        <div className="cm-sidebar-user-card">
          <div className="cm-sidebar-avatar">{iniciais(nome)}</div>
          <div className="cm-sidebar-user-info">
            <strong>Olá, {nome.split(" ")[0]}</strong>
            <span className="cm-badge-membro">Membro Presença</span>
          </div>
          <button type="button" className="cm-sidebar-logout" onClick={onSair} aria-label="Sair">
            <LogOut size={15} />
          </button>
        </div>
        <p className="cm-sidebar-copy">© 2026 Clube Presença</p>
      </div>
    </aside>
  );
}

export default ComunidadeSidebar;
