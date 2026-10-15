# Decisions

Why the map, and the cities games draw from it, are built this way. A change of mind is a new
entry that names the one it replaces; old entries stay as they were. The earlier decisions on
the zones and landmarks, taken on the shared map page, are in `map/decisions.json`.

## 001 · The goal: Braga as close to real life as possible

*2026-10-13*

The owner and their friends want to recognise their city: each street as wide as it is, each
building where it stands, at its height and colour, the hills, the trees, the landmarks and the
street furniture as they are. Everything on the roadmap serves that. Where a game departs from
real life, it's on purpose and listed in decision 004.

One roadmap and one set of tasks, kept here, cover both the map's data (this repository) and
the 3D city a game draws from it (today `../party-kart/src/render/`). Each task names its
repository. The data lives here because every game on the map shares it: the kart race first,
a shooter next (decision 003).

## 002 · Photo textures are allowed

*2026-10-13*

party-kart's rule was "no asset files: every texture is drawn on a canvas". For the city it no
longer holds: real photographs and aerial imagery may texture the ground, facades, roofs and
landmarks, wherever they make a place look more like itself. The owner chose this over keeping
textures procedural (lighter, no licences to track) and over allowing photos only on landmarks.

What it costs, and the conditions:

- **Licences.** Only images whose licence allows using them as a texture and publishing the
  result: the owner's and their friends' own photos, and open sources whose terms say so
  (task 005 keeps the register). Each source's credit goes where the README keeps credits, and
  in the game where it credits OpenStreetMap.
- **Size.** Photos weigh far more than canvas textures. They're compressed, streamed by tile,
  and sized per quality tier, inside the budget of task 004, so phones still play. How is task
  007's.
- **party-kart's docs** (`CLAUDE.md`, the README's "nothing to maintain") change to say so, in
  a party-kart session (task 007).

## 003 · Where the detail goes first: the track, and Fujacal for the shooter

*2026-10-13*

The scripts keep working for the whole map, but hand work (measuring, photographing,
modelling) goes first to two places:

- **The Volta dos Amigos**, and what can be seen from it.
- **Fujacal and Conselheiro Lobato,** where the first shooter game will take place: the Rua do
  Fujacal, the Travessa and the Alameda do Fujacal, the Rua and the Travessa Conselheiro Lobato.
  On the map that's about x −350…350 and z 600…1050, 700 × 450 m, in tiles `x-1z1`, `x0z1`,
  `x-1z2` and `x0z2` (task 015 settles the edge). A shooter is played on foot, so this area
  needs detail at walking distance: doors, windows, walls, kerbs and steps where they are. The
  track's start line is on the Rua do Fujacal, so the two overlap.

The rest of the map gets what the scripts can make from data alone. The owner chose this over
the track alone and over the whole map evenly.

## 004 · Where games depart from real life, on purpose

*2026-10-13*

- **Bom Jesus and the Sameiro are twice their real size** in the kart race
  (`party-kart/src/render/sights.ts`, `FAR_SCALE`), so they read 3–4 km away through the haze.
  The owner chose readability over accuracy here (2026-10-13). A shooter may draw them at their
  real size.
- **The track is never narrower than 9 m** (`W_MIN` in `tools/osm.mjs`), so eight karts and a
  row of item boxes fit. The world's own streets keep their real widths; only the race widens
  them.
  *Replaced by decision 019 (2026-10-14): the race runs on the streets at their real widths.*
- **The friends' houses are never at their real door.** An easter egg stands near a waypoint,
  44–50 m past it (`tools/track.mjs`), and the waypoints stay in `.cache/places.json`.
  *Replaced by decision 014 (2026-10-14): the eggs stand on the houses.*

- **A ramp into the dead end,** in the Volta dos Amigos only during a race: planks on a pile of
  rubble behind an "obras" sign, and a flight over the Rio Este where there's no road (decision 027,
  2026-10-15).

Anything else that looks different from the real place is a bug, and belongs in a task.

## 005 · "Looks like Braga" is judged on a shared scorecard

*2026-10-13*

The owner and their friends know Braga; a script doesn't. So realism is measured at fixed
viewpoints (task 001): each one a real photo beside a screenshot from the same place, height
and heading, on a shared page where they rate how much it looks like Braga and say what's wrong
(task 003). The screenshots are shot again after every task that changes the look (task 002),
so each round shows whether it got closer. The owner chose this over sending screenshots in the
chat case by case.

## 006 · Which sources may be used, and for what

*2026-10-13*

What each source's terms allow, as read on 2026-10-13 (task 005 has the details, and
`docs/SOURCES.md` the credits, once it exists):

- **Use freely, with credit:** OpenStreetMap (ODbL), DGT's LiDAR, orthophotos and land use
  (CC BY 4.0, credit "Informação geográfica cedida pela Direção-Geral do Território"),
  Copernicus data, and Microsoft's building footprints (CDLA-Permissive-2.0). Data derived from
  them may go into the world's tiles and be published.
- **Photos by the owner and the friends:** theirs to use, as references and as textures, with
  their consent. The first choice for textures and the scorecard.
- **Wikimedia Commons:** each photo under its own licence. As a reference, always. As a
  texture, with its credit; a CC BY-SA photo makes the texture CC BY-SA. Portugal's freedom of
  panorama covers buildings and sculptures in public places, naming the architect.
- **Mapillary:** its photos (CC BY-SA) as references, with its credit and link. Its detected
  map features (signs, lamps) are under Mapillary's own revocable terms: never copied into
  this repository. They may guide someone mapping those things in OpenStreetMap, which then
  brings them here.
