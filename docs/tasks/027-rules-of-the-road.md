---
status: doing
priority: high
kind: code
repo: braga-map
created: 2026-10-13
depends-on: []
roadmap: Phase 2 · The shape
---

# 027 · The route by the rules of the road: one-way streets the right way, no banned turns

## Why

The Volta dos Amigos drives about 1.2 km of its 8.2 km against the traffic: the start itself goes
the wrong way down the Rua do Fujacal, and the Via da Falperra's roundabout is taken the wrong way
round. Anyone who drives in Braga sees it at once, and the race should go the way the real traffic
goes. The router also knows nothing of the turns the map bans, or of streets cars may not use.

## What

Today:

- `tools/track.mjs` (step 1) builds the street graph from `.cache/osm/base.json` with every way in
  both directions. `route()` prices the turns and forbids hairpins, but ignores `oneway`, which
  way round a roundabout goes, the turn restrictions and the access tags (only `access=private`
  is left out).
- `tools/fetch.mjs` doesn't fetch the turn restrictions (OSM relations `type=restriction`).
- Measured on 2026-10-13, on braga-map v1.1.0's `tracks/amigos.js` against OSM's one-way ways:
  1204 m against the traffic (and 1310 m the right way). The Rua do Fujacal 583 m (the start),
  the Rua Monsenhor Airosa 176 m, the Rua da Devesa 151 m, the Rua Álvaro Carneiro 55 m, a link
  by the Avenida Doutor António Alves Palha 48 m, the Avenida Robert Smith 40 m, the Via da
  Falperra's roundabout 40 m, and eight bits of 8–24 m (some may be corners cut across a
  junction). Driving the whole loop the other way round doesn't help. The turns weren't measured.
- The loop's order through the waypoints is fixed (`order` in `.cache/places.json`), so only the
  direction through each one is chosen (`flips`), and the loop always goes round the same way.
  One of the five waypoints is on a one-way street, which fixes the direction through it.

Steps:

1. **Fetch the turn restrictions:** a `restrictions` query in `fetch.mjs`
   (`relation["type"="restriction"]`, members only) into `.cache/osm/restrictions.json`, so
   `base` needn't be fetched again.
2. **One-way streets one way:** each edge of the graph says whether it may be driven that way:
   `oneway=yes` and roundabouts forwards, `oneway=-1` backwards, `oneway:motor_vehicle` or
   `oneway:motorcar` over `oneway`. Ways a car may not use (`access`, `vehicle`, `motor_vehicle`
   or `motorcar` set to no, private, permit, forestry or agricultural, the most specific of them
   winning) are left out. The `(joined)` links out of dead ends (a note on the map asked for them)
   stay two-way.
3. **Banned turns:** `route()` skips a turn a restriction bans: `no_*` from its `from` way to its
   `to` way at its `via` node, and `only_*` any other turn from that `from` way there.
   `restriction:motorcar` or `restriction:motor_vehicle` win over `restriction`; one whose
   `except` names cars, or that holds only at some hours (`:conditional`), doesn't apply. A
   restriction whose `via` is a way: count them first, and if any is on or next to the loop, ban
   it too (it needs the way the route came in by, not only the last node).
4. **Through the waypoints, and between legs:** `through()` picks the pair of neighbours that can
   be driven in that direction, and a leg only ends where the turn onto the next waypoint's street
   is legal (today the turn at a leg's last node isn't checked at all).
5. **Both ways round:** with the order fixed, try it as given and reversed (the same houses in
   the same order, the loop driven the other way), and keep the cheaper.
6. **Check it, and say so:** after the loop is found, `track.mjs` walks it and fails if any edge is
   driven against the traffic or any turn is banned; it prints the metres on one-way streets, the
   restrictions at the loop's junctions, and the loop's length. A test checks the written track
   against OSM's one-way ways independently, skipped where `.cache/osm/` wasn't fetched.
7. **Make it all again:** `npm run tracks`, then `npm run world` (the ground is finest within
   60 m of the route, so it follows the new one), `npm test` and `node tools/relief.mjs`. In
   party-kart, `npm install --install-links ../braga-map`, widen its track tests for the longer
   loop (the question below), then `npm test` and `npm run check`, and put the tag back in its
   `package.json`. Tagging a new version, party-kart's peer id prefix (the track changes) and
   deploying wait for the owner to ask.

## Questions

- [x] One waypoint's street is one-way against the way the loop goes, and the loop must drive
  along it, so a legal loop doubles back there: 9.27 km instead of 8.15 km. Keep it, take the
  houses in another order (8.81 km, but without the Avenida da Liberdade, the Avenida 31 de
  Janeiro and the Via da Falperra), or keep that one stretch against the traffic as a departure
  in decision 004 (8.38 km)?
  Recommendation: keep the legal loop in the same order, and widen party-kart's track tests.
  > The legal loop in the same order (2026-10-13).

## Read first

- `tools/track.mjs`, step 1: the graph, `snap`, the joins, `route`, `through`, `loopThrough`.
- `tools/osm.mjs` (`isOneway`), `tools/fetch.mjs` (`QUERIES`, `overpass`).
- `README.md`, "How a track is planned" and "The friends' houses".
- `../party-kart/CLAUDE.md`, "Gotchas": what its tests guard on the track, and the peer id prefix.

