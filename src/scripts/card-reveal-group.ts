class CardRevealGroup extends HTMLElement {
  private cards: HTMLElement[] = [];
  private listeners?: AbortController;
  private reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  private hover = matchMedia('(any-hover: hover)');
  private target?: { x: number; y: number };
  private x = 0;
  private y = 0;
  private frame = 0;
  private lastTime = 0;

  connectedCallback() {
    this.cards = Array.from(this.querySelectorAll(':scope > [data-reveal-card]'));
    this.listeners = new AbortController();
    const options = { signal: this.listeners.signal, passive: true };
    this.addEventListener('pointermove', this.move, options);
    this.addEventListener('pointerleave', this.stop, options);
    this.addEventListener('pointercancel', this.stop, options);
    this.addEventListener('keydown', this.stop, options);
    window.addEventListener('blur', this.stop, options);
    window.addEventListener('resize', this.schedule, options);
    window.addEventListener('scroll', this.schedule, { ...options, capture: true });
    this.hover.addEventListener('change', this.stop, options);
  }

  disconnectedCallback() {
    this.listeners?.abort();
    this.stop();
  }

  private move = (event: PointerEvent) => {
    if (event.pointerType === 'touch' || !this.hover.matches) {
      this.stop();
      return;
    }
    if (!this.target) {
      this.x = event.clientX;
      this.y = event.clientY;
      this.lastTime = performance.now();
    }
    this.target = { x: event.clientX, y: event.clientY };
    this.schedule();
  };

  private schedule = () => {
    if (this.target && !this.frame) this.frame = requestAnimationFrame(this.paint);
  };

  private paint = (now: number) => {
    this.frame = 0;
    if (!this.target) return;
    // Ease one point in viewport space, including while it crosses the grid gap.
    const blend = this.reducedMotion.matches ? 1 : 1 - Math.exp(-(now - this.lastTime) / 45);
    this.lastTime = now;
    this.x += (this.target.x - this.x) * blend;
    this.y += (this.target.y - this.y) * blend;

    const rects = this.cards.map(card => card.getBoundingClientRect());
    this.cards.forEach((card, i) => {
      // The mask is positioned inside the card's border.
      card.style.setProperty('--reveal-x', (this.x - rects[i].left - card.clientLeft) + 'px');
      card.style.setProperty('--reveal-y', (this.y - rects[i].top - card.clientTop) + 'px');
    });
    this.toggleAttribute('data-tracking', true);
    if (Math.hypot(this.target.x - this.x, this.target.y - this.y) > .25) this.schedule();
  };

  private stop = () => {
    cancelAnimationFrame(this.frame);
    this.frame = 0;
    this.target = undefined;
    this.removeAttribute('data-tracking');
  };
}

customElements.define('card-reveal-group', CardRevealGroup);