- **Never, for anything that ends up in the map or a game:** Google (Maps, satellite, Street
  View, 3D Tiles: its terms forbid creating data or content from them), Esri World Imagery and
  Bing (only for tracing into OSM in an OSM editor). Nothing is recorded from Street View, not
  even by hand.

The alternative, using whatever looks best, would put the map at risk of being taken down, and
it's meant to be shared by games.

## 007 · DGT's data is fetched with the owner's account and stays out of the repository

*2026-10-13*

DGT's LiDAR, orthophoto and land use (decision 006) are fetched by `tools/fetch.mjs` into
`.cache/dgt/`, which git ignores (about 1.8 GB), and read by `tools/dgt.mjs` with dev dependencies
only (`geotiff`, `proj4`, `laz-perf`, `jpeg-js`). Nothing ships to games as it is: what a task
makes from it goes into the world's tiles, with DGT's credit. `docs/SOURCES.md` has the details.

- **The account.** The LiDAR's downloads need a free account at DGT's CDD. It's the owner's,
  kept out of git in `.cache/credentials.json`, and `fetch.mjs` logs in with it. The owner chose
  this over setting it in environment variables and over downloading the tiles by hand. The
  orthophoto and the land use need no account. Mapillary's token, when it's wanted, is task
  001's to ask for.
- **The grid.** DGT's data is in EPSG:3763. ETRS89 is taken as WGS84 (EPSG's transformation
  1149), as DGT's own server does, and `test/sources.test.js` checks that the Praça da República
  lands at (0, 0) within 1 m in the orthophoto and in the LiDAR.
- **The orthophoto** comes from DGT's open WMS as JPEG at 25 cm, on the LiDAR's 1 km tiles. Its
  TIFF is 18 times the size, and its PNG has only 256 colours.

The alternative, committing the data, or cuts of it, would make the package gigabytes for every
game that installs it.

## 008 · The ground is DGT's LiDAR, finest where the games are played

*2026-10-13*

The world's ground, the tracks' heights and the buildings' footing come from DGT's 2025 LiDAR
terrain model (task 009, `tools/terrain.mjs`): at 50 cm over the Volta dos Amigos' box and at 2 m
over the rest of the map. EU-DEM, which the map had before, smoothed away anything smaller than a
block, and was 34 m low on the Picoto's top.

- **How fine.** The world's tiles hold the ground every 2 m where the tracks run (within 60 m of
  each) and over the shooter's area (decision 003), and every 10 m elsewhere: the ground of a 2 m tile is
  about 35 KB gzipped, of a 10 m one 3 KB. A new track gets its 2 m tiles at the next `npm run world`.
- **The track is the street's own surface,** smoothed over about 10 m, no more than karts need,
  and it tips sideways as the street does, up to 8%. Bridges, whose decks the bare ground leaves
  out, are crossed straight from end to end until task 012 gives them their levels.
- **A building stands on the ground at its lowest corner,** and its height is from there, as
  OpenStreetMap measures it.
- **Beyond the map,** for the horizon, the Terrain Tiles (EU-DEM) stay: the LiDAR wasn't fetched
  that far, and 5 km off the difference doesn't show.
- **In the kart race,** the land meets the road as the ground does: no flattening beside it, the
  pavements sloping to the ground at their back, a retaining wall or a skirt for the rest. It
  costs triangles (task 004 has the numbers); the detail kept near the road is what to trade
  first.

The alternatives were the 2 m model everywhere (simpler, but the steps and walls along the
streets go) and the 50 cm model in the tiles (four times the 2 m tiles' size, for detail the
games' meshes can't show yet).

## 009 · Viewpoints are set where open photos were taken

*2026-10-13*

The viewpoints the city is judged from (decision 005, task 001) are chosen where a good open photo
of the place already exists online, and each stands exactly where its photo was taken: the
camera's position, heading, pitch and roll as Mapillary's reconstruction gives them, at eye level
(the track + 1.2 m for a kart, the ground + 1.7 m on foot). The owner chose this over picking
favourite spots first and finding photos for them.

- **Mapillary for the streets.** It had 33,764 photos round the route and Fujacal; Wikimedia
  Commons had 24 near the route, Panoramax 3, and KartaView answered nothing. Its photos are CC
  BY-SA 4.0: each viewpoint keeps its author and link, to show wherever it's shown. Its token is
  the owner's, kept out of git in `.cache/credentials.json`.
- **The list is committed, the photos aren't.** `refs/viewpoints.json` holds the viewpoints and
  their credits; `tools/refs.mjs` fetches the photos into `.cache/refs/`, until task 007 decides
  where images live.
- **The friends' houses stay out of them:** 150 m from every waypoint and egg, never looking at one
  within 300 m, checked by `test/viewpoints.test.js`; nowhere says which places that left out.
- **A photo the owner or a friend takes** from the same place and heading (task 008) may replace
  one later; Google Street View never (decision 006).

The alternative, the owner's and the friends' favourite spots, would have waited on the photo walk,
and a spot with no photo can't be judged.

## 010 · The race keeps the rules of the road

*2026-10-13*

The Volta dos Amigos, and every track planned on the map, goes the way a car may: one-way streets
and roundabouts only the way they go, no turn OpenStreetMap bans for cars, and no street cars may
not use (`tools/track.mjs`, task 027). The planner fails a loop that breaks one, and
`test/rules.test.js` checks the tracks against the map's one-way streets.

