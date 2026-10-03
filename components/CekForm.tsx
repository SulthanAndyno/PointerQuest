"use client";

import { useState, type DragEvent, type FormEvent } from "react";
import { readText } from "@/lib/png.ts";
import { check, download, parseText, toCsv, type ResultRecord } from "@/lib/result.ts";
import { isScoreConsistent, makeCode } from "@/lib/verify.ts";
import { PixelIcon } from "./PixelIcon";

const MAX_BYTES = 5_000_000; // PNG kartu skor ±200–800 KB

type Row = { file: string; rec: ResultRecord | null; valid: boolean; consistent: boolean };

const status = (r: Row) => (!r.rec ? "BUKAN FILE HASIL" : !r.valid ? "TIDAK VALID" : !r.consistent ? "SKOR JANGGAL" : "VALID");

function Bulk() {
  const [rows, setRows] = useState<Row[]>([]);
  const [drag, setDrag] = useState(false);

  async function add(files: FileList | null) {
    if (!files) return;
    const next: Row[] = [];
    for (const f of Array.from(files)) {
      let rec: ResultRecord | null = null;
      if (f.size <= MAX_BYTES) {
        const bytes = new Uint8Array(await f.arrayBuffer());
        const text = readText(bytes) ?? (f.name.endsWith(".txt") ? new TextDecoder().decode(bytes) : null);
        rec = text ? parseText(text) : null;
      }
      next.push({ file: f.name, rec, ...(rec ? check(rec) : { valid: false, consistent: false }) });
    }
    setRows((old) => [...old, ...next]);
  }

  function onDrop(e: DragEvent) {
    e.preventDefault();
    setDrag(false);
    void add(e.dataTransfer.files);
  }

  const sorted = [...rows].sort((a, b) =>
    Number(!a.rec) - Number(!b.rec) || // file rusak di bawah
    (a.rec?.kelas ?? "").localeCompare(b.rec?.kelas ?? "") ||
    (a.rec?.nim ?? "").localeCompare(b.rec?.nim ?? ""),
  );
  const ok = rows.filter((r) => status(r) === "VALID").length;

  return (
    <section className="flex flex-col gap-4" aria-labelledby="bulk">
      <h2 id="bulk" className="font-pixel text-[12px] text-ember">
        1 · CEK FILE HASIL (BANYAK SEKALIGUS)
      </h2>
      <label
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={onDrop}
        className={`px-panel flex cursor-pointer flex-col items-center gap-3 p-8 text-center ${drag ? "!bg-stone-3" : ""}`}
      >
        <PixelIcon name="upload" size={28} className="text-ember" />
        <span className="text-[21px]">
          Seret semua file <code className="font-code text-[16px] text-ember">PointerQuest_*.png</code> ke sini, atau klik untuk memilih.
        </span>
        <input type="file" accept=".png,image/png,.txt,text/plain" multiple className="sr-only" onChange={(e) => void add(e.target.files)} />
      </label>

      {rows.length > 0 && (
        <>
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-[20px]" role="status">
              {rows.length} file · <span className="text-ok">{ok} valid</span> ·{" "}
              <span className="text-bad">{rows.length - ok} perlu dicek</span>
            </p>
            <button
              type="button"
              className="px-btn ml-auto flex items-center gap-2 px-4 py-2 font-pixel text-[10px] text-ok"
              onClick={() =>
                download(
                  `rekap-pointer-quest-${new Date().toISOString().slice(0, 10)}.csv`,
                  toCsv(sorted.filter((r) => r.rec).map((r) => ({ ...r.rec!, status: status(r) }))),
                  "text/csv;charset=utf-8",
                )
              }
            >
              <PixelIcon name="download" size={14} />
              EKSPOR CSV
            </button>
            <button type="button" className="px-btn px-4 py-2 font-pixel text-[10px] text-dim" onClick={() => setRows([])}>
              BERSIHKAN
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] border-collapse text-left text-[19px]">
              <thead className="font-pixel text-[9px] text-dim">
                <tr>
                  {["NAMA", "NIM", "KELAS", "SKOR", "BENAR", "HINT", "KE-", "WAKTU", "STATUS"].map((h) => (
                    <th key={h} className="border-b-2 border-stone-3 px-2 py-2">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sorted.map((r, i) => {
                  const st = status(r);
                  return (
                    <tr key={i} className="border-b border-stone-3/60">
                      {r.rec ? (
                        <>
                          <td className="px-2 py-1.5">{r.rec.nama}</td>
                          <td className="px-2 py-1.5 font-code text-[15px]">{r.rec.nim}</td>
                          <td className="px-2 py-1.5 font-code text-[15px]">{r.rec.kelas}</td>
                          <td className="px-2 py-1.5 text-ember">{r.rec.skor}</td>
                          <td className="px-2 py-1.5">{r.rec.benar}</td>
                          <td className="px-2 py-1.5">{r.rec.hint}</td>
                          <td className={`px-2 py-1.5 ${r.rec.percobaan > 1 ? "text-torch" : ""}`}>{r.rec.percobaan}</td>
                          <td className="px-2 py-1.5">{r.rec.durasi}</td>
                        </>
                      ) : (
                        <td colSpan={8} className="px-2 py-1.5 text-dim">
                          {r.file}
                        </td>
                      )}
                      <td className={`px-2 py-1.5 ${st === "VALID" ? "text-ok" : "text-bad"}`}>
                        <span className="flex items-center gap-2 font-pixel text-[9px]">
                          <PixelIcon name={st === "VALID" ? "check" : "cross"} size={10} />
                          {st}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="text-[17px] text-dim">
            Percobaan ke-2 dst. ditandai oranye. “Skor janggal” = kode cocok tapi angka skor tidak masuk akal.
          </p>
        </>
      )}
    </section>
  );
}

const FIELDS = [
  { key: "nama", label: "Nama", mode: "text" },
  { key: "nim", label: "NIM", mode: "numeric" },
  { key: "kelas", label: "Kelas", mode: "text" },
  { key: "skor", label: "Skor", mode: "numeric" },
  { key: "benar", label: "Jumlah benar", mode: "numeric" },
  { key: "hint", label: "Hint dipakai", mode: "numeric" },
  { key: "percobaan", label: "Percobaan ke-", mode: "numeric" },
  { key: "kode", label: "Kode verifikasi", mode: "text" },
] as const;

type Key = (typeof FIELDS)[number]["key"];

function Manual() {
  const [v, setV] = useState<Record<Key, string>>({ nama: "", nim: "", kelas: "", skor: "", benar: "", hint: "", percobaan: "1", kode: "" });
  const [res, setRes] = useState<{ valid: boolean; consistent: boolean } | null>(null);

  function onCheck(e: FormEvent) {
    e.preventDefault();
    const n = (k: Key) => Number(v[k]);
    const input = { nama: v.nama, nim: v.nim, kelas: v.kelas, skor: n("skor"), benar: n("benar"), hint: n("hint"), percobaan: n("percobaan") };
    const numsOk = [input.skor, input.benar, input.hint, input.percobaan].every((x) => Number.isInteger(x) && x >= 0);
    setRes({
      valid: numsOk && makeCode(input) === v.kode.trim().toUpperCase(),
      consistent: numsOk && isScoreConsistent(input.skor, input.benar, input.hint),
    });
  }

  return (
    <section className="flex flex-col gap-4" aria-labelledby="manual">
      <h2 id="manual" className="font-pixel text-[12px] text-ember">
        2 · CEK MANUAL DARI SCREENSHOT
      </h2>
      <form onSubmit={onCheck} className="px-panel grid grid-cols-1 gap-4 p-5 sm:grid-cols-2">
        {FIELDS.map((f) => (
          <label key={f.key} className="flex flex-col gap-1">
            <span>{f.label}</span>
            <input
              className="px-input px-3 py-2 font-code text-[17px] text-bone"
              inputMode={f.mode}
              value={v[f.key]}
              maxLength={60}
              required
              onChange={(e) => {
                setRes(null);
                setV({ ...v, [f.key]: e.target.value });
              }}
            />
          </label>
        ))}
        <button type="submit" className="px-btn self-end justify-self-start px-5 py-3 font-pixel text-[11px] text-ember">
          CEK
        </button>
      </form>
      {res && (
        <div role="status" className="px-panel flex flex-col gap-2 p-5 text-[22px]">
          <p className={`flex items-center gap-2 ${res.valid ? "text-ok" : "text-bad"}`}>
            <PixelIcon name={res.valid ? "check" : "cross"} size={14} />
            {res.valid ? "VALID" : "TIDAK VALID: data di SS kemungkinan diedit (atau salah ketik)"}
          </p>
          <p className={`flex items-center gap-2 ${res.consistent ? "text-ok" : "text-bad"}`}>
            <PixelIcon name={res.consistent ? "check" : "cross"} size={14} />
            {res.consistent ? "Skor konsisten dengan jumlah benar & hint" : "Skor tidak konsisten dengan jumlah benar & hint"}
          </p>
        </div>
      )}
    </section>
  );
}

export function CekForm() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-10 px-4 py-10">
      <header className="flex flex-col gap-2">
        <h1 className="flex items-center gap-3 font-pixel text-[16px] text-ember">
          <PixelIcon name="search" size={18} />
          CEK HASIL PRAKTIKAN
        </h1>
        <p className="text-[19px] text-dim">
          Semua pengecekan berjalan di browser ini saja — file tidak diunggah ke server mana pun.
        </p>
      </header>
      <Bulk />
      <Manual />
    </main>
  );
}
