---
status: todo
priority: medium
kind: code
repo: braga-map
created: 2026-10-13
depends-on: []
roadmap: Phase 1 · See it
---

# 006 · Every street there: an audit of what the map has and what the game draws

## Why

The friends think streets were removed. As far as the code shows, none was: the world keeps
every class of street, service roads and dirt tracks included. But the map page shows only the
main streets (the 65% cut approved in draft 1), and footpaths, steps and cycleways were never
fetched. A street that's missing, or drawn where there's none, is one of the first things a
local notices. An audit settles it with numbers and a picture, and lists what to add.

## What

Today, according to the inventory of 2026-10-13:

- `tools/fetch.mjs` (`base`) fetches `highway` motorway to track, and pedestrian, but not
  `footway`, `path`, `steps`, `cycleway` or `bridleway`.
- `tools/world.mjs` keeps all of them as `lines` in the tiles (`kind` 0–8), except tunnels
  (`world.mjs:48`); 2,255 service segments are in the tiles.
- `tools/build.mjs` keeps only the main streets for the map page (`build.mjs:119`).
- `tools/track.mjs` routes only on primary to living_street (`track.mjs:46`).

Steps:

1. **Fetch the footways too:** add `footway`, `path`, `steps`, `cycleway` and
   `highway=pedestrian` areas to `fetch.mjs`'s `base` (or a new `paths` part), so the audit and
   task 013 have them.
2. **Write `tools/audit.mjs`:** for the track's box (`tracks/amigos.js`, `box`) and the
   shooter's area (decision 003), list every OSM street by class, its length, and whether the
   world tiles draw it (a line within 1 m of it), and the reverse: lines in the tiles that
   match no OSM street. Print a table by class and write the list to `.cache/audit.json`.
3. **Compare with the orthophoto** (task 005's source), by eye, in the shooter's area and
   along the route: streets, lanes and squares the photo shows but OSM lacks. List each one
   with its position in Notes. The list is the outcome: nobody in the group will edit
   OpenStreetMap (the owner's answer), and nothing is patched here either.
4. **Show it** on the map page: a layer "Audit" with the streets coloured by whether the game
   draws them.

## Questions

- [x] Does anyone have, or want, an OpenStreetMap account to fix missing streets at the source?
  Recommendation: yes. Fixes there also reach every map that uses OSM, and they survive each
  fetch.
  > No (2026-10-14): the account would only be for contributing to OSM, and nobody will. List
  > what's missing, and leave it at that.

## Read first

- `tools/fetch.mjs`, `tools/osm.mjs` (`KIND_OF`, `carriageway`), `tools/world.mjs` (lines),
  `tools/build.mjs` (the page's streets).
- `map/decisions.json`: the 65% cut.

## Done when

- [ ] `node tools/audit.mjs` prints, per class, the OSM streets in the track's box and the
  shooter's area and how many the world draws, and the lines that match none.
- [ ] Footways, steps, paths and cycleways are in `.cache/osm/`.
- [ ] The owner has the answer for the friends: which streets, if any, are missing, and why.

## Out of scope

- Drawing pavements, footpaths and steps in the game: task 013.
- Changing the map page's 65% cut: it was decided in draft 1.
- Editing OpenStreetMap, and patching the world here for a street OSM lacks.

## Notes

- With nobody editing OSM (2026-10-14), decision 010's "where OSM is wrong about a street's
  direction, it's fixed in OSM (task 006)" has nobody to do it. If the audit finds a missing or
  wrong street that matters to the race or the shooter, bring it to the owner then: fixing it
  would mean a local override, which no decision allows yet. Record the outcome in
  `docs/DECISIONS.md` when this task is finished.
