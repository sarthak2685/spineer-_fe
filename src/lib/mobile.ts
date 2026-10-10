export function digitsOnly(value: string) {
  return value.replace(/\D/g, '').slice(0, 10);
}

export function isTenDigitMobile(value: string) {
  return /^[6-9]\d{9}$/.test(value);
}
