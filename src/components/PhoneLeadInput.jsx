import { useState } from "react";
import { PhoneInput } from "react-international-phone";
import "react-international-phone/style.css";

// react-international-phone (v4.8, a mais recente) não exporta mais
// `isPhoneValid` — a validação foi removida da lib nas versões atuais, o
// jeito oficial recomendado agora é plugar google-libphonenumber por fora.
// Pra não trazer essa dependência extra só por causa de 2 países, mantém
// a mesma regra específica que já existia (BR: 11 dígitos após o DDI; PT: 9
// dígitos começando com 9) direto em cima do valor completo (+DDI+número)
// que o PhoneInput devolve, com um fallback genérico pros demais países.
function isPhoneValid(phone) {
  const digitos = phone.replace(/\D/g, "");
  if (digitos.startsWith("55")) return digitos.length === 13; // 55 + DDD(2) + 9 dígitos
  if (digitos.startsWith("351")) return digitos.length === 12 && digitos[3] === "9";
  return digitos.length >= 8 && digitos.length <= 15;
}

// Campo de WhatsApp com dropdown de país (bandeira SVG, 200+ países) e botão
// de liberar abaixo — usado na gate "Desbloqueio Consciente" entre Mito 1 e
// Mito 2 de /mitos. Não faz fetch nem toca localStorage: só valida e delega
// o resultado pro onSubmit de quem chamou — onSubmit({ whatsapp, country }),
// igual antes.
function PhoneLeadInput({ onSubmit, submitLabel = "Liberar meu próximo vídeo →" }) {
  const [phone, setPhone] = useState("");
  const [country, setCountry] = useState("BR");
  const [enviando, setEnviando] = useState(false);

  const valido = isPhoneValid(phone);

  // onSubmit hoje (Meditacao.jsx) é síncrono, mas se algum dia passar a
  // devolver uma Promise o botão já mostra loading corretamente enquanto
  // ela não resolve — sem precisar mexer aqui de novo.
  async function handleSubmit(e) {
    e.preventDefault();
    if (!valido || enviando) return;

    const resultado = onSubmit({ whatsapp: phone, country });
    if (resultado && typeof resultado.then === "function") {
      setEnviando(true);
      try {
        await resultado;
      } finally {
        setEnviando(false);
      }
    }
  }

  return (
    <form className="phone-lead-input" onSubmit={handleSubmit} noValidate>
      <PhoneInput
        defaultCountry="br"
        value={phone}
        onChange={(value, meta) => {
          setPhone(value);
          setCountry(meta.country.iso2.toUpperCase());
        }}
      />

      <button type="submit" className="phone-lead-submit" disabled={!valido || enviando}>
        {enviando ? "Liberando…" : submitLabel}
      </button>

      <p className="phone-lead-trust">🔒 Sem spam. Só aviso do desafio + áudio do Renato.</p>
    </form>
  );
}

export default PhoneLeadInput;
