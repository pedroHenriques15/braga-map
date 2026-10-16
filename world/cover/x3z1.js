// Made by tools/cover.mjs: what the ground is on tile x3z1 (task 016), from DGT's 2025 LiDAR and orthophoto, and the cars
// its LiDAR saw parked there: in cars.json, each [x, z, angle, length, width, where (0 other, 1 kerb, 2 park)].
export default {
  tile: 'x3z1', box: { x0: 1500, z0: 500, x1: 2000, z1: 1000 },
  classes: { high: { url: new URL('./x3z1/classes-high.webp', import.meta.url).href, w: 1000, h: 1000, bytes: 64724 },
    medium: { url: new URL('./x3z1/classes-medium.webp', import.meta.url).href, w: 500, h: 500, bytes: 25396 },
    low: { url: new URL('./x3z1/classes-low.webp', import.meta.url).href, w: 250, h: 250, bytes: 9904 } },
  colour: { high: { url: new URL('./x3z1/colour-high.webp', import.meta.url).href, w: 128, h: 1152, bytes: 19286, squares: 125 },
    medium: { url: new URL('./x3z1/colour-medium.webp', import.meta.url).href, w: 112, h: 1008, bytes: 14530, squares: 100 },
    low: { url: new URL('./x3z1/colour-low.webp', import.meta.url).href, w: 64, h: 576, bytes: 6120, squares: 50 } },
  cars: { url: new URL('./x3z1/cars.json', import.meta.url).href, n: 647, bytes: 17266 },
  credit: { source: 'DGT', author: 'Direção-Geral do Território', licence: 'CC BY 4.0', url: 'https://snig.dgterritorio.gov.pt/rndg/srv/por/catalog.search#/metadata/96d83932-f957-40d6-a2ea-3a25751c4b2d', date: '2025' },
};
