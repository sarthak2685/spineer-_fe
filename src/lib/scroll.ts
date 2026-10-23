/** Scroll the window to the top of the page. */
export function scrollPageTop(smooth = true) {
  window.scrollTo({ top: 0, left: 0, behavior: smooth ? 'smooth' : 'auto' });
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
