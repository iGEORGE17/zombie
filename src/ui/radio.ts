interface Msg { who: string; text: string; cls: string; t: number }

const VISIBLE = 3;
/** Pickups and radio chatter clear fast; journal pages carry the story, so they stay a little longer. */
const SHOW_MS = 1800;
const JOURNAL_SHOW_MS = 5000;
/** Matches the .msg opacity transition. */
const FADE_MS = 600;

/** Radio log: last three messages, each fading out after its show time. */
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
    for (const el of [...this.box.children] as HTMLElement[]) {
      const show = el.classList.contains('journal') ? JOURNAL_SHOW_MS : SHOW_MS;
      const age = now - Number(el.dataset.t);
      if (age > show + FADE_MS) {
        el.remove();
        this.msgs = this.msgs.filter((m) => String(m.t) !== el.dataset.t);
      } else el.style.opacity = age > show ? '0' : '1';
    }
  }
}
