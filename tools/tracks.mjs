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
];
