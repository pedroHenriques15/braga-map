---
status: done
priority: medium
kind: code
repo: party-kart
created: 2026-10-25
depends-on: [093]
roadmap: Ultra · Braga at its most real
---

# 132 · The bare trees' twigs dark against the sky, as in March, not a pale haze

## Why

Task 093 put Ultra's deciduous trees in their season: on the default 13 March the avenues' planes and
the park's trees are bare, as that day's photos have them. But in its round (`2026-10-25-after093`,
Ultra) the bare crowns' twigs draw as a pale, stippled haze, lighter than the sky at the horizon and
than the trunks:

- close up (`capela-sao-joao`, `liberdade`, `fujacal-west`) it reads as hoarfrost on the branches;
- far off it's white, grainy blotches over the town (`sameiro`'s left half, the band behind
  `estadio`'s wall), and `bom-jesus`'s right-hand tree looks pinkish, as if in flower.

The photos of bare trees (`fujacal-west`, `alameda-fujacal`, `fujacal-start`, `egidio-guimaraes`, and
093's January and March reference photos) show dark grey-brown twigs against the sky, a fine dark
lattice that thins to a soft brownish-grey mass far off.

## What

1. Find why the twigs are pale: the twig cards' texture, their light (sky light from below, the sun
   through them), the dither that fades them (`alpha to coverage` or a stipple), or the haze over them.
2. Draw them as the photos have them: dark twigs whose thin ends fade to the sky, not to white; far
   off, a grey-brown mass, no stipple or grain; the evergreen crowns as they are.
3. Shoot the views 093's round names above at Ultra on 13 March, beside the photos of bare trees, and
   every viewpoint at Ultra for the round.

## Read first

- party-kart's `src/render/trees.ts` (093's season functions, `bakeBillboard`, `limbVertex`) and
  `src/render/season.ts`; task 093's Notes; decision 077 (089's limbs) and the decision 093 lands with.

## Done when

- [x] On Ultra on 13 March the bare crowns are dark twigs against the sky, close up and far off, beside
  the photos of bare trees; no pale haze, stipple or white blotch over the town.
  > `shots/2026-10-25-after132` against `after093` and the photos (Notes, "The round"); marked by the
  > coordinator: close up dark lattices against the sky, far off a grey-brown mass where the white
  > blotches were, nothing pink at `bom-jesus`; "no stipple" met at 1:1, a fine hatch left far off at
  > `estadio` (`.cache/scorecard/marks/2026-10-25-after132.json`).
- [x] High, Medium and Low unchanged; rated no lower.
  > High and Low: 33 of 33 the same to the pixel, measured. Medium isn't shot in a round, and every
  > change is in Ultra's frame or Ultra's season code. No mark moved (mean 2.64).
- [x] party-kart's tests (four at a time) and `npm run check` pass; the cost in its budget.
  > 166 and `npm run check`, on main with braga-map 1.44.0; the budget's "Ultra's bare twigs dark".

## Notes

- Found by the coordinator marking 093's round (2026-10-25); 093 landed with it, as main isn't deployed
  until the run's end, so this lands before the deploy.
- **Why the twigs were pale** (What 1): not their texture. The broadleaf's twig card, made again,
  is dark brown (mean 80, 71, 60), and its see-through texels hold that mean, so its mipmaps don't
  pale. Nor was it the haze or the dither. It was the sun's sheen:
  - A card's normal is its crown's, near upright. Seen from below against the sun, three's specular
    lit it about 0.8, against about 0.09 for its own colour.
  - The twigs came out about 200 grey in `capela-sao-joao`'s crowns, against 40–60 now. The sheen was
    the sun's warm colour, so it was pinkish too (`bom-jesus`'s right-hand tree).
  - The leaves take the same sheen, but in their green it was never seen as white.
- **What's drawn now** (party-kart's `trees.ts` and `post.ts`, Ultra only):
  - A card of twigs has no sheen.
  - It takes a third of the sun a card of leaves would (`TWIG_SUN`): a twig is a thin round stick, and
    what's seen of a crown's against the sky is mostly its shaded side.
  - Its colour goes half way to its own grey. The texture's brown, averaged with the sky, read as pink,
    as if in flower, and massed into a copper beech's. The winter photos' twigs are a near-neutral dark
    grey.
  - The finer twigs far off are still dithered, as in 093, but the dither is resolved. The pixels
    dithered (a card's twigs by how far into the dither they are, a bare billboard's by how see-through
    it is) flag themselves in Ultra's frame's alpha.
  - A pass between the occlusion and SMAA (`dithered`, `UltraFrame`) averages each flagged pixel, or
    one seen through it, with those round it that are flagged or behind it. A bare crown far off is a
    soft grey-brown mass, as the photos have one. What stands in front of a crown (a sign, a lamp post)
    and everything away from one stays sharp.
  - The cards are dithered in two sets, apart. One pattern for all left each card the same holes; once
    resolved, the veil was too thin, mostly sky. One pattern per card massed the crowns near black
    (`sameiro`'s left, `bom-jesus`), where the photos have see-through lattices.
- **Tried and dropped:** one dither pattern per card (above); and the twigs' full sun with only the
  sheen taken off (rust-red against the sky).
- **Not changed:** the twig textures (braga-map's files as 093 made them), the leaves, the billboards'
  bake. High, Medium and Low draw as before: everything here is in Ultra's frame or in Ultra's season
  code.
- **The round's "before" (an exception to rule 18, decided with the coordinator):** `after093` is 132's
  "before", not a round from a new worktree of main. Main is 093's state:
  - party-kart's main is 093's commits and the pin to 1.43.0 (cf1806f), and the pin's `base.js` was
    the same as 093's worktree's by `cmp` at the landing;
  - braga-map's world is 093's f863e09, with docs only since;
  - `after093`'s views shot before f863e09 are those the twelve park trees don't reach; the 11 that do
    were shot again.
- **The round:** `shots/2026-10-25-after132` against `after093` (above), the 33 viewpoints at Ultra, High
  and Low, on braga-map 1.43.0.
  - High and Low: 33 of 33 the same to the pixel.
  - Ultra, on the default 13 March: the bare crowns are dark twigs against the sky close up
    (`capela-sao-joao`, `liberdade`, `fujacal-west`, `bom-jesus`). Far off they're a soft grey-brown mass:
    over the town at `sameiro`, a grey row behind `estadio`'s wall.
  - Beside the photos of bare trees: `fujacal-start`'s and `fujacal-west`'s dark lattices against the
    sky are as the photos have them. `alameda-fujacal`'s photo has pollarded trees, sparser than its
    near crown here, with dark trunks where the plane's bark draws pale. Both are beyond what this task
    changes (told the coordinator).
- **The cost**, at 2560 by 1440, two runs each, back to back with main:
  - The resolve and the twigs' light cost 0.0–0.2 ms a frame: `falperra` 10.7 ms either way;
    `capela-sao-joao` 8.9–9.0 (8.8–8.9); `alameda-fujacal` and `lobato-pavement` 7.9 and 7.9 (7.7 and
    7.8); `picoto-top` 9.8 (9.6–9.7).
  - In the round: one more draw call and triangle on Ultra (the resolve's); textures the same,
    462 MB.
  - A buffer the screen's size more: 29 MB at 2560 by 1440, in half floats.
  - In party-kart's budget, "Ultra's bare twigs dark".
- party-kart's tests four at a time (164, then 166 on main's 1.44.0 at the landing) and `npm run check`
  pass. 132 touches no braga-map code or
  data, so it's no new braga-map version.
