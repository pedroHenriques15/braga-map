// Made by tools/cover.mjs: what the ground is on tile x4z0 (task 016), from DGT's 2025 LiDAR and orthophoto, and the cars
// its LiDAR saw parked there: in cars.json, each [x, z, angle, length, width, where (0 other, 1 kerb, 2 park)].
export default {
  tile: 'x4z0', box: { x0: 2000, z0: 0, x1: 2500, z1: 500 },
  classes: { high: { url: new URL('./x4z0/classes-high.webp', import.meta.url).href, w: 1000, h: 1000, bytes: 69336 },
    medium: { url: new URL('./x4z0/classes-medium.webp', import.meta.url).href, w: 500, h: 500, bytes: 26316 },
    low: { url: new URL('./x4z0/classes-low.webp', import.meta.url).href, w: 250, h: 250, bytes: 9638 } },
  colour: { high: { url: new URL('./x4z0/colour-high.webp', import.meta.url).href, w: 128, h: 1152, bytes: 18814, squares: 125 },
    medium: { url: new URL('./x4z0/colour-medium.webp', import.meta.url).href, w: 112, h: 1008, bytes: 14382, squares: 100 },
    low: { url: new URL('./x4z0/colour-low.webp', import.meta.url).href, w: 64, h: 576, bytes: 6002, squares: 50 } },
  cars: { url: new URL('./x4z0/cars.json', import.meta.url).href, n: 682, bytes: 18247 },
  credit: { source: 'DGT', author: 'Direção-Geral do Território', licence: 'CC BY 4.0', url: 'https://snig.dgterritorio.gov.pt/rndg/srv/por/catalog.search#/metadata/96d83932-f957-40d6-a2ea-3a25751c4b2d', date: '2025' },
};
