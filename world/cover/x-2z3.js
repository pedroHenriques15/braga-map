// Made by tools/cover.mjs: what the ground is on tile x-2z3 (task 016), from DGT's 2025 LiDAR and orthophoto, and the cars
// its LiDAR saw parked there: in cars.json, each [x, z, angle, length, width, where (0 other, 1 kerb, 2 park)].
export default {
  tile: 'x-2z3', box: { x0: -1000, z0: 1500, x1: -500, z1: 2000 },
  classes: { high: { url: new URL('./x-2z3/classes-high.webp', import.meta.url).href, w: 1000, h: 1000, bytes: 79302 },
    medium: { url: new URL('./x-2z3/classes-medium.webp', import.meta.url).href, w: 500, h: 500, bytes: 31336 },
    low: { url: new URL('./x-2z3/classes-low.webp', import.meta.url).href, w: 250, h: 250, bytes: 12046 } },
  colour: { high: { url: new URL('./x-2z3/colour-high.webp', import.meta.url).href, w: 128, h: 1152, bytes: 20994, squares: 125 },
    medium: { url: new URL('./x-2z3/colour-medium.webp', import.meta.url).href, w: 112, h: 1008, bytes: 16134, squares: 100 },
    low: { url: new URL('./x-2z3/colour-low.webp', import.meta.url).href, w: 64, h: 576, bytes: 6802, squares: 50 } },
  cars: { url: new URL('./x-2z3/cars.json', import.meta.url).href, n: 988, bytes: 27657 },
  credit: { source: 'DGT', author: 'Direção-Geral do Território', licence: 'CC BY 4.0', url: 'https://snig.dgterritorio.gov.pt/rndg/srv/por/catalog.search#/metadata/96d83932-f957-40d6-a2ea-3a25751c4b2d', date: '2025' },
};
