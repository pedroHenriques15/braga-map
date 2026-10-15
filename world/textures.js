// Made by tools/textures.mjs: a loader for each tile's photo textures (task 007), so a game only
// downloads the index of those it loads; and every source they're made from, with its authors.
export const TEXTURES = {
  'x-1z1': () => import('./textures/x-1z1.js'),
  'x0z1': () => import('./textures/x0z1.js'),
  'x0z2': () => import('./textures/x0z2.js'),
  'x2z2': () => import('./textures/x2z2.js'),
};
export const CREDITS = [
  { source: 'DGT', licence: 'CC BY 4.0', authors: ['Direção-Geral do Território'], kinds: ['ground'] },
  { source: 'Mapillary', licence: 'CC BY-SA 4.0', authors: ['apires', 'stuckstick', 'waldyrious'], kinds: ['facade'] },
];
