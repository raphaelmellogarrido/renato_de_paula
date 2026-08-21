import { NavLink } from "react-router-dom";
import { Home, Library, CalendarDays, Video, Users, BarChart3, Settings, Leaf, LogOut } from "lucide-react";

function iniciais(nome) {
  return nome
    .split(" ")
    .slice(0, 2)
    .map((parte) => parte[0])
    .join("")
    .toUpperCase();
}

// Itens de navegação da referência. Só "Início" tem uma rota construída
// nesta fase — os demais ficam visualmente prontos (facilita a Fase 2)
// mas levam de volta ao dashboard em vez de gerar links quebrados.
// Todos apontam para /comunidade nesta fase (só o dashboard existe), então
// usam `end` para só ficarem ativos quando a rota é exatamente essa —
// sem isso, qualquer subrota (ex: /comunidade/aula/dia-0) acenderia todos
// os itens ao mesmo tempo.
const NAV_ITEMS = [
  { label: "Início", icon: Home, to: "/comunidade" },
  { label: "Aulas meditação raiz", icon: Library, to: "/comunidade" },
  { label: "Meditações da Semana", icon: CalendarDays, to: "/comunidade" },
  { label: "Ao Vivo", icon: Video, to: "/comunidade", comBolinha: true },
  { label: "Comunidade", icon: Users, to: "/comunidade" },
  { label: "Meu Progresso", icon: BarChart3, to: "/comunidade" },
  { label: "Configurações", icon: Settings, to: "/comunidade" },
];

// Sidebar esquerda fixa (280px), igual à referência "Clube Presença":
// logo, navegação e card do usuário no rodapé.
function ComunidadeSidebar({ session, onSair }) {
  const nome = session?.nome || "Aluno";

  return (
    <aside className="cm-sidebar-left">
      <div className="cm-sidebar-brand">
        <span className="cm-sidebar-brand-icon">
          <Leaf size={18} />
        </span>
        <div>
          <strong>Clube Presença</strong>
          <span>POR DR. RENATO DE PAULA</span>
        </div>
      </div>

      <nav className="cm-sidebar-nav">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.label}
            to={item.to}
            end
            // Todos os itens apontam pra "/comunidade" nesta fase (só o
            // dashboard existe de verdade) — se deixássemos o NavLink decidir
            // sozinho, TODOS ficariam "ativos" ao mesmo tempo quando a rota
            // bate (mesmo `to`, mesmo `end`). Só "Início" deve acender;
            // os demais ficam sempre no estado neutro (cinza), igual à
            // referência, mesmo sendo clicáveis.
            className={({ isActive }) => `cm-sidebar-nav-item ${isActive && item.label === "Início" ? "is-ativo" : ""}`}
          >
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
        <p className="cm-sidebar-copy">© 2025 Clube Presença</p>
      </div>
    </aside>
  );
}

export default ComunidadeSidebar;
