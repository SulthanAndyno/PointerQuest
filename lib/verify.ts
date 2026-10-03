// ponytail: kode ini hanya penghalang ringan. SALT ikut ter-bundle ke client,
// jadi praktikan yang membongkar JS tetap bisa membuat kode valid. Upgrade path:
// tanda tangan HMAC di server (butuh backend).
const SALT = "pq-sll-2526";

export type CodeInput = {
  nama: string;
  nim: string;
  kelas: string;
  skor: number;
  benar: number;
  hint: number;
  percobaan: number;
};

export const normalizeName = (nama: string) => nama.trim().replace(/\s+/g, " ").toLowerCase();
export const normalizeKelas = (kelas: string) => kelas.trim().toUpperCase();

function fnv1a(str: string): number {
  let h = 0x811c9dc5;
  for (const byte of new TextEncoder().encode(str)) {
    h ^= byte;
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}

export function makeCode(i: CodeInput): string {
  const raw = [normalizeName(i.nama), i.nim.trim(), normalizeKelas(i.kelas), i.skor, i.benar, i.hint, i.percobaan, SALT].join("|");
  return fnv1a(raw).toString(36).toUpperCase().padStart(6, "0").slice(-6);
}

/** Cek konsistensi angka di SS tanpa tahu hint mana yang dipakai pada jawaban benar. */
export function isScoreConsistent(skor: number, benar: number, hint: number): boolean {
  return (
    Number.isInteger(skor) &&
    skor % 5 === 0 &&
    benar >= 0 &&
    benar <= 10 &&
    hint >= 0 &&
    hint <= 10 &&
    skor <= benar * 10 &&
    skor >= benar * 10 - hint * 5
  );
}
