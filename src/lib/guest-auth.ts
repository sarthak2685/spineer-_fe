/** True when the session is a real shop customer (not Guest_* or staff). */
export function isGuestCustomer(user: { role?: string; name?: string } | null | undefined) {
  return Boolean(user && user.role === 'Customer' && !String(user.name || '').startsWith('Guest_'));
}
