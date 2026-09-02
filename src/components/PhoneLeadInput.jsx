import { useState } from "react";

// Lista curta de países (não a lista inteira de src/config/countries.js —
// aquela vem de country-telephone-data e não tem essas regras de máscara
// específicas por país). Adicionar país novo = adicionar uma linha aqui.
const PHONE_COUNTRIES = [
  { code: "BR", dial: "55", flag: "🇧🇷", name: "Brasil" },
  { code: "PT", dial: "351", flag: "🇵🇹", name: "Portugal" },
  { code: "US", dial: "1", flag: "🇺🇸", name: "Estados Unidos" },
  { code: "ES", dial: "34", flag: "🇪🇸", name: "Espanha" },
  { code: "AR", dial: "54", flag: "🇦🇷", name: "Argentina" },
];

const GENERIC_MIN_DIGITS = 8;
const GENERIC_MAX_DIGITS = 15;

function onlyDigits(value) {
  return value.replace(/\D/g, "");
}

function maxDigits(countryCode) {
  if (countryCode === "BR") return 11; // 2 DDD + 9
  if (countryCode === "PT") return 9;
  return GENERIC_MAX_DIGITS;
}

// BR: 11 dígitos (2 DDD + 9). PT: 9 dígitos começando com 9. Resto: livre,
// só quantidade de dígitos (8 a 15).
function isValid(countryCode, digits) {
  if (countryCode === "BR") return digits.length === 11;
  if (countryCode === "PT") return digits.length === 9 && digits.startsWith("9");
  return digits.length >= GENERIC_MIN_DIGITS && digits.length <= GENERIC_MAX_DIGITS;
}

function placeholderFor(countryCode) {
  if (countryCode === "BR") return "(11) 9____-____";
  if (countryCode === "PT") return "912 345 678";
  return "Número de WhatsApp";
}

// Formata só pra exibição — o valor "real" usado na validação/envio é
// sempre onlyDigits(input), a máscara aqui é cosmética.
function formatDisplay(countryCode, digits) {
  if (countryCode === "BR") {
    const ddd = digits.slice(0, 2);
    const resto = digits.slice(2);
    if (!ddd) return "";
    let out = `(${ddd}`;
    if (digits.length > 2) out += `) ${resto.slice(0, 5)}`;
    if (digits.length > 7) out += `-${resto.slice(5, 9)}`;
    return out;
  }
  if (countryCode === "PT") {
    return [digits.slice(0, 3), digits.slice(3, 6), digits.slice(6, 9)].filter(Boolean).join(" ");
  }
  return digits;
}

// Campo de WhatsApp com select de país (bandeira + código) à esquerda e
// botão de liberar ao lado — usado na gate "Desbloqueio Consciente" entre
// Mito 1 e Mito 2 de /mitos. Não faz fetch nem toca localStorage: só valida
// e formata, e delega o resultado pro onSubmit de quem chamou.
function PhoneLeadInput({ onSubmit, submitLabel = "Liberar meu próximo vídeo →" }) {
  const [countryCode, setCountryCode] = useState("BR");
  const [digits, setDigits] = useState("");

  const country = PHONE_COUNTRIES.find((c) => c.code === countryCode);
  const valido = isValid(countryCode, digits);

  function handleCountryChange(e) {
    setCountryCode(e.target.value);
    setDigits("");
  }

  function handleDigitsChange(e) {
    setDigits(onlyDigits(e.target.value).slice(0, maxDigits(countryCode)));
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!valido) return;
    onSubmit({ whatsapp: `+${country.dial}${digits}`, country: countryCode });
  }

  return (
    <form className="phone-lead-input" onSubmit={handleSubmit} noValidate>
      <div className="phone-lead-input-row">
        <div className="phone-lead-input-country">
          <span className="phone-lead-input-flag" aria-hidden="true">
            {country.flag}
          </span>
          <select value={countryCode} onChange={handleCountryChange} aria-label="País">
            {PHONE_COUNTRIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.flag} +{c.dial}
              </option>
            ))}
          </select>
        </div>
        <input
          type="tel"
          inputMode="numeric"
          className={`phone-lead-input-number ${valido ? "valid" : ""}`}
          value={formatDisplay(countryCode, digits)}
          onChange={handleDigitsChange}
          placeholder={placeholderFor(countryCode)}
          aria-label="Número de WhatsApp"
        />
        <button type="submit" className="phone-lead-submit" disabled={!valido}>
          {submitLabel}
        </button>
      </div>
      <p className="phone-lead-trust">🔒 Sem spam. Só aviso do desafio + áudio do Renato.</p>
    </form>
  );
}

export default PhoneLeadInput;
