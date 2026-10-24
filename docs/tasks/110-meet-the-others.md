---
status: todo
priority: high
kind: code
repo: party-kart
created: 2026-10-24
depends-on: [107]
roadmap: Now · The open world
---

# 110 · Meet the others: the GPS to a friend, and a mark the whole room sees

## Why

Friends in a room are scattered over the open world, and finding each other is "where are you?" in
the chat. The owner chose this from the session's suggestions (2026-10-24): the GPS to a friend, and
a mark on the map everyone in the room sees.

## What

Today: the room's players are drawn where their snapshots say, 15 a second through the host
(`src/session.ts`), and they're dots on the minimap; every message the host takes is cleaned
(`cleanSnap`, `cleanEv`), and a new one needs the same (`docs/making-changes.md`, "A new network
message").

1. **The GPS to a friend:** on the full map (106), a click on a friend's dot (or their name in a list
   beside the map) makes them the waypoint, and the route (107) follows them as they move, worked out
   again every few seconds or when they've gone 50 m.
2. **A mark for the room:** on the full map, "Marcar para todos" puts a mark that everyone in the room
   sees on their maps and minimaps, with the name of who put it, and can make their waypoint with a
   click. One mark a player; a new one replaces it, and it goes when they take it away or leave.
3. **The message:** a new `ToHost`/`ToClient` pair, the host checking everything in it (a place inside
   the open world, the sender's own id, not more than one a second), as `cleanEv` does.
4. Not in a race or a round, as the minimap's rule keeps a round's foes off it.

## Read first

- party-kart's `CLAUDE.md` ("Conventions": the host trusts nothing), `docs/making-changes.md` ("A new
  network message"), `src/session.ts`, `src/main.ts`, tasks 106 and 107.

## Done when

- [ ] In two browser contexts in one room, one sets its route to the other and it follows them; one
  puts a mark and the other sees it (Playwright in Notes).
- [ ] The host drops a mark outside the open world or under another's id (a test).
- [ ] `npm test` and `npm run check` pass.

## Notes

- The owner's choice (2026-10-24), from the session's suggestions. To be done first, before 081.
- A new message in the same format old builds ignore: the peer prefix stays unless 105 has already
  changed it (it does, for the karts' size).
