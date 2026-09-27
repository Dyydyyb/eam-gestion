/**
 * Utilidades para validación y normalización de teléfonos argentinos (+54 9 ...)
 * Requisito: Normalizar automáticamente a 549 + código de área + número, sin 0 ni 15.
 */

export function normalizeArgentinePhone(phone: string): string {
  if (!phone) return "";

  // Remover todo carácter no numérico excepto el signo + inicial
  let cleaned = phone.trim().replace(/[^\d+]/g, "");

  // Si comienza con +, extraer dígitos
  if (cleaned.startsWith("+")) {
    cleaned = cleaned.substring(1);
  }

  // Si ya tiene el prefijo de país 54
  if (cleaned.startsWith("54")) {
    cleaned = cleaned.substring(2);
  }

  // Si tiene el 9 de móvil internacional, quitarlo temporalmente para estandarizar
  if (cleaned.startsWith("9")) {
    cleaned = cleaned.substring(1);
  }

  // Si el usuario ingresó el código con 0 inicial (ej: 011), quitarlo
  if (cleaned.startsWith("0")) {
    cleaned = cleaned.substring(1);
  }

  // Si tiene el '15' de celular local después del código de área de 2 dígitos (ej: 11 15 36373331)
  // o de 3 dígitos (ej: 221 15 ...) o de 4 dígitos (ej: 2225 15 ...)
  if (/^(11)15(\d{8})$/.test(cleaned)) {
    cleaned = cleaned.replace(/^(11)15(\d{8})$/, "$1$2");
  } else if (/^(\d{3})15(\d{7})$/.test(cleaned)) {
    cleaned = cleaned.replace(/^(\d{3})15(\d{7})$/, "$1$2");
  } else if (/^(\d{4})15(\d{6})$/.test(cleaned)) {
    cleaned = cleaned.replace(/^(\d{4})15(\d{6})$/, "$1$2");
  }

  // Ahora 'cleaned' contiene el número nacional (código de área + abonado, exactamente 10 dígitos)
  // Ej: 1136373331 o 2214567890
  return `549${cleaned}`;
}

/** Verifica si un número normalizado es válido en Argentina */
export function isValidArgentinePhone(phone: string): boolean {
  const normalized = normalizeArgentinePhone(phone);
  // Debe comenzar con 549 y tener 10 dígitos posteriores (total 13 dígitos)
  return /^549\d{10}$/.test(normalized);
}

/** Formato amigable para lectura humana en la UI: +54 9 11 3637-3331 */
export function formatArgentinePhoneDisplay(phone: string): string {
  const normalized = normalizeArgentinePhone(phone);
  if (!isValidArgentinePhone(normalized)) return phone;

  const area = normalized.substring(3, 5); // Ej: 11
  const first = normalized.substring(5, 9); // 3637
  const second = normalized.substring(9); // 3331
  return `+54 9 ${area} ${first}-${second}`;
}
