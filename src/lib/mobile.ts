export function digitsOnly(value: string) {
  return value.replace(/\D/g, '').slice(0, 10);
}

export function isTenDigitMobile(value: string) {
  return /^[6-9]\d{9}$/.test(value);
}

/** Strip non-digits from any phone-like string (no length cap). */
export function phoneDigits(value?: string | null) {
  return String(value || '').replace(/\D/g, '');
}

/** Normalize to E.164-ish digits for India-first shops (no leading +). */
export function e164Digits(value?: string | null) {
  let digits = phoneDigits(value);
  if (!digits) return '';
  if (digits.length === 10) return `91${digits}`;
  if (digits.length === 11 && digits.startsWith('0')) return `91${digits.slice(1)}`;
  if (digits.startsWith('91') && digits.length >= 12) return digits;
  return digits;
}

export function telHref(value?: string | null) {
  const digits = e164Digits(value);
  return digits ? `tel:+${digits}` : '';
}

export function waHref(value?: string | null) {
  const digits = e164Digits(value);
  return digits ? `https://wa.me/${digits}` : '';
}
