/** Fallback when `--shop-sticky-bar` is not set yet (play/menu ~220, bill/review ~140). */
export const SHOP_STICKY_OFFSET = 176;

/** Live sticky bar height published by PlaceFrame as `--shop-sticky-bar`. */
export function getShopStickyOffset() {
  if (typeof document === 'undefined') return SHOP_STICKY_OFFSET;
  const raw = getComputedStyle(document.documentElement).getPropertyValue('--shop-sticky-bar').trim();
  const parsed = Number.parseFloat(raw);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : SHOP_STICKY_OFFSET;
}

/** Scroll the window to the top of the page. */
export function scrollPageTop(smooth = true) {
  const behavior = smooth ? 'smooth' : 'auto';
  window.scrollTo({ top: 0, left: 0, behavior });
  // WebKit / some mobile browsers ignore window.scrollTo alone when layout just changed.
  if (!smooth) {
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }
}

/**
 * Scroll a shop content panel into view after layout settles
 * (route change + AnimatePresence), clearing the sticky header.
 */
export function scrollToShopContent(el: HTMLElement | null, smooth = true, offsetPx = getShopStickyOffset()) {
  const run = () => {
    const node = el || document.getElementById('shop-panel');
    if (!node) return;
    const top = node.getBoundingClientRect().top + window.scrollY - offsetPx;
    window.scrollTo({ top: Math.max(0, top), behavior: smooth ? 'smooth' : 'auto' });
  };
  requestAnimationFrame(() => requestAnimationFrame(run));
}

/** Same as scrollToShopContent, but waits for tab panel animation (~280ms). */
export function scrollToShopContentLater(el: HTMLElement | null, smooth = true, delayMs = 320, offsetPx?: number) {
  window.setTimeout(() => scrollToShopContent(el, smooth, offsetPx ?? getShopStickyOffset()), delayMs);
}
