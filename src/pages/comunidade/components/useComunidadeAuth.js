import { useState, useEffect } from "react";

export function limparSessao() {
  localStorage.removeItem("comunidade_session");
  localStorage.removeItem("user_email");
  localStorage.removeItem("comunidade_email");
}

export function useComunidadeAuth() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("comunidade_session");
      if (raw) {
        const parsed = JSON.parse(raw);
        setSession(parsed);
      } else {
        const email = localStorage.getItem("user_email");
        if (email) setSession({ email });
      }
    } catch {}
    setLoading(false);
  }, []);

  return { session, loading };
}

export default useComunidadeAuth;
