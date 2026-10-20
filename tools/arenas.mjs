// The shooter's arenas (task 079): three small places in the shooter's area (docs/SHOOTER-AREA.md),
// about 80 m across each, where a round is played, rather than the whole 21.5 ha, which a handful of
// players never met in (the owner's answer, 2026-10-20: two or three, very small, the whole area no
// longer played). Each is a ring of [x, z] points drawn by hand over the map: along the backs and
// sides of the buildings round it where it can, so the edge stands in them, and across a street or
// a path where it must; world.mjs works out its gates (open.mjs's gatesOf, as the shooter's area's),
// and the games stand barriers there and a railing wherever else someone could walk up to the edge.
//
// - Topo do Fujacal: the Rua do Fujacal by the race's start, round the block of flats standing alone
//   in its loop of street, the houses south-west of it, and the Rua Conselheiro Lobato below.
// - Doutor José Vilaça: the end of the Rua Doutor José Vilaça's driveway and the courtyard of the
//   flats round it, the houses along the Rua Monsenhor Airosa, and that street.
// - Santa Justa: the Rua de Santa Justa between its flats and the long block by the river, down to
//   the Ecovia; its edge on the south is the shooter's area's, the river's near bank.
//
// Drawn on the map as it was at 1.30.0; a building the edge runs through stays whole and shut.
export const ARENAS = [
  {
    id: 'topo',
    name: 'Topo do Fujacal',
    pts: [[118, 787], [182, 787], [184, 868], [182, 880], [118, 895]],
  },
  {
    id: 'vilaca',
    name: 'Doutor José Vilaça',
    pts: [[-345, 902], [-300, 902], [-268, 906], [-268, 985], [-345, 985]],
  },
  {
    id: 'santa-justa',
    name: 'Santa Justa',
    pts: [[-385, 1018], [-298, 1018], [-298, 1076], [-345, 1080], [-385, 1070]],
  },
];
