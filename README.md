# Antidote Run

Top-down zombie survival shooter. Find Dr. Okoro's three journal pages, storm the lab, take the cure from Kane before the infection takes you.

## Run

```sh
npm install
npm run dev        # http://localhost:5173 (also exposed on LAN for phone testing)
npm test           # vitest: city generation, reachability, headless sim
npm run build      # typecheck + production build to dist/
npm run preview    # serve dist/
```

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
  main.ts          boot, state machine, frame loop
legacy/            original single-file prototype (reference)
```

The simulation (`game/`, `world/`, `ai/`) never touches the DOM; it reports out through `Hooks` (radio, objective, end), so it runs headless in tests.
# zombie
