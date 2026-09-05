// Reservas do card "Próximo encontro ao vivo" — GET/POST/DELETE tentam
// sempre o back-end real primeiro (public/api/live/reservas.php, mesmo
// padrão mysqli dos outros endpoints em public/api/hotmart/*.php). Se a
// chamada falhar (típico em `npm run dev` local, sem PHP rodando), cai pro
// localStorage no MESMO formato de resposta — então trocar pro back-end de
// verdade depois é só isso: a chamada parar de cair no catch, nada no
// componente precisa mudar.
const RESERVAS_URL = "/api/live/reservas.php";

function chaveLista(eventId) {
  return `reservas_${eventId}`;
}

function chaveMinhaReserva(email, eventId) {
  return `minha_reserva_${email}_${eventId}`;
}

function lerListaLocal(eventId) {
  try {
    return JSON.parse(localStorage.getItem(chaveLista(eventId)) || "[]");
  } catch {
    return [];
  }
}

function salvarListaLocal(eventId, lista) {
  try {
    localStorage.setItem(chaveLista(eventId), JSON.stringify(lista));
  } catch {
    // localStorage indisponível (modo privado etc.) — segue só em memória.
  }
}

function marcarMinhaReservaLocal(email, eventId, valor) {
  try {
    localStorage.setItem(chaveMinhaReserva(email, eventId), valor ? "true" : "false");
  } catch {
    // idem acima.
  }
}

function inicialDe(nome) {
  const letra = (nome || "").trim().charAt(0);
  return letra ? letra.toUpperCase() : "?";
}

function montarSnapshot(lista, email) {
  return {
    total: lista.length,
    usuarios: lista.slice(0, 3).map((u) => ({ display_name: u.display_name, inicial: inicialDe(u.display_name) })),
    euReservei: email ? lista.some((u) => u.email === email) : false,
  };
}

// Leitura 100% síncrona do cache local — usada como valor inicial do
// useState no componente, pra não esperar a rede antes do primeiro render
// (mesmo motivo de useEmailSessao() ler localStorage direto no lazy
// initializer em vez de num useEffect).
export function snapshotLocalSincrono(eventId, email) {
  return montarSnapshot(lerListaLocal(eventId), email);
}

export async function buscarReservas(eventId, email) {
  try {
    const url = `${RESERVAS_URL}?event_id=${encodeURIComponent(eventId)}${email ? `&email=${encodeURIComponent(email)}` : ""}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("back-end de reservas indisponível");
    return await res.json();
  } catch {
    return montarSnapshot(lerListaLocal(eventId), email);
  }
}

export async function reservarVaga(eventId, email, displayName) {
  try {
    const res = await fetch(RESERVAS_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event_id: eventId, user_email: email, display_name: displayName }),
    });
    if (!res.ok) throw new Error("back-end de reservas indisponível");
    return await res.json();
  } catch {
    const lista = lerListaLocal(eventId);
    if (!lista.some((u) => u.email === email)) {
      lista.push({ email, display_name: displayName });
      salvarListaLocal(eventId, lista);
    }
    marcarMinhaReservaLocal(email, eventId, true);
    return montarSnapshot(lista, email);
  }
}

export async function cancelarReserva(eventId, email) {
  try {
    const res = await fetch(RESERVAS_URL, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event_id: eventId, user_email: email }),
    });
    if (!res.ok) throw new Error("back-end de reservas indisponível");
    return await res.json();
  } catch {
    const lista = lerListaLocal(eventId).filter((u) => u.email !== email);
    salvarListaLocal(eventId, lista);
    marcarMinhaReservaLocal(email, eventId, false);
    return montarSnapshot(lista, email);
  }
}
