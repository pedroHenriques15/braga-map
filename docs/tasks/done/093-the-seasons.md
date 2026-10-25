---
status: done
priority: low
kind: code
repo: both
created: 2026-10-23
depends-on: [088]
roadmap: Ultra · Braga at its most real
---

# 093 · The seasons: bare trees in winter, the jacarandas in flower in June

## Why

The trees are always in summer leaf, tinted to Braga's summer green, and the lawns as the July
orthophoto has them (task 068). Yet the game's default is 13 March (decision 037), when the
avenues' planes and limes are bare. The date the game is set at should show.

## What

Today braga-map's `tools/trees.mjs:401` marks each kind evergreen or not (decision 051) and
nothing reads it; party-kart's `src/render/trees.ts` tints every kind's leaves one summer green;
`src/sun.ts` knows the date (`?time=`).

1. **By the date:** each deciduous kind's leaves follow its year: bare (branches only, 089's limbs),
   budding, in leaf, turning (each kind its autumn colour), falling; the dates for Braga from a
   phenology source (research, recorded in `docs/SOURCES.md`).
2. **Flowering:** the jacarandas (June, violet), the cherries and magnolias (March), the
   camellias (winter), each where 088 names its species.
3. **The ground:** fallen leaves under the deciduous trees in autumn; the lawns' green by the month
   (task 068 is March's).
4. The default stays 13 March: the planes bare, as the photos of that date show.
5. **On Ultra only** (the owner, 2026-10-24): High, Medium and Low stay in summer leaf, as now, so a
   phone sees no change. The rounds, shot at Ultra at each photo's moment (091), show each photo's
   season.

## Questions

- [x] Where do the seasons show: on Ultra only, High and below staying in summer leaf; or on every
  level, the default game's planes bare for everyone? Recommendation: Ultra only (081: what a
  phone can't hold goes to Ultra).
  > Ultra only (the owner, 2026-10-24).

## Read first

- `docs/DECISIONS.md` 037, 043, 051; task 068; `tools/trees.mjs`; party-kart's
  `src/render/trees.ts`, `src/sun.ts`.

## Done when

- [x] On Ultra, at `?time=` in January, March, June and October, the avenues' trees look as Braga's do then
  (`31-de-janeiro`, `liberdade`, `capela-sao-joao`, `porfirio-da-silva`), each set beside a reference
  photo of that season.
  > Drawn from six reference photos' own cameras on their dates, January, March, June, November and
  > December, and the four viewpoints at the four months (Notes, "The seasons beside photos of them");
  > the round marked by the coordinator, no mark moved, mean 2.64, its bare trees matching the winter
  > photos where the leaves didn't (`.cache/scorecard/marks/2026-10-25-after093.json`).
- [x] High, Medium and Low unchanged (every viewpoint the same at those levels).
  > High and Low: 33 of 33 the same to the pixel (`shots/2026-10-25-after093` against `before093`).
  > Medium isn't shot in a round; it draws by High's and Low's path, every change being Ultra's alone
  > and the evergreen broadleaf drawn as a broadleaf below Ultra (party-kart's `cityTrees`).
- [x] `npm test` here, `npm test` and `npm run check` in party-kart pass.
  > 163 here; party-kart's 163, four at a time, and `npm run check`, on braga-map 1.43.0.

## Out of scope

- The species: 088.

## Notes

- **Premises that didn't hold (rule 4):**
  - "The jacarandas (June, violet), the cherries and magnolias (March), the camellias (winter), each
    where 088 names its species": 088 named none of them. Its trees are broadleaves, limes, planes,
    hackberries, willows, 6 Judas trees, robinias, 4 evergreen broadleaves, an oleander, conifers and
    palms. Nor does a species reach a game; the tiles carry a kind.
    - The Judas trees (pink on bare wood in spring) and COS2025's acacia woods (45 ha, evergreen,
      yellow in February and March) are task 130's: kinds of their own, with their flowering.
      `YEAR`'s rows for them are ready (`judas-tree`, `acacia`).
    - The flowers 093 draws are the limes', in June.
  - "The lawns' green by the month (task 068 is March's)": 068 isn't done, so there's no March lawn
    to vary; left to 068.
  - "Fallen leaves under the deciduous trees in autumn": not made here; told the coordinator, for a
    task of its own.
  - "Each deciduous kind": the broadleaf kind wasn't all deciduous. With it bare, the hills went
    grey-brown on the default 13 March, where `picoto-top`'s photo (17 February) and `falperra`'s
    (2 March) have them green, so a tenth kind was added (below). Decided with the coordinator, for
    the owner to confirm (task 103's table).
- **The evergreen broadleaf** (`tools/trees.mjs`'s `KINDS`, the tenth: the kind's 4 bits hold 16):
  - Drawn in the broadleaf's bark and leaves, with no textures of its own (`DRAWN_AS` in `index.js`).
  - Given to the broadleaves the map names evergreen (cork and holm oaks, camellias, laurels, olives,
    citrus, hollies, strawberry trees and the like, or `leaf_cycle=evergreen`).
  - Given to those 088 saw keeping their leaves (`refs/trees.json`'s evergreen and oleander), and to
    COS2025's broadleaf woods but the oaks' (cork oaks, acacias, other broadleaves).
  - Given, where no name tells otherwise, to the broadleaves on COS2025's green spaces (1.8.1.1) and
    scrub (6).
  - 58,474 of the map's trees; 106,449 broadleaves stay deciduous. On the slopes in `picoto-top`'s and
    `falperra`'s views, 25 m and more above their cameras, 12 to 15% of the trees are broadleaves now;
    the rest are evergreen broadleaves and eucalyptus.
  - COS2025's urban classes hold 86% of the open world's broadleaves and couldn't split the hills'
    from the avenues', but its green spaces did: the slopes the viewpoints see stand mostly on them.
  - **A park's unnamed trees:** checked at the Parque da Ponte against a photo by the roundabout on
    21 March 2026 (`roundabout-way-239601643-3`). The park's tall trees south of its limes are bare
    there, but the green-space rule had made them evergreen. Twelve of them are now named in
    `refs/trees.json` as trees seen in it, broadleaves (`sure: false`). A place's ring would have
    renamed the four "conifers" and a eucalyptus among them too, and changed High. Other parks have no
    winter photo to check them by.
  - Below Ultra the evergreen broadleaf is drawn as a broadleaf (party-kart's `cityTrees`), and its
    textures are the broadleaf's, loaded once: High and Low draw as before, to the pixel.
- **Each kind's year** (`tools/trees.mjs`'s `YEAR`, into `world/textures.js` and `treeKinds`' `year`;
  its sources in `docs/SOURCES.md`, "The trees' year"):
  - The spring rests on measurements in Galicia: the planes flower 11–17 March, birches leaf out
    23–29 March, oaks burst bud on days 98–107.
  - The autumn is estimated, and so is every colour. No autumn average was found for north-west
    Iberia; Porto's phenological garden records one, but not online.
  - On 13 March every deciduous kind is bare, the planes with it, as that day's photos have them.
  - The broadleaf's autumn was moved later after a photo of 17 November 2018 (`facade-way-393579619`,
    by `porfirio-da-silva`): the avenue's hackberries in it are still mostly green. They now begin to
    turn from about 14 November, half are down by 8 December, and all by 26 December, in a paler
    yellow-brown.
- **The twigs** (`tools/made.mjs`'s `twigsSVG`, `tools/textures.mjs`'s `twigs`): a card of each
  deciduous kind's bare twigs, made as its sprays of leaves are, forking from the card's foot.
  - The plane's are stout and zigzag, with seed balls hanging; the lime's dense, fine and red-brown;
    the birch's fine and hanging; the poplar's held up close to the upright.
  - Each is matched to its bark's Poly Haven reference, toned darker than any trunk.
  - Each is made at every level, as the leaves are, though only Ultra draws them: 7 to 162 KB a file.
- **On Ultra** (party-kart `src/render/season.ts`, `trees.ts`): each card of a crown is in leaf or
  bare twigs by a number of its own, so a crown thins card by card through the year.
  - Its leaves take a spring's paler green, their kind's autumn colour (each card turning on its own)
    and the limes' flowers in June.
  - The twigs are cut where a twig is a few pixels wide and dithered where finer, so a bare crown far
    off is a haze; they're darker seen against the sun.
  - The billboards are baked in the season, and the shadows follow it. A kind in summer leaf draws as
    before.
- **089's limbs were wound inside out:** the side towards the sun drew dark and the shaded side lit.
  Fixed here, which a bare crown made plain. The limbs now fork, five a tree and two forks each.
- **The seasons beside photos of them** (Done when 1), each drawn from its photo's own camera on its
  date:
  - January 2018 by `porfirio-da-silva` (`facade-lidar-x753z659`, `facade-way-185016793`): the
    avenues bare, as in the photos.
  - 17 November 2018 (`facade-way-393579619`): mostly green, starting to turn.
  - 2 December 2018 by `capela-sao-joao` (`facade-lidar-x372z933`): the hills green, a tree or two
    yellow.
  - June 2023 in the Parque da Ponte (`landmark-parque-da-ponte-2`): in full leaf.
  - 21 March 2026 by `sao-joao-da-ponte` (`roundabout-way-239601643-3`): the park's trees bare, the
    hill behind green.
  - And the four viewpoints at January, March, June and October (`31-de-janeiro`, `liberdade`,
    `capela-sao-joao`, `porfirio-da-silva`).
- **The round:** `shots/2026-10-25-after093` against `before093`, shot from a worktree of main after
  `npm ci` (braga-map 1.42.0).
  - High and Low: 33 of 33 the same to the pixel.
  - Ultra, on the default 13 March: the avenues' trees bare, the hills green.
  - Nine viewpoints' photos are of May to July, in leaf (`31-de-janeiro`, `porfirio-da-silva`,
    `bernardo-sequeira`, `altice-forum`, `capela-sao-joao`, `devesa`, `liberdade`, `lobato-crossing`,
    `sao-joao-da-ponte`), and two of late April, coming into leaf (`imaculada-conceicao`,
    `viriato-amaral-nunes`). Their shots now show March's bare trees beside the photos' leaves, until
    091 shoots each at its photo's moment, as the task says the rounds will.
  - The frame times in the round's stats aren't to be trusted: the owner was playing on this PC
    while part of it was shot.
- **The cost**, at 2560 by 1440 on 13 March, two runs each, back to back with main (no game running):
  - A frame is 10.6–10.7 ms at `falperra` (10.0–10.1 before), 8.7–8.8 at `capela-sao-joao` (8.0), 7.7 at
    `alameda-fujacal` (7.3) and `lobato-pavement` (7.4), and 9.6 at `picoto-top` (9.5).
  - A gather of the near trees takes 1.7–1.9 ms either way.
  - In the round at 720 pixels high: draw calls 504 against 493 (median: the evergreen broadleaves'
    meshes), triangles 10.28 M against 9.37 (the limbs' forks); textures the same, 462 MB.
  - In party-kart's budget, "Ultra's seasons".
- `npm test` here (163); party-kart's tests four at a time (163) and `npm run check` pass.
