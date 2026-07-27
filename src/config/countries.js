import { allCountries } from 'country-telephone-data'

function toFlagEmoji(iso2) {
  return iso2
    .toUpperCase()
    .replace(/./g, (char) => String.fromCodePoint(127397 + char.charCodeAt(0)))
}

function cleanName(name) {
  return name.replace(/\s*\([^)]*\)\s*$/, '').trim()
}

// A biblioteca fornece uma máscara tipo "+..-..-....-...." (cada ponto é
// um dígito). Contamos os pontos depois do código do país para estimar o
// tamanho real do número nacional — sem isso, países fora do Brasil caem
// num intervalo genérico (6 a 14) frouxo demais (ex: Portugal aceitava
// 6 dígitos quando o certo são 9).
function digitosNacionais(format, dialCode) {
  if (!format) return null
  const totalPontos = (format.match(/\./g) || []).length
  const nacional = totalPontos - dialCode.length
  return nacional > 0 ? nacional : null
}

const seen = new Set()

export const COUNTRIES = allCountries
  .filter((c) => {
    if (seen.has(c.iso2)) return false
    seen.add(c.iso2)
    return true
  })
  .map((c) => ({
    code: c.iso2.toUpperCase(),
    name: c.iso2 === 'br' ? 'Brasil' : cleanName(c.name),
    dial: `+${c.dialCode}`,
    flag: toFlagEmoji(c.iso2),
    hasDDD: c.iso2 === 'br',
    phoneDigits: c.iso2 === 'br' ? 9 : digitosNacionais(c.format, c.dialCode),
  }))
  .sort((a, b) => a.name.localeCompare(b.name))

const brIndex = COUNTRIES.findIndex((c) => c.code === 'BR')
if (brIndex > 0) {
  const [brasil] = COUNTRIES.splice(brIndex, 1)
  COUNTRIES.unshift(brasil)
}
