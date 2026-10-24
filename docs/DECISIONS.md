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
- **But the photo's own pitch where Mapillary's is off** (task 055, 2026-10-16): a phone on a
  dashboard can be reconstructed tilted several degrees from what it saw. Where the photo's horizon,
  or its buildings outlined from the camera (`node tools/buildings.mjs mark <id>`), say otherwise,
  the camera is aimed as the photo looks, and its note says so: `monte-da-forca` 3° up (Mapillary's
  9.5°), `estadio` 5.5° (7.1°). The other viewpoints over 5° fit as Mapillary has them.
- **And on the surface its photo was taken from** (task 058, decision 041): where Mapillary's
  position is off the lane, the pavement or the path the photo shows, the camera is moved the
  shortest way onto it, its heading and pitch kept.

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

## 031 · The shooter's area: between two avenues and the river, and braga-map stays data only

*2026-10-15 · task 015 · settles decision 003's edge for Fujacal*

The first shooter is played on foot in Fujacal and Conselheiro Lobato: the five streets (the Rua,
the Travessa and the Alameda do Fujacal, the Rua and the Travessa Conselheiro Lobato) and a block
each side of them, 21.5 ha. What it needs at walking distance, and where each thing comes from, is
in [SHOOTER-AREA.md](SHOOTER-AREA.md).

- **Its edge is where a player would take one:** the near kerbs of the Avenida Imaculada Conceição
  and the Avenida da Liberdade, and the near bank of the Rio Este, so the player walks their
  pavements and sees across but doesn't cross. On the west, past the Rua Monsenhor Airosa, the
  block behind it is in, the flats round the Rua Doutor José Vilaça's driveway and their courtyard
  with it, down to the river; there the edge runs half way between the streets in and those out,
  along the buildings' backs, as the open world's does (decision 020). `tools/shooter.mjs` works it
  out from OpenStreetMap and the buildings; run it again rather than editing `tools/shooter.json`.
  The owner agreed it as drawn, over taking in the block across the Avenida Imaculada Conceição
  and over keeping the west to the row of houses on the Rua Monsenhor Airosa.
- **A game loads it as the section `fujacal`,** with the 12 tiles round it for what's seen past the
  edge, and finds it in `map().shooter` and `inShooter`. It isn't one of the six sections that share
  the map out: those stay as they are, and Fujacal overlaps two of them.
