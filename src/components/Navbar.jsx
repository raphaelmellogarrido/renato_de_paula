import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";

const HOTMART_LINK = "https://go.hotmart.com/I99615540I?dp=1";

const links = [
  { to: "/", label: "Home" },
  // { to: "/cursos", label: "Cursos" },
  // { to: "/triagem", label: "Triagem do Saber" },
  { to: "/meditacao", label: "Meditação" },
  // { to: "/sobre", label: "Sobre" },
  { to: "/contato", label: "Contato" },
];

function Navbar() {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  const isMeditacao = pathname === "/meditacao";

  function handleNavClick() {
    setOpen(false);
    window.scrollTo(0, 0);
  }

  return (
    <header className="navbar">
      <nav className="container">
        <NavLink to="/" className="brand" onClick={handleNavClick}>
          Dr. Renato <span>de Paula</span>
        </NavLink>

        <button className="nav-toggle" onClick={() => setOpen((o) => !o)} aria-label="Abrir menu">
          ☰
        </button>

        <ul className={`nav-links ${open ? "open" : ""}`}>
          {links.map((link) => (
            <li key={link.to}>
              <NavLink to={link.to} end={link.to === "/"} onClick={handleNavClick} className={({ isActive }) => (isActive ? "active" : "")}>
                {link.label}
              </NavLink>
            </li>
          ))}
          <li>
            <a
              href={isMeditacao ? HOTMART_LINK : "https://wa.me/5521976624767"}
              target={isMeditacao ? "_blank" : undefined}
              rel={isMeditacao ? "noreferrer" : "noopener noreferrer"}
              className="btn btn-primary nav-cta"
              onClick={handleNavClick}
            >
              {isMeditacao ? "Comece a meditar" : "Agendar Consulta"}
            </a>
          </li>
        </ul>
      </nav>
    </header>
  );
}

export default Navbar;
