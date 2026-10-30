/** Sticky shop bar height (play ~168, other tabs ~136) + small buffer. */
export const SHOP_STICKY_OFFSET = 176;

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
export function scrollToShopContent(el: HTMLElement | null, smooth = true, offsetPx = SHOP_STICKY_OFFSET) {
  const run = () => {
    const node = el || document.getElementById('shop-panel');
    if (!node) return;
    const top = node.getBoundingClientRect().top + window.scrollY - offsetPx;
    window.scrollTo({ top: Math.max(0, top), behavior: smooth ? 'smooth' : 'auto' });
  };
  requestAnimationFrame(() => requestAnimationFrame(run));
}

/** Same as scrollToShopContent, but waits for tab panel animation (~280ms). */
export function scrollToShopContentLater(el: HTMLElement | null, smooth = true, delayMs = 320) {
  window.setTimeout(() => scrollToShopContent(el, smooth), delayMs);
}
