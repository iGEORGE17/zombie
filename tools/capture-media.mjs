#!/usr/bin/env node
/**
 * Render CrazyGames store media into store/:
 *   covers  - cover-landscape-1920x1080.png, cover-portrait-800x1200.png, cover-square-800x800.png
 *   videos  - preview-landscape-1920x1080.mp4, preview-portrait-1080x1620.mp4 (18 s, no audio,
 *             opening on the static cover, then autopilot gameplay)
 *
 * Usage: npm run media [-- covers|videos]
 * Needs Google Chrome (set CHROME_PATH if not in the default macOS location) and ffmpeg for videos.
 */
import { spawn, execFileSync } from 'node:child_process';
import { mkdirSync, rmSync, writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createServer } from 'vite';

const OUT = 'store';
const CHROME = process.env.CHROME_PATH ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const PORT = 9334;
const only = process.argv[2];

const COVERS = [
  { name: 'cover-landscape-1920x1080', w: 960, h: 540, dsf: 2, z: 1.7 },
  { name: 'cover-portrait-800x1200', w: 400, h: 600, dsf: 2, z: 1.5 },
  { name: 'cover-square-800x800', w: 400, h: 400, dsf: 2, z: 1.5 },
];
const VIDEOS = [
  { name: 'preview-landscape-1920x1080', w: 960, h: 540, dsf: 2, cover: 'cover-landscape-1920x1080' },
  { name: 'preview-portrait-1080x1620', w: 720, h: 1080, dsf: 1.5, cover: 'cover-portrait-800x1200' },
];
const FPS = 30, COVER_SECONDS = 1, GAMEPLAY_SECONDS = 17, WARP = 75;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
mkdirSync(OUT, { recursive: true });

const server = await createServer({ server: { port: 5199, strictPort: true, host: '127.0.0.1' }, logLevel: 'warn' });
await server.listen();
const BASE = 'http://127.0.0.1:5199';

const profile = mkdtempSync(join(tmpdir(), 'ar-chrome-'));
const chrome = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${PORT}`, '--no-first-run', '--no-default-browser-check', `--user-data-dir=${profile}`, 'about:blank'], { stdio: 'ignore' });
let targets;
for (let i = 0; i < 40 && !targets; i++) { await sleep(500); try { targets = await (await fetch(`http://127.0.0.1:${PORT}/json`)).json(); } catch {} }
if (!targets) throw new Error('Chrome did not start; set CHROME_PATH');
const ws = new WebSocket(targets.find((t) => t.type === 'page').webSocketDebuggerUrl);
await new Promise((r) => ws.addEventListener('open', r));
let id = 0; const pending = new Map();
ws.addEventListener('message', (ev) => {
  const m = JSON.parse(ev.data);
  if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
  if (m.method === 'Runtime.exceptionThrown') console.error('page error:', m.params.exceptionDetails.exception?.description);
});
const send = (method, params = {}) => new Promise((r) => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
const evalJS = async (expression) => (await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })).result?.result?.value;
const waitFor = async (expr) => { for (let i = 0; i < 120; i++) { if (await evalJS(expr)) return; await sleep(250); } throw new Error(`timeout: ${expr}`); };
const shot = async (format = 'png', quality) => Buffer.from((await send('Page.captureScreenshot', { format, quality, captureBeyondViewport: false })).result.data, 'base64');
const viewport = (v) => send('Emulation.setDeviceMetricsOverride', { width: v.w, height: v.h, deviceScaleFactor: v.dsf, mobile: false });

await send('Runtime.enable'); await send('Page.enable');

try {
  if (only !== 'videos') {
    for (const c of COVERS) {
      await viewport(c);
      await send('Page.navigate', { url: `${BASE}/tools/covers.html?z=${c.z}` });
      await waitFor("document.body.dataset.ready === '1'");
      await sleep(300);
      writeFileSync(join(OUT, `${c.name}.png`), await shot('png'));
      console.log(`✓ ${OUT}/${c.name}.png`);
    }
  }
  if (only !== 'covers') {
    for (const v of VIDEOS) {
      const frames = mkdtempSync(join(tmpdir(), 'ar-frames-'));
      await viewport(v);
      await send('Page.navigate', { url: `${BASE}/?autopilot` });
      await waitFor('!!window.__autopilot');
      // Difficulty: Standard looks busiest on video.
      await evalJS("document.querySelector('input[value=standard]').click()");
      await evalJS(`window.__autopilot.start(${WARP})`);
      const n = FPS * GAMEPLAY_SECONDS;
      for (let f = 0; f < n; f++) {
        await evalJS(`window.__autopilot.step(${1 / FPS})`);
        writeFileSync(join(frames, `${String(f).padStart(4, '0')}.jpg`), await shot('jpeg', 92));
        if (f % 60 === 0) process.stdout.write(`\r${v.name}: frame ${f}/${n}`);
      }
      const W = v.w * v.dsf, H = v.h * v.dsf, out = join(OUT, `${v.name}.mp4`);
      execFileSync('ffmpeg', [
        '-y', '-loglevel', 'error',
        '-loop', '1', '-t', String(COVER_SECONDS), '-framerate', String(FPS), '-i', join(OUT, `${v.cover}.png`),
        '-framerate', String(FPS), '-i', join(frames, '%04d.jpg'),
        '-filter_complex', `[0:v]scale=${W}:${H},setsar=1,format=yuv420p[a];[1:v]scale=${W}:${H},setsar=1,format=yuv420p[b];[a][b]concat=n=2:v=1:a=0[v]`,
        '-map', '[v]', '-an', '-c:v', 'libx264', '-preset', 'slow', '-crf', '20', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', out,
      ]);
      rmSync(frames, { recursive: true, force: true });
      console.log(`\r✓ ${out}                      `);
    }
  }
} finally {
  ws.close();
  const exited = new Promise((r) => chrome.once('exit', r));
  chrome.kill();
  await exited;
  await server.close();
  try { rmSync(profile, { recursive: true, force: true }); } catch { /* temp dir; OS cleans it */ }
}
