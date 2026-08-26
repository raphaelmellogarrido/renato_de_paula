import { Navigate } from "react-router-dom";
import useComunidadeAuth from "./useComunidadeAuth";
import { isAdminEmail } from "./isAdmin";

// Gate de UX/roteamento — esconde a tela de quem não é admin (e evita
// achar por digitar a URL). NÃO é a proteção de dados de verdade: a sessão
// da comunidade é 100% client-side (localStorage, ver useComunidadeAuth),
// então um e-mail aqui é só o que o navegador diz que é. A proteção real
// dos dados continua sendo a ADMIN_SECRET que o próprio AdminMeditacao.jsx
// já pede (header X-Admin-Secret, checado com hash_equals no PHP).
function AdminGuard({ children }) {
  const { session } = useComunidadeAuth();

  if (!isAdminEmail(session?.email)) {
    return <Navigate to="/comunidade" replace />;
  }

  return children;
}

export default AdminGuard;