- **The player goes** in the streets, the squares and the open courtyards, never inside a building
  (the owner's answer, 2026-10-14). Every building is closed to its roof.
- **braga-map stays data only:** it gives the shooter the same tiles it gives Party Kart, and no
  ready-made meshes, since the shooter's engine isn't chosen (the owner, 2026-10-14). If the
  shooter turns out to use three.js, sharing Party Kart's renderer is a task then.
- **Every task in Phases 2–4 does this area first,** to the bar SHOOTER-AREA.md sets for it.

The alternatives were the box decision 003 gave (x −350…350, z 600…1050), which cut across streets
and blocks, and the five streets alone, with nothing past their far kerbs.

## 032 · The paths are surfaces beside the streets, each step at its height, and a kart takes them all

*2026-10-15 · task 050 · adds the paths to decisions 019, 021 and 024*

The world draws every footway, path, cycleway and flight of steps OpenStreetMap has in the open
world's area (`world.streets.paths`), as the streets are drawn (decision 024), and a kart drives
them all, steps too (the owner's answer):

- **What the map draws as a footway beside a street is the street's:** a pavement, a crossing, an
  island, or a cycleway's crossing, which the streets' surfaces already are. What's indoors stays
  out.
- **Who gives way:** a flight of steps keeps its place over everything; the pavements give way to a
  cycleway, flush with them where it runs in one, or a lane at the road's level, a kerb behind it,
  where it runs along the carriageway's edge; a footway or a path gives way to the pavements,
  ending at a pavement where it meets a street. All of them are cut back to the carriageways at
  their level, the buildings (but a passage under one) and the water.
- **Each step is a tread at its own height,** from the flight's foot to its top, as many as the map
  counts or its rise over 16 cm, the ends on DGT's terrain at 50 cm. Where the map counts the steps
  and the terrain shows less than 8 cm a step, or the other way from the map's incline, the flight
  climbs to something the terrain doesn't have (a landing at a door): from its foot at the ground,
  16 cm a step (the owner's answer). The terrain's height wins over the map's incline otherwise.
- **A kart takes a riser as a kerb,** a bump up and a drop down; one higher than a step (0.3 m) is
  a wall, and so is a handrail. A passage under a building is open, the building cut back at its
  edges as at a carriageway's (decision 021; the owner's answer).
- **A gate wherever a path crosses an area's edge,** its kind after the streets' (10 to 13), as a
  street's gate is; the edge isn't moved for the paths.

The alternatives were the paths drivable and the steps a wall (what the task recommended: a kart
can't climb stairs), a bollard where each path leaves a street (none drivable), the flights the
terrain shows no rise for drawn flat or left out, and the passages closed, the buildings whole.

## 033 · The walls are the map's, measured, and those the LiDAR finds; what each is made of, by what's round it

*2026-10-16 · task 013 · adds the walls to decisions 021, 024 and 025*

The world carries every wall, fence, railing, hedge and gate round the open world's area
(`world.walls`), and a game stands each on its ground and stops a kart at it:

- **OpenStreetMap's barriers, measured:** each as high as DGT's LiDAR saw it, else the map's
  `height`; a wall of the map's where the terrain steps a metre or more across it is a retaining
  wall. Nothing on them is moved.
- **The LiDAR finds the rest, and keeps to what it can tell:** a wall where its point cloud has a
  thin ridge 6 m long or more, a hedge where the ridge is growing (its near-infrared), a retaining
  wall where the terrain steps sharply; laid where the map's buildings round them sit. A wall under
  6 m is left out, as at 10 points a square metre a parked car is as thin, as dense and as even;
  what the cloud sees through as little as a wall (a fence, a railing) is a wall, but on a retaining
  wall's top. What neither has (the walls the cars along the Rua do Monte da Forca park against)
  isn't invented (decision 025).
- **What each is made of, where the map doesn't say, is by what's round it** (the owner's answer),
  checked against the photos that show walls, which changed it: a wall in front of a house or a
  block of flats is rendered and painted, a low one with a railing as its top half, not granite as
  the answer had it for a house's (the owner agreed); a retaining wall is granite, or concrete where
  it holds up a street; a low wall under a hedge granite; a long wall by a bigger street concrete.
- **A wall opens where a street or a path passes through it, and gives way to a carriageway or a
  path it would stand on**, cut at its edge as a building is (decision 021); a gate where the map
  has one, where a driveway crosses a wall, and in a door's or a car's gap in a wall the LiDAR found.
  A gate is shut to a kart; open, for someone on foot, only where a photo shows it open into
  somewhere they may go.

The alternatives were the LiDAR's 50 cm models (a wall 0.2 m wide is lost in them), every short wall
kept (a car park full of walls), the owner's rule as it was (the houses' walls granite where the
photos show them rendered, with railings), and a wall standing in a street as the world draws it
(task 052 brings the street back to the wall instead).

## 034 · The ground is what it is every 50 cm, each kind drawn in its own photo and the place's colour

*2026-10-16 · task 016 · how the ground uses decision 002's photos; replaces decision 030's orthophoto
ground*

The world says what the ground is, not only what the land is used for, and a game draws each kind
of ground with a photo of that surface:

- **What it is comes from DGT's data:** every 50 cm under the Volta dos Amigos' box (`tools/cover.mjs`,
  `world.groundCover`), asphalt, paving, setts, grass, bare soil, gravel, water, or a roof, and
  whether a tree's crown is over it. The hard ground by the LiDAR's echo, in the sun or a shadow
  (the orthophoto's sunlit asphalt is as pale as its paving); the plants by the orthophoto's
  near-infrared; setts only where OpenStreetMap says so, as concrete echoes the same. Under a
  crown, a shadow or a parked car the ground is what's round it; where the world draws the
  streets, their own surfaces.
- **How it's drawn is way A, the owner's pick from a test tile** (Fujacal's seven viewpoints, A, B
  and C beside their photos): each kind in a seamless CC0 photo from Poly Haven, tiled at its real
  size, its own mean colour divided out and the place's put in. The place's colour is each kind's
  median over squares of 4 m of the orthophoto in the sun, its cars and shadows left out. Sharp up
  close, the place's own colour from afar. Far off, a crown's cells take the game's trees' green,
  as the orthophoto's canopy reads slate-blue under the game's light.
- **The orthophoto is not draped (B):** its cars, shadows and leaning roofs are in it, and at a
  kart's height it's a blur; its ground texture over Fujacal (decision 030's) is no longer made.
  C, A near and B beyond 100 m, kept B's faults where most of the ground is seen.
- **The map's areas stay** where the classes don't reach (beyond the box), with a multipolygon's
  holes now holes and the car parks an area of their own; the parked cars the LiDAR saw are kept
  with the classes, for the bays (task 018) and the cars a game draws (task 020).

The alternatives were B and C, and the ground classed by the orthophoto's colour alone, which can't
tell sunlit asphalt from paving.

## 035 · The streets' surfaces have no slivers: what's under a metre wide is closed, an island stays

*2026-10-16 · task 048 · how decision 019's surfaces are cut and rounded*

A game draws a sliver of pavement in the road as a spike of calçada with a kerb round it, which a
kart bumps over, and a crack between two pieces of road as a line of nothing. So the streets'
surfaces (`tools/streets.mjs`) have none:

- **Where they come from is fixed there:** a street's band is round where it runs on into another,
  and through a junction within 20° of straight (cut square, the two left a wedge outside the
  bend); the carriageways' pieces are snap-rounded together onto the tiles' 10 cm grid, so two that
  meet share their points; no scrap of carriageway is left out.
- **What the map's lines leave is closed:** a notch into the carriageways under a metre wide (half
  a metre either side), so a gore's tip is road from where it narrows past a metre; a gap between
  two carriageways under 0.3 m wide all along, the width under which `streets.mjs` already draws
  no reservation between them, filled, as they touch.
- **An island keeps the map's shape, however narrow,** but where it's under 10 cm wide (a crack): a
  narrow median is real in places (0.49 m at (245, 547), in the orthophoto) and not in others
  (the Liberdade's south end, drawn as three one-way ways), and nothing in the map tells them
  apart. Measuring the carriageways (task 026) will.

The alternative was the task's own first plan, closing the carriageways by half a metre
everywhere, which takes every median under a metre wide with it, the real ones too.

## 036 · A building's facade is its kind's, in its own colours: as a session saw it, else guessed from those seen

*2026-10-16 · task 017 · what a building's walls look like*

Every building was one of eight colours by a hash of its id, with one window pattern a kind. Now each
is drawn as what it is:

- **Braga's kinds, eleven** ([BUILDING-TYPES.md](BUILDING-TYPES.md)): the old house, the house, the
  blocks of the 1950s, of the 1970s to the 1990s and of the 2000s, the glass office, the school or
  public building, the church, the shop of its own, the warehouse, the annex. Each has its real
  proportions (a storey, the ground floor, a window and its spacing, a balcony's depth), fitted to the
  LiDAR's eaves over the storeys counted in the photos where enough were counted. A corner block with
  shops is a block whose ground floor is shops, and a tiled front a material, as both are in every
  kind.
- **Seen where the photos show it:** every building in the shooter's area and every one a viewpoint
  sees has an entry in `refs/buildings.json`, written by a session that looked at it in the photo that
  shows it best: its kind, its walls' colour and material, its ground floor along the street, its
  balconies, its shutters and its storeys; the colours judged against what's white nearby, as many
  photos are tinted. One no photo shows clearly is listed with why.
- **Guessed from those seen everywhere else:** the kind from OpenStreetMap's tag, else from the
  footprint and the height; the rest as often as the buildings of that kind that were seen have each,
  by a hash; OSM's `building:colour` and `building:material` where it has them, and shops where a
  named shop is in it.
- **A game draws a kit,** each kind's bay in its proportions over its material in the building's
  colours, the ground floor as it is along a street, the balconies as geometry. Doors and windows are
  in a rhythm, not where they really are: that needs a photo of each facade straight on (decision
  018), and the shooter's area's bar (decision 031) waits for them.
- **A photo where one is good enough** (straight on, sharp, even light, nothing in front: ten, two in
  the shooter's area), drawn for everyone in the building's colour: the photo divided by its wall's
  colour and multiplied by the building's, so a photo taken at dusk or through a windscreen takes the
  game's light. The owner's answer to the task wanted one on every facade in the shooter's area;
  task 008 found no other photo good enough, so the rest are the kit until one is taken.
- **Shops' signs** are the map's named shops (and those a photo showed), plain text on the sign's
  colour over the ground floor, on the wall facing a street; no logo.

The alternatives were the hash's palette with OSM's few tags (55 colours, 28 materials over 20,000
buildings), and photos on every facade, which the photos found online can't give.

## 037 · Braga's light is a clear March afternoon, matched to the photos, in the game and in every round

*2026-10-17 · task 022 · the sun, the sky, the haze and the weather*

The sun stood still, about 25° up, the haze was one beige colour, and the sky's light was nearly the
sun's, so the game was about twice as bright as the photos and its shadows hardly showed. Now:

- **The real sun:** where it is over Braga (41.55° N, 8.42° W) at a moment, which `?time=` sets in
  Braga's clock. By default it's 13 March at 15:15, the clear afternoon when five of the photos in
  Fujacal and by the Conselheiro Lobato were taken.
- **Matched to the photos of clear days,** by their pixels: the sky their deep blue with a fair day's
  cumulus drifting, the sun strong against the sky's light (in a photo a shadow is about a quarter as
  bright as the sunlit ground beside it), the asphalt a mid grey. The haze hides with the distance, as
  air does, not with its square: half of a hill 4 km off, in a blue-grey a little greyer than the
  horizon's sky. Bom Jesus and the Sameiro, at twice their size (decision 004), take it as the hills
  round them do.
- **The street lamps** light only once the sun is under 4°.
- **A grey day and rain** (`?weather=grey`, `?weather=rain`) are only for whoever asks for them in the
  address: not in the menu, and the rain has no sound yet.
- **Every round is shot on the same clear afternoon** (`?scenery` draws the clouds at time 0, so a
  round is the same every time), grey photos included (the owner, 2026-10-17): 18 of the 29 are grey
  days, so in 18 places the scorecard sets a sunny shot beside a grey photo.

The alternatives were a grey day as the game's default, which matches those 18 photos and loses the
11 clear ones, and each viewpoint shot at its photo's time and in its weather while the game stays
sunny.

## 038 · A landmark the race sees is a model of its own, at its real size: measured by the LiDAR, drawn from its photos

*2026-10-17 · task 021 · which landmarks are built, and how*

- **The ones the race sees.** Of the map's 32 landmarks, a game builds those the race sees: from 2 m
  over its line, within 45° of the way it goes, past the tiles' buildings and trees. Today São João
  da Ponte's chapel and bridge, the Altice Forum, the Estádio 1.º de Maio and the Picoto's top. The
  rest (the old town's, the Theatro Circo, the Congregados, the Igreja de Lamaçães) wait for a track
  or the shooter that goes there. The owner chose so on 2026-10-16, and to give the route's chapels
  and shrines that aren't among the 32 a task of their own (056).
- **Measured where the LiDAR can say.** braga-map's sight carries what DGT's 2025 LiDAR measured:
  the chapel's heights from its building's parts, the stadium's stands along spokes round its track
  and its floodlights from the point cloud (`tools/sights.mjs`). The game draws what the photos show
  on top of that (the bell gable, the porch, the cross, the wall's windows, the α), from shapes and
  canvas textures, at the real size: only decision 004's and 015's exaggerations stand.
- **In its building's place.** A landmark the tiles have as a building says so (`covers`), and a game
  draws the model there instead; the building stays a wall to the karts. One the tiles left out (the
  stadium's stands, task 011) is the sight alone. A bridge keeps its decks where the streets have
  them; its arch (`arch`) is drawn on their edges, on no pillars.
- **Judged at a viewpoint of its own,** where one of task 008's photos of it was taken (decision 009):
  `capela-sao-joao`, `altice-forum` and `picoto-top`, beside `estadio`.

The alternatives were the first track's cartoon models (not to scale), and photo-textured boxes: the
photos found online give one wall straight on, the chapel's side, and none of the rest.

## 039 · The streets are where the LiDAR measured them: the map's ways, moved onto their carriageways

*2026-10-17 · task 026 · narrows decision 022's "no street is moved"*

Every street was a band round OpenStreetMap's line for it, at the width the map gives or guesses
(decision 019), and the map's lines sit a metre or two off the middle of the real street in many
places (the Avenida João XXI's slip road at (586, 230) drew its carriageway over a 5 m drop). The
owner chose to move them by measurement, as the buildings' heights are the LiDAR's (decision 025),
over listing the offsets and keeping the map's lines; and the width measured over the map's `width`
where it was measured clearly (task 026's answers, 2026-10-16).

- **Nothing is moved by hand:** the map's ways stay the streets, with their names, kinds,
  junctions and directions, and nothing is added or turned round (decision 022 still holds for
  that). Where they are and how wide is the LiDAR's: `tools/carriageways.mjs` measures each street
  on the ground in the open world's area every 2 m (its kerbs, walls, banks and drops in the 50 cm
  terrain, the road by the laser's echo off it), and `lines.mjs`'s `onCarriageways` moves the map's
  nodes onto the middle measured, for every reader of the streets.
- **Kerb to kerb:** the carriageway is everything at the road's level between its kerbs, bays along
  it included; a car park the map has beside it is not. Where nothing tells the edge (a parked car
  on it, a tree's crown, setts from house to house, a junction), nothing is measured, and the map's
  line stays.
- **What moves:** a street whose middle is a quarter metre or more off its line for 30 m or more
  (the task had "about half a metre": the edges are measured to a quarter metre, and a third of a
  metre already took the João XXI's slip road over its drop); and wherever its band, at its width,
  would reach past a drop, a wall or a bank the LiDAR saw at its edge. It eases in and out over 20 m.
  A junction moves once, to where its streets' middles meet. A bridge's deck, a tunnel's road and the
  railway keep their lines (tasks 028 and 012), and a street that runs on into a deck keeps the map's
  width, the deck's.
- **The jump stays as the owner approved it** (decision 027): the streets its ramp takes off from and
  lands on keep the map's lines and widths (`kept`: the landing street is 5 m by the LiDAR, the map's
  6.5, and party-kart's autopilot can't turn into it off the flight; task 057 asks how the race should
  land on the real one). Moving the streets made another jump the cheapest, so a track now names its
  approved jump (`jump` in `tools/tracks.mjs`) and the planner fails rather than take another.
- **The open world's edge stays where it was agreed:** `open.mjs` takes the moved lines at the map's
  widths, as its rules for the edge were set on them (the area 3.486 km² before, 3.489 after).
- **What the LiDAR took for ground over a street isn't:** a carriageway is held at the street's
  height where the ground under it stands more than a metre over it, and a tree's crown or a roof
  more than 5 m over it is taken off beside it too, if it ends within 20 m (`streetBumps`): the
  Avenida Doutor Porfírio da Silva's plane trees at (760, 659), 19 m, which the street's measured
  width now took in and which threw the race's karts off it, and two roofs over service ways.

What it did, 2026-10-17: 85.4 km of streets measured, both edges seen over 12.9 km (15%) and one
over 17.9 (21%); where both were, the middle within 0.63 m of the map's line for half of them and 2
m for 90%; widths clear on 158 streets, 53 narrower than the map's by over half a metre and 67
wider. 244 streets moved, 342 stretches over 24.2 km, 310 nodes by over a metre and 3.89 m at most.
Carriageways past an edge the LiDAR saw, over a drop of more than a metre, 269 places every 2 m
before and 48 after; over any drop, seen or not, 681 and 411 (the rest under trees and parked cars,
where no edge was seen). The Volta dos Amigos' line 10,178 m (10,168 before), over the same jump. In
party-kart, the autopilot's laps 302.1 and 300.0 s (298.8 and 296.9 on 1.19.0), the eight bots'
finishes within 3.3 s, with 2 respawns (10.8 s and 2).

The alternatives were the task's other answers: the offsets measured and listed only, the map's
lines kept (decision 022 as it was); and the map's `width` tag where it has one, the measured width
replacing only the guesses.

## 040 · The route's chapels and shrines are landmarks too: from their photos, where the map has them, in place of what stands for them

*2026-10-17 · task 056 · the small landmarks the race passes that aren't among the 32*

Decision 038 for the route's small landmarks: the Capela de Santa Justa, the Capela de Santo Adrião,
the Capela de Santa Tecla, the Igreja de São Lázaro's bell tower, and the wayside shrines of the
Senhor do Bonfim and the Senhor da Boa Morte. Each is a sight of its own, built from its photos at
the size and heights braga-map gives it, and drawn by a game in place of what the tiles had there.

- **Where the map has it, as the map has it** (decision 022): each stands on its outline's rectangle,
  its front to the street or the square its photos were taken from. Where the outline is off the
  LiDAR's walls (Santa Tecla's, by 2–3 m) it's listed, not moved; where the photo shows a front
  narrower than the outline, the model takes the photo's width on the outline's front.
- **Measured where the LiDAR can say**: the eaves and ridge from `roofs.mjs`'s parts, the top (a
  bell gable's, a cross's) from the point cloud (`tools/sights.mjs`). Where it can't, under a tree
  whose leaves it took for a roof (Boa Morte's) or for a bell gable too thin for it (Santo Adrião's),
  as the photo shows it, said in its comment.
- **In place of what stands for it:** a chapel covers its building and a porch the map has as a
  building of its own (`covers`); a church's tower covers only the part that is the tower, the rest
  stays the church's parts. A shrine the tiles leave out as too small is the sight alone, not a wall
  to the karts.
- **Judged where the race passes it:** a viewpoint at a chapel only where a photo was taken from the
  race's line and the friends' houses' rule (decisions 009 and 018) allows it; the owner chose two
  (2026-10-17), Santa Justa's and Santo Adrião's.
- **Small, so baked together:** a game draws them as one mesh a material, a draw call each wherever
  any is in view.

The alternatives were leaving them to task 017's church facade and kit (the shrines not drawn at
all), and boxes in their photos, which the photos found online, one front each at most, can't give.

## 041 · A viewpoint's camera stands on the surface its photo was taken from

*2026-10-17 · task 058 · narrows decision 009's "exactly where Mapillary's reconstruction puts its photo"*

Decision 009 stood each viewpoint's camera exactly where Mapillary's reconstruction puts its photo,
and Mapillary's position is a phone's GPS: a few metres off, a dozen in a street of tall buildings.
While the map's streets were off too, some cameras stood in the road by luck; once task 026 put the
streets where the LiDAR measured them (decision 039), cameras whose photos were taken from a car
stood on the median, on the pavement or on the verge. The owner chose to move them the shortest way
onto the surface their photos show, their headings and pitches kept (task 058's answer,
2026-10-17), over letting Mapillary's position stand and taking a camera off its surface as the
photo's fault: it's still the photo's place, within the GPS's error, as task 055 aimed two cameras as
their photos look.

- **Each viewpoint says what its photo was taken from** (`surface` in `refs/viewpoints.json`): a
  lane (a carriageway), a pavement (or a central reservation or an island beside the carriageway),
  a path, or the ground where none of those is (a square, a park). `test/viewpoints.test.js` holds
  each camera on it in the tiles, and a car's half a car's width (0.9 m) in from the carriageway's
  edge.
- **Where Mapillary's position is off it, the camera moves across its street,** square to its
  heading: in a lane, to the middle of the lane the photo shows, between the lines the tiles paint
  (where they paint none, the half of the carriageway the photo drives on, or its middle if it's a
  lane wide), and 2 m clear of the kerb where the photo shows cars parked along it; on a pavement or a path, to where across it the photo stands, half a metre
  in at least. Its target moves with it, so its heading and pitch stay, and its height is the eye's
  over the ground there. Its notes say how far; the test lets a moved camera be up to 15 m from where
  Mapillary puts its photo, and any other 5 m.
- **The heading and the pitch stay Mapillary's,** but where task 055 aimed a camera as its photo
  looks.

What it moved, 2026-10-17: 15 of the 34 cameras, from 1.7 m to 11.3 m. Twelve stood off their
photo's surface or on another street: on the median against its hedge (`imaculada-conceicao`), on
the pavement across the road (`bom-jesus`), on the carriageway where the photo is from the
Avenida da Liberdade's wide pavement (`liberdade`, `lobato-crossing`), on the cycleway beside the
pavement (`sao-joao-da-ponte`), on the verge (`alameda-fujacal`, `altice-forum`), on the pavement
where the photo is from the road (`porfirio-da-silva`, `travessa-fujacal`), in a car park or a
junction beside the street (`conselheiro-lobato`, `lobato-pavement`, `lobato-east`). Three were in
the road but not in the photo's lane: against the kerb (`fujacal-start`, `falperra`) or over the
centre line (`capela-santa-justa`). The Avenida da Liberdade's pavement is an island in the tiles,
grass in party-kart (task 059).

The alternative was the task's other answer: Mapillary's position stands, and a camera off its
surface is the photo's fault, not the game's.

## 042 · The jump lands on its real street, and a race takes the walled corner at its landing

*2026-10-17 · task 057 · replaces decision 039's "the jump stays as the owner approved it", and adds to decisions 027 and 029*

Decision 039 kept the streets the Volta dos Amigos' jump takes off from and lands on as the map has
them (`kept`), as the landing street is 5 m by the LiDAR, the map's 6.5, and party-kart's autopilot
stopped at its corner. At 5 m it wasn't the street that stopped it: the map's wider carriageway had cut
back the walls of the lot north of the landing, which `walls.mjs` keeps once the street is its real
width, a 2.75 m wall the flight crosses 6 m short of the landing, running on to the kerb, a 3.18 m
wall along the street's north kerb and a gate between them, 2 to 3 m over the ground in DGT's surface
model. Karts leave the lip 4–6° left of the flight (the run-up turns 8° onto the ramp at its foot, 7.5
m before the lip), come down 4 m left of the line, and met that wall in the air: the autopilot stuck
at (-557, 1154), the bots respawning 10–14 times a race. On the line, the slowest flight clears it by
1.6 m; 1.5° off at the lip doesn't.

- **The jump's streets are measured like any other** (decision 039): nothing is kept as the map has
  it, the run-up 5.9 m and the landing street 5 m.
- **The race's road takes in the corner between the flight and the landing street** (the owner's
  answer, task 057): within 20 m of the landing (`CORNER` in `tools/track.mjs`), on the side the
  street turns to, the hull of the road's outline there, less the buildings: 164 m², whatever is on
  it, as the flight is taken in past the landing (decision 029).
- **The corner is a walled lot, so a race takes the world's walls down there while it runs** (the
  owner's choice, over karts flying the flight's line exactly, keeping the streets as the map has
  them, or another jump; jump 2 lands beside a wall too): a track's `cleared`, its road within 20 m
  of the landing, where a game leaves the world's walls, fences, hedges and gates out of the race's
  ground and doesn't draw them while a race is on (party-kart: 18 m of the 2.75 m wall, 13 m of the
  3.18 m wall and the gate, 32 m). Free roam keeps them, and no building is taken down.
- **The road works' boards stand round the corner** (`boards`, the owner's answer): along the race's
  edge where it's the corner's own, across the lot, where the race's wall is, as the ramp's boards
  are (decision 027's joke: the city's works took the lot's corner for the race).

What it did, braga-map 1.22.0: the loop 10,253 m, the line 10,178 m, as before. In party-kart, the
autopilot's laps 301.7 and 299.9 s with no respawn, the eight bots' finishes within 5.1 s with none,
a lap in the browser with the autopilot and three bots over the jump with no page error (310.6 s).
Over six races of eight bots, 24 wall hits and 7 respawns within 60 m of the landing, where 1.20.1,
the jump's streets kept, had 42 and 18; the hit left is the outside of the turn 13 m on, as on 1.20.1.

The alternatives were the task's: the street as it is with nothing taken in (the autopilot stuck, the
bots respawning 10–14 times a race); party-kart's autopilot and bots lining up with the flight (two
tries didn't: from the run-up they miss the ramp, from its foot they still fly 3 m left); the jump's
streets kept as the map has them; another jump, which the owner would see first.

## 043 · The trees are the LiDAR's: each one found, measured and of its kind, in its photos near and its kind's billboard far

*2026-10-18 · task 019 · replaces the woods and parks filled with made-up trees, as decision 025 did the houses*

Every tree on the map is one DGT's 2025 LiDAR sees (`tools/trees.mjs`): a crown in its point
cloud's high vegetation, a top that stands out of the canopy round it (6% of its height, 1 m at least,
over where it meets a higher one), 3 m tall or more. 251,000 on the map, 55,000 under the Volta dos
Amigos' box, 765 in the shooter's area, where the map had 10,800 of its own and woods and parks
filled at a tree to so many square metres. Each is where it stands (its top), as tall as the laser
measured it, its crown as wide as it covers and its foot where its lowest leaves are (under a thick
crown, no higher than 60% of the tree, as the laser seldom reaches them). Nothing is filled in where
the point cloud was fetched, which is the whole map; OpenStreetMap's trees in no crown are kept, as
young trees (1,300).

- **A tree's kind is the map's where it names one,** its species, genus or leaf type; **else its
  wood's,** the main species COS2025 gives a wood of 1 ha or more (eucalyptus, maritime or stone
  pine, other conifers, oaks, acacias, other broadleaves); **else its shape's:** a broadleaf, but
  for the narrow and tall (a poplar where the photo sees a broadleaf's leaves, else a cypress or a
  cedar), a tree taller than the town's with its crown held high (a eucalyptus), and a tall tree
  with its crown held high that's dark in the near-infrared, as needles are (a pine). Six kinds:
  broadleaf (167,000), eucalyptus (73,500), pine (4,900), cypress or cedar (3,500), poplar (2,700),
  palm (3, the map's). The photos (task 008) weren't read tree by tree: a broadleaf is any of the
  avenues' hackberries, limes, planes and oaks, and the Parque da Ponte's planes are eucalyptus, as
  COS2025 has its wood.
- **No tree stands on a carriageway:** a crown's top over one has its trunk at the street's edge,
  within 3 m (4,700 moved), else it's left out (800). The 9 m the houses filled in keep from a street
  (`W_MIN`) isn't the trees'.
- **Each kind is drawn in photos of its own** (decision 002's, made as decision 030's): its bark, a
  Poly Haven bark photo (a hackberry's, a pine's, a blue gum's, a cedar's, a willow's, a palm's), and
  a spray of its leaves composed from a Poly Haven tree's photos of them (CC0), in the world as the
  ground's are. A game tints them the green of Braga's trees in summer.
- **party-kart draws every tree in the box,** near the camera (260 m on High, 180 on Medium, 120 on
  Low) as a trunk in its bark and a crown of cards of its leaves in its kind's shape, each card the
  same size whatever the crown's; further off as its kind's billboard, baked from the near tree; the
  two dithered into each other over 25 m. A kart hits its trunk, as thick as a tree that tall and
  wide usually is.

What it cost, on party-kart's 34 viewpoints on High (the median): 2 draw calls fewer (the trees
were 800 m tiles of instances a kind), 0.25 M triangles more (1.79 to 2.04 M; up to 0.48 M where
the hills' woods are in view), 5 MB of textures more, the city built 0.2 s slower, and the download
1.3 MB more gzipped (the trees' textures 0.9 MB, the tiles 0.45). The alternatives were keeping
OpenStreetMap's trees and the filled woods with the LiDAR's heights only where they stood on one
(the woods' made-up trees stay made up), and a crown's kind from its photo alone (the cloud's
near-infrared tells a pine wood from a eucalyptus one in a quarter of its trees, no better).

## 044 · The karts fly the jump's flight, and take it a little slower than planned, to land short of the street's turn

*2026-10-18 · task 060 · adds to decision 042, for party-kart's autopilot and bots*

Karts left the Volta dos Amigos' lip 4–6° left of the flight, as the run-up turns 8° onto the ramp at
its foot and the grip turns a kart's velocity a tenth of a second after its nose, and came down about
4 m left of the line, in the corner the race takes in (decision 042). On the line, they land where
the landing street turns about 35° left and narrows from 5 m to 3.5 m: over 12 races of eight bots,
the axis alone made the landing worse (81 hits and 60 respawns within 60 m of it, against 76 and 46),
going wide onto the street's kerb or straight on to the end of the flight's overrun. How fast a kart
leaves the lip decided it, not where across it: from 105–111 km/h, nine landings in ten were clean.

- **The autopilot steers its velocity onto the ramp's axis** (party-kart's `autopilot.ts`), from 18 m
  before the foot to 6 m past the lip, where the grip still turns it: off any line and caution it
  leaves within 0.2° of the flight and comes down within 0.2 m of its line.
- **It takes the ramp 2.1 m/s under `rampSpeed`** at its foot and lets the climb take what it takes,
  as a slipstream's pull up the ramp put some bots 3 m/s over the others: off the lip at about
  110 km/h, under the 119 braga-map plans (`v`), it comes down a metre or two short of the landing
  street, in the corner, with room to turn (the owner's answer, task 060, over flying the line alone
  or leaving the landing for another task). `v` stays the slowest that lands on the street's line.
- **In the air it turns its nose to the landing street, and down it slows for the turn its velocity
  still has to make,** to 60 m past the landing, through the street's second bend, 3 m wide.
- **The bots drive the middle and pass nobody** from a jump's run-up to 30 m past its landing.

What it did, on braga-map 1.23.0, over 48 races of eight bots: 21 wall hits and 36 respawns within
60 m of the landing, where it was 206 and 98; from 45 m past the lip on, where the karts come down,
2 hits and 1 respawn, where it was 146 and 46. What's left is in the flight: karts that come to the
lip too slow, stopped by an item or a bump before it, falling short into the Rio Este, as decision
027 has it (35 respawns, where it was 52). The autopilot's
laps 302.1 and 300.1 s (301.7 and 299.9 before).

The alternatives were the task's: the velocity onto the axis and the bots' line alone (more hits,
above); the bots kept off the middle on the run-up (more respawns: they bump and draft less, but go
wide more); a landing street taken wider, or a jump elsewhere, which are braga-map's track, out of the
task's scope.

## 045 · A round's shots go up in a few sheets, not a file each

*2026-10-18 · task 062 · adds to decision 012*

The scorecard (decision 012) carries its pictures as the page's own published files, and a version
of an artifact holds 511 at most: after task 019's round it held 495, a file a shot. So each round's
shots are packed into JPEG sheets (task 062), `rounds/<round>-<n>.jpg`, at most 9 shots a sheet,
three across (about 6.5 megapixels, which a phone decodes), at most 4 for a round of 34 places, and
the page shows each shot through a window its size over its sheet.

- **Each shot as it was:** it keeps 8 pixels of its own edge round it, so the page's scaling never
  reaches a neighbour, and starts on the JPEG's 8-pixel blocks, so its piece of the sheet is what
  its own JPEG would be. The 17 rounds already up were packed from their files, a second JPEG at the
  same quality on the same blocks: 50.5 dB from the files at worst, over the 458 shots.
- **A shot the same as an earlier round's is still that round's** (task 057): found by the start of
  its own JPEG's SHA-1, which `refs/rounds.json` keeps now that the files aren't.
- **Room:** the page holds 98 files (the page, its two lists, the 34 photos and 61 sheets); a round
  of 34 changed places adds 4, so about 100 more rounds fit.

The alternatives were the artifact's assets (which may be refused to a viewer from outside the
owner's organization, as the friends are: task 003), thinning the old rounds (their pictures lost
beside the marks given on them), and a second page (the rounds split across two links).

## 046 · A street ends at its walls: the pavement runs to the first one, and a carriageway gives way to the map's

*2026-10-18 · task 052 · adds to decisions 021, 033 and 039*

Task 013 put the walls in the world, and many of the map's stood where the world drew a street: a
wall on a carriageway was cut away (decision 033, as a building in a street is cut at the kerb,
decision 021), and one on a pavement stood in the middle of it, the pavement going on past it into
the garden behind. In Braga a street ends at its walls. The owner chose (task 052's answers,
2026-10-16 and 2026-10-18):

- **A pavement runs from its kerb to the first wall or building behind it,** 3.2 m at most: the
  map's walls, fences, railings, hedges, guard rails and retaining walls, and the walls, fences and
  retaining walls the LiDAR found, but not the hedges it found (half of those in task 013's contact
  sheets were scrub) nor the gates (`stopsAt` in `tools/streets.mjs`). Each piece of a kerb looks
  straight out from it, and what's behind a wall it sees, from 15 cm short of the wall's line (the
  tiles' 10 cm), is no pavement; but what another kerb sees past it stays, as a street on a wall's
  other side has its pavement up to it. A path stops at a wall the same way, either side of its
  line, but where it passes through one (walls.mjs opens the wall there).
- **A carriageway the map's wall stands in gives way to it,** its edge brought back to 15 cm short of
  the wall where the wall runs along it (within 30°), inside its band or within 15 cm of its edge,
  over a metre or more, and on straight across an opening in it up to 6 m that no other street passes
  through (a gate, a door); but not round a deck's or a tunnel's end, which meets the ground's
  streets at their height (decision 023). Where a road's two carriageways touch with the map's wall
  between them, both stop at it, and its gap is an island, not a crack filled in (decision 035). A
  junction's rounded corner stops at a wall of the map's in it, as seen from the junction. The wall is where the
  street really ends (decision 019: the street at its real width), and since task 026 (decision 039)
  the streets are on their carriageways, so this is where the map's width, or its kind's usual, is
  wider than the street there and the LiDAR didn't measure it.
- **No narrower than its lanes:** those the map paints, each 2.5 m, or one where it paints none (the
  owner's answer once `lanesOf` turned out to count only painted lanes). Where they don't fit beside
  the wall, each side goes back out in proportion to how far it came in, and the wall is cut where it
  stands in the street, as before. The lines painted on a narrower stretch share what's left, easing
  in and out over 10 m a metre; a zebra and a stop line span what's there.
- **The LiDAR's walls on a carriageway are still cut** (1.40 km of its retaining walls, mostly the
  steps in the ground at a carriageway's edge it took for walls): the task gave the map's.

What it did, braga-map 1.24.0: 181 streets brought back to the map's walls, giving way 3,204 m² of
carriageway; 39,800 m² of pavement and 700 m² of paths behind a wall taken off. Of the 17.4 km of
walls a pavement stops at that face a street, 0.16 km (0.9%) have pavement past them, where 40.8% had
on 1.22.0 (at a kerb's sharp outside corner, and in the squares); of the map's 29.7 km of barriers,
0.43 km (1.4%) are still cut on a carriageway, where 3.50 km were (12%): mostly where a median's wall
runs straight at a junction's point, so its corner sees it end on, then across a street, and 10 m
where the lanes don't fit. One viewpoint dropped (`joao-xxi`, the owner's answer) and one camera moved
onto its lane (`robert-smith-picoto`, decision 041). The race the same line, its road 14 m² smaller
and its barriers split where a median's wall stands; in party-kart the autopilot's laps 302.4 and
300.3 s with no respawn, eight bots within 4.6 s, and a lap in the browser with three bots 310.0 s.

The alternatives were the task's: the wall cut away as before, or kept standing in the street; and
for the LiDAR's walls, all of them stopping a pavement, or only the map's and its retaining walls;
for a street with no lanes painted, a lane each way it's driven (5 m for a two-way street, which
would have kept 0.46 km of walls cut, the Travessa da Devesa's among them) or 026's narrowest, 2.4 m.

## 047 · A tree's crown is where its leaves are: a limb with no trunk under it is its tree's, and a trunk stands off the paths

*2026-10-18 · task 063 · adds to decision 043*

Decision 043 stood each tree's trunk under its crown's top. At two viewpoints the camera ran into a
tree its photo doesn't have there, and step 1 of task 063 found neither was a leaning tree: at São João
da Ponte's chapel, the "tree" 1.6 m ahead (29 m tall, its leaves from 17 m) was the park's canopy
reaching out over the Largo, with no point of high vegetation under it below 16 m and no trunk within
8–10 m in the photo's panorama; at the Altice Forum, the camera stands under its willow's crown as
its photo does, but the willow was three trees (a lobe over the cycleway, another 5 m ahead, each
with a trunk), and the game hung its leaves to the eye. The task's rules for finding a trunk (the
stem's points, the cell with the lowest leaves, the crown's middle) would have put both further into
the open: there's no stem to find. The owner chose (task 063's answers, 2026-10-18):

- **A crown with no trunk under it is a limb of the taller crown it meets,** and joins it
  (`mergeStemless` in `tools/trees.mjs`): as narrow as a cypress (its height 2.8 times its width or
  more), but its leaves in its upper half, where a cypress's and a poplar's come down near the
  ground, and a taller crown borders it along a fifth of its edge or more. 10,468 over the point
  cloud; 246,269 trees on the map, where there were 251,738.
- **The crown is drawn where its leaves are:** each tree carries its crown's middle (`cx`, `cz`)
  beside its trunk (`x`, `z`), off it where the crown spreads to one side, a limb reaches out, or its
  trunk was moved to a street's edge (the crown stays over the street). party-kart draws the crown
  there and leans the trunk into it only past half the crown's radius, up to 25° (a crown spread to
  one side stands on an upright trunk); the middle is a metre or more off the trunk on 57% of the
  trees, past the crown's radius on 5%.
- **No card of leaves hangs below a crown's foot** (party-kart): a broadleaf's cards are up to
  4.5 m, and the lowest hung 2 m under its foot, to a person's eye under the willow.
- **A trunk stands off what people walk on** where it can (in the open world's area, by the
  surfaces the world draws): off a footway, a path, a cycleway or a flight of steps, and off a
  pavement its crown only overhangs from behind (nearer the pavement's back than its kerb, by half a
  metre, its crown's middle off the pavement and the street), to the nearest open ground under its
  crown, half a metre clear, onto no carriageway, building or water; else it stays. A street tree
  stands in its pit: moving every trunk off the pavements (1,359 then) took `alameda-fujacal`'s out
  of the pavement its photo has it in, and one whose crown spreads over the garden behind,
  `31-de-janeiro`'s, was taken for a garden's until the kerb was asked about. On 1.24.0's streets: 675 moved
  (354 off a path, 321 off a pavement), 40 with nowhere to go, 2,875 street trees left in their
  pavements. Not a tree the map has, where the map puts it.
- **No viewpoint's camera stands within 2.5 m of a trunk or in a crown** (`test/trees.test.js`):
  at 1 m, as the task had it, both cameras passed before (their trunks 1.63 m and 1.75 m off).

What it cost: two numbers more a tree in the tiles, 0.13 MB more to download gzipped for the Volta dos
Amigos' box (3.03 to 3.16 MB). The alternatives were each limb drawn as a crown with no trunk (leaves
floating 16 m up, nothing holding them), the task's rules for a trunk, and every trunk off the
pavements.

## 048 · The streets' name plates stand where the map puts them: at every corner, on the corner building or on a post

*2026-10-18 · task 042 · as the shops' signs (decision 036)*

The tiles carry each street's name on its lines and the map's bus stops, and braga-map puts the
streets' name plates itself (`tools/plates.mjs`), for every game, as it puts the shops' signs: at
every corner in the open world's area where a named street meets a street of another name, its
plate. A street begins at each of its junctions, so a corner building carries both its streets'
names, one on each wall, as Braga's do.

- **On the corner building's wall along the street**, near the corner, 2.6 m up or over a shop's
  sign it would cover, where a building stands within 3 m of both kerbs (the owner's answer,
  2026-10-15); **else on a post** half a metre past the rounded kerb, on a pavement or open ground,
  a second name on the post over the first.
- **The corners from the junctions and the kerbs as they're drawn:** the map's nodes where the
  streets meet (every street but a link, a service road or a track without a name), and the corner
  on the kerb as `world.streets` draws it, not as each line and its width put it, which can be a
  metre or two out where a carriageway isn't centred on its line. None inside a wide junction's
  carriageway, on a reservation or an island, or in a building; a wall's plate on the footprint as
  the tiles hold it (in half metres), with open ground in front of it.
- **What it came to:** 1,034 plates for 199 of the area's 205 named streets, 111 on a wall: most of
  the area's corners have no building within 6 m of the kerb (its avenues, its roundabouts, houses
  behind their gardens), and a building whose wall the carriageway as drawn overlaps has its plate on
  a post. The six without one meet no street of another name at a corner in the area (on the Picoto,
  or only by a link across their own median), or barely enter it. The bus stops: 516 on the map, 94
  in the area.
- **party-kart draws them as the signs are:** one empty plate, and each name's letters cut from one
  canvas of every letter the names use: about 1 MB of textures for every name in the area, where
  the route's 36 names, each on its own plate in one texture, took 10.5 MB, and the area's 205 would
  have taken several textures past what some phones take. Every bus stop in the area stands on its
  pavement, and the HUD names the street you drive onto from the lines' names, anywhere.

The alternatives were the task's: the game working the corners out from the names on the lines
(every game again, from lines cut at the tiles' edges, without the map's nodes), and the names drawn
into atlases of plates.

## 049 · The ground under a street is the street's: a 2 m square takes only the carriageway it reaches

*2026-10-18 · task 045 · after decision 008 (the LiDAR's ground) and task 043's held ends*

The tiles hold the ground every 2 m, each point the mean of the LiDAR's over a 2 m square, and a
street on the ground takes that height. Within 2 to 4 m of a wall, a cutting or a bank, the squares
took its top into the street, which rode up it, or rippled along it where the wall ran across the
grid (the Avenida João XXI over its junction), and six tunnels' mouths had a cutting's wall in their
first 2 m. Over the open world's area, a square that reaches a street's carriageway is now the mean of
the part on it alone (`lines.mjs`'s `streetBands`, `terrain.mjs`'s `mean`):

- **Of the carriageway, only the street's own surface:** every metre along it, the median of the
  ground over its middle half, carried across at that half's slope (as `streetBumps` has it, but
  never more than 10% across). What's more than 30 cm off it isn't the street: a wall's top the
  carriageway's width reaches where the map's line is a metre off the street's middle, the wall's
  face smeared over the LiDAR's last half metre, the cutting or the island over a tunnel's mouth. A
  square with none of the street's surface in it keeps the mean of all of it, so a wall stays where
  it is.
- **Two streets at different heights side by side** (a cutting's street and a lane along its top a
  metre away, at the João XXI and the Liberdade's underpass): each point holds the one whose surface
  its own ground is within a metre of, the side of the wall it's on, so the ground steps between
  them at the wall, not in either street; on the wall's face, the one whose middle is nearest.
- **Not at a deck's end:** a square that reaches the ground task 043 holds there keeps it as it is,
  for a car that feels the land's slope over its length. Nor where the map tags an area's outline as
  a street (`area:highway`, the Rotunda Santos da Cunha's island): it's no carriageway.

What it came to: along the area's streets every 2 m, the tiles' ground more than 15 cm off the
LiDAR's at 110 of 43,139 points (355 before), 94 of them where a wall or a cutting's edge runs
within 1.5 m of the street's middle; the six walled mouths within 7 cm of their street's slope.
A 2 m grid still can't hold a lane on a cutting's top and the street at its foot a metre apart both
to their edges: the step between them is a metre either side of the wall, and a car that tilts by
the land 1.5 m beside it feels it (party-kart's race hops 0.4 to 0.7 s on the João XXI's upper lane:
task 066).

The alternatives, each measured on the walled mouths, the streets' middles and party-kart's drives:
the nearest street's middle for each point (the step moved off the wall, onto the lane the race
drives at the Liberdade), the higher street for each point (the roundabout over a mouth took it),
and the old mean wherever two levels meet (two walled mouths stayed off). A finer grid, or the
streets on the ground carrying their own heights as the decks do, would hold both edges; neither is
needed for the streets' middles.

## 050 · A roundabout's ring is where the LiDAR measured it, and its island is what the ground is there

*2026-10-18 · task 014 · as the streets' carriageways (decision 039)*

Every roundabout's ring was a band round OpenStreetMap's line for it, at the width its kind of street
usually is, and its island the hole the band left (task 033): task 026 measured almost no ring, as a
ring is all junctions and it takes no station near one. At São João da Ponte the island was 8.6 m
round where the LiDAR has 5.9, and the ring 6.5 m wide where it's 10.3. The owner chose to measure
the rings (task 014's answers, 2026-10-18), to draw each island in what the ground is there, and to
paint the give-way markings at their entries.

- **Measured as a street is, out from the island** (`tools/roundabouts.mjs`): every 2 m round the
  ring, 026's cross-section; the island's kerb all round, the outer kerb but in an arm's mouth. A
  round island (most) is one circle fitted to its kerb, and its ring that circle half its width out;
  an oval, or a ring round a square, moves out by the middle measured round it. The width is the one
  measured, where five or more stations saw both kerbs; else the ring runs from the island's kerb to
  the map's outer edge. Of the open world's box's 20 rings, 17 moved (15 round), 16 at a width
  measured. Three stay as the map has them: the Praça Paulo Vidal's (cars parked along its island) and
  the Rotunda Lions Clube's, too little of their islands seen, and a ring a deck passes over, the
  Rotunda Santos da Cunha's under its viaduct: its kerb is seen only between the piers, and its ring
  widened reached the tunnel's mouth beside it, which task 045 holds to its own street. Its moves are laid over `carriageways.json`'s, a file of its own
  (`.cache/roundabouts.json`), so every reader of the streets has them; and a corner's rounding never
  fills a roundabout's island, however far it reaches (it filled one on the route, at (-109, 1678)).
- **The island is the ground's:** a roundabout's island is `round` in the tiles, the cover classes it
  from the LiDAR and the orthophoto as any ground, not as paving (where it echoes as grass, it's
  grass: a lawn the summer of 2025 dried reads as paving in its photo), and party-kart draws it in the
  land's own material, its grass, flower beds and paving at the kerb's height; its grass in a
  watered lawn's green in the same photo, as the game's March has it, not the summer's (the owner's
  answer, 2026-10-18; the city's other lawns are task 068's).
- **What stands in it is the map's:** OpenStreetMap's statues, fountains and monuments in an island
  (`fetch.mjs art`), each as tall as DGT's point cloud has it, all its points but the ground's (São
  João da Ponte's São João Baptista, 4.3 m, is classed as noise there): two statues, São João Baptista
  and the Comendador Santos da Cunha. The signs on the islands are street furniture (task 020).
- **The give-way markings** at every entry, where a street runs into the ring the way its traffic
  goes: the dashed line across the side coming in, at the ring's edge, and a triangle's outline in
  each lane behind it, their sizes from the orthophoto and the photos (docs/STREET-DETAILS.md): 73
  lines and 80 triangles in the open world's tiles.

The alternatives were the task's: checking the islands against the photos and keeping the map's
rings, and the markings left to task 018. The race's road takes the rings measured: party-kart's
peer prefix moves.

## 051 · A tree near a viewpoint is the species its photo shows, and a kind is a look to draw: nine, each deciduous or evergreen

*2026-10-18 · task 061 · on decision 043's trees, as the facades seen (decision 036)*

Task 019 named each tree's kind from OpenStreetMap's tags, else COS2025's wood, else its shape
(decision 043): the Parque da Ponte's trees were eucalyptus, as COS2025 has the park's wood, and the
avenues' hackberries and limes one broadleaf. The viewpoints' photos show what they are.

- **The trees seen are recorded** in `refs/trees.json`, as `refs/buildings.json` records the facades:
  every tree in view of seven viewpoints within 60 m of their cameras (`tools/species.mjs mark`
  numbers them on the photo and on the orthophoto round it), by its crown's middle (what a photo and
  the orthophoto show, and what `world.mjs` keeps where it is, decision 047), its species and how sure
  of it; the stretches of avenue a photo shows lined with one species (a line, and how far from it a
  trunk stands); and the places one species fills (the Parque da Ponte's limes). 87 trees, five rows,
  one place. A row is named only as far as a photo shows it (the owner's choice, 2026-10-18): the
  same avenue further on may be planted otherwise.
- **They come first** in `kindOf`: a tree seen is the species seen, whatever else names it; then
  OpenStreetMap's species or genus, where the map names one; then a row's or a place's; then 019's
  rules. A tree seen is the crown whose middle is nearest, within half its crown and 3 m at least;
  `npm test` checks that each of the 87 is matched and of its kind.
- **A kind is a look to draw, not a species.** Three new ones, each with its bark and leaves from Poly
  Haven, toned (`refs/textures.json`'s `tone`, `lobes`), and its shape in party-kart: the plane (pale
  mottled bark, an open crown of broad leaves), the lime (dark ridged bark, a dense crown of small
  sprays) and the birch (white bark, fine hanging twigs). The other species seen are drawn as the kind
  they look like: hackberries, robinias and the horse chestnut as broadleaves, the white poplars as
  poplars, the fan palm as a palm; a tree the photo can't name (9 of the 87, hidden behind others)
  keeps 019's rules. Nine kinds; the tiles hold a tree's kind in
  4 bits since (16).
- **Each kind is deciduous or evergreen** (`map().treeKinds[i].evergreen`), for the seasons to come.
- **The Parque da Ponte's trees are limes**, not the planes task 019 and the task had: Commons' photo of
  its bandstand, in late June, has their heart-shaped leaves and their crowns in flower. The planes
  are a few, the one beside São João da Ponte's chapel and the Liberdade's; the Porfírio da Silva's
  white trees are white poplars, not birches.

The alternatives: a species for every one of the 246,000 trees (no photo shows most of them), or
each avenue's row named the length of the avenue from one photo of it.

## 052 · When the game can't be downloaded the loading screen says so, and the game is one script with nothing preloaded

*2026-10-19 · tasks 069 and 070 · party-kart's `index.html`, a friend's endless spinner after a deploy*

A deploy force-pushes a `gh-pages` that holds the new build alone, and Pages serves `index.html` for
10 minutes from a browser's cache, so a page from before a deploy asks for a script that's gone. Its
`<script>`'s error doesn't reach `window`, and the loading screen spun for ever.

- **The loading screen hears a `<script>` fail** (a capture listener on `window`, in the `<head>`,
  ahead of the tags the build puts at its end), and says the game couldn't be downloaded, with
  "Tentar outra vez", which reloads and so fetches the new `index.html`, and the file's name in small
  print. Past 90 s with the city not up, it adds a line that it's taking longer than it should, with
  the same button, and keeps the spinner.
- **The previous build's files are not kept** at a deploy: a page from before it would open the old
  build, which shares no room with the new one whenever the peer prefix moved.
- **The game is one script, and its `index.html` preloads nothing.** WebKit keeps a
  `<link rel="modulepreload">` that failed until the browser closes, and fails the reloaded page's
  script from it at once. `photos.ts`, imported dynamically since it was behind `?photos`, made a
  chunk of its own and one of three.js it shared, both preloaded; it's imported statically now, as
  `cover.ts` did already: the same bytes, one file, the load as fast. Code that's split off again
  should be fetched by a dynamic import only, which WebKit fetches again on a reload.

The alternatives: keep each build's files on `gh-pages` (a page from before a deploy would open, in a
room of its own); `build.modulePreload: false` (a shared chunk would come after the game's script,
one round trip later); or a service worker (a build step and a cache to keep right).

## 053 · More tracks in the open world as it is, the host picks one, and the Volta dos Amigos keeps its place

*2026-10-19 · tasks 071 and 072 · the owner's answers: more tracks, inside today's area, two or three planned to pick from*

The owner wanted more kart tracks, inside the open world's area as it is (decision 019): every street
there is already drawn, measured and driven on, so a new track needs no new city.

- **The host picks the track** on the race screen ("Pista"), with each one's name and length; the
  lobby carries its id, the guests race it, and a race's time limit follows its length. Party Kart's
  tracks are a list (`src/tracks.ts`): a new one is braga-map's file and a line there. Each track's
  race (its walls, barriers and ramp in a ground of its own, and the marks it puts on the streets) is
  built with the city at load, about 85 ms a track on a desktop at High, so a race starts with
  nothing to build.
- **The Volta dos Amigos keeps its place in the world**, whatever is raced: the city is loaded round
  it, its plinth stands at its start, the friends' eggs on their houses (decision 014) and the brown
  signs to its landmarks. Only it may take the world's walls down (`cleared`, task 057): they're drawn
  apart for it alone. The eggs go off only in its race. A sign names the track raced, never the
  Volta's name on another.
- **A new track keeps off the Volta's streets** where a legal loop can (the planner's `avoid`: its
  streets cost 2.5 times as much), keeps to the area and off its last 100 m where it can (`open`), and
  never jumps (only the owner asks for a departure from the real streets, decision 004). Any loop of
  7 km or more in the area shares some of the Volta's streets: the area is the Volta and about 150 m
  round it.
- **The owner picks from loops planned and shown**, not an area they name: of an east loop (8.9 km,
  27% on the Volta's streets) and a west one (9.0 km, 39%), they kept the east and named it the Volta
  de Lamaçães. To race cleanly it then left the Rua Professor Machado Vilela's 3 m bend, where eight
  karts still together pushed each other through its inside: 9.2 km, 35%.
- **A track is raceable** when Party Kart's tests pass over it, as over the Volta: a closed loop of
  7–10.5 km with 5 checkpoints inside the area, two autopilot laps with no respawn at 25–60 m/s on
  average (a street loop's corners make it slower than the Volta's 170–310 s scaled), a race closed
  by its walls and barriers, every row of barriers holding, and eight bots finishing a lap with items
  within 60 s of each other.

The alternatives: a track picked by vote in the room (the host starts the race anyway); each track's
race built when it starts (a hitch at the countdown, and its marks' materials compiled then); tracks
outside the area, which would grow it (not chosen); the owner naming an area to plan in.

## 054 · No street rises and falls 4 m within 24 m: a lump across one is the LiDAR's, and the street goes straight under it

*2026-10-19 · task 067, found by task 045 · the Rua Padre Francisco de Almeida at (874, 1098), on the Volta de Lamaçães*

Five broadleaved trees 25–28 m tall stand either side of the Rua Padre Francisco de Almeida there,
their crowns 17 m across meeting over it, their undersides about 8 m up; DGT's terrain model has them as ground, 9 m
over the street across its whole width, and the street rose with them. Task 026's `streetBumps` takes
off a crown or a roof only where it stands over the street's own height, and here it was that height.

- **Along each street every metre**, where its own height stands more than 4 m over the chord from up
  to 12 m back to as far on, and the ground 3 m past its kerbs either side doesn't stand half as much
  over its own, the street is laid straight from a little before to a little after (`flattenLumps` in
  `lines.mjs`): in the world's ground (`streetBumps`) and in a planned track's heights (`track.mjs`),
  the same way. No real street does it: a crest that steep would be a 33% change of grade.
- It takes off five in the open world's tiles and round them: (875, 1096) 9.3 m, the Rua Victor de
  Sá's two of 5.4 and 5.5 m at (1610, 1440), and two of 4.6 m at (-72, -55) and (-818, 1018) whose
  ground barely changes. Lumps of 1 to 3.3 m are left: ramps into garages, and the streets round the
  Praça do Condestável's underpass, which may be what they look like.

The alternatives: a tree's crown taken off wherever the trees' file has one over a street (it would
lower a street that really runs under a bank); a lower threshold (it would lay straight the streets
over the underpass, which may really rise).

## 055 · The shooter lives in Party Kart's open world, on foot, in first person, each player the figure they picked

*2026-10-20 · task 073 · the owner's answers, 2026-10-19 · settles decision 031's "the shooter's engine isn't chosen"*

The first shooter isn't a game of its own: a player gets out of the kart in Party Kart's open world
and walks, and the deathmatch (task 074) is a round played that way in Fujacal. The city, its
renderer, the rooms, the invite links and the menus are already there, and braga-map stays data
(decision 031) with one game drawing it.

- **On foot anywhere in the open world,** not only in Fujacal: F, or "🚶 A pé", gets out beside the
  kart, which waits empty where it stopped, and F again is back in it. Not in a race.
- **A person on the world's ground** (`walker.ts`): 1.75 m tall, the eye at 1.65 m, a circle 0.3 m
  round, walking 1.5 m/s and running 5 m/s, a short jump; up a kerb or a tread, down any drop, never up
  a retaining wall. The walls, hedges, gates, trunks and buildings that stop a kart stop a walker at
  its own radius, through the one circle test the kart uses (`circle` in `ground.ts`), so the kart
  drives as it did.
- **First person:** on a computer the mouse looks round with the pointer locked, and Esc, which
  releases it, still opens the menu; on a touch screen, twin sticks (the left walks, the right half
  looks) and a jump button. No head bob.
- **Seen by the others as the driver they picked, standing,** on legs, walking and running (the
  owner's answer): the friends' cartoon figures of decision 014, never a likeness. Their kart stands
  empty where it waits.

The alternatives: a game of its own on the same map (a second renderer, rooms and menus to make and
keep, which decision 031 left open by keeping braga-map data only); third person (the owner chose
first); a generic soldier for every player (the owner chose the friends' figures).

## 056 · The deathmatch: a round started as a race, a kit at each spawn, and the shooter's browser decides a hit

*2026-10-20 · task 074 · the owner's answers, 2026-10-19 (a realistic deathmatch, a kit chosen at each spawn, twin sticks on a touch screen); the rest taken as defaults*

The first shooter is a round in Party Kart's open world (decision 055): the host starts it from the
menu ("🎯 Tiroteio"), as a race, for 3, 5 or 10 minutes; everyone in the room is put on foot in
Fujacal, their kart waiting where it was, and whoever has the most kills when the time runs out wins.
Then the results, and everyone is back in their kart.

- **A shot is decided by the shooter's browser,** against the others as it draws them (110 ms
  behind), and the victim's browser takes the damage and says when it's down; the host keeps the
  kills and deaths. A bullet is instant, so the items' rule (the victim decides, as for
  Party Kart's items) would have shots that hit on the shooter's screen miss. What hit on your screen
  hit; a victim just round a corner can still be hit for a tenth of a second, as in most shooters.
  Every browser draws a shot from its aim, cone and seed, so its marks are the same everywhere.
- **Four kits, chosen at each spawn,** none best everywhere (the tests' duels): the carabina, the
  shotgun, the sniper's rifle with its scope, the pistol. Health 100, back slowly after 5 s unhurt; a
  hit on the head counts more. After going down, 4 s and back at the spawn none of the others can see,
  safe for 2 s.
- **What stops a shot is what you'd hide behind:** buildings and their roofs, walls, hedges, parapets,
  trunks, waiting karts and the ground. Fences, railings, gates' bars, handrails and the trees' crowns
  let it through.
- **The area's edge is barriers and a railing, not an invisible wall** (decision 019): a railing where
  someone on foot can reach the edge, road-works barriers across its streets and paths, up only during
  a round.
- **No gore:** a figure put down falls and fades. No names over the others and nobody on the minimap in
  a round: both would show where they are through the walls.

The alternatives: the victim deciding, as with the items (shots that hit on screen missing); teams or
other modes (out of scope for the first); an invisible wall at the edge (decision 019 has barriers).

## 057 · A round in one of three small arenas, and the buildings in them with insides made up

*2026-10-20 · task 079 · the owner's answers, 2026-10-20 (two or three arenas, very small; very simple
insides, a ground floor in most buildings and every floor and the roof in one or two of the most
strategic and tallest; arenas only, for now)*

The shooter's area (decision 031) is 21.5 ha: a round of a few players in it is mostly walking. A
round is played in one of three arenas in it instead, about 80 m across each (`tools/arenas.mjs`,
`world.arenas`): Topo do Fujacal, Doutor José Vilaça and Santa Justa, the host choosing which. The
area itself stays what's loaded and seen round them.

- **The arenas are the map's** (braga-map, like the area: places, with their gates); **the insides are
  the game's** (party-kart's `src/world/interiors.ts`): made up, as nobody knows what's behind those
  walls, and kept out of the map, which holds what's real (decision 002's realism).
- **Very simple insides:** in each arena most buildings wholly in it have their ground floor as one
  room, its doors and windows open where the facade draws them; in two arenas the tallest flat-roofed
  block near the middle has a stairwell to its roof, every storey an open floor, its windows open, a
  parapet round the roof. Plain plaster and concrete, no furniture.
- **They're the world's, not only a round's:** walkable on foot round the city too, and drawn always;
  a kart can't get through a door.

The alternatives: the whole area with more bots (still mostly walking); arenas of their own geometry
(not Braga); insides in the map (made-up data in a map of what's real).


## 058 · The deathmatch's bots: the host's browser runs them, and they know only what a player could

*2026-10-20 · task 075 · the owner's answer, 2026-10-19 (bots from the start); played by the owner at
each level, 2026-10-20*

A round's empty places are filled by bots on foot, the drivers nobody picked (as in a race, decision
014), at a level the host sets: Fácil, Médio or Difícil ("Nível", beside "Bots").

- **The host's browser runs them** and decides their shots, as a player's browser decides theirs
  (decision 056): it sends their snapshots as its own and draws them 110 ms behind, as everyone does,
  so it shoots at them where it draws them.
- **A bot knows only what a player could:** it sees what the round's line of sight lets it see, hears
  shots and footsteps placed only roughly, and fires only at someone in its sight as it fires. Its level
  is its reaction, its aim's error and tremble, how fast it turns, how far it sees and when it backs off.
- **After 8 s of seeing and hearing nothing, a bot makes for somewhere 30–60 m from someone,** as
  far-off footsteps would tell a player: without it a round with few players was mostly walking. It
  never lets a bot see or shoot anyone it couldn't.
- **They walk a graph of the round's ground** (party-kart's `src/world/paths.ts`), made when the host
  opens the round's settings, keeping only the points every spawn reaches.

The alternatives: each browser running some of the bots (a bot's shots would need deciding twice);
bots that know where everyone is (no hiding from them); bots that only wander (a round of walking).

## 059 · A retaining wall is measured along its length, the land at a wall stands under it, and a passage comes out past its mouths

*2026-10-20 · tasks 077 and 078, found on foot by task 073*

On foot a wall is something a player can't climb or walk under, and a passage under the houses is a
way through. Walking Fujacal found retaining walls stepped over from below, walls walked under, and
both of its passages shut or narrowed. The causes were in the data and in the game:

- **A retaining wall of the map's is measured along it** (`walls.mjs`, `stepsOf`): the map gives a way
  one height, but a retaining wall's face tapers out at its ends, and a way runs on past it or round a
  corner where its higher ground changes side. Every half metre, the terrain's step across it from
  1.75 m out either side; cut where its higher ground changes side (turned, so it's on its left) and
  where its step changes height, each piece its own `h`; where the terrain doesn't step, a piece as low
  as it does. Of the map's 23 km round the open world, 3 km were the wrong way round and 5 km have no
  step. Nothing is moved (decision 033 holds): the map's lines are about 0.75 m off the terrain's step
  either way (the median, not the buildings' shift), so a wall's face and the land's step don't meet.
- **So on foot a retaining wall stands as high over its top as for a kart** (party-kart's `overTop`),
  from its lower side, where its face is more than a step: the land at its foot is a 2 m grid's, which
  ramps up to its top (and a line 0.75 m off puts the step past it), and would let a walker run up it
  and jump over. A low one (no step there) is climbed.
- **The river's bed is cut no further than a wall standing on its bank** (party-kart's `land.ts`): the
  Rio Este's bed was cut 12 m wider than the river either side, under the walls along it by Fujacal,
  which a walker walked under. A retaining wall along it is the channel's side, cut down past as
  before: the race's jump by Ponte Pedrinha flies that gap (task 039).
- **A passage under a building reaches a metre past each mouth** (`streets.mjs`, `mouths`), flush with
  a pavement it opens onto, which gives way to it; and one the map ends inside the building within 3 m
  of its outline is drawn out of it: the map draws a passage from a corner of the outline to another,
  so its floor ended on the outline, and the edge across its mouth was left standing (anywhere within
  25 cm, the tiles holding a building's points to half a metre). A game cuts a building back at a
  flight's treads on the ground too, and stands a cut's edges inside a building only where the building
  is on their other side, not where a passage's floor meets a carriageway's (party-kart's `trimmed`).
  39 of the open world's 40 passages are walked through (the last runs along a seam between two of the
  map's buildings, with no open ground at its end).

The alternatives: retaining walls moved onto the terrain's step (decision 033's "nothing is moved",
and the step is often a bank, not a line); the land carved to the wall at 50 cm (a 2 m grid can't hold
it, and the game draws the land at 2 m); the river's bed narrowed everywhere (the race's jump needs its
gap).

## 060 · The deathmatch after Counter-Strike 2's: its arsenal and buy menu, two teams, cover on the arenas, and CC0 models and recordings for it

*2026-10-21 · the owner's answers, 2026-10-21 ("100x better… inspired in CS2… a buy menu (unlimited
money for deathmatch), animations, weapon changing, noscopes, everything"; real arenas with cover over
hand-built maps; CC0 models and sounds allowed; core gunplay, grenades, the full arsenal and a team
mode all in) · replaces decision 056's four kits and its health coming back, adds to decisions 016,
057 and 058*

The first deathmatch was four kits on a real street; the owner wants it to play like Counter-Strike 2.
In party-kart:

- **The arsenal is Counter-Strike 2's** (`src/game/arsenal.ts`): twenty guns in six families, with
  their damage, armour penetration, range falloff, rate of fire, magazines, reloads (a shotgun's a
  shell at a time), draw times and running speeds; a spray pattern each automatic climbs and sways
  along, the same every time; accuracy that depends on moving, crouching and being in the air
  (counter-strafing works, the walker braking as Counter-Strike's does); scopes with zoom levels, the
  AWP's no-scope wild and its quick-scope true once the scope's up; the knife's slash and stab, worth
  more from behind; four grenades (HE, flash, smoke, molotov), whose throw is their whole flight so
  every browser draws it alike; a vest and a helmet. Health doesn't come back. A head shot counts four
  times, the legs three quarters, as Counter-Strike's do — so the figures in a round are a person's
  proportions (a CC0 figure in the friend's colours), not the friends' big-headed ones.
- **A buy menu, the money unlimited,** as in Counter-Strike's deathmatch: what's bought is kept from
  one life to the next and changed in the first 15 s of one (else for the next).
- **Two teams, as the host chooses,** or everyone for themselves: no damage to a team-mate, the bots
  shared out too, the team's kills its score.
- **The arenas stay the real three (decision 057), with cover laid on them:** the cars the LiDAR saw
  parked there where they stood, and road works' things (skips, hoardings, a scaffold, pallets,
  sandbags, a site office, a van, toilets, barriers), placed by party-kart's `src/world/cover.ts` to
  break the long looks down the streets and give a corner to fight round, up only during a round —
  as the edge's barriers are, and like them a departure from what's there (decision 004). The
  insides (decision 057) get partitions, back doors, furniture to hide behind and a third tower; and
  some thirty spawns an arena, sheltered, indoors as well, never one a foe can see.
- **CC0 models and recordings, for the deathmatch only** (adds to decision 016): the guns, the knife,
  the grenades, the figure and the props are CC0 models, the shots, reloads, grenades, impacts and
  footsteps CC0 recordings, all in party-kart's `src/fight/` and on record in its `ASSETS.md`
  (source, author, what was done). About 4.4 MB of models and 0.4 MB of sound, fetched when a round
  needs them; the shapes made in code stand in until they're in. One gun pack's itch.io page shows
  CC-BY where its own description and its other pages say CC0: its author is credited, which either
  asks.

The alternatives: hand-built maps after Counter-Strike's (more like the game, not Braga); keeping the
models and sounds made in code (no assets, but guns that look and sound like a game's of 2005).

## 061 · No photograph is drawn in a game: every texture is made, and matched to the photos

*2026-10-23 · task 082 · the owner's rule, 2026-10-23 ("Nenhuma foto usada diretamente no jogo, seja
fachada ou não. Pode-se usar imagens de referências e qualquer outro uso para melhorar.") · replaces
decision 002, and decision 030's photo textures; the KTX2 files and their levels stay · changes how
decisions 034, 036, 043 and 051 draw the ground, the facades and the trees*

Photos are references: to measure, to judge colours and kinds by, to read a building's face off, and
the scorecard's. None is drawn. Decision 018 (no new photos taken) stands.

- **The ten photo facades are gone** (task 007's, from Mapillary and Commons): their buildings are
  the kit's, as the 13,000 others are (decision 036), each said in `refs/buildings.json` as its
  photo shows it, with what the kit can't yet draw of it (an azulejo's own pattern, a shop's
  grille, brand boards) in its notes, for task 086 and after. `world.photos`, `world/textures/<tile>/`
  and their indexes are gone with them.
- **Every texture is made by `tools/made.mjs`:** each kind of ground (asphalt's aggregate and
  wear, concrete, Braga's granite setts in their rows and joints, a lawn's blades over soil, soil,
  gravel) and each kind of tree's bark (nine) from seeded noise and cells that wrap both ways, and
  its leaves drawn from their shape (outline, teeth, midrib and veins, two tones, the stalk) and laid
  along twigs into the spray decision 043's cards take. The same files as before (decision 030's
  KTX2, ETC1S, a file a level), so a game draws them as it did.
- **Each is matched to its references:** its mean colour and the spread of its luminance brought to
  what they measure (`refs/textures.json`'s `ref` and `match`, `--measure` reads them): the Poly
  Haven textures that were drawn until now, CC0, kept as references only, and Braga's own close-up
  where there's one fit to measure (the setts', `closeup-pavement-setts-1`). A game divides a
  ground's texture by its mean and puts the place's colour in (decision 034), so it's the contrast
  and the pattern that come from the texture, the colour from the orthophoto.
- **No credits for them:** `map().photoCredits` is empty, and a game's credits list no photographer
  or Poly Haven author. `test/textures.test.js` fails if a recipe names a photo, a Poly Haven
  asset, a quad or a wall, or if `world/textures/` holds anything the recipes don't make.

The alternatives: keeping the photos where they're good (the rule is the owner's, and has no
exceptions); painting the textures in a shader in party-kart (every game would draw its own, and
none could share them, as a world's textures are shared by decision 030).

## 062 · The furniture is the map's, and what the LiDAR sees of a pole's head; the low things the map's only

*2026-10-23 · task 100 · adds the street furniture to decisions 022 and 025*

OpenStreetMap has little of Braga's street furniture and nobody adds to it (decision 022), so the
world takes what DGT's 2025 point cloud finds, as it does for the buildings and the walls, but only
what the cloud can tell (`tools/furniture.mjs`, `world.furniture`):

- **The map's, all of it,** in the open world's area: its lamps, signs, benches, bins and litter bins,
  ecopontos, bollards, bus shelters (a stop with `shelter=yes`) and the poles that carry wires, where
  it puts them. Where the LiDAR has one within 3 m, the map's stands, as high as the LiDAR measured it.
- **The LiDAR's lamps, signs, traffic lights and bus shelters**, which it sees as a head in the air: a
  clump of points 2 m up or more with nothing under it, a lamp's arm or a sign's plate long at most,
  clear of trees, buildings, walls and wires, and not a parapet's top. It sees about one lamp in four
  (of the map's in the open, 93 of 132 have no point over 3 m within 4 m), and of what it finds, a
  sample of 50 checked against the photos was 17 right, 10 another piece of furniture, 14 nothing and 9
  not shown (`refs/furniture.json`): kept, as a game's street with a lamp where there's a sign is
  nearer Braga's than one with neither.
- **Not the LiDAR's low things nor its poles on wires.** At 18 points a square metre a bench, a
  container or a row of bollards is the top of a parked car, a parapet or a fence's posts (none of 14
  looked at was one), an ecoponto's lids don't show their colours in the orthophoto, and a head on a
  wire was never a pole's (none of 16). What neither has, task 020 places by its rules.
- **A sign's face** is a photo's where one shows it (read, not drawn, as task 082 keeps the photos
  as references), else the commonest for its place: a stop or a give-way sign by the map's, a
  no entry at a one-way street's wrong end, a crossing's by a zebra, a bus stop's by a stop; else none.

The alternatives were Mapillary's detected signs and lamps (decision 006 keeps them out), every clump
the LiDAR finds kept (three times as many pieces, most of them cars and walls), and the map's alone
(714 pieces where the open world has thousands).

## 063 · A square is a square however the map maps it, less what's in it; the audit measures the streets where the world draws them

*2026-10-24 · task 041 · makes decision 022's "a street the world misses is a bug in the scripts" hold for the squares*

- **A square mapped in parts,** a `highway=pedestrian` multipolygon as the Praça da República is, is
  a square as one mapped as a way is: each of its outer rings a `plaza` area in the tiles and on the
  map page. Its relations are read from `paths.json`, which fetches them; `base` isn't fetched again
  for them.
- **What's in it is cut out, not painted over:** its inner rings (a lawn, a garden, a fountain, a
  bandstand, a building) are its holes, in the tiles' area and in the pavement the streets' surfaces
  pave a square with (task 033), so what the map has there shows.
- **A way tagged as an area that isn't pedestrian** (a residential street's yard, a driveway) stays a
  street round its outline: it's driven on, and a square's paving and furniture (tasks 018, 020)
  aren't a yard's.
- **The street audit measures the world against the streets where the world draws them:** on their
  carriageways (task 026), within 1.2 m, as the tiles keep a street to 0.8 m and in half metres. Against
  the map's lines as fetched it listed 167 ways as drawn in part that the world draws whole.

The alternative was fetching the relations into `base` with the streets (one file, but eleven days
of the map's edits into every tile and track); the owner chose `paths.json` (2026-10-24).

## 064 · The full map: M opens it over the game, which goes on under it; a round's maps show no foe

*2026-10-24 · task 106 · adds to decisions 019 and 056*

Party Kart's minimap shows 220 m round you, and nothing showed the whole open world. M opens the
minimap into a full map (party-kart's `FullMap`), the place the GPS, going somewhere, finding a place
and meeting the others are done from (tasks 107 to 110):

- **What it shows:** every line of the tiles the city loads, north up, from the minimap's own: the
  streets at their widths and their names as you zoom in, the race's route, the arenas, the area's
  edge, you and the others. Round the city it opens round you; in a race on its whole track; in a
  round on its arena.
- **The game goes on under it.** The network, the others and the bots don't pause; your kart waits
  (in a race too) and you stand, as with the menu. It's opaque, and the city isn't drawn under it.
- **A round's maps show no foe:** only you and your team-mates who are up, on the minimap and the
  full map alike (`onTheMap`), so neither gives a foe away.
- **The sound moves to N;** a key a player bound to another control keeps that control.

The alternatives were the map over the game half seen through (the city drawn for nothing, the
streets harder to read), the game paused while it's open (it can't be, with others in the room), and
a map of the open world's area alone (the city round it is where a player looks for somewhere to go).

## 065 · Every kart 2.8 by 1.8 m, drawn within the footprint it collides as, its driver the same size in each

*2026-10-24 · task 105 · the karts' size, in party-kart*

The karts were drawn about twice a real kart's size, the kart 4.0 by 2.4 m, on a collision of two
circles 0.8 m round, 3.5 by 1.6 m, and touched each other 2.2 m apart whichever way. The owner chose
halfway to a real racing kart's 1.9 by 1.4 m (2026-10-24):

- **One footprint, every kart's:** 2.8 m long and 1.8 m wide (party-kart's `KART`), so a race stays
  fair. The walls meet it as two circles 0.9 m round, 0.5 m either side of its middle; another kart
  as a capsule 0.9 m round its axis, so two touch 1.8 m apart side by side and 2.8 m nose to tail.
  As the two circles, another kart's circle settled in the waist between them and two side by side
  in a 3 m street locked there.
- **Drawn within it:** each body at 0.7 of its model, its driver, glow and slipstream with it, so
  every driver is the same size, about a person's: the kart 2.79 by 1.69 m, the chair 2.06 by 1.37
  and the trolley 2.16 by 0.97, shorter than the karts as they were; the banger, the longest, at
  0.65, 2.80 by 1.18 m. Keeping the chair and the trolley shorter was decided by the session, for
  the owner to confirm (task 103).
- **What's sized by a kart follows it:** the items' hits, the chase and close cameras (a kart fills
  the screen as before, the street round it larger), getting out beside it, and a waiting kart as
  cover and as what stops someone on foot.

What it changes is mostly how the karts look: by collision two of the first karts already passed side
by side in 3.8 m between walls, and these need 3.6 m, a band only about 34 m of the open world's
streets fall in. The collision itself is 0.2 m wider. The alternatives were a real kart's size (the
owner's no), the bodies drawn within the old collision, 3.5 by 1.6 m (the owner's no), the chair and
the trolley brought to 2.8 m (their drivers 30% bigger than the others), and the two circles for the
karts too (they lock).

## 066 · The map carries a road graph to route on; a car's GPS keeps to the streets by the rules, and off them only where none reaches

*2026-10-24 · task 107 · makes decision 023's "the data does it once" hold for routing, and decision 010's rules of the road a game's*

A game that finds the way somewhere needs what the race's planner has (`tools/track.mjs`): the streets
joined at their junctions, which way a car may drive each, and the turns the map bans. The tiles' lines
can't give it: they're for drawing, thinned, cut at each tile's edge, with no junctions. So the map
carries it, made once by `tools/roads.mjs` (`world.roads`, `world.turns`):

- **Every street and path in the open world's area, junction to junction:** each way split where
  another shares a node, cut where it crosses the area's edge (a dead end there, as a game's barriers
  stand at the gates), with who may use it (cars by the map's access; on foot every path it doesn't
  close and every street but a motorway), a car's one-way (turned to run the way its points go), a
  roundabout's ring, its name, width, level and heights. The streets' own footways (a pavement the
  map draws, a crossing) are in it, as they join the paths to the streets.
- **The turns the map bans cars, as plain bans:** at a junction, from the point before it to the point
  after it, an `only_` turn made into bans of every other; the few over a way rather than a node left
  out.
- **A car's GPS keeps to the streets by the rules** (one-way, no banned turn, no turning back but at a
  dead end, the avenues first), and leaves them for a path or the steps, as a kart drives them, only
  where no street reaches the waypoint inside the area: each time costs ten minutes in the search, so
  a pavement never saves going round a one-way street. The Picoto's top is such a place: its streets
  in the area reach the rest only from outside it.

