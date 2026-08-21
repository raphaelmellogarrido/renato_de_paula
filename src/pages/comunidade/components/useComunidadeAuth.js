import { useEffect, useState } from "react";

export function useComunidadeAuth() {
  const [status, setStatus] = useState(() => {
    // já verifica antes do effect, sem setState
    const email = typeof window !== "undefined" ? localStorage.getItem("user_email") || localStorage.getItem("email") : null;
    return email ? "loading" : "negado";
  });

  useEffect(() => {
    const email = localStorage.getItem("user_email") || localStorage.getItem("email");
    if (!email) return; // já está como negado, não precisa setar

    fetch(`https://renatodepaula.com/api/hotmart/check.php?email=${encodeURIComponent(email)}`)
      .then((res) => res.json())
      .then((data) => {
        setStatus(data.tem_acesso ? "autorizado" : "negado");
      })
      .catch(() => setStatus("negado"));
  }, []);

  return status;
}
