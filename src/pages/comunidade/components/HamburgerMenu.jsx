import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { Home, Library, Mail, Settings, Shield, LogOut } from "lucide-react";
import { isAdminEmail } from "./isAdmin";

function iniciais(nome) {
  return nome
    .split(" ")
    .slice(0, 2)
    .map((parte) => parte[0])
    .join("")
    .toUpperCase();
}

// Menu mobile (<=768px, ver ComunidadeApp.css) — bug relatado: a sidebar
// inteira (nav em ícones + card do usuário com nome/badge/Sair) virava uma
// topbar espremida numa linha só em telas de 375px. Aqui vira um botão
// hamburger fixo no topbar (ComunidadeSidebar.jsx) que abre um drawer com
// toda a navegação — no desktop este componente inteiro fica invisível
// (a sidebar comum, ao lado, já cobre tudo lá).
// mensagensNaoLidas vem por prop (ComunidadeSidebar.jsx já chama
// useMensagensNaoLidas para o card "Mensagens" dela) — evitar 2 polling
// independentes (1 aqui, 1 lá) batendo no endpoint a cada 5s.
function HamburgerMenu({ session, onSair, mensagensNaoLidas }) {
  const [open, setOpen] = useState(false);
  const admin = isAdminEmail(session?.email);
  const nome = session?.nome || "Aluno";
  const primeiroNome = session?.primeiroNome || nome.split(" ")[0];

  // Trava o scroll da página por trás enquanto o drawer está aberto.
  useEffect(() => {
    if (!open) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, [open]);

  function fechar() {
    setOpen(false);
  }

  function sairEFechar() {
    fechar();
    onSair();
  }

  return (
    <>
      {/* HEADER MOBILE FINAL (26/08): hamburger + badge + "Olá, Nome"
          centralizado + avatar, sempre visíveis no topbar (ver grid em
          .cm-header-mobile-final no ComunidadeApp.css). Só o toggle do
          drawer abaixo é reaproveitado — layout de fora é novo. */}
      <div className="cm-header-mobile-final">
        <button type="button" className="cm-hamburger-btn" aria-label="Abrir menu" onClick={() => setOpen(true)}>
          <span />
          <span />
          <span />
        </button>

        <span className="cm-badge-membro-topo">Membro da comunidade</span>

        <div className="ola-wrapper">
          <span className="ola-nome">Olá, {primeiroNome}</span>
        </div>

        {session?.avatarUrl ? (
          <img src={session.avatarUrl} alt="" className="cm-sidebar-avatar cm-sidebar-avatar-img cm-header-mobile-avatar" />
        ) : (
          <div className="cm-sidebar-avatar cm-header-mobile-avatar">{iniciais(nome)}</div>
        )}
      </div>

      {open && <div className="cm-hamburger-overlay" onClick={fechar} aria-hidden="true" />}

      <div className={`cm-hamburger-drawer ${open ? "is-open" : ""}`} role="dialog" aria-modal="true" aria-label="Menu">
        <div className="cm-hamburger-header">
          {session?.avatarUrl ? (
            <img src={session.avatarUrl} alt="" className="cm-sidebar-avatar cm-sidebar-avatar-img" />
          ) : (
            <div className="cm-sidebar-avatar">{iniciais(nome)}</div>
          )}
          <div>
            <strong>Olá, {primeiroNome}</strong>
            <span className="cm-badge-membro">Membro da comunidade</span>
          </div>
        </div>

        <nav className="cm-hamburger-nav">
          <NavLink to="/comunidade" end onClick={fechar} className={({ isActive }) => `cm-hamburger-link ${isActive ? "is-ativo" : ""}`}>
            <Home size={18} strokeWidth={1.8} />
            <span>Início</span>
          </NavLink>

          <NavLink to="/comunidade/aulas-raiz" onClick={fechar} className={({ isActive }) => `cm-hamburger-link ${isActive ? "is-ativo" : ""}`}>
            <Library size={18} strokeWidth={1.8} />
            <span>Aulas</span>
          </NavLink>

          <NavLink to="/comunidade/mensagens" onClick={fechar} className={({ isActive }) => `cm-hamburger-link ${isActive ? "is-ativo" : ""}`}>
            <Mail size={18} strokeWidth={1.8} />
            <span>Mensagens</span>
            {mensagensNaoLidas > 0 && (
              <span className="cm-hamburger-badge" aria-label={`${mensagensNaoLidas} mensagens não lidas`}>
                {mensagensNaoLidas > 9 ? "9+" : mensagensNaoLidas}
              </span>
            )}
          </NavLink>

          <NavLink to="/comunidade/configuracoes" onClick={fechar} className={({ isActive }) => `cm-hamburger-link ${isActive ? "is-ativo" : ""}`}>
            <Settings size={18} strokeWidth={1.8} />
            <span>Configurações</span>
          </NavLink>

          {admin && (
            <NavLink to="/comunidade/admin" onClick={fechar} className={({ isActive }) => `cm-hamburger-link ${isActive ? "is-ativo" : ""}`}>
              <Shield size={18} strokeWidth={1.8} />
              <span>Admin</span>
            </NavLink>
          )}
        </nav>

        <div className="cm-hamburger-footer">
          <button
            type="button"
            className="cm-hamburger-whatsapp"
            onClick={() => {
              fechar();
              window.open("https://wa.me/5521976624767?text=Olá, preciso de ajuda na Comunidade Meditação Raiz", "_blank");
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20.52 3.48A11.94 11.94 0 0 0 12.04 0C5.5 0 .2 5.3.2 11.85c0 2.09.55 4.13 1.6 5.93L0 24l6.4-1.68a11.86 11.86 0 0 0 5.64 1.44h.01c6.54 0 11.85-5.3 11.85-11.85 0-3.17-1.23-6.14-3.38-8.43ZM12.05 21.6h-.01a9.8 9.8 0 0 1-5-1.37l-.36-.21-3.8 1 1.01-3.7-.23-.38a9.75 9.75 0 0 1-1.5-5.18c0-5.4 4.4-9.79 9.8-9.79 2.62 0 5.08 1.02 6.93 2.87a9.72 9.72 0 0 1 2.87 6.92c0 5.4-4.4 9.79-9.8 9.79Zm5.37-7.34c-.29-.15-1.74-.86-2.01-.96-.27-.1-.47-.15-.66.15-.2.29-.76.96-.93 1.16-.17.2-.34.22-.63.07-.29-.15-1.24-.46-2.36-1.46-.87-.78-1.46-1.74-1.63-2.03-.17-.3-.02-.45.13-.6.13-.13.29-.34.44-.51.15-.17.2-.29.29-.49.1-.2.05-.37-.02-.51-.08-.15-.66-1.6-.91-2.2-.24-.58-.48-.5-.66-.5h-.56c-.2 0-.51.07-.78.37-.27.29-1.02 1-1.02 2.44s1.05 2.83 1.2 3.03c.15.2 2.06 3.16 5 4.43.7.3 1.24.48 1.67.62.7.22 1.34.19 1.84.12.56-.08 1.74-.71 1.98-1.4.25-.68.25-1.27.17-1.4-.07-.13-.26-.2-.55-.35Z" />
            </svg>
            <span>Tire suas dúvidas no WhatsApp</span>
          </button>

          <button type="button" className="cm-hamburger-sair" onClick={sairEFechar}>
            <LogOut size={16} strokeWidth={1.8} />
            <span>Sair</span>
          </button>
        </div>
      </div>
    </>
  );
}

export default HamburgerMenu;