The alternatives were the one-way on each Line and the junctions found by each game from the lines'
points (every game making the graph again, from points thinned and cut by tile), a route that stops
where the streets do (the Picoto's top out of reach), and a car free on the pavements (a GPS that
drives against a one-way street on its pavement).

## 067 · On a jump's run-up the bots go round a kart stopped there, and one that can't fly gets out of the way

*2026-10-24 · task 114 · changes decision 044's "the bots pass nobody" on the run-up, in party-kart*

The bots drove a jump's run-up on the ramp's axis in single file and passed nobody (decision 044).
With the karts 2.8 m long (decision 065), one stopped there by an item or a bump sent those behind
into it and short of the landing: put back on the Volta dos Amigos' run-up 56 times in 64 seeded
eight-bot races, where the old karts, touching only 2.2 m apart, had about half that.

- **A kart in the way is gone round:** one a bot would catch before that kart is well off the lip,
  judged by where it will be when the bot gets there. On the bot's own side if there's room, to the
  kerb; else the other side if there's more than a second to cross; else as far over on its side as
  it goes. Not crossing in front of a kart it's about to reach, nor swinging back while alongside it.
- **Up the ramp beside it:** the autopilot steers onto a line up to 1.65 m either side of the ramp's
  axis, parallel to it, as it steers onto the axis. Flights from up to 2.15 m off the axis all land
  in the corner the race takes in; further across, karts arriving at an angle clip the ramp's side.
