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
 * (route change + AnimatePresence).
 */
export function scrollToShopContent(el: HTMLElement | null, smooth = true) {
  const run = () => {
    const node = el || document.getElementById('shop-panel');
    if (!node) return;
    node.scrollIntoView({ block: 'start', behavior: smooth ? 'smooth' : 'auto' });
  };
  requestAnimationFrame(() => requestAnimationFrame(run));
}

/** Same as scrollToShopContent, but waits for tab panel animation. */
export function scrollToShopContentLater(el: HTMLElement | null, smooth = true, delayMs = 120) {
  window.setTimeout(() => scrollToShopContent(el, smooth), delayMs);
}