- **Longer where it must be.** One waypoint's street runs one way against the loop, and the loop
  drives along each waypoint's street, so it doubles back there: 9.27 km instead of 8.15 km. The
  owner chose that over taking the houses in another order (8.81 km, without the Avenida da
  Liberdade, the 31 de Janeiro and the Via da Falperra) and over keeping that one stretch against
  the traffic (8.38 km). party-kart's tests take a loop of 7–10 km and a second lap of 170–290 s.
- **The map is the authority.** Where OSM is wrong about a street's direction, it's fixed in OSM
  (task 006), not worked round here.
  *Replaced by decision 022 (2026-10-14): nobody edits OSM; a wrong street that matters comes to
  the owner.*
- **Not a departure.** Decision 004's list stays as it was; the `(joined)` links out of dead ends,
  which a note on the map asked for, are the one way the loop leaves the streets.
  *Replaced by decision 027 (2026-10-15): no made-up road; the race jumps into a dead end from a
  ramp, a departure on decision 004's list.*

The alternative, any street either way, made the start go the wrong way down the Rua do Fujacal
and the race take the Via da Falperra's roundabout the wrong way round: anyone who drives in Braga
sees it.

## 011 · A round of shots is the city alone, the same every time

*2026-10-13*

Every task that changes the look is judged by shooting the viewpoints again (decision 005), so a
round has to differ from the one before only where the city did. party-kart's
`scripts/shots.mjs` (task 002) shoots them with `?scenery`: the city built as a race builds it,
with no menus, karts, HUD or race, its textures' noise seeded and its animations held at 0 s.
Two runs on the same tree give identical PNGs.

- **The photo's frame.** Each shot takes its viewpoint's field of view and its photo's shape,
  720 pixels high, so shot and photo can be set side by side or over each other.
- **Its own dev server.** The script never uses one already running: Vite doesn't watch
  `node_modules`, and one started before braga-map was last installed serves the old map.
- **No network.** Everything off the dev server is refused, and nothing asks for it.
- **The baseline** is `shots/2026-10-13-baseline/` in party-kart (ignored by git, 24 MB), shot
  on party-kart `ac47bf0` and braga-map v1.2.0. Being deterministic, it can be shot again from
  that commit.