- **One that can't fly moves aside:** a bot that can't make the ramp's speed by its foot any more
  (6 m/s under it, by the handling's own acceleration) moves as far over as the road goes, away from
  the kart behind it; under 15 m/s the autopilot drives its line up the ramp rather than steering it
  onto the flight, which at a walking pace swung it into the run-up's wall. It still falls short and
  is put back on the run-up, as a player would be: from a standstill a kart needs about 120 m to
  reach the ramp's speed, about 15 s backing up, against 3 s for the put-back (decided by the
  session, for the owner to confirm).

What it did: put back on the run-up 24 times in the same 64 races, where it was 56; of eight bots in
a pack with a pudim dropped on the run-up, 32 seeded times, 44 put back (32 of them the ones it hit)
where it was 85; behind a kart stopped on the run-up, every bot past the landing. The alternatives
were keeping a following distance on the run-up (a bot that brakes takes the ramp too slow and falls
short itself), and a bot that lost its speed backing up and lining up again (above).

## 068 · A car tilts by the surface it's on, not the ground past its edge

*2026-10-24 · task 066 · party-kart's ground, beside decision 049*

party-kart tilted a car by the ground 1.5 m either side of it wherever that fell, and on a narrow
street beside a wall or a cutting that's past the carriageway's edge: on the Avenida João XXI's 3.3 m
upper lane the race's car read the cutting's street 6 m down and was tipped to 64° on a flat road.
Since task 066, on a street, a pavement or a path, a side whose ground is further off the ground
under the car than a street climbs (40% over the distance) is read at half a metre instead, or left
out, and the slope taken on the side that's still its own surface; elsewhere, and where both sides
are its own, as before. Along every street in the area at 90 km/h, both ways, a car was in the air
0.3 s or more 172 times, where it was 187. What's left on the João XXI is the ground itself, which
runs from the lane down to the cutting over about 1.5 m: held in the car's floor alone, the car
would float over the street as drawn on that ground, so the step is the ground's to make (task 115).
The land dug in front of the tunnels' mouths (`openings`) stays: without it a car doesn't come out of
the Liberdade underpass.

