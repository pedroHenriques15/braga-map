// Made by tools/textures.mjs: the photo textures on tile x-1z1, each at every graphics level.
export default [
  { id: 'ground-x-1z1', kind: 'ground', box: { x0: -500, z0: 500, x1: 0, z1: 1000 },
    files: { high: { url: new URL('./x-1z1/ground-x-1z1-high.ktx2', import.meta.url).href, w: 2048, h: 2048, bytes: 911454 },
      medium: { url: new URL('./x-1z1/ground-x-1z1-medium.ktx2', import.meta.url).href, w: 1024, h: 1024, bytes: 260038 },
      low: { url: new URL('./x-1z1/ground-x-1z1-low.ktx2', import.meta.url).href, w: 512, h: 512, bytes: 86058 } },
    credit: { source: 'DGT', author: 'Direção-Geral do Território', licence: 'CC BY 4.0', url: 'https://snig.dgterritorio.gov.pt/rndg/srv/por/catalog.search#/metadata/96d83932-f957-40d6-a2ea-3a25751c4b2d', date: '2025' } },
  { id: 'facade-way-440182287', kind: 'facade', wall: [[-85.5, 693], [-91.5, 695]], s: [0, 6.32], y: [9.6, 19.6],
    files: { high: { url: new URL('./x-1z1/facade-way-440182287-high.ktx2', import.meta.url).href, w: 252, h: 400, bytes: 30414 },
      medium: { url: new URL('./x-1z1/facade-way-440182287-medium.ktx2', import.meta.url).href, w: 128, h: 200, bytes: 8943 },
      low: { url: new URL('./x-1z1/facade-way-440182287-low.ktx2', import.meta.url).href, w: 64, h: 100, bytes: 2998 } },
    credit: { source: 'Mapillary', author: 'waldyrious', licence: 'CC BY-SA 4.0', url: 'https://www.mapillary.com/app/?pKey=375719327094032', date: '2018-03-18' } },
  { id: 'facade-way-440314428', kind: 'facade', wall: [[-165, 771], [-159.5, 769]], s: [0, 5.85], y: [8.1, 20.9],
    files: { high: { url: new URL('./x-1z1/facade-way-440314428-high.ktx2', import.meta.url).href, w: 236, h: 512, bytes: 39508 },
      medium: { url: new URL('./x-1z1/facade-way-440314428-medium.ktx2', import.meta.url).href, w: 120, h: 256, bytes: 11569 },
      low: { url: new URL('./x-1z1/facade-way-440314428-low.ktx2', import.meta.url).href, w: 60, h: 128, bytes: 3759 } },
    credit: { source: 'Mapillary', author: 'apires', licence: 'CC BY-SA 4.0', url: 'https://www.mapillary.com/app/?pKey=754014825289658', date: '2019-03-13' } },
];