- **Changing how shots are taken** (the light, the shadows' reach, the size) makes rounds
  incomparable: shoot a new baseline with it, and say so in the round's label.

The alternative, a race started alone and its camera held with `?view=`, put the HUD, the
countdown and moving karts in the shot, and needed PeerJS's server, so the internet.

## 012 · The scorecard: the owner's, in Portuguese, one round open at a time

*2026-10-13*

"Braga real" (task 003, https://claude.ai/artifact/MsA5VZHSqxfD3e4BDYrYPs) is where the rounds of
decision 011 are judged (decision 005): each viewpoint's photo over the game's High shot, a mark
from 1 ("não é Braga") to 5 ("juro que é real") and a comment, per person and per round.

- **Who rates.** The owner, alone for now. Anyone else rates once the owner invites them by email
  as Editor, with no public link: a public link leaves everyone but the owner read-only. Names
  come from each person's claude.ai account; nobody types one.
- **In Portuguese,** like the map page; the viewpoints carry a `nome` for it.
- **High shots.** Realism is judged on the best the game draws; Low is the budget's (task 004).
- **One round open.** Only the newest round takes marks; older ones are its history. In it, the
  others' marks for a place show once you've given yours, so nobody follows the first.
- **The page carries the pictures,** as its own published files, and the database only the marks
  (`scores/<their id>`, written only by them). A round goes up with `tools/round.mjs` and a
  republish, and is recorded in `refs/rounds.json`.
- **Comments become tasks.** After a round, its comments are read, and each goes to the task that
  covers it, naming the viewpoint, or to a new one.

The alternative the task first had, anyone with the link rating, can't save a mark on this plan.

## 013 · The city's budget is today's city

*2026-10-14*

Everything a change adds to the city keeps inside a budget (task 004): the most draw calls,
triangles, textures' memory and download the city may take on each graphics level, written in
party-kart's `docs/architecture.md`, "The city's budget". Without it, every realism task would add
a little until the game stutters on a phone.

- **The floor** is an older Android, the slowest phone a friend races on.
- **Today's city, rounded up.** The owner dropped measuring the phone. The friends already race on
  today's city, so that's what is known to run: at any viewpoint, 200 draw calls, 1.1 M triangles
  and 95 MB of textures on High; 200, 0.9 M and 60 MB on Medium; 180, 0.55 M and 45 MB on Low; and
  1.5 MB downloaded. The karts come on top.
- **More takes a trade or a phone.** A change that needs more takes it from somewhere else in the
  city (the ground's detail near the road first, task 009), or measures the phone and raises the
  budget to what it holds with room to spare. Most tasks of Phases 2–4 add to the city, so the
  first that can't trade is when the phone gets measured.
- **Measured** with `node scripts/shots.mjs <label> --medium` at the viewpoints and
  `node scripts/download.mjs` on the PC, and with `?stats` on a phone: an on-screen counter, so a
  friend can run it alone, with no cable or developer tools. Task 004's Notes have the phone's
  steps.

The alternative, the task's plan, set the budget from the phone's frame rate with room to spare.
It stays the way to raise it.

## 014 · The friends are in the game: their jokes on their houses, and they drive

*2026-10-14 · replaces decision 004's bullet on the friends' houses*

The kart race was dressed as an American celebrity party (P. Kiddy's White Party, parody rappers
and a president for drivers). The owner wanted Braga's own instead: the drivers are the five
friends the Volta dos Amigos goes past, each in a car that's a joke about them, and each one's
easter egg stands on their house, exactly on the dot on the shared map, where before it stood
44–50 m past it so nobody's door was shown.

- **The eggs are on the houses.** `tools/track.mjs` writes each egg at its waypoint's own spot, on
  the side of the road it's on; the games stand the egg there (party-kart's `eggSpots`), or just
  far enough from the kerb for what's in front of it. A friend with no joke yet can have one:
  Vale's is a clock (task 030).
- **The drivers are the friends, by first name.** Pedro, Joel, Joel F., Capelas and Vale; never a
  surname. Their faces are the same cartoon face as everyone's, never a likeness.
- **What stays private.** The waypoints themselves stay in `.cache/places.json` and the shared
  map's database, and no commit, task or doc names a friend's street or door. The eggs'
  coordinates in `tracks/amigos.js` are now the houses', and with the drivers' names a stranger
  can tell whose house is where. The owner chose this knowing the repositories and the game are
  public (2026-10-14), over keeping the eggs 44–50 m off and the drivers as nicknames.
- **The rest of the party went too:** the items have Braga's names and looks with the same rules
  (☕ café, 🍮 pudim, ⚽ bola do Braga, 🕊️ pombo-correio, 🚀 foguete, ✨ filigrana, 🔨 martelinho,
  ☂️ guarda-chuva), and the start is a granite plinth with Braga's arms (task 028). "Party Kart"
  keeps its name and address.

## 015 · The Tourigalo is five times its size, and exaggerated

*2026-10-14 · adds to decision 004's departures*

The owner wanted the Tourigalo bigger than life and over the top: in party-kart it stands about
25 m to the top of its comb, five times the real statue (`TOURIGALO_SCALE` in
`src/render/sights.ts`), with every feature exaggerated, the testicles most of all, swinging
under it. It keeps its real place, heading and colours, and the restaurant behind it stays its
real size. No building or tree stands within 13 m of it.

Like Bom Jesus and the Sameiro at twice their size (decision 004), it's a choice for the game,
not a mistake for a task to fix. A shooter may draw it at its real size. From the race it shows
for about 150 m, ahead and to the left on the way to the roundabout; the corner block hides it
before that.


## 016 · The engines and the city may be recordings; the rest stays synthesized

*2026-10-13, written 2026-10-14 · adds to decision 002*

party-kart's rule was "no asset files: every sound is synthesized". For the karts' engines and the
city's sound round the track it no longer holds: they may be recordings, which sound like the
thing itself where a synthesis only sounds like a game. The menus', the items', the jingles' and
the eggs' sounds stay synthesized, and there's no music. The owner chose this on 2026-10-13, over
recording everything and over keeping everything synthesized.

The conditions, as decision 002's for photos:

- **Licence: CC0 only**, from Freesound or the like, each on record in `docs/SOURCES.md`
  ("Sounds") with what was cut from it, though CC0 owes no credit. Nothing is recorded on the
  photo walk.
- **Size:** MP3, which every browser decodes, fetched after the city so a race never waits for
  it; the engines' loops under 300 KB in all, the city's under 1 MB.
- **The karts' engine is a race car's, synthesized:** a V8 through six gears, its revs climbing
  in each and dropping at the shifts (task 024). No CC0 recording holds a race engine, or a kart's,
  steady over its revs, which loops need. The owner chose it on 2026-10-14 after hearing two in
  the game: a small OHV engine's recording, the kind rental karts have ("too harsh"), and a
  synthesized racing kart's two-stroke ("not two stroke, several gears and should be closer to a
  race car"). A kart's lack of a gearbox doesn't bind the game.

## 017 · The budget is a guide, not a limit

*2026-10-14 · replaces decision 013's "a change may not take the city past it"*

Realism comes first (decision 001). The budget stays (task 004, party-kart's `docs/architecture.md`)
as what the city cost when the friends raced on it, and every task that adds to the city still
measures what it adds against it and records that in its notes: draw calls, triangles, textures
and download, on High, Medium and Low. But a task no longer stops, trims what's real, or waits on a
phone to get past it. When the city outgrows the friends' phones or GitHub Pages, the owner moves
the games to a stack that scales better, or serves them from their homelab server: the map is data,
and any game can draw it.

The owner said so on 2026-10-14, when task 011's real buildings took the city past the budget
(Low 0.583 M triangles of 0.55, and 1.56 MB of 1.5 to download) and the choice was to trim them,
keep them all and measure a phone first, or stay inside it with simpler buildings far from the road.

## 018 · The city's photos are found online; nobody takes new ones

*2026-10-14 · replaces decision 006's "the owner's and the friends' photos, the first choice", and
decision 009's "a photo the owner or a friend takes may replace one later"*

The reference photos every later task works from, and the textures made from them, come from open
photos already online: Mapillary first (its July 2024 panoramas taken on foot before its
dashboard photos), Wikimedia Commons for the landmarks, the skyline and the close-ups, an open
texture library where Braga has no photo, marked as generic. Nobody walks the route or Fujacal with
a camera. What no online photo shows is listed as a gap, and is drawn from its type's kit or a
procedural texture until a photo turns up online. The photos the owner or a friend take are still
theirs to use, with their consent (decision 002); they're just not sought.

- **The list is committed, the photos aren't:** `refs/photos.json` says what each photo shows,
  whether it's good enough for a texture (straight on, sharp, evenly lit, nothing in front) or a
  reference only, and its source, author, licence and link; `tools/refs.mjs` fetches them into
  `.cache/refs/photos/`, cutting a panorama to what it shows.
- **The friends' houses stay out of them,** as the viewpoints' do (decision 009): every photo
  taken 150 m from every waypoint and egg, none looking towards one within 300 m, checked by
  `test/photos.test.js`; nowhere says which photos that left out.

The owner chose this on 2026-10-14 over the photo walk task 008 first was (the owner and the
friends photographing the route and Fujacal with their phones): the scorecard's 29 viewpoints had
all found their photos online, and a walk waited on everyone's time. Task 008 found 424 photos and
listed the gaps: about half the buildings in the shooter's area have none.

## 019 · An open world: Braga to drive anywhere in, and the race a game mode in it

*2026-10-14 · replaces decision 004's bullet on the track's 9 m*

The owner wants to drive round Braga with the karts wherever they like, inside a small area for
now: every street as detailed as the track is today, the bridges and tunnels working, everything;
and the race as the first game mode started from it. Party Kart becomes an open world, and the
race goes from being the whole game to being one thing to do in it.

- **The area** is the Volta dos Amigos' and a little round it (task 032), so the race the friends
  know runs in it from the first day. The owner chose this over a smaller area (Centro and
  Fujacal) with a new, shorter race in it. It grows later, a section at a time.
- **One road for everyone.** Every street in the area is a surface the map gives (task 033): its
  carriageway at its real width, its junctions, kerbs, pavements, crossings and markings, at its
  level (task 012). The games draw it (task 035) and drive on it (task 034). The race runs on the
  same streets at their real widths: the 9 m it took (decision 004) goes, and a narrow street is
  as narrow for the race as it is. The owner chose "as real as possible" over keeping the route's
  streets 9 m wide in the open world too.
- **The pavements can be driven on,** over the kerb, outside a race. In a race the route's kerbs are
  its walls, as today, and barriers close the side streets it passes (task 037).
- **At the area's edge** every street leaving it is closed with barriers, and the city beyond is
  drawn but can't be driven into (task 032). The owner chose this over an invisible wall and over
  turning the player back.
- **The game opens in the world:** you're driving at once, alone, and the menus sit over it.
  Friends who follow the invite link appear in your world (task 036). A race takes everyone in
  the room, put on the grid at once, with bots filling the empty places as today; after the
  results everyone is back in the world where they were (task 037). The owner chose this over
  keeping the menus and the lobby first, over driving to the start line, and over a race only
  some join.
- **The stack stays:** TypeScript, three.js, Vite and PeerJS, served from GitHub Pages, with no
  server. The arcade handling stays, its ground and walls taken from the world instead of the
  track; no physics engine. braga-map stays data (task 015's answer): the streets as surfaces are
  data any game can draw. Unity, Unreal and Godot were weighed: turning OpenStreetMap and the
  LiDAR into a city is code to write in any of them, their web builds are heavy or weak on phones
  (Unreal has none), and a switch would throw away the game and its tests. When the city outgrows
  GitHub Pages, its tiles go to Cloudflare R2 or the owner's homelab (decision 017).
- **The city is built whole** for the small area, as the track's is today; streaming it tile by
  tile (task 038) comes when the area grows or a phone needs it.

The alternative, the kart race as it was with more streets painted round it, can't be driven off
the route: everything but the track is paint on the ground.

## 020 · The open world's edge is worked out from the streets, and the Picoto's top is in it

*2026-10-14 · task 032*

Where the open world ends (decision 019) is drawn by a script from the map, not by hand
(`tools/open.mjs`, into `tools/open.json`), so it can be drawn again when the map changes or the
area grows, by the same rules:

- **The streets decide it.** Every street that comes within 120 m of the Volta dos Amigos (or of a
  pocket between two of its arms) is in, whole, from junction to junction; so is a street between
  two junctions that are in. The edge runs half way between the streets in and those out, which
  puts it along the backs of the buildings between them, and goes round a building rather than
  through it. The loop is always more than 100 m inside it.
- **A street leaving is closed just past its junction,** where its kerbs have turned the corner,
  with the edge straight across it at right angles: a game stands its road-works barriers there
  ("Estrada cortada"), the gates. A roundabout is never cut: it's in whole, and its exits are
  closed where their two carriageways run side by side, one row of barriers across both.
- **The Picoto's top is in** (its viewpoint and its cross, with the road round the summit), taken
  in as if the loop passed there. The owner chose this after looking at the edge on the map page,
  over leaving it 150 m outside.
- **Where a kart can go, the ground is every 2 m:** on every tile the area touches. A game loads
  those and the tiles within 500 m of them, so the city stays drawn past the edge
  (`loadWorld({ open: true })`).

The owner looked at the edge on the map page and kept it as it came out. A hand-drawn edge would
have been tidier in places, but couldn't follow the map when it changes, and nothing would say
where it crosses each street.

## 021 · A kart drives on the world as the map has it, and a building in a street is cut at the kerb

*2026-10-14 · task 034*

In the open world (decision 019) a kart's ground and walls come from the map, not from the race's
track: party-kart's `stepCar` takes a ground, the world's (`src/world/ground.ts`) or, until the
race moves into the world (task 037), the track's, with the same handling on both.

- **What the map says is what's solid.** The land as the game draws it, every street at its level
  (`world.streets`), the buildings, the trees and the area's edge with its barriers. A kerb is a
  step a kart hops up; a deck's edge has a parapet and a tunnel's sides are walls wherever no street
  or land at its level is beside them; land that rises more than a step, or steeper than 35° off
  the carriageway, stops it. Nothing stands where the map has nothing: a street's edge that drops
  into a cutting has no railing until the map has walls and fences (task 013).
- **A building that stands on a carriageway is cut back to the kerb** until the streets are
  measured (task 026): solid only off the carriageway, a passage through one left open, and drawn
  the same way (task 035). 993 do round the area, by up to 14 m, half of them OSM's outlines and half
  the LiDAR's. The owner chose this over clearing those a metre or more in, as the race clears its
  road (about 490 would go, leaving gaps in the rows of houses), and over keeping them whole (a
  LiDAR sliver across a street would block it).
- **Where the map is off, the ground eases it** and braga-map fixes the data: a deck's end up to
  0.66 m off the ground it meets is eased to it over 10 m (task 040), and a street stands on the
  land without the river's bed cut under it.

## 022 · OpenStreetMap as it is: what it lacks is listed, not patched

*2026-10-14 · task 006 · replaces decision 010's "it's fixed in OSM"*

Nobody in the group will edit OpenStreetMap: an account would only be for contributing to it, and
nobody will (the owner, 2026-10-14). So the map's streets are OpenStreetMap's, as they are.

- **What it lacks, or has wrong, is listed,** not patched here: no street is added, moved or turned
  round in the world for it. `tools/audit.mjs` lists, round the Volta dos Amigos, every street the
  map has and whether the world draws it, and task 006's Notes what the 2025 orthophoto shows and
  the map lacks: on 2026-10-14, no street in use along the route or in Fujacal, only private
  drives, yards and dirt paths.
- **A wrong or missing street that matters to the race or the shooter** (its direction, a street on
  the route) comes to the owner: the only fix would be a local override, which no decision allows
  yet.
- **The world draws every street the map has,** of every class. A map page that shows fewer (the
  65% cut of draft 1) leaves them out of that page only, and a street the world misses is a bug in
  the scripts (task 041, the squares mapped in parts).

The alternative, fixing OpenStreetMap at the source, would reach every map made from it and
survive each fetch, but needs someone in the group to do it.

## 023 · A deck meets the street at the ground the tiles hold, and at one level nothing lies over another

*2026-10-15 · task 040 · makes decision 021's "braga-map fixes the data" concrete for the decks*

The height a street on the ground has is the tiles' ground (`height(x, z)`: the LiDAR's mean round
each point of a 2 m grid), not the LiDAR's own. So that's what a bridge meets:

- **A deck's end is at the ground as the tiles hold it,** so a game drawing or driving the streets
  needs no easing there: the end's node, and its end's line across the deck (a point every 2 m),
  meet the street on the ground within 5 cm. The deck doesn't follow the ground across it where
  that's half a metre or more off it: there the ground is an embankment's side, where the deck is
  wider than the street or the 2 m grid falls away at the abutment.
- **A tunnel's end is on the cutting's floor:** the lowest of the tiles' ground from its mouth to
  4 m out. The map's node is at the portal's face, where the 2 m ground is halfway up the hill, so
  a tunnel doesn't meet `height(x, z)` there: the ground is what's off, not the tunnel.
- **Within 2 m of each other's height, a deck or a tunnel's road and the ground are one level:**
  nothing passes under a deck that low, so no pavement on the ground lies over it (the road wins),
  and a deck's pavements give way to the ground's carriageway and stop at its end's line.
- **The ground itself is held to the street at a deck's end and a tunnel's mouth** in a task of its
  own (043): where the 2 m mean averages in what's under a deck or over a tunnel, the street on the
  ground dips into the abutment or climbs the portal, and the data should hold it level, once, for
  every game, rather than each game holding its land down (as party-kart does at the mouths).

The alternative, a deck's end at the LiDAR's height at its node, is closer to the real abutment
where the grid blurs it, but leaves a step of up to 0.66 m at the join, which each game would have
to ease.

## 024 · A game draws the streets on the ground its karts drive on, and no land under them

*2026-10-15 · task 035*

In the open world (decision 019) every street in the area is drawn from the map's surfaces
(`world.streets`), and a kart drives on them (decision 021): what's drawn has to be where the kart
stands. party-kart does it this way, and a game drawing the map's streets should too:

- **The surfaces lie on the ground the karts drive on:** a carriageway on the land without the
  river's bed cut into it, a pavement a kerb over it, a deck's or a tunnel's road at its height.
  Each piece is its own triangles, an edge halved where the ground under it bends more than a
  tolerance (25 cm on party-kart's High), each edge decided by itself so pieces meet without cracks;
  the drawn carriageways are within 3.4 cm of the karts' ground at the median and 19 cm at the
  90th percentile.
- **The land isn't drawn under a street,** whatever its height: party-kart clears its painted
  ground there and the land's material skips what's clear. Where a street's outline meets the
  land, a skirt down to it or a retaining wall up to it closes the gap.
- **Plates and bus stops for every street come from the tiles** (task 042, the owner's answer):
  until then, the route's.

The alternatives cost too much: laying the streets on the land's own triangles, or making the land
fine under them, needs 2 m detail under 80% of the streets, since the LiDAR's 2 m ground is rough at
their edges (it sees the kerbs): about 3.8 M triangles for the area. Following that ground to within
5 cm everywhere took 3 M. Even so the city costs more than the budget's guide at its busiest views
(decision 017): 1.57 M triangles on High where it was 1.14, and twice the time to build, which task
038 (streaming) is for.

## 025 · The buildings and the levels are the LiDAR's: measured, found, never invented

*2026-10-15 · tasks 010, 011 and 012*

Where the map and the LiDAR disagree about what's built and how high, the world takes the LiDAR's
(DGT's 2025 point cloud, over the whole map), and keeps OpenStreetMap's outlines where it has them:

- **Every building's height and roof are measured** (task 010): its eaves, its ridge, its shape
  (flat, gabled, hipped at either end, skillion), the way it runs and its pitch, cut into parts
  where its roof steps, its roof's colour from the 2025 orthophoto. OpenStreetMap's `height`,
  `building:levels` and `roof:*` are kept only where the LiDAR didn't see the building (622 of
  13,019), and where they disagree the LiDAR's wins: nobody fixes them in OSM (task 006's answer),
  and `tools/heights.mjs` lists the outliers.
- **No building is invented** (task 011): the buildings OSM lacks are outlined from the LiDAR's
  building points and squared (`tools/footprints.mjs`), 7,251 of them, where 11,492 houses were
  made up to fill built-up streets. Each footprint in the tiles says its source (`osm`, `lidar`,
  `microsoft`, `invented`); `invented` is kept for places the LiDAR doesn't cover, of which there
  are none on the map today.
- **Streets on two levels are in the tiles** (task 012): each stretch on a bridge, in a tunnel or
  under something, with the heights of a deck or a tunnel's road, and a game draws and drives them
  at those levels (decisions 021, 023 and 024).

The tiles' format changed for it (braga-map 1.4.0 to 1.6.0): a building packs its kind, colour,
roof, material, source and flags into one number, and its roof's colour is one of 127
(`map().roofColors`). The alternative, OSM's tags and guesses filled in by kind, put 4–7 floors on
any untagged block and invented houses in real streets (in front of the stadium, on São João da
Ponte's roundabout).

## 026 · Free roam goes live before the race moves onto the streets

*2026-10-15 · task 036 · changes the roadmap's "one release when 037 is done"*

The open world was to go live in one release with task 037, so the live game never lost its race.
The owner wanted to play free roam away from home, so it went live on 2026-10-15 with task 035's
streets and braga-map 1.9.1 (party-kart `af048ce`), and 037 follows in a release of its own:

- **The race is still there.** 🏁 Corrida in the menu starts today's race on the track's road, its
  barriers, gates, boost pads and line up only while it runs, and everyone is back where they were
  when it ends (task 036's answer). Until 037 that road is the 9 m one, not drawn: in a race a kart
  can be on a drawn pavement, and a gate can stand in the middle of a street (task 035's round).
- **Older tabs don't see the new rooms** (`partykart-pk32-`) until they reload.
- **Not checked before it went live:** the feel by hand (a kart rolls on 20 s and more off the
  throttle), a real phone, two networks. The owner plays it live first.

## 027 · The map is real; the race jumps into a dead end

*2026-10-15 · task 039 · replaces decision 010's "not a departure", and adds to decision 004*

One waypoint's street leads only into a pocket: a dead end, and a street off it that leads nowhere
either. The loop drives along each waypoint's street through it, so it took a made-up road, 86 m
straight through back gardens from the dead end to the next street. The owner wants the map as
real as it can be, with the easter eggs as the only jokes: the made-up road goes, and the race gets
in the way a kart game would.

- **The map's streets are the only roads** `tools/track.mjs` knows. Where a waypoint's street leads
  into a pocket, it finds every jump into it (`JUMP`): a ramp on a street a car may use outside the
  pocket, taken nearly straight on after 40 m of straight run-up; a flight at a kart's gravity over
  whatever's really there, clear of what DGT's surface model has under the slowest flight that
  lands; a landing on a street in the pocket heading for the waypoint. The loop takes the cheapest
  it can, and goes out by the pocket's own mouth. `test/rules.test.js` checks a track leaves the
  streets only in a ramp's flight.
- **The owner approves the jump** before it's built (task 039's answer). For the Volta dos Amigos,
  of seven candidates one is kept and approved: from the end of a straight street west of the Rio
  Este, over the T-junction there and the river, onto the pocket's lower street, 59 m and level, a
  20° ramp 2.7 m high, cleared from 117 km/h. The others swerve 41–60° onto their ramps in narrow
  streets, or have no run-up.
- **The loop grew to 10.1 km** (9.3 before): it comes down the run-up from the north, by Ponte
  Pedrinha. party-kart's tests take a loop of 7–10.5 km. The open world grew round it, 3.12 to
  3.48 km² (the owner's answer), and brought in the Rotunda Santos da Cunha (task 047).
- **The ramp is a Braga joke** (the owner's answer): planks on a pile of rubble behind an "obras"
  sign, with the road works' red-and-white boards, as if the city's works had left it. It stands
  only in a race: free roam is all real, and task 037 puts it out and takes it away with the race's
  barriers. In the air there's no road, kerbs or walls; a kart that falls short goes back onto the
  run-up.

The alternatives were the made-up road; a race that passes the street's mouth without driving
through it; turning round in the dead end; and the jump from the made-up road's own street (the
loop as long as before, but a 51° swerve onto the ramp in a 6.5 m street, too slow to clear it).

## 028 · A bridge's deck where the LiDAR saw it

*2026-10-15 · task 047 · adds to decision 025's levels*

A deck runs straight between the ground where it ends (task 012). That's right for a bridge over a
valley, but a flyover humps over what it crosses with both its ends on the ground: the straight
line laid the Rotunda Santos da Cunha's viaduct 6 m too low, on the streets under it, where the
loop now passes.

- **Where DGT's point cloud saw a deck** (class 26) 30 cm or more over that line, the deck is at the
  LiDAR's height. `tools/decks.mjs` boils the point cloud down to its decks once (the median in each
  metre, `.cache/decks.json`, 10 minutes); without it the world is as before.
- **Where the map ends a bridge short of its abutment** (the deck half a metre or more over the
  ground at its end), the street on the ground runs on along the deck the LiDAR saw, to where it
  meets the ground: the viaduct's map ends both fall about 10 m short.
- What it changed: the viaduct, up to 6.4 m, now within 0.1 m of the LiDAR's deck; of the other
  decks' 45 points the LiDAR saw, 16 closer to it and none further.
- **OpenStreetMap's errors found there are listed, not patched** (decision 022): a closed, unnamed
  `primary` way round the viaduct's south ramp, an outline of the junction rather than a street
  (way 160389857), is named in `test/levels.test.js` and `test/streets.test.js`.

The alternative, a hump guessed from the bridge's length, would be wrong wherever a deck isn't
symmetric, and the LiDAR has every deck it flew over.

## 029 · The race runs on its own streets as they're drawn, walled at their edges

*2026-10-15 · task 037 · makes decision 019's race concrete, and replaces decision 004's 9 m for good*

The Volta dos Amigos is a game mode in the open world: it runs on the streets everyone drives, at
their real widths, and a game walls its route in only while it's on.

- **The race's road is the route's own streets** as `world.streets` draws them: each street's band
  round the map's line at its real width, the corners between them rounded as a kerb turns them,
  cut to the carriageways drawn (a sliver of pavement under 1.2 m wide taken as road). A track
  gives it as `road`; its outline is the race's walls, closed by construction, so nothing is left
  for a kart to slip out by. `tools/track.mjs` reads the streets from the tiles for it.
- **Barriers where the street goes on.** Wherever the carriageway drawn goes on past the race's
  road, a game stands a row of barriers for the race (`closures`): across each side street's mouth,
  on the line of the route's kerb, and between a road's two carriageways where the map draws them
  as one and the route takes one (the Avenida João XXI, the Avenida da Liberdade). The owner chose
  that row down the middle over opening the other carriageway to the race.
- **The line is the street's own,** the map's line its carriageway is drawn round, folded at a
  jog or rounded at a corner only as far as it stays 1.2 m inside the race's road; a point's width
  is its street's, never past the race's road either side. Both only place the race (the bots'
  lines, the item boxes, the grid): the walls are the road's outline.
- **The jump's landing takes in the ground beside its street** as far as a kart flat out comes down
  (the owner's choice, over sending it back onto the run-up): a 4 m landing street can't catch a
  flight that lands up to 33 m past it, and a kart that comes down there drives back on, walled in
  the open.
- **The race is slower, as the streets are:** party-kart's autopilot's second lap went from 285 s
  on the 9 m road to 297 s, and its test takes 170–310 s (the owner, knowing it went over 290).

The alternatives were barriers by the kerb line at each junction the route passes, and openings
found by looking square off the line: the first stood barriers down the middle of a road drawn as
one, and the second missed a street leaving behind a corner the route turns, or off a road beside
the route's, and could stand a straight row of barriers across the route where it turns.

## 030 · Photo textures live with the world, as KTX2 compressed with Basis Universal's ETC1S

*2026-10-15 · task 007 · how decision 002's photo textures are made, kept and loaded*

A photo texture belongs to the place, not to a game, so it lives in braga-map with the world, and
every game on the map gets the same ones.

- **Where:** `world/textures/<tile>/<id>-<level>.ktx2`, a file for each graphics level (High,
  Medium, Low), committed and published with the package. Each tile's index,
  `world/textures/<tile>.js`, says where each texture goes (a ground tile's box, a facade's wall),
  its credit, and each level's file as a `new URL(…, import.meta.url)`, which a game's bundler
  serves as an asset. `loadWorld` hands a game the index with the tile (`world.photos`), never the
  files: a game fetches those it draws, at its level. The owner chose this over party-kart's
  `public/` and over keeping them outside git.
- **How they're made:** `tools/textures.mjs`, from `refs/textures.json`. The ground from DGT's 2025
  orthophoto, resampled onto the map's grid; a facade from a reference photo (decision 018)
  straightened onto its wall, from its corners read off the photo by eye. Each is credited in its
  index; one made from a CC BY-SA photo is CC BY-SA.
- **The format: KTX2, Basis Universal's ETC1S** (quality 200 of 255, sRGB, with mipmaps), which
  three.js's `KTX2Loader` turns into what the graphics card takes, so it stays compressed on it:
  half a byte a pixel on a phone (ETC1), where a WebP or a canvas takes four. For one ground tile
  and ten facades on High, measured in Chromium at a phone's size with the CPU slowed 4× (the owner
  dropped the phone, decision 013): 1.39 MB to download and 4 MB of a phone's graphics memory,
  against WebP's 0.71 MB and 32 MB; WebP also holds the frame three times as long putting them on
  the card. Basis's transcoder is 0.56 MB more, once. Over the open world's ground tiles WebP would
  take some 300 MB on High, three times the city's budget, which decided it.
- **A game draws them as it likes:** party-kart behind `?photos`, until tasks 016 and 017 decide
  how the ground and the facades should use them.

The alternatives were WebP (half the download, eight times the memory) and Basis's UASTC (sharper,
five times ETC1S's download for twice its memory).
