# Antidote Run

Top-down zombie survival shooter. Find Dr. Okoro's three journal pages, storm the lab, take the cure from Kane before the infection takes you.

## Run

```sh
npm install
npm run dev        # http://localhost:5173 (also exposed on LAN for phone testing)
npm test           # vitest: city generation, reachability, headless sim
npm run build      # typecheck + production build to dist/
npm run preview    # serve dist/
npm run package    # build + zip for CrazyGames upload
npm run media      # render store covers + preview videos into store/ (needs Chrome, ffmpeg)
```

Publishing on CrazyGames: see [docs/crazygames.md](docs/crazygames.md).

## Layout

```
src/
  config.ts        all tuning numbers (player, weapons, enemies, spawner, pickups)
  core/            rng, math, dom helpers, env flags
  world/           city generation, tile queries/collision, baked canvas layers
  ai/flowfield.ts  BFS distance field every chaser walks down
  game/            simulation: state setup, missions, player, enemies, combat, items, spawner, update
  render/          canvas drawing: world pass, darkness, overlays, minimap
  ui/              DOM HUD, radio log, menu/pause/end screens
  input/           keyboard, mouse, touch stick → one Input object
  platform/        CrazyGames SDK wrapper (never throws; game runs without it)
  dev/             dev-only autopilot for video capture (not in production builds)
  main.ts          boot, state machine, frame loop
tools/             store cover page + media capture script
store/             store covers (and generated preview videos)
docs/              CrazyGames submission notes
legacy/            original single-file prototype (reference)
```

The simulation (`game/`, `world/`, `ai/`) never touches the DOM; it reports out through `Hooks` (radio, objective, end), so it runs headless in tests.
# zombie
