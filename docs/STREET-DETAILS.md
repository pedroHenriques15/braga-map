# Street details

The sizes of what's painted on Braga's streets and what stands along them, as measured on DGT's 2025
orthophoto (25 cm a pixel) and the reference photos (task 008), for the world's markings
(`tools/streets.mjs`). Portugal's regulation (Regulamento de Sinalização do Trânsito, DR 22-A/98 as
amended by DR 6/2019) says what each marking is, but not its sizes (task 018). Task 018 measures the
rest of Braga's markings and its pavements; this file starts with a roundabout's.

## A roundabout's entry

*Task 014, 2026-10-18.* At every entry of the roundabouts on the route, the photos show a give-way
line across the lanes coming in, at the ring's edge, and behind it in each lane a triangle's outline,
its point to the traffic coming: `giveway` and `yield` in the tiles' markings (`index.d.ts`).

| | Size | How it was measured |
|---|---|---|
| The give-way line | 30 cm wide, in dashes 50 cm long, 50 cm apart | The photos (São João da Ponte's north entry, 2026; the one at (-109, 1678)'s, 2018): the dashes about as long as the gaps between them, nearly square. The orthophoto doesn't resolve them. |
| Where it is | 30 cm out from the ring's edge, across the side coming in (all of a one-way street) | The photos and the orthophoto: at the ring's outer kerb line. |
| The triangle | 2.75 m to its point, 1.5 m across its base, its outline 20 cm | The orthophoto at São João da Ponte's north entry: about 11 pixels long and 6 across, to a pixel. |
| Where it is | its base 1 m behind the line, one to a lane (3.5 m at most) | The orthophoto there, and the photos. |

None where the map has a zebra crossing at the line's place, nor its triangles on one: the world draws
the zebra there.
