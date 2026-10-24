---
status: todo
priority: high
kind: code
repo: both
created: 2026-10-24
depends-on: [106]
roadmap: Now · The open world
---

# 107 · A waypoint on the map, and the GPS's route to it along the streets

## Why

Finding your way round Braga in the game is by knowing it. The owner asked for waypoints with a GPS
(2026-10-24): a place marked on the full map, and the way there along the real streets, as a car's
GPS gives it.

## What

Today: the tiles' streets are `world.lines` (braga-map's `index.d.ts`, `Line`: kind, level, width,
name, points), with no one-way and no junctions said; the race's planner routes on OpenStreetMap's
ways with the rules of the road (`tools/track.mjs`'s `route`: one-way streets by `isOneway` in
`tools/osm.mjs`, the turn restrictions from `.cache/osm/restrictions.json`, decision 010), but only
when the tracks are planned. party-kart has no routing on the streets (the bots on foot route on a
round's walkable ground, `src/world/paths.ts`).

1. **braga-map carries what a route needs** (decision 023's way: the data does it once): for each
   line its one-way (`oneway`: 1 along its points, -1 against, absent both ways), and where the
   lines meet, the junctions a route can turn at, with the turns the map bans; in the tiles, typed in
   `index.d.ts`, tested (`test/`). A version up and tagged; party-kart pinned to it.
2. **party-kart's router** (pure, in `src/world/`, so the tests run it): from where you are to the
   waypoint, along the streets a car may drive, the right way down one-way streets and no banned turn,
   the shortest by time (each street's length over a speed by its kind). On foot, any way along the
   streets and the paths.
3. **Setting it:** a click (a tap) on the full map (106) puts the waypoint; again on it takes it
   away. It's yours alone (110 shares one).
4. **Showing it:** the route on the minimap and the full map; on the street ahead, arrows laid on the
   carriageway for the next 100 m or so; on the HUD, the distance left and the next turn with its
   street's name ("Vira à direita na Rua …, 200 m"). Left the route: it's worked out again from where
   you are. Reached: it says so and clears.
5. Not in a race or a round: their own routes rule.

## Read first

- braga-map: `index.d.ts` (`Line`), `tools/world.mjs` (the lines), `tools/osm.mjs` (`isOneway`,
  `driven`), `tools/track.mjs` (`route`, the turn restrictions), decisions 010 and 023.
- party-kart: `src/hud.ts`, `src/main.ts`, `src/world/names.ts`, `src/world/paths.ts`, task 106.

## Done when

- [ ] A route from the plinth to the Picoto's top drives the one-way streets the right way and takes
  no banned turn (a test in party-kart), and one on foot takes the steps.
- [ ] The route shows on both maps and as arrows on the street, and the HUD names the next turn
  (Playwright's shots in Notes).
- [ ] `npm test` here, `npm test` and `npm run check` in party-kart pass.

## Out of scope

- Finding a place by its name: 109. A friend as the waypoint: 110.

## Notes

- The owner's answer (2026-10-24). By the rules of the road, as a real GPS: the session's plan,
  stated to the owner before Phase 2 and not objected to. To be done first, before 081.
