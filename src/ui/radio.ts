interface Msg { who: string; text: string; cls: string; t: number }

const VISIBLE = 3;
const FADE_AFTER_MS = 11000;

/** Radio log: last three messages, fading out after 11 s. */
export class Radio {
  private msgs: Msg[] = [];
  constructor(private readonly box: HTMLElement) {}

  clear() {
    this.msgs = [];
    this.box.replaceChildren();
  }

  push(who: string, text: string, cls = '') {
    this.msgs.push({ who, text, cls, t: performance.now() });
    if (this.msgs.length > VISIBLE) this.msgs.splice(0, this.msgs.length - VISIBLE);
    this.box.replaceChildren(
      ...this.msgs.map((m) => {
        const d = document.createElement('div');
        d.className = `msg ${m.cls}`.trim();
        d.dataset.t = String(m.t);
        const label = document.createElement('em');
        label.textContent = m.who;
        d.append(label, document.createTextNode(m.text));
        return d;
      }),
    );
  }

  tick(now: number) {
    for (const el of this.box.children as HTMLCollectionOf<HTMLElement>)
      el.style.opacity = now - Number(el.dataset.t) > FADE_AFTER_MS ? '0' : '1';
  }
}
