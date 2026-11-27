# Turkey Run — Thanksgiving Escape

[![make.fun](https://make.fun/badge/turkey-run-game-01.svg)](https://make.fun/c/turkey-run-game-01)
[![Rank](https://make.fun/badge/turkey-run-game-01/Limit99/makefun-turkey-escape-game/rank.svg)](https://make.fun/c/turkey-run-game-01)
[![Reward](https://make.fun/badge/turkey-run-game-01/Limit99/makefun-turkey-escape-game/reward.svg)](https://make.fun/c/turkey-run-game-01)

A turkey escape game for the make.fun **turkey-run-game-01** bounty: you are the turkey, Thanksgiving is coming, and the farmer wants you for dinner. Run 1500 metres of sunset farm to freedom — jump the brick ovens, duck the spinning carving knives, sidestep the knives dropping from the sky, and grab corn, pumpkin pie and golden feathers on the way. Every hit lets the farmer lunge closer; three hits and you are caught.

## How to play

Open `game/index.html` in a desktop browser (or run `node serve.ts` and open http://localhost:8080). No network, no build step — every file the game loads lives under `game/`.

1. **Start** — press `Enter` or click the big START RUN button.
2. **Move** — `←` / `→` or `A` / `D` to run back and forth inside your lane.
3. **Jump** — `Space`, `↑`, `W`, or click/tap. Jump the ovens, fences and hay bales.
4. **Duck** — `↓` or `S` to slide under the flying carving knives; press it mid-air to dive down fast under one.
5. **Dash** — `Shift` for a burst of speed (with a short cooldown).
6. **Pause / mute** — `P` pauses, `M` mutes the synthesised gobbles and jingles.

Reach **1500 m** and you escape; lose all 3 lives, or let the farmer close the gap, and you are caught. Your best score is kept in the browser.

## The farm

A seeded sunset farm, the same every screenshot: a low sun over red hills, the old barn, fences and pumpkins marching past, autumn leaves in the wind, and the farmer — straw hat, blue shirt, apron, carving fork in hand — running right behind you. The HUD shows score, distance to freedom, lives, dash readiness and speed, and flashes a warning when the farmer closes in.

## Files

- `game/` — the playable game (plain HTML + ES modules, canvas-drawn art, WebAudio sound, no libraries)
  - `game/src/config.js` — field, turkey, farmer, hazards, pickups and colours
  - `game/src/random.js` — the seeded generator behind every run
  - `game/src/audio.js` — synthesised sound effects (gobbles, jumps, pickups)
  - `game/src/world.js` — the run: physics, spawning, collisions, scoring
  - `game/src/render.js` — the farm, the turkey, the farmer, the HUD and screens
  - `game/src/input.js` — keyboard + mouse
  - `game/src/shots.js` — deterministic screenshot scenes with an autopilot
  - `game/src/main.js` — the game loop and the screen flow
- `screenshots/` — real renders of the game's own code (`shots.json` lists the `?shot=` scene behind each one)
- `main.ts` — the hand-in program: copies `game/` and `screenshots/` to `/output` and writes `dossier.json`
- `serve.ts` — a tiny local static server for play-testing