## 069 · Ultra: everything past what a phone holds goes to a fourth level, for a PC only

*2026-10-24 · task 081 · the owner's answer of 2026-10-23, beside decisions 013 and 017*

The owner wants Braga at its absolute best in every aspect, and the friends' phones can't hold it.
So the game has a fourth graphics level, **Ultra**, above High, Medium and Low, for a PC only, and
everything the "Ultra" tasks add (083 to 101) goes there; High, Medium and Low stay as they are, so
the phones play as before, and the budget (decision 013) keeps its three phone levels.

- **Offered on a PC:** where the device isn't played by touch first and its graphics card takes
  textures 16,384 pixels wide or is a discrete one by its name. `?quality=ultra` sets it whatever
  the device (the shots). The game steps Ultra down to High when it runs slowly, never up to it.
- **Built at High's level but for its own:** the city's detail, braga-map's files and the tiles are
  High's until a task gives Ultra its own (085 its textures). Its own so far: the screen's every
  pixel, the sun's shadows at 4096 px, and the near trees to 700 m, the most whose gathering keeps a
  frame under 16 ms on the owner's PC at 2560 by 1440 (12 ms; 18 at 1,000 m). The haze stays the
  light's (decision 037), and the camera already sees 30 km.
- **The rounds are shot at Ultra and Low** from now on (`scripts/shots.mjs --ultra`): Ultra is what
  "as real as it gets" means, Low what a phone sees.

