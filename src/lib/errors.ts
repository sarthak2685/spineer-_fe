/** Turn API / network noise into a short, professional user-facing line. */
export function friendlyError(raw: unknown, fallback = 'Something went wrong. Please try again.'): string {
  const text = normalizeMessage(raw).trim();
  if (!text) return fallback;

  const lower = text.toLowerCase();

  if (
    /syntax error|invalid input syntax|error:\s*syntax|postgresql|pg_|sqlstate|relation ["'].+["'] does not exist|column ["'].+["'] does not exist|duplicate key value|violates (foreign key|unique|not-null|check) constraint|queryfailederror|typeerror:|referenceerror:|cannot read propert|unexpected token|econnrefused|enotfound|etimedout|socket hang up|internal server error|nestjs|exception|stack trace|at\s+\w+\s+\(|\/src\/|node_modules/i.test(lower)
    || text.length > 160
    || /^error\s*:/i.test(text)
    || /[{}\[\]]/.test(text) && /message|statusCode|error/.test(lower)
  ) {
    return fallback;
  }

  if (/failed to fetch|networkerror|load failed|network request failed/i.test(lower)) {
    return 'Unable to connect. Please check your internet and try again.';
  }
  if (/timed?\s*out|abort/i.test(lower)) {
    return 'The request took too long. Please try again.';
  }
  if (/unauthorized|invalid (mobile|credentials|password)|wrong password/i.test(lower)) {
    return text.length <= 120 ? text : 'Invalid mobile number or password.';
  }
  if (/forbidden|not allowed|paused|deleted/i.test(lower)) {
    return text.length <= 120 ? text : 'You do not have permission to do that.';
  }
  if (/too many/i.test(lower)) {
    return text.length <= 120 ? text : 'Too many attempts. Please wait a moment and try again.';
  }

  // Keep short, human BadRequest-style copy from the API.
  if (text.length <= 120 && !/[`<>]/.test(text) && !/\b(select|insert|update|delete from|alter table)\b/i.test(text)) {
    return text;
  }

  return fallback;
}

function normalizeMessage(raw: unknown): string {
  if (raw == null) return '';
  if (typeof raw === 'string') return raw;
  if (Array.isArray(raw)) return raw.map((item) => normalizeMessage(item)).filter(Boolean).join('. ');
  if (typeof raw === 'object') {
    const obj = raw as { message?: unknown; error?: unknown };
    if (obj.message != null) return normalizeMessage(obj.message);
    if (obj.error != null) return normalizeMessage(obj.error);
  }
  return String(raw);
}