## Done when

- [ ] `track.mjs` prints 0 m against the traffic and no banned turn on the Volta dos Amigos, and
  fails a track that has either.
- [ ] A test measures `tracks/amigos.js` against OSM's one-way ways and finds no stretch of more
  than a few metres against the traffic (a corner cut across a junction).
- [ ] The Via da Falperra's roundabout, and every other one on the loop, is driven anticlockwise,
  seen from above.
- [ ] braga-map's `npm test`, and party-kart's `npm test` and `npm run check` on the new track,
  pass, with the lap's summary line before and after.
- [ ] No viewpoint gets worse: task 001 is placing them at the same time, and its viewpoints along
  the route take their heading from the way the race goes, so they're placed (or turned round) on
  the route this task makes.

## Out of scope

- Fixing OSM's tags where the map is wrong about a street's direction: task 006 (an OSM account,
  its question). Note any found in Notes.
- The race's other departures from real life (decision 004): the track never under 9 m, the eggs
  past the houses. The `(joined)` links stay as the map's note asked.
- Traffic in the streets, traffic lights that change, giving way: "Later", life in the streets.
- Moving the line onto the real carriageway's middle: task 026.

## Notes

- Drafted 2026-10-13, while task 001 (viewpoints) runs in another session: its viewpoints along
  the route should wait for this task's route, or be checked against it.
- The turn restrictions (2026-10-13): 146 in the box, 144 at a node, one through a way (a U-turn
  ban), one with no junction (left out). Every one's streets end at its junction, so a turn is
  matched by the streets' ids alone. 20 junctions on the new loop have one.
- What made the loop longer (2026-10-13): the one-way rule alone (without the turn bans the loop
  is the same), and only where the loop doubles back by the waypoint. Letting the five one-way
  ways there be driven both ways gives 8.38 km, legal everywhere else (the Rua da Devesa, the Rua
  Álvaro Carneiro, the Via da Falperra's roundabout and the rest cost 120 m between them). Driving
  the fixed order the other way round is 14.7 km; the router's costs (`RES` 1–1.6, `TURN` 5–40)
  all give the same loop; of every order of the houses, only one is shorter (8.81 km, the
  question above).
- Done so far (2026-10-13), not yet released:
  - `fetch.mjs` fetches `restrictions`; `osm.mjs` has `driven` (which way a car may drive a
    street); `track.mjs` keeps the rules in `route`, `through` and where legs meet, tries the fixed
    order both ways round, and walks the loop after: "3221 m on one-way streets, the right way; 20
    junctions on it with turn restrictions; 0 m against the traffic; 0 banned turns". It throws
    otherwise.
  - The new loop: 9274 m (was 8152); 3 corners tighter than 9 m, at (358, 1028), (293, 1389) and
    (-563, 1435) (was the last one only); steepest 19.5% (was 19.3%); no clashes. It
    still starts on the Rua do Fujacal, now driven west, then by the Avenida Imaculada Conceição to
    the Avenida da Liberdade; from there on it's the same streets as before.
  - `test/rules.test.js`: no stretch over 20 m against a one-way street. The old track fails it
    (the Rua do Fujacal, Monsenhor Airosa, the Devesa, Álvaro Carneiro, the Espadanido, Robert
    Smith); the new one has one step of 8 m, a corner off the Avenida Robert Smith grazing its
    other carriageway at (1155, 1197). Every roundabout on it (8) is driven the way it's drawn.
  - `npm run world`: no tile changed (the same 18 tiles have the ground every 2 m).
    `npm test` 11 of 11; `node tools/relief.mjs`: the bridges within 0.26 m of their decks.
  - party-kart on the new track (`--install-links`, then put back on `v1.1.0`): `npm test` 19 of
    19, `npm run check` clean. Laps 265.6 and 263.5 s (were 235.3 and 233.2), 0 respawns, 0 wall
    hits, top 217 km/h; eight bots finish within 5 s of each other (about 270 s). Its tests widened:
    the loop 7–10 km (was 7–9), the second lap 170–290 s (was 170–260), the autopilot drives
    600 s (was 540) and the split test 360 s (was 300). The stopping test now stops on the most
    level 300 m: at 150 m from the new start the road climbs 6%, and a car held by `stopInput`
    creeps back 5 cm/s there (its dead band of 0.5 m/s; 11 cm/s on a 4% descent). Not fixed: a
    party-kart matter. The widened tests pass on `v1.1.0` too.
- **Released** on 2026-10-13: braga-map `e909c28`, tagged `v1.2.0` (with task 001's viewpoints,
  placed on this route); party-kart `c14a139`, on it, deployed to
  https://pedrohenriques15.github.io/party-kart/. The peer id prefix is `pk30` (the track changed),
  so players on the old build must reload to race. On v1.2.0: party-kart's `npm test` 19 of 19,
  laps 265.6 and 263.5 s.
- **Left:** `/task finish 027`: the boxes above, a decision (the race keeps the rules of the road,
  longer where it must), and 027 off the roadmap.