What it costs, on the owner's RTX 4060 Ti at 720 pixels high: 103–271 draw calls, 2.68–5.36 M
triangles, 181 MB of textures, a frame of 1.4–3.4 ms (High 99–264, 1.43–3.19 M, 133 MB, 0.8–1.9 ms).
High, Medium and Low draw the same as before, to the pixel.

## 070 · The shooter's area's trees are the species their photos show, in leaf too; a species is drawn as the kind it looks like, and the kinds stay nine

*2026-10-24 · task 088 · on decision 051*

Decision 051 named the trees near seven viewpoints from their photos. Task 088 did it for every tree of
the shooter's area a photo shows, and Braga's council publishes no street-tree inventory to take it
from (`docs/SOURCES.md`).

- **Every tree a photo shows is looked at** (`tools/species.mjs shooter`): within 60 m of a viewpoint's
  or a reference photo's camera, in its view and in sight past the buildings. Most of those photos are
  of February and March, the broadleaves bare, so **views of Mapillary's panoramas taken in leaf** are
  reference photos too (`what: trees`, `tools/species.mjs summer`), none taken within 150 m of an egg or
  a waypoint or looking at one within 300 m, the rule every reference photo keeps (`test/photos.test.js`).
  Of the area's 337 trees in some photo's view, 328 were looked at (the other 9 the limes' row names):
  71 named past "broadleaf" (the Rio Este's willows, the Alameda do Fujacal's planes, Judas trees,
  hackberries, cedars and cypresses), 165 broadleaves no photo can name, 92 hidden. A label that names
  nothing leaves a tree to the row that names it.
- **A species is drawn as the kind it looks like** (as 051's were): the willows as poplars, the cedars,
  cypresses and the araucaria as conifers, the Judas trees, oleander and evergreen broadleaves as
  broadleaves. **No kind is added** until a species has some 50 trees on the photos' evidence: none
  has (the willows 23, the planes 25, the hackberries 20), and the hackberries, the nearest, already
  have "broadleaf"'s bark. An evergreen broadleaf is drawn deciduous till the seasons (093).
- **A row is carried no further than a photo shows it** (051's rule): the point cloud's spacing would
  carry the alameda's planes and the willows on, unseen.

What it changed: 63 trees' kinds and nothing else of any tree; the shooter's area's share of
"broadleaf" from 90.0% to 86.1%, the open world's from 87.3% to 87.1%. Of the five viewpoints shot,
`alameda-fujacal`'s trunks are the plane's bark (paler than its photo's wet February bark), the others
as they were (Claude's marks the same).

## 071 · Ultra's light: WebGL, its frame drawn through three's post-processing

*2026-10-24 · task 090 · decided by the session, for the owner to confirm (task 103), beside decision 069*

Ultra stays on three's `WebGLRenderer` and gets what a phone can't afford laid over its frame
(party-kart `src/render/post.ts`), not a move to `WebGPURenderer`. The game's look is in at least
14 changes to three's shaders in 7 files, all WebGL's GLSL, which WebGPU's node materials don't take:
Ultra on WebGPU would mean writing each again in TSL and keeping both, the phones' levels staying on
WebGL. High, Medium and Low draw as before, to the pixel.

- **The sun's shadows in four cascades** (three's CSM) of 4096 px, ending 60, 200, 650 and 2,000 m
  off, the first as sharp as Ultra's one box was. Each lit material takes three's own lights chunk
  with only CSM's loop over the suns in it: CSM's copy of the whole chunk is older than three
  0.186's and drew every standard material darker and duller.
- **Occlusion** (GTAO), from the frame's depth, eased so a crease between two walls doesn't come
  out as a band; **SMAA** for the edges (three's TAA doesn't reproject, so it would smear in motion).
- **Left for tasks of their own:** reflections (a buffer of the surfaces' normals, which the
  occlusion would use too), the light bounced, a volumetric haze and the clouds' shadows, shadows
  that soften with distance.

What it costs, on the owner's RTX 4060 Ti: a frame at 720 pixels high of 3.34–7.58 ms (081's
Ultra 1.36–3.44), at most 9.8 ms at 2560 by 1440; 192 MB more of textures (the cascades' maps). A
gather of the near trees, every 20 m, adds 3–4 ms to its frame; the near trees go into every cascade
whole, and task 089, which remakes the trees, takes that on.

## 072 · The land steps under a retaining wall: a game holds it to each side's own ground, and cuts its mesh along the wall

*2026-10-24 · task 111 · adds to decision 059, whose "the land carved to the wall at 50 cm" it leaves as it was*

The tiles hold the ground every 2 m (decision 049), so across a retaining wall standing at a slant to
that grid the land ramps from one side's ground to the other's, over up to a cell either side of the
step. A game drawing that ramp on a 2 m lattice stood its triangles up to a metre or more in front of
the wall's face (the white shards in the Travessa Conselheiro Lobato, through the band a street's
outline leaves the land drawn in), curled a street at the wall's foot up to it (39 cm over its last
2 m, at the median, in the Volta dos Amigos' box) and sank one on its top down to it (44 cm). The data
can't hold the step, whatever its points' heights; the game can, so party-kart does it:

- **The land's height either side of a retaining wall is that side's own** (`land.ts`'s
  `heldAtWalls`): within 3 m of a wall of the map's standing half a metre or more over its lower side,
  the land on its lower side is held down to the ground 3 m out, past the grid's ramp, and on its
  higher side up to the ground 3 m in, eased out over the last metre and the wall's first and last
  1.5 m. The karts and the walkers stand on it as it's drawn. (The wall's own top, and its top less its
  height, are braga-map's measures 1.75 m either side and the step's upper quarter: held to them, a
  street at its foot was held up to a metre over itself.) A side's ground is never taken past another
  wall alongside, but half way to it: between a terrace's two tiers, or a street between the wall
  above it and the one below, both walls hold the land to the same ground.
- **The land's mesh is cut along each wall's footprint** (`lattice.ts`'s `Surface`), its pieces at
  those heights, so it steps under the wall, whose face and top stand over the step. Only a small
  cell's triangles are cut, and a cell is split into small ones only as any is (where the land shows
  beside a street and its triangles would miss it): splitting every cell a wall meets, round the map's
  80 km of them, cost a fifth more triangles at every viewpoint, and cutting the big cells' 8% more
  on High and 13% on Low, where a 10 m triangle (20 m on Low) is too coarse for a step to show.
- **Nothing in the data changes:** a wall's line, its top and its height are as braga-map has them.

The alternatives: the land carved in the tiles at 50 cm (decision 059's, still too big to ship); the
land masked in front of each wall (a street's edge would still curl, and the karts would still ride
the ramp); a wall's measured foot and top as the land's heights (up to a metre off a street at its
foot).
