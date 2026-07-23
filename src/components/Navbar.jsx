import { useState } from "react";
import { NavLink } from "react-router-dom";

const links = [
  { to: "/", label: "Home" },
  { to: "/cursos", label: "Cursos" },
  { to: "/dores", label: "Dores" },
  { to: "/sobre", label: "Sobre" },
  { to: "/contato", label: "Contato" },
];

function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="navbar">
      <nav className="container">
        <NavLink to="/" className="brand" onClick={() => setOpen(false)}>
          Dr. Renato <span>de Paula</span>
        </NavLink>

        <button className="nav-toggle" onClick={() => setOpen((o) => !o)} aria-label="Abrir menu">
          ☰
        </button>

        <ul className={`nav-links ${open ? "open" : ""}`}>
          {links.map((link) => (
            <li key={link.to}>
              <NavLink to={link.to} end={link.to === "/"} onClick={() => setOpen(false)} className={({ isActive }) => (isActive ? "active" : "")}>
                {link.label}
              </NavLink>
            </li>
          ))}
          <li>
            <NavLink to="/consulta" className="btn btn-primary nav-cta" onClick={() => setOpen(false)}>
              Agendar Consulta
            </NavLink>
          </li>
        </ul>
      </nav>
    </header>
  );
}

export default Navbar;
