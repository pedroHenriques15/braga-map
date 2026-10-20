// The kart tracks planned on the map, for track.mjs. Each is a loop through waypoints on Braga's
// streets:
// - `waypoints`: [{ id, x, z, egg?, rows? }] on the map, or 'private' for the ones kept in
//   .cache/places.json (the friends' houses, never committed), as { places, order? }. `egg` is
//   the easter egg on that house, and `rows: true` lines its street with houses (world.mjs).
// - `order` (or the private file's): the waypoints' ids in the order the loop takes them. Without
//   it, every order is tried.
// - `sections`: when given, the loop keeps to those sections' streets (sections.mjs).
// - `start`: the street the start line goes on, while the loop uses it.
// - `jump`: where the lip of the jump the owner approved is (decision 027): of the jumps kept, the
//   loop takes the one whose lip is nearest it, within 15 m, and fails if none is. Without it, the
//   jump that makes the cheapest loop.
// - `open`: the loop keeps to the open world's area (decision 019), and off its last 100 m where it
//   can.
// - `keepOff`: [[x, z, r]], places the loop keeps r metres from (no junction of its nearer).
// - `avoid`: the ids of tracks whose streets this one keeps off where it can: each metre of them
//   costs AVOID (2.5) times as much.
export const TRACKS = [
  {
    id: 'amigos',
    name: 'Volta dos Amigos',
    about: "Braga's real streets, through five friends' neighbourhoods, from the Rio Este to Lamaçães and round the Picoto.",
    waypoints: 'private',
    start: 'Rua do Fujacal',
    // The river jump, from the end of the Rua Professor Mota Leite over the Rio Este (task 039).
    jump: [-581.5, 1101.9],
  },
  // The second track (task 072): in the open world's area, keeping off the Volta's streets where a legal
  // loop can. Of the two loops planned, the one the owner kept and named (2026-10-19).
  {
    id: 'lamacaes',
    name: 'Volta de Lamaçães',
    about: "Braga's real streets east of the Avenida da Liberdade: round Santa Tecla and Lamaçães, and back under the Picoto.",
    open: true,
    avoid: ['amigos'],
    // The Rua Professor Machado Vilela's bend into the Rua Bernardo Sequeira, 3 m wide: eight karts
    // still together a kilometre from the start push each other through its inside.
    keepOff: [[966, 415, 12]],
    waypoints: [
      { id: 'rua-de-baixo', x: 914, z: 530 },
      { id: 'nascente', x: 1297, z: 618 },
      { id: 'afonso-palmeira', x: 1486, z: 512 },
      { id: 'jose-antonio-cruz-s', x: 1446, z: 997 },
      { id: 'machado-owen', x: 1214, z: 969 },
      { id: 'simoes-almeida', x: 1127, z: 1162 },
      { id: 'padre-francisco-almeida', x: 858, z: 1212 },
      { id: 'humberto-soeiro', x: 828, z: 1062 },
    ],
    order: ['rua-de-baixo', 'nascente', 'afonso-palmeira', 'jose-antonio-cruz-s', 'machado-owen', 'simoes-almeida', 'padre-francisco-almeida', 'humberto-soeiro'],
  },
];
