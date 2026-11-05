# CrazyGames submission

Requirements: https://docs.crazygames.com/requirements/intro/
Developer portal: https://developer.crazygames.com/

## 1. Build the upload

```sh
npm run package   # typecheck + build + zip → antidote-run-crazygames.zip
```

Upload the zip (or the contents of `dist/`). `index.html` is at the root, every path is relative, and the bundle is about 140 KB in 10 files.

## 2. Store media (already in `store/`)

| Asset | File | Spec |
|---|---|---|
| Cover, landscape | `store/cover-landscape-1920x1080.png` | 1920×1080, 16:9 |
| Cover, portrait | `store/cover-portrait-800x1200.png` | 800×1200, 2:3 |
| Cover, square | `store/cover-square-800x800.png` | 800×800, 1:1 |
| Preview video, landscape | `store/preview-landscape-1920x1080.mp4` | 1080p 16:9, 18 s, no audio, opens on cover |
| Preview video, portrait | `store/preview-portrait-1080x1620.mp4` | 1080p 2:3, 18 s, no audio, opens on cover |

Covers show only the title. They are rendered by the game itself (`tools/covers.ts`); the videos are real gameplay recorded with a dev-only autopilot. Regenerate with `npm run media` (or `npm run media -- covers` / `-- videos`); needs Chrome and ffmpeg. The mp4s are not committed.

## 3. Form answers

- **Title:** Antidote Run
- **Genre / tags:** Shooting, Zombie, Survival, Top-down, Action
- **Orientation (mobile):** Landscape
- **Platforms:** Desktop and mobile (keyboard + mouse, touch)
- **SDK:** Yes, HTML5 SDK v3
- **Progress save:** Not applicable (each run is a single session). Do **not** select "Data Module"; the game keeps only the difficulty preference in `localStorage`.
- **Ads:** Midgame ad between runs (when the player presses "Run it again"). No rewarded ads, no banners.
- **Login:** None. Guests and CrazyGames users play the same way.
- **Language:** English

### Description

> You've been bitten, and the infection climbs every second. Before she vanished, Dr. Ada Okoro split the antidote formula across three journal pages hidden in Lazarus City. Follow the trail page by page, fight through the undead horde and the Ash Crew's armed scavengers, then storm the lab and take the cure from their leader, Kane. Grab suppressant vials to hold off the infection and ammo to keep firing; when you run dry, swing the bat. Auto-aim locks onto the nearest threat and on-screen hints always tell you what to do next. New to it? Beginner mode gives you a slower horde, 1000 rounds and 12 minutes before you turn.

### Controls

> WASD or arrow keys: move
> Space or hold left mouse button: shoot (auto-aims at the nearest enemy)
> Mouse: point at an enemy to target it
> T: switch auto-aim on/off (manual aim follows the mouse)
> P: pause
> Touch: left joystick to move, FIRE button auto-aims at the nearest enemy

## 4. Compliance checklist

| Requirement | Status |
|---|---|
| Size ≤ 50 MB initial / 250 MB total, ≤ 1500 files | ~140 KB, 10 files |
| Relative paths only | `base: './'`; checked in `dist/index.html` |
| No external requests besides the SDK | Fonts are bundled (`@fontsource`); only `sdk.crazygames.com` is requested |
| SDK v3 loaded in `<head>` before game code, `init()` before use | `index.html`, `src/platform/crazygames.ts` |
| Game works if the SDK is missing, slow, or `disabled` | Every call is guarded; boot never waits on `init()` |
| `gameplayStart` on start/resume, `gameplayStop` on pause/death/win/menu, not on focus loss | `src/main.ts` |
| Midgame ad only at a natural break; game paused + muted during the ad; continues on `adError` | Retry → `platform.midgameAd()`; no audio yet, mute state is tracked for when audio lands |
| `muteAudio` setting honoured | Tracked in `platform.muted` / `onMuteChange` (no audio yet; **wire this up when sound is added**) |
| `happytime()` used sparingly | Once, on winning |
| No custom fullscreen button | None |
| Escape not used | Pause is P only (Escape exits fullscreen on CrazyGames) |
| Page doesn't scroll from arrows/space/wheel; no context menu | `src/input/keyboard.ts` |
| AZERTY / other layouts | Uses physical key codes (ZQSD works on AZERTY) |
| Physics consistent across 60/144/165 Hz | dt-based simulation; particle damping fixed to be dt-based |
| Readable at 800×450 … 1920×1080 | Checked at 800×450, 907×510, 1280×720, 1920×1080, and 800×450 touch; menu switches to two columns on short frames |
| Players reach gameplay in ≤ 1 click | One click on "Enter the city" |
| Mobile: touch controls, safe-area insets, no text selection | Yes |
| No external links, other branding or third-party ads | None |
| English | Yes |
| PEGI 12 | Stylised top-down shapes, no realistic gore or language; fits PEGI 12 |
| Original content | Original game, story and art |

## 5. Before you submit

1. Run the build through the CrazyGames **QA / preview tool** in the developer portal. Check that the SDK logs show `gameplayStart`/`gameplayStop`, and that the midgame ad on "Run it again" pauses the game and resumes it.
2. Play one run on **Safari** (macOS or iOS): CrazyGames disables games on Safari if they misbehave there.
3. When audio is added (Phase 1), mute it on `platform.onMuteChange` and resume the `AudioContext` on a user gesture (iOS).
