// Compressing the world's photo textures (decision 030), for textures.mjs and cover.mjs: KTX2 files
// in Basis Universal's ETC1S, which a phone's graphics card keeps compressed, sRGB, with their mipmaps.
import fs from 'node:fs';
import sharp from 'sharp';
import { encodeToKTX2 } from 'ktx2-encoder';

// ETC1S's quality, 1 to 255: where it stops getting closer to the photo. Over Basis's default, 128,
// it's 0.9–1.6 dB closer for some 40% more bytes; above 200, 0.2 dB at most (task 007's notes).
export const QUALITY = 200;

// A KTX2 file of an RGB image ({ w, h, data } with three bytes a pixel, or four with `channels: 4`, its
// alpha last), Basis's ETC1S (or UASTC, with Zstandard), with its mipmaps, sRGB.
export async function ktx2(img, uastc = false) {
  const ch = img.channels ?? 3, rgba = Buffer.alloc(img.w * img.h * 4);
  for (let i = 0, j = 0; i < img.w * img.h * ch; i += ch, j += 4) { rgba[j] = img.data[i]; rgba[j + 1] = img.data[i + 1]; rgba[j + 2] = img.data[i + 2]; rgba[j + 3] = ch === 4 ? img.data[i + 3] : 255; }
  // The encoder prints each mipmap it makes; this keeps the console to what's made.
  const write = process.stdout.write;
  process.stdout.write = () => true;
  try {
    const out = await encodeToKTX2(new Uint8Array(1), {
      isUASTC: uastc, qualityLevel: QUALITY, compressionLevel: 2, needSupercompression: uastc, uastcLDRQualityLevel: 1,
      generateMipmap: true, isPerceptual: true, isSetKTX2SRGBTransferFunc: true, isKTX2File: true,
      imageDecoder: async () => ({ width: img.w, height: img.h, data: new Uint8Array(rgba.buffer, rgba.byteOffset, rgba.length) }),
    });
    return Buffer.from(out);
  } finally {
    process.stdout.write = write;
  }
}

// An RGB (or RGBA) image at another size, as sharp's Lanczos has it.
export async function resize(img, w, h) {
  if (w === img.w && h === img.h) return img;
  const channels = img.channels ?? 3;
  const { data, info } = await sharp(img.data, { raw: { width: img.w, height: img.h, channels } }).resize(w, h, { fit: 'fill', kernel: 'lanczos3' }).raw().toBuffer({ resolveWithObject: true });
  return { w: info.width, h: info.height, data, ...(channels === 4 ? { channels } : {}) };
}

// A KTX2 file's size in pixels, from its header.
export function ktx2Size(file) {
  const b = fs.readFileSync(file);
  return { w: b.readUInt32LE(20), h: b.readUInt32LE(24), bytes: b.length };
}

// Sizes that Basis's 4 × 4 blocks divide.
export const four = (n) => Math.max(4, Math.round(n / 4) * 4);

// A value as JavaScript, as the world's other modules write it: single quotes, no quotes on keys.
export const js = (v) =>
  typeof v === 'string'
    ? `'${v.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`
    : Array.isArray(v)
      ? `[${v.map(js).join(', ')}]`
      : v && typeof v === 'object'
        ? `{ ${Object.entries(v).map(([k, x]) => `${k}: ${js(x)}`).join(', ')} }`
        : String(v);
