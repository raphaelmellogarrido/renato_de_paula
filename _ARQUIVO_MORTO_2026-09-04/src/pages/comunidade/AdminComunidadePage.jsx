import AdminMeditacao from "../AdminMeditacao";

// Reusa o painel de /admin inteiro dentro da comunidade — mesmo componente,
// mesmo gate de ADMIN_SECRET, sem duplicar os ~1300 lines de JSX dele.
// AdminMeditacao usa classes do site (.section/.container/.btn), não as
// cm-* da comunidade, então o visual destoa um pouco do resto — aceito, é
// o mesmo painel de sempre só que acessível sem sair da comunidade.
function AdminComunidadePage() {
  return <AdminMeditacao />;
}

export default AdminComunidadePage;
