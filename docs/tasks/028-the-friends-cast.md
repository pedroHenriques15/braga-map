---
status: doing
priority: high
kind: code
repo: party-kart
created: 2026-10-14
depends-on: []
roadmap: Alongside · The friends' Braga
---

# 028 · The friends' cast: the five friends drive, and the celebrity party is gone

## Why

Party Kart's theme is an American celebrity party: P. Kiddy's White Party, parody rappers and a
president for drivers, champagne, a paparazzi drone, a bodyguard and a bass drop for items. It has
nothing to do with Braga, which the whole game now is. The drivers should be the five friends the
Volta dos Amigos goes past, each in a car that's a joke about them, and everything else Braga's.

## What

Today, in `../party-kart`:

- `src/render/drivers.ts`: `DRIVERS`, nine parody celebrities (P. Kiddy, Donald Trunk, Gucci Pain,
  Lil Woozy Vert, Trav Scotch, 22 Average, Lil Babyface, Lil Past, Playboi Farty), their `Body`
  (`kart`, `limo`, `stroller`, `vintage`, `van`), `Extra` props (chain, disco, flag, cactus…),
  `Trail` (`confetti`, `money`, `gas`…) and horns.
- `src/game/items.ts`: `ItemKind` `champagne`, `champagne3`, `pudim`, `disco`, `drone`, `bomb`,
  `gold`, `bass`, `shield`, with names, icons and blurbs; `ProjKind` and the `bass` event;
  `DISCO_SPEED`, `DISCO_BACK`. Used in `racer.ts`, `arena.ts`, `bot.ts`, `session.ts` (`cleanEv`),
  `main.ts` (`howName`, the feed, the flashes), `hud.ts`, `audio.ts` (`bass`), and the tests.
- `src/render/items3d.ts`: the disco ball, the drone, the pink party bomb, the bass drop's purple
  ring. `src/render/fx.ts`: the trails. The bodyguard's bubble is in `drivers.ts`.
- The start: `partyStage` in `src/render/city.ts` (a stage with a giant P. Kiddy, a "P. KIDDY'S
  WHITE PARTY" sign, a disco ball hung over the road), the party lights at the start
  (`stringLights`), the barriers' "WHITE PARTY ✦ BRAGA GP" (`tex.banner`), the start gate's sign
  and its gold caps (`road.ts`).
- The first track, kept for reference (`world.ts`, `landmarks.ts`): the same stage and sign, and
  a banner "BRAGA ♥ P. KIDDY · MAKE KARTING GREAT AGAIN · 22 AVERAGE".
- Words: the first screen's tagline (`main.ts`), `index.html`'s description and icon, the README
  ("P. Kiddy's White Party", the drivers, the items, "All names are parodies"),
  `docs/making-changes.md` and `docs/architecture.md` where they name drivers or items.

Steps:

1. **The drivers** are the five friends, by first name, each a cartoon bobblehead (the same
   friendly face for all, no likeness) in a car that's their joke:
   - **Pedro**: tech. A matte black kart with neon cyan trim and underglow, a laptop open on the
     nose, a Wi-Fi antenna with a blinking light; glasses and a headset. Horn: a notification
     ding. Trail: glowing cyan and green bits.
   - **Joel F.**: Mercadona. A giant supermarket trolley on castors, in Mercadona's green and
     orange, with shopping bags, a leek sticking out and a baguette; a cap. Horn: the shop's
     "ding-dong". Trail: till receipts.
   - **Capelas**: a car ready to be sold for parts, all of it wrecked. A boxy old hatchback,
     faded, rust patches, one door in grey primer, a cracked windscreen, a bumper hanging off and
     swinging, a missing hubcap, a space-saver spare, gaffer tape, and a "VENDE-SE PARA PEÇAS"
     sign in the window; black smoke out the back. Horn: a dying honk.
   - **Vale**: always late. A kart with a huge twin-bell alarm clock on the back, its hands
     racing round, clock faces on the wheels and an hourglass; a nightcap and a big wristwatch.
     Horn: an alarm clock ringing.
   - **Joel**: the dentist. A dentist's chair on wheels with the lamp on its arm over him, a
     giant toothbrush for a spoiler and a tooth on the nose, white and mint; a surgical mask and
     a head mirror. Horn: the drill. Trail: toothpaste foam.
   The parody names, taglines, props, bodies, trails and horns that only served the old drivers
   go.
2. **A full grid with five drivers.** Bots take the drivers nobody picked first; past five, they
   repeat a driver in a second paint job ("Pedro II"), so a race still fills its 8 places.
   `validDriver` and `cleanSnap` accept only real ids.
3. **The items** keep their rules, odds and timings, with Braga's names and looks: ☕ Café (×1
   and ×3, the champagnes), 🍮 Pudim Abade de Priscos (kept), ⚽ Bola do Braga (the disco ball:
   a red and white football), 🕊️ Pombo-correio (the drone: a homing pigeon), 🚀 Foguete (the
   party bomb: a festival rocket), ✨ Filigrana (gold plating), 🔨 Martelinho (the bass drop: a
   squeaky hammer bonks everyone ahead), ☂️ Guarda-chuva (the bodyguard: an umbrella over the
   kart). Their ids in the code follow the new names. The messages change, so the peer id prefix
   in `session.ts` changes too.
4. **The start, plainly Braga:** no stage party, disco ball or party lights. The lobby's car
   stands on a granite plinth with Braga's coat of arms, a "VOLTA DOS AMIGOS · BRAGA" sign
   behind it; the barriers and the start gate say the same, in blue and white, with granite caps
   on the gate. The first track's reference code loses the celebrity signs and banners too.
