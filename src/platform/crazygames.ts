/**
 * Thin, never-throwing wrapper around the CrazyGames HTML5 SDK v3.
 * https://docs.crazygames.com/sdk/intro/
 *
 * The SDK script is loaded async in index.html (#cg-sdk). Off CrazyGames (own domain, offline, script blocked)
 * the SDK is missing or reports `environment: "disabled"`, where every call throws, so every
 * call here is guarded and the game runs exactly the same without it.
 */

type AdError = { code: string; message: string };
interface CrazySDK {
  init(): Promise<void>;
  environment: 'local' | 'crazygames' | 'disabled';
  game: {
    gameplayStart(): void;
    gameplayStop(): void;
    happytime(): void;
    settings: { muteAudio: boolean };
    addSettingsChangeListener(fn: (s: { muteAudio: boolean }) => void): void;
  };
  ad: {
    requestAd(type: 'midgame' | 'rewarded', cb: { adStarted?(): void; adFinished?(): void; adError?(e: AdError): void }): void;
  };
}
declare global {
  interface Window { CrazyGames?: { SDK: CrazySDK } }
}

let sdk: CrazySDK | null = null;
const SDK_LOAD_TIMEOUT_MS = 10000;

/** Wait for the async SDK <script> to finish (or fail, or time out). */
function sdkScriptLoaded(): Promise<CrazySDK | undefined> {
  if (window.CrazyGames?.SDK) return Promise.resolve(window.CrazyGames.SDK);
  const tag = document.getElementById('cg-sdk');
  if (!tag) return Promise.resolve(undefined);
  return new Promise((resolve) => {
    const done = () => resolve(window.CrazyGames?.SDK);
    tag.addEventListener('load', done, { once: true });
    tag.addEventListener('error', done, { once: true });
    setTimeout(done, SDK_LOAD_TIMEOUT_MS);
  });
}
let playing = false;
let muted = false;
const muteListeners: ((muted: boolean) => void)[] = [];

const safe = (fn: (s: CrazySDK) => void) => {
  if (!sdk) return;
  try { fn(sdk); } catch (e) { console.warn('[CrazyGames SDK]', e); }
};

function setMuted(m: boolean) {
  if (m === muted) return;
  muted = m;
  for (const fn of muteListeners) fn(m);
}

export const platform = {
  /**
   * Resolve the SDK if present and enabled. Never rejects. The game does not wait on this:
   * it can take seconds, and anything requested before it resolves is replayed once it does.
   */
  async init() {
    const candidate = await sdkScriptLoaded();
    if (!candidate) return;
    try {
      await candidate.init();
      if (candidate.environment === 'disabled') return;
      sdk = candidate;
      setMuted(sdk.game.settings.muteAudio);
      sdk.game.addSettingsChangeListener((s) => setMuted(s.muteAudio));
      // Player already in a run before the SDK was ready: report it now.
      if (playing) safe((s) => s.game.gameplayStart());
    } catch (e) {
      console.warn('[CrazyGames SDK] init failed; continuing without it', e);
      sdk = null;
    }
  },

  get active() { return sdk !== null; },

  /** Idempotent: safe to call on every resume. */
  gameplayStart() {
    if (playing) return;
    playing = true;
    safe((s) => s.game.gameplayStart());
  },
  /** Idempotent: call on every break (menu, pause, death, win). Not on focus loss; the platform handles that. */
  gameplayStop() {
    if (!playing) return;
    playing = false;
    safe((s) => s.game.gameplayStop());
  },

  happytime: () => safe((s) => s.game.happytime()),

  /** Platform mute (settings.muteAudio or an ad playing). Audio code should honour this over its own settings. */
  get muted() { return muted; },
  onMuteChange(fn: (muted: boolean) => void) { muteListeners.push(fn); },

  /**
   * Midgame ad at a natural break. Resolves when the game may continue: after the ad,
   * or immediately when ads are unavailable (Basic Launch, adblock, cooldown, off-platform).
   */
  midgameAd(): Promise<void> {
    if (!sdk) return Promise.resolve();
    const before = muted;
    return new Promise((resolve) => {
      const done = () => { setMuted(before || (sdk?.game.settings.muteAudio ?? false)); resolve(); };
      try {
        sdk!.ad.requestAd('midgame', {
          adStarted: () => setMuted(true),
          adFinished: done,
          adError: done,
        });
      } catch {
        done();
      }
    });
  },
};
