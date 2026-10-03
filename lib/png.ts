// Sisipkan/baca teks di chunk tEXt PNG — data hasil ikut tersimpan di gambar kartu skor
// sehingga /cek bisa memverifikasi PNG tanpa server.

const KEYWORD = "PointerQuest";
const SIG = [137, 80, 78, 71, 13, 10, 26, 10];

const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});

function crc32(bytes: Uint8Array): number {
  let c = 0xffffffff;
  for (const b of bytes) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

const isPng = (b: Uint8Array) => SIG.every((v, i) => b[i] === v);

/** Tambahkan chunk tEXt sebelum IEND. Nilai di-encodeURIComponent supaya tetap ASCII/Latin-1. */
export function addText(png: Uint8Array, text: string): Uint8Array {
  if (!isPng(png)) throw new Error("bukan PNG");
  const data = new TextEncoder().encode(`${KEYWORD}\0${encodeURIComponent(text)}`);
  const typeAndData = new Uint8Array(4 + data.length);
  typeAndData.set(new TextEncoder().encode("tEXt"));
  typeAndData.set(data, 4);
  const chunk = new Uint8Array(12 + data.length);
  const view = new DataView(chunk.buffer);
  view.setUint32(0, data.length);
  chunk.set(typeAndData, 4);
  view.setUint32(8 + data.length, crc32(typeAndData));
  const iend = png.length - 12; // IEND selalu chunk terakhir, panjang 12 byte
  const out = new Uint8Array(png.length + chunk.length);
  out.set(png.subarray(0, iend));
  out.set(chunk, iend);
  out.set(png.subarray(iend), iend + chunk.length);
  return out;
}

/** Baca teks dari chunk tEXt kita; null kalau tidak ada / rusak. */
export function readText(png: Uint8Array): string | null {
  if (!isPng(png)) return null;
  const view = new DataView(png.buffer, png.byteOffset, png.byteLength);
  const dec = new TextDecoder("latin1");
  for (let p = 8; p + 12 <= png.length; ) {
    const len = view.getUint32(p);
    const type = dec.decode(png.subarray(p + 4, p + 8));
    if (p + 12 + len > png.length) return null;
    if (type === "tEXt") {
      const body = dec.decode(png.subarray(p + 8, p + 8 + len));
      const sep = body.indexOf("\0");
      if (body.slice(0, sep) === KEYWORD) {
        try {
          return decodeURIComponent(body.slice(sep + 1));
        } catch {
          return null;
        }
      }
    }
    if (type === "IEND") return null;
    p += 12 + len;
  }
  return null;
}

export function dataUrlToBytes(url: string): Uint8Array {
  const bin = atob(url.slice(url.indexOf(",") + 1));
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}
