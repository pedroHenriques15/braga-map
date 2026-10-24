---
status: done
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

- [x] In two browser contexts in one room, one sets its route to the other and it follows them; one
  puts a mark and the other sees it (Playwright in Notes). `meet110.mjs`, 19 of 19: Bruno's GPS
  follows Ana, again past 50 m and every 4 s; her mark on his maps with her name; shots seen.
- [x] The host drops a mark outside the open world or under another's id (a test).
  `test/marks.test.ts`, its first test.
- [x] `npm test` and `npm run check` pass. On party-kart's main with 066 (84712aa) under it: 156 of
  156, `tsc` clean.

## Notes

- The owner's choice (2026-10-24), from the session's suggestions. To be done first, before 081.
- A new message in the same format old builds ignore: the peer prefix stays unless 105 has already
  changed it (it does, for the karts' size).
- **Done (worker-2, 2026-10-24), party-kart branch `task-110` (`a379b63`, on 109's 6967a66):**
  - `src/game/marks.ts` (new, the simulation's half): the host's `MarkBook` (one mark a player, put,
    moved or taken away; dropped: anything not a mark, a place outside the open world or not a pair
    of finite numbers, a message naming an id other than its connection's, one within a second of the
    sender's last; a name changed on it; gone with whoever leaves), a player's `MarkSender` (one every
    1.2 s at most, the last asked for, so the network's jitter never makes one too soon), and
    `whereIs` (a friend's latest snapshot while they're in the room and heard of in the last 5 s).
  - `src/session.ts`: `mark` to the host (`at`: a place, or null) and `marks` to everyone (the list,
    on every change and to someone joining); the host's own through the same book; none taken in a
    race or a round. Both are messages old builds ignore (an old host's `receive` and an old client's
    switch skip a `t` they don't know), so the peer prefix stays pk44. `HostRoom.create` takes the
    open world's `inside`.
  - `src/hud.ts`: the full map and the minimap draw the room's marks, each a flag in the colour of who
    put it with their name ("A tua marca" for yours), and the friends with their names; a click on a
    friend (on the map, or in the room's list at the bottom left: each with how far, nearest first)
    makes the GPS follow them, a ring round them in place of the pin, and again stops it; a click on a
    mark makes it your waypoint; the right click's menu (a long press) has **🚩 Marcar para todos**
    inside the area and **✕ Tirar a minha marca** once you have one; the hints say so.
  - `src/main.ts`: `roomView` (the friends where they are, the marks), the GPS following a friend
    (`gps.follow`: the waypoint where they were, worked out again every 4 s once they've moved more
    than the arrival's distance, at once past 50 m; "Chegaste ao pé de …" within 15 m in the kart or
    6 m on foot, or at the route's end while it still ends near them; "… já não está na sala" when
    they leave; a moment unheard of, as after a race, it keeps on to where they were, for 5 s), the
    feed's "🚩 … marcou um sítio para todos", and the help.
  - **Found along the way, fixed here:** round the city, the maps drew someone on foot at their
    waiting kart, not where they were (the dots came from the karts' cars); now from the friends'
    own positions, which the click on a friend needs.
  - README ("Meeting the others", the touch controls), `docs/architecture.md` (the file, the flow,
    both messages), `CLAUDE.md` (the host's checks) say so.
- **Evidence.** `test/marks.test.ts`: the host drops a mark outside the open world (10 km off, 5 km
  east of the plinth), not finite, malformed, and one under another's id (Bruno's connection naming
  Ana, or the host), keeps Ana's untouched; takes his own beside hers; one a player; not more than one
  a second (999 ms dropped, 1000 ms taken); renamed; taken away; gone when he leaves. The sender: the
  first at once, the last of three within 1.2 s after it, none once stopped. `whereIs`: none for a
  bot, someone gone, or unheard of for 5 s. `npm test` 155 of 155 and `npm run check` clean.
  Playwright in the game, two browser contexts in one room over PeerJS (party-kart's
  `shots/2026-10-24-task110/`, `meet110.mjs`, `results.json`, 19 of 19, run again on the last code):
  Ana hosts, Bruno joins by the link; Ana goes to the Avenida João XXI, Bruno sees her in the list and on the map, a click and his
  GPS follows her (662 m by the streets); she goes 497 m to the Parque da Ponte and his route goes
  after her at once (1220 m); she drives 20 m on and within 4 s his waypoint is where she is; she
  marks a place by the Topo do Fujacal for everyone, Bruno has it with her name and his feed says
  so, a click on it makes it his waypoint (no longer following); her new mark takes the old one's
  place; taken away, it goes from his maps; his own reaches her and goes when he leaves; in a race no room on the map; no
  page errors. On a phone's screen (`phone110.mjs`, `results-phone.json`): her mark on his minimap
  with her name, the room's list on the full map a tap on the minimap opens, a long press offering
  "Marcar para todos"; its check of a tap on her name following her failed as it should: he was 10 m
  from her, inside the 15 m of being there, so the GPS said he'd arrived at once (following on a click
  is the desktop run's). Shots seen: `1-bruno-follows-ana` (the ring, the route, the list),
  `2-ana-marks` ("A tua marca" with its ✕), `3-bruno-sees-the-mark` (her flag by the Topo do Fujacal,
  "Marca de Ana" in the list; by car the route to her ends about 50 m short of her in the park, on
  the streets as 109 has it), `4-phone-minimap-mark`, `5-phone-map-room`, `6-phone-long-press`.
- **Seen once, not reproduced:** one full `npm test` run on this branch ended on a stack trace in
  `test/comp.test.ts`, its test "bots alone in a match, two against two and three against three:
  rounds won every way, bombs planted, the match over" (its last frames: `inside` in
  `src/world/interiors.ts`:185, `solid`, `sight` and `clear` in `src/world/sight.ts`, `FootBot.sees`,
  `look` and `step`, `Squad.step`, then `match` at comp.test.ts:222), and no summary after it; its
  cause wasn't found. 110 doesn't touch those files. The file passed alone four times, and the full
  suite three times since.
- **Decided by the session, for the owner to confirm:**
  - The room's marks stay through a race or a round, hidden in it, and are back after it (rather
    than cleared when one starts); none can be put while one is on.
  - Following a friend ends when you're there (15 m in the kart, 6 m on foot), as a waypoint does,
    rather than going on following them.
  - A mark is a flag in the colour of who put it, the driver's: a dark driver's is dark, with a white
    edge.
- **Landed (worker-2, 2026-10-24):** party-kart `67e3771`, rebased onto 066's 84712aa (156 of 156,
  `tsc` clean). braga-map unchanged but this file and the roadmap: no version. No new decision: the
  task's own rules; the three decided for the owner are in task 103's table.
- **Not verified:** two machines on different networks (both contexts were on one machine, through
  PeerJS's server); real phones (Playwright's touch screen only); an old build in the same room (that
  it ignores both messages is read from the code, not run).
