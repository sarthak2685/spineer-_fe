function withProtocol(value?: string | null) {
  const text = String(value || '').trim();
  if (!text) return '';
  return /^https?:\/\//i.test(text) ? text : `https://${text}`;
}

function hostOf(href: string) {
  try {
    return new URL(href).hostname.replace(/^www\./i, '').toLowerCase();
  } catch {
    return '';
  }
}

function pathOf(href: string) {
  try {
    const path = new URL(href).pathname.replace(/\/+$/, '');
    return path === '/' ? '' : path;
  } catch {
    return '';
  }
}

const hosts: Record<string, RegExp> = {
  instagram: /(^|\.)instagram\.com$/i,
  facebook: /(^|\.)(facebook\.com|fb\.com|fb\.me)$/i,
  twitter: /(^|\.)(twitter\.com|x\.com)$/i,
  youtube: /(^|\.)(youtube\.com|youtu\.be)$/i,
};

/** Returns a safe profile URL for the network, or empty if missing / wrong host / bare homepage. */
export function socialHref(kind: keyof typeof hosts | 'website', value?: string | null) {
  const href = withProtocol(value);
  if (!href) return '';
  if (kind === 'website') return href;
  const host = hostOf(href);
  if (!host || !hosts[kind].test(host)) return '';
  // Bare network homepage (placeholders) — hide the icon.
  if (!pathOf(href) && !new URL(href).search) return '';
  return href;
}

export function websiteHref(value?: string | null) {
  return socialHref('website', value);
}
