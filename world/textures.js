// Made by tools/textures.mjs: a loader for each tile's photo textures (task 007), so a game only
// downloads the index of those it loads; each kind of ground's photo (task 016); and every source
// they're made from, with its authors.
export const TEXTURES = {
  'x-1z1': () => import('./textures/x-1z1.js'),
  'x0z1': () => import('./textures/x0z1.js'),
  'x0z2': () => import('./textures/x0z2.js'),
  'x2z2': () => import('./textures/x2z2.js'),
};
export const SURFACES = {
  asphalt: { id: 'surface-asphalt', metres: 4.04, mean: [135, 130, 127],
    files: { high: { url: new URL('./textures/surfaces/surface-asphalt-high.ktx2', import.meta.url).href, w: 1024, h: 1024, bytes: 217663 },
      medium: { url: new URL('./textures/surfaces/surface-asphalt-medium.ktx2', import.meta.url).href, w: 512, h: 512, bytes: 71705 },
      low: { url: new URL('./textures/surfaces/surface-asphalt-low.ktx2', import.meta.url).href, w: 256, h: 256, bytes: 19463 } },
    credit: { source: 'Poly Haven', author: 'Jenelle van Heerden, Sergej Majboroda', licence: 'CC0', url: 'https://polyhaven.com/a/asphalt_04', date: '2023-11-16' } },
  paving: { id: 'surface-paving', metres: 2, mean: [122, 111, 93],
    files: { high: { url: new URL('./textures/surfaces/surface-paving-high.ktx2', import.meta.url).href, w: 1024, h: 1024, bytes: 243385 },
      medium: { url: new URL('./textures/surfaces/surface-paving-medium.ktx2', import.meta.url).href, w: 512, h: 512, bytes: 78185 },
      low: { url: new URL('./textures/surfaces/surface-paving-low.ktx2', import.meta.url).href, w: 256, h: 256, bytes: 21412 } },
    credit: { source: 'Poly Haven', author: 'Rob Tuytel', licence: 'CC0', url: 'https://polyhaven.com/a/concrete_floor_01', date: '2018-07-16' } },
  setts: { id: 'surface-setts', metres: 2.4, mean: [123, 116, 100],
    files: { high: { url: new URL('./textures/surfaces/surface-setts-high.ktx2', import.meta.url).href, w: 1024, h: 1024, bytes: 234086 },
      medium: { url: new URL('./textures/surfaces/surface-setts-medium.ktx2', import.meta.url).href, w: 512, h: 512, bytes: 76797 },
      low: { url: new URL('./textures/surfaces/surface-setts-low.ktx2', import.meta.url).href, w: 256, h: 256, bytes: 21287 } },
    credit: { source: 'Poly Haven', author: 'Rob Tuytel', licence: 'CC0', url: 'https://polyhaven.com/a/cobblestone_floor_03', date: '2018-06-18' } },
  grass: { id: 'surface-grass', metres: 2.51, mean: [111, 97, 63],
    files: { high: { url: new URL('./textures/surfaces/surface-grass-high.ktx2', import.meta.url).href, w: 1024, h: 1024, bytes: 217302 },
      medium: { url: new URL('./textures/surfaces/surface-grass-medium.ktx2', import.meta.url).href, w: 512, h: 512, bytes: 70537 },
      low: { url: new URL('./textures/surfaces/surface-grass-low.ktx2', import.meta.url).href, w: 256, h: 256, bytes: 19202 } },
    credit: { source: 'Poly Haven', author: 'Charlotte Baglioni', licence: 'CC0', url: 'https://polyhaven.com/a/grass_ground', date: '2026-09-18' } },
  soil: { id: 'surface-soil', metres: 2.07, mean: [183, 140, 101],
    files: { high: { url: new URL('./textures/surfaces/surface-soil-high.ktx2', import.meta.url).href, w: 1024, h: 1024, bytes: 221463 },
      medium: { url: new URL('./textures/surfaces/surface-soil-medium.ktx2', import.meta.url).href, w: 512, h: 512, bytes: 71955 },
      low: { url: new URL('./textures/surfaces/surface-soil-low.ktx2', import.meta.url).href, w: 256, h: 256, bytes: 19767 } },
    credit: { source: 'Poly Haven', author: 'eye-candy.xyz', licence: 'CC0', url: 'https://polyhaven.com/a/dirt_floor', date: '2023-01-16' } },
  gravel: { id: 'surface-gravel', metres: 2, mean: [174, 170, 159],
    files: { high: { url: new URL('./textures/surfaces/surface-gravel-high.ktx2', import.meta.url).href, w: 1024, h: 1024, bytes: 241440 },
      medium: { url: new URL('./textures/surfaces/surface-gravel-medium.ktx2', import.meta.url).href, w: 512, h: 512, bytes: 77759 },
      low: { url: new URL('./textures/surfaces/surface-gravel-low.ktx2', import.meta.url).href, w: 256, h: 256, bytes: 21365 } },
    credit: { source: 'Poly Haven', author: 'Jenelle van Heerden, Dimitrios Savva', licence: 'CC0', url: 'https://polyhaven.com/a/gravel_floor_02', date: '2024-02-29' } },
};
export const CREDITS = [
  { source: 'Mapillary', licence: 'CC BY-SA 4.0', authors: ['apires', 'stuckstick', 'waldyrious'], kinds: ['facade'] },
  { source: 'Poly Haven', licence: 'CC0', authors: ['Charlotte Baglioni', 'Dimitrios Savva', 'Jenelle van Heerden', 'Rob Tuytel', 'Sergej Majboroda', 'eye-candy.xyz'], kinds: ['surface'] },
];
