---
status: todo
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

- [ ] On Ultra on 13 March the bare crowns are dark twigs against the sky, close up and far off, beside
  the photos of bare trees; no pale haze, stipple or white blotch over the town.
- [ ] High, Medium and Low unchanged; rated no lower.
- [ ] party-kart's tests (four at a time) and `npm run check` pass; the cost in its budget.

## Notes

- Found by the coordinator marking 093's round (2026-10-25); 093 landed with it, as main isn't deployed
  until the run's end, so this lands before the deploy.
