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
- **The friends' houses are never at their real door.** An easter egg stands near a waypoint,
  44–50 m past it (`tools/track.mjs`), and the waypoints stay in `.cache/places.json`.
  *Replaced by decision 014 (2026-10-14): the eggs stand on the houses.*

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
- **Not a departure.** Decision 004's list stays as it was; the `(joined)` links out of dead ends,
  which a note on the map asked for, are the one way the loop leaves the streets.

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
