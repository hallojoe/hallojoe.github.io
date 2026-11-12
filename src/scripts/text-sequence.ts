import type { SequenceOptions } from '../lib/animated-text';

class TextSequence extends HTMLElement {
  private motion = matchMedia('(prefers-reduced-motion: reduce)');
  private timer?: number;
  private spin?: Animation;
  private index = 0;
  private words: string[] = [];
  private options: SequenceOptions = {};
  private output!: HTMLElement;

  connectedCallback() {
    this.words = Array.from(this.querySelectorAll('[data-word]'), node => node.textContent ?? '');
    this.output = this.querySelector('[data-output]')!;
    this.options = JSON.parse(this.dataset.options ?? '{}');
    this.motion.addEventListener('change', this.restart);
    this.restart();
  }

  disconnectedCallback() {
    this.motion.removeEventListener('change', this.restart);
    this.stop();
  }

  private stop() {
    window.clearTimeout(this.timer);
    this.spin?.cancel();
  }

  private restart = () => {
    this.stop();
    this.index = 0;
    this.output.textContent = this.words[0] ?? '';
    if (!this.motion.matches && this.words.length > 1) this.hold();
  };

  private hold() {
    this.timer = window.setTimeout(() => {
      this.index = (this.index + 1) % this.words.length;
      const next = this.words[this.index];
      const { effect = 'type' } = this.options;
      if (effect === 'type') this.type(next);
      else this.flip(next, effect === 'spin-horizontal' ? 'rotateY' : 'rotateX');
    }, this.options.holdMs ?? 2400);
  }

  private type(next: string) {
    const segmenter = new Intl.Segmenter(undefined, { granularity: 'grapheme' });
    const letters = (word: string) => Array.from(segmenter.segment(word), part => part.segment);
    const current = letters(this.output.textContent ?? '');
    const target = letters(next);
    let typed = 0;
    const step = () => {
      if (current.length) {
        current.pop();
        this.output.textContent = current.join('');
        this.timer = window.setTimeout(step, this.options.deleteMs ?? 45);
      } else if (typed < target.length) {
        this.output.textContent += target[typed++];
        this.timer = window.setTimeout(step, this.options.typeMs ?? 85);
      } else {
        this.hold();
      }
    };
    step();
  }

  private flip(next: string, axis: 'rotateX' | 'rotateY') {
    const frames = (from: number, to: number) => [from, to].map(degrees => ({
      transform: `perspective(8em) ${axis}(${degrees}deg)`,
    }));
    const duration = (this.options.spinMs ?? 480) / 2;
    this.spin = this.output.animate(frames(0, -90), { duration, easing: 'ease-in' });
    this.spin.onfinish = () => {
      this.output.textContent = next;
      this.spin = this.output.animate(frames(90, 0), { duration, easing: 'ease-out' });
      this.spin.onfinish = () => this.hold();
    };
  }
}

customElements.define('text-sequence', TextSequence);