5. **The words:** the tagline, `index.html`, the README, `docs/making-changes.md` and
   `docs/architecture.md` say what the game is now. "Party Kart" stays the game's name (the repo
   and its address). The eggs' own names (Faísca, Contente, the café) stay.
6. `npm test` and `npm run check`. Look at every driver in the lobby and in a race, and every item
   in a race with bots (`?autodrive`).

## Questions

- [x] The game and both repos are public, and each car matches the egg by that friend's house:
  how are the drivers named? First names, no surnames (recommended); full names; or nicknames.
  > First names, no surnames: Pedro, Joel F., Capelas, Vale, Joel (2026-10-14).
- [x] Five drivers, but a race takes 8 karts: bots repeat drivers in a second paint job
  (recommended), five karts at most, or Faísca drives too?
  > Bots repeat drivers (2026-10-14).
- [x] What replaces the rest of the party: São João de Braga at the start (recommended), Braga
  without a festival, or only the drivers and words?
  > Braga, no festival: the items renamed as in step 3, a plain start with Braga's arms
  > (2026-10-14).

## Read first

- `../party-kart/CLAUDE.md`: the conventions, "the status flags are defined twice", `bake()` and
  `mat()`'s caches, the peer id prefix, the tests that guard the items.
- `../party-kart/docs/making-changes.md`: adding an item, a driver.
- `../party-kart/src/render/drivers.ts`, `src/game/items.ts`, `src/render/items3d.ts`.

## Done when

- [x] No celebrity, rapper, party or US name or joke is left in party-kart's code, UI or docs
  (`grep -i` for kiddy, trunk, gucci, woozy, scotch, average, babyface, farty, white party,
  champagne, paparazzi, bodyguard, bass, disco, money finds nothing but this task's history).
  > The grep finds only the first track's own name, "Braga Grand Prix", trees' trunks, an
  > unrelated "on average", and the confetti for a lap (2026-10-14).
- [x] The lobby offers Pedro, Joel F., Capelas, Vale and Joel, each in their own car as step 1
  says; a race with 7 bots fills 8 places.
  > Seen in the lobby, each car on the plinth; a room with 7 bots: "Tester (you) Pedro | Joel |
  > Joel F. | Capelas | Vale | Pedro II | Joel II | Joel F. II".
- [x] Every item turns up in a race and works as before: party-kart's `npm test` (which checks
  every item turns up) and `npm run check` pass.
  > 19 of 19, `tsc` clean. Eight bots: "events bola, pombo, martelinho, foguete, boom, haz, hit";
  > laps 265.6 and 263.5 s, as before.
- [x] The start: the plinth, the sign and the barriers as step 4 says, seen in the lobby.
- [x] The budget (task 004): the start's draw calls and triangles no more than before, at the
  start's viewpoint if there is one, on High and Low.
  > `fujacal-start`, against round `2026-10-13-budget`: 18 fewer draw calls and 23,000 fewer
  > triangles on High, 9 and 19,000 fewer on Low. The textures are 3 MB more at every viewpoint
  > (the arms, the clock faces, the script): 94 MB on High (budget 95) and 45 MB on Low (budget
  > 45, now full). Round `2026-10-14-friends`, all 29 viewpoints within the budget.

## Out of scope

- The eggs on the friends' houses, and Vale's clock: task 030.
- The Tourigalo: task 029.
- The game's name, its address, and its sounds beyond the horns and the hammer: tasks 023–025.

## Notes

- The owner, 2026-10-14: "Remove the Diddy, rapper and USA celebrities theme. Everything."
- The drivers' first names are a choice the owner made knowing the repos are public (decision 014,
  with task 030).
- Done so far (2026-10-14), not committed or released:
  - The drivers (`drivers.ts`): four bodies (`kart`, `trolley`, `banger`, `chair`), the props on
    the drivers and the cars, the trails (`bits`, `receipts`, `smoke`, `sparkle`, `foam`), and
    what moves: Vale's clock hands and bells, his hourglass, Capelas's bumper and wobbling spare
    and his car rattling, Pedro's antenna light. Shields are an umbrella, the shrink a squeaky
    hammer bonking the head. Repeats: `repeatOf`, `driverById` with `alt`, `syncBots` in
    `session.ts`.
  - The items renamed in the code too (`cafe`, `bola`, `pombo`, `foguete`, `filigrana`,
    `martelinho`, `guarda`); the `bass` event is `martelinho`; the peer id prefix is `pk31`.
  - The start: `startPlinth` in `city.ts`, `tex.bragaArms()` (the arms simply drawn, from Heraldry
    of the World's description: on blue, Santa Maria de Braga with the Child between two silver
    towers, three escutcheons of Portugal's old arms in chief, a mural crown of five towers). No
    trees on the plinth or in the eggs' ground now. The lobby's camera looks from the road, so
    the wall with the arms is behind the car.
  - The sign's subtitle is no longer gold, and the default frame is grey; the item boxes are
    blue.
- **Released** on 2026-10-14: braga-map `5d6ca6b`, tagged `v1.3.0`; party-kart `6309e63`, on it,
  deployed to https://pedrohenriques15.github.io/party-kart/. The peer id prefix is `pk31`, so
  players on the old build must reload to race. On v1.3.0: party-kart's `npm test` 19 of 19,
  `tsc` clean.
- **Left:** `/task finish 028`: the round `2026-10-14-friends` (shot) posted to the scorecard.
