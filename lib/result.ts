import { correctCount, hintCount, score, type Session } from "./game.ts";
import { isScoreConsistent, makeCode } from "./verify.ts";

/** Isi file hasil yang diunduh praktikan dan diunggah asprak di /cek. */
export type ResultRecord = {
  nama: string;
  nim: string;
  kelas: string;
  skor: number;
  benar: number;
  hint: number;
  percobaan: number;
  nyawa: number;
  durasi: string; // mm:ss
  selesai: string; // ISO 8601
  kode: string;
};

const FIELDS: [keyof ResultRecord, string][] = [
  ["nama", "Nama"],
  ["nim", "NIM"],
  ["kelas", "Kelas"],
  ["skor", "Skor"],
  ["benar", "Benar"],
  ["hint", "Hint"],
  ["percobaan", "Percobaan"],
  ["nyawa", "Sisa nyawa"],
  ["durasi", "Waktu"],
  ["selesai", "Selesai"],
  ["kode", "Kode"],
];
const NUMERIC = new Set<keyof ResultRecord>(["skor", "benar", "hint", "percobaan", "nyawa"]);
const HEADER = "POINTER QUEST — HASIL QUIZ";

export function recordOf(s: Session): ResultRecord {
  const secs = Math.max(0, Math.round(((s.finishedAt ?? s.startedAt) - s.startedAt) / 1000));
  const r = {
    nama: s.nama,
    nim: s.nim,
    kelas: s.kelas,
    skor: score(s),
    benar: correctCount(s),
    hint: hintCount(s),
    percobaan: s.attempt,
    nyawa: s.lives,
    durasi: `${String(Math.floor(secs / 60)).padStart(2, "0")}:${String(secs % 60).padStart(2, "0")}`,
    selesai: new Date(s.finishedAt ?? 0).toISOString(),
  };
  return { ...r, kode: makeCode({ ...r }) };
}

export const toText = (r: ResultRecord) =>
  [HEADER, ...FIELDS.map(([k, label]) => `${label}: ${r[k]}`), ""].join("\n");

export const fileName = (r: ResultRecord) =>
  `PointerQuest_${r.kelas}_${r.nim}_${r.nama}`.replace(/[^\p{L}\p{N}_-]+/gu, "-").slice(0, 100) + ".txt";

/** Parser file hasil; data tidak lengkap/rusak → null. */
export function parseText(text: string): ResultRecord | null {
  if (!text.startsWith(HEADER)) return null;
  const map = new Map<string, string>();
  for (const line of text.split(/\r?\n/).slice(1)) {
    const i = line.indexOf(": ");
    if (i > 0) map.set(line.slice(0, i), line.slice(i + 2).trim());
  }
  const out: Record<string, string | number> = {};
  for (const [k, label] of FIELDS) {
    const v = map.get(label);
    if (v === undefined || v.length > 80) return null;
    if (NUMERIC.has(k)) {
      if (!/^\d{1,3}$/.test(v)) return null;
      out[k] = Number(v);
    } else out[k] = v;
  }
  return out as ResultRecord;
}

export function check(r: ResultRecord) {
  return {
    valid: makeCode(r) === r.kode.toUpperCase(),
    consistent: isScoreConsistent(r.skor, r.benar, r.hint),
  };
}

/** Sel CSV aman dari formula injection saat dibuka di Excel/Sheets. */
const cell = (v: string | number) => {
  let s = String(v);
  if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
  return `"${s.replace(/"/g, '""')}"`;
};

export function toCsv(rows: (ResultRecord & { status: string })[]) {
  const head = ["Nama", "NIM", "Kelas", "Skor", "Benar", "Hint", "Percobaan", "Waktu", "Selesai", "Kode", "Status"];
  const body = rows.map((r) =>
    [r.nama, r.nim, r.kelas, r.skor, r.benar, r.hint, r.percobaan, r.durasi, r.selesai, r.kode, r.status].map(cell).join(","),
  );
  return "﻿" + [head.map(cell).join(","), ...body].join("\r\n");
}

/** Unduh teks sebagai file lokal (tanpa server). */
export function download(name: string, text: string, type = "text/plain;charset=utf-8") {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
