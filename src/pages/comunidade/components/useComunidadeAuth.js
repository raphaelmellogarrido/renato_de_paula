import { useState } from "react";

// Sessão fake da Fase 1: só localStorage, sem backend. Serve pra dar o
// "gate" de acesso (não dá pra entrar em /comunidade sem logar) enquanto o
// login real (validando compra Hotmart via Supabase/MySQL) não é plugado.
const STORAGE_KEY = "comunidade_session";

export function getSessao() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function salvarSessao(usuario) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(usuario));
}

export function limparSessao() {
  localStorage.removeItem(STORAGE_KEY);
}

export default function useComunidadeAuth() {
  // Leitura do localStorage é síncrona, então o estado inicial já resolve
  // a sessão sem precisar de um efeito à parte (evita render em cascata).
  const [session] = useState(() => getSessao());
  return { session, loading: false };
}
