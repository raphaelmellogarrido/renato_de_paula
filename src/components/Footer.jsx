import { Link } from "react-router-dom";

function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div>
          <h3>Dr. Renato de Paula</h3>
          <p style={{ maxWidth: 260 }}>Médico dedicado à prevenção, escuta ativa e educação em saúde.</p>
        </div>

        <div>
          <h3>Navegação</h3>
          <ul className="footer-links">
            <li>
              <Link to="/">Home</Link>
            </li>
            <li>
              <Link to="/meditacao">Meditação</Link>
            </li>
            {/* <li>
              <Link to="/sobre">Sobre</Link>
            </li> */}
            <li>
              <Link to="/contato">Contato</Link>
            </li>
            <li>
              <a href="https://wa.me/5521976624767" target="_blank" rel="noreferrer">
                Agendar consulta
              </a>
            </li>
            <li>
              <a href="https://go.hotmart.com/I99615540I?dp=1" target="_blank" rel="noreferrer">
                Quero aprender a meditar
              </a>
            </li>
          </ul>
        </div>

        <div>
          <h3>Contato</h3>
          <ul className="footer-links">
            <li>
              <a href="https://wa.me/+5521976624767" target="_blank" rel="noreferrer">
                WhatsApp
              </a>
            </li>
            <li>
              <a href="https://www.instagram.com/dr.renatodepaula/" target="_blank" rel="noreferrer">
                Instagram
              </a>
            </li>
            <li>
              <a href="mailto:contato@renatodepaula.com">contato@renatodepaula.com</a>
            </li>
          </ul>
        </div>

        <div>
          <h3>Credenciais</h3>
          <p style={{ maxWidth: 260 }}>
            CRM-RJ 52.011743-8
            <br />
            Pós-graduado em Nefrologia
          </p>
        </div>
      </div>

      <div className="footer-bottom">© {new Date().getFullYear()} Dr. Renato Silva de Paula. Todos os direitos reservados. O conteúdo deste site tem caráter informativo e não substitui uma consulta médica.</div>
    </footer>
  );
}

export default Footer;
