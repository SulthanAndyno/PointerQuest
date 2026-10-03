"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import { Sprite } from "./Sprite";

export const NAME_RE = /^[\p{L}\s.'-]{3,60}$/u;
export const NIM_RE = /^\d{8,15}$/;
export const KELAS = ["25-01", "25-02", "25-03", "25-04", "25-05", "25-06"];

type Props = { attempt: number; onStart: (nama: string, nim: string, kelas: string) => void };

const RULES: ReactNode[] = [
  <>Sepuluh ruangan adalah sepuluh node. Jawaban benar membuka pintu <code className="font-code text-[0.8em]">next</code> menuju ruangan berikutnya.</>,
  <>Jawaban benar bernilai <b>10 poin</b>. Bila dibantu Peta Kuno, nilainya <b>5</b>. Salah atau kehabisan waktu bernilai <b>0</b>.</>,
  <>Peta Kuno (hint) hanya dapat dibuka sekali di setiap ruangan.</>,
  <>Kamu membawa <b>3 nyawa</b>. Salah atau kehabisan waktu mengambil satu; tiga jawaban benar beruntun memulihkan satu.</>,
  <>Tanpa nyawa, dungeon menjadi gelap dan Peta Kuno terkunci — namun perjalanan tetap berlanjut hingga NULL.</>,
  <>Obor ruangan biasa menyala <b>30 detik</b>, obor ruang boss <b>90 detik</b>.</>,
  <>Kunci jawaban tidak akan pernah diperlihatkan. Memuat ulang halaman tidak mengulang perjalanan.</>,
  <>Di gerbang NULL, klik <b>SIMPAN HASIL</b> lalu upload file PNG-nya ke form quiz.</>,
];
const ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII"];

function Field(props: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  error: string | false;
  placeholder?: string;
  mono?: boolean;
  inputMode?: "numeric" | "text";
  autoComplete?: string;
  maxLength: number;
}) {
  return (
    <label className="flex flex-col gap-1.5" htmlFor={props.id}>
      <span className="font-pixel text-[10px] tracking-wider text-dim">{props.label}</span>
      <input
        id={props.id}
        className={`px-input px-3 py-2 text-bone placeholder:text-dim/40 ${props.mono ? "font-code text-[18px]" : "text-[22px]"}`}
        value={props.value}
        placeholder={props.placeholder}
        onChange={(e) => props.onChange(e.target.value)}
        inputMode={props.inputMode}
        autoComplete={props.autoComplete ?? "off"}
        maxLength={props.maxLength}
        required
        aria-invalid={!!props.error}
        aria-describedby={`${props.id}-err`}
      />
      <span id={`${props.id}-err`} className="min-h-5 text-[17px] text-bad">
        {props.error || ""}
      </span>
    </label>
  );
}

export function StartScreen({ attempt, onStart }: Props) {
  const [nama, setNama] = useState("");
  const [nim, setNim] = useState("");
  const [kelas, setKelas] = useState("");
  const namaOk = NAME_RE.test(nama.trim());
  const nimOk = NIM_RE.test(nim);
  const kelasOk = KELAS.includes(kelas);
  const ok = namaOk && nimOk && kelasOk;

  function submit(e: FormEvent) {
    e.preventDefault();
    if (ok) onStart(nama, nim, kelas);
  }

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col items-center gap-10 px-4 py-8 sm:py-12">
      <header className="flex w-full flex-col items-center gap-3 text-center">
        <div className="flex items-end justify-center gap-5 sm:gap-10" aria-hidden>
          <Sprite name="torch" scale={4} fps={9} />
          <Sprite name="knight" scale={4} />
          <Sprite name="bigDemon" scale={3} />
          <Sprite name="torch" scale={4} fps={9} style={{ animationDelay: "-0.3s" }} />
        </div>
        <h1 className="mt-2 font-pixel text-[26px] leading-tight text-ember drop-shadow-[4px_4px_0_#000] sm:text-[46px]">
          POINTER QUEST
        </h1>
        <p className="font-pixel text-[10px] tracking-[0.35em] text-torch sm:text-[12px]">ESCAPE TO NULL</p>
        <p className="font-code text-[13px] text-dim">
          HEAD → [R1|•] → [R2|•] → … → [R10|•] → <span className="text-bad">NULL</span>
        </p>
      </header>

      <div className="grid w-full grid-cols-1 items-start gap-10 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
        {/* gulungan peraturan */}
        <section aria-labelledby="aturan" className="scroll">
          <div className="scroll-rod" />
          <div className="scroll-paper px-6 pt-6 pb-7 sm:px-10">
            <div className="-mt-1 mb-4 flex justify-center">
              <h2 id="aturan" className="plaque">PERATURAN QUEST</h2>
            </div>
            <p className="mb-4 text-center text-[20px] leading-snug italic">
              Wahai petualang — pointer <b>p</b> akan membawamu dari HEAD hingga NULL. Patuhi hukum dungeon berikut.
            </p>
            <ol className="flex flex-col gap-2.5">
              {RULES.map((r, i) => (
                <li key={i} className="grid grid-cols-[3.4rem_1fr] text-[20px] leading-snug">
                  <span className="ink-red pt-1 font-pixel text-[10px]">{ROMAN[i]}.</span>
                  <span>{r}</span>
                </li>
              ))}
            </ol>
            <p className="mt-5 text-right text-[19px] italic opacity-80">— Penjaga Dungeon</p>
          </div>
          <div className="scroll-rod" />
        </section>

        {/* registrasi petualang */}
        <form onSubmit={submit} className="px-panel flex flex-col gap-3 p-5 sm:p-7" noValidate>
          <div className="mb-2 flex justify-center">
            <h2 className="plaque">DAFTAR PETUALANG</h2>
          </div>
          <Field
            id="nama"
            label="NAMA LENGKAP"
            value={nama}
            onChange={(v) => setNama(v.slice(0, 60))}
            error={nama !== "" && !namaOk && "Minimal 3 huruf, tanpa angka atau simbol."}
            autoComplete="name"
            maxLength={60}
          />
          <Field
            id="nim"
            label="NIM"
            value={nim}
            onChange={(v) => setNim(v.replace(/\D/g, "").slice(0, 15))}
            error={nim !== "" && !nimOk && "NIM berupa 8–15 digit angka."}
            inputMode="numeric"
            mono
            maxLength={15}
          />
          <label className="flex flex-col gap-1.5" htmlFor="kelas">
            <span className="font-pixel text-[10px] tracking-wider text-dim">KELAS</span>
            <select
              id="kelas"
              className="px-input px-3 py-2 font-code text-[18px] text-bone"
              value={kelas}
              onChange={(e) => setKelas(e.target.value)}
              required
            >
              <option value="" disabled>
                Pilih kelas…
              </option>
              {KELAS.map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
            </select>
            <span className="min-h-5" />
          </label>

          {attempt > 1 && (
            <p className="border-l-4 border-torch bg-torch/10 px-3 py-2 text-[19px] text-torch">
              Perjalanan ini akan tercatat sebagai <b>Percobaan ke-{attempt}</b>.
            </p>
          )}

          <button
            type="submit"
            disabled={!ok}
            className="px-btn mt-2 flex items-center justify-center gap-3 px-6 py-4 font-pixel text-[12px] text-ember disabled:text-dim/50"
          >
            <Sprite name="goldSword" scale={2} className={ok ? "" : "opacity-40 grayscale"} />
            MASUK DUNGEON
          </button>
        </form>
      </div>

    </main>
  );
}
