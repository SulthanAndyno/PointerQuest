import { Fragment } from "react";
import type { Question } from "@/lib/questions.ts";
import { ListVisual } from "./ListVisual";
import { PixelIcon, type IconName } from "./PixelIcon";

export type Fx = "correct" | "wrong" | "timeout";

/** `kode` di dalam teks → <code>. Semua teks dirender sebagai teks (tanpa innerHTML). */
export function Rich({ text }: { text: string }) {
  return (
    <>
      {text.split("`").map((part, i) =>
        i % 2 ? (
          <code key={i} className="bg-stone-950 px-1 font-code text-[0.8em] text-ember">
            {part}
          </code>
        ) : (
          <Fragment key={i}>{part}</Fragment>
        ),
      )}
    </>
  );
}

const TOKEN = /(\bNil\b|\bNULL\b)|(\b\d+\b)|(->)|(\b[A-Za-z_]\w*(?=\())|([A-Za-z_]\w*)|(\s+|.)/g;

function CodeBlock({ code }: { code: string }) {
  return (
    <pre className="overflow-x-auto bg-stone-950 p-3 font-code text-[14px] leading-6 shadow-[inset_0_0_0_2px_var(--color-stone-3)] sm:text-[15px]">
      <code>
        {code.split("\n").map((line, n) => (
          <div key={n} className="whitespace-pre">
            <span className="mr-3 inline-block w-4 text-right text-dim/50 select-none">{n + 1}</span>
            {Array.from(line.matchAll(TOKEN), (m, i) => {
              const cls = m[1]
                ? "text-bad"
                : m[2]
                  ? "text-gold"
                  : m[3]
                    ? "text-torch"
                    : m[4]
                      ? "text-ice"
                      : m[5]
                        ? "text-bone"
                        : "text-dim";
              return (
                <span key={i} className={cls}>
                  {m[0]}
                </span>
              );
            })}
          </div>
        ))}
      </code>
    </pre>
  );
}

type Props = {
  q: Question;
  options: string[];
  hintOpen: boolean;
  canHint: boolean;
  darkMode: boolean;
  locked: boolean;
  picked: string | null;
  fx: Fx | null;
  onPick: (opt: string) => void;
  onHint: () => void;
};

const FX_TEXT: Record<Fx, string> = {
  correct: "PINTU TERBUKA!",
  wrong: "KENA JEBAKAN!",
  timeout: "OBORMU PADAM!",
};
const FX_ICON: Record<Fx, IconName> = { correct: "check", wrong: "cross", timeout: "hourglass" };

export function QuestionCard({ q, options, hintOpen, canHint, darkMode, locked, picked, fx, onPick, onHint }: Props) {
  const expert = q.level === "expert";
  return (
    <section className="px-panel relative z-30 flex flex-col gap-4 p-4 sm:p-5" aria-labelledby="soal">
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={`px-2 py-1 font-pixel text-[10px] text-stone-950 ${expert ? "bg-arcane" : "bg-ok"}`}
        >
          {expert ? "EXPERT" : "EASY"}
        </span>
        <span className="text-[19px] text-dim">
          <span className="mr-2 font-pixel text-[9px] tracking-wider">MATERI</span>
          <span className="text-bone">{q.label}</span>
        </span>
      </div>

      <h2 id="soal" className="text-[24px] leading-tight sm:text-[26px]">
        <Rich text={q.prompt} />
      </h2>

      {q.initialList && <ListVisual values={q.initialList} marker={q.marker} />}
      {q.code && <CodeBlock code={q.code} />}

      <div className="grid gap-3 sm:grid-cols-2" role="group" aria-label="Pilihan jawaban">
        {options.map((opt, i) => {
          const mine = picked === opt;
          const tone = mine && fx === "correct" ? "!bg-ok/25 ring-2 ring-ok" : mine && fx ? "!bg-bad/25 ring-2 ring-bad" : "";
          return (
            <button
              key={opt}
              type="button"
              disabled={locked}
              onClick={() => onPick(opt)}
              className={`px-btn flex min-h-12 items-center gap-3 px-3 py-2 text-left text-[21px] ${tone} ${locked && !mine ? "opacity-60" : ""}`}
            >
              <span className="grid size-7 shrink-0 place-items-center bg-stone-950 font-pixel text-[10px] text-ember">
                {String.fromCharCode(65 + i)}
              </span>
              <span className="min-w-0 break-words">
                <Rich text={opt} />
              </span>
              {mine && fx && (
                <PixelIcon name={fx === "correct" ? "check" : "cross"} size={14} className={`ml-auto ${fx === "correct" ? "text-ok" : "text-bad"}`} />
              )}
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap items-start gap-3">
        <button
          type="button"
          onClick={onHint}
          disabled={!canHint || locked}
          className="px-btn flex items-center gap-2 px-3 py-2 font-pixel text-[10px] leading-4 text-ember disabled:text-dim/50"
          aria-describedby="hint-note"
        >
          <PixelIcon name="map" size={14} />
          PETA KUNO (H)
        </button>
        <p id="hint-note" className="flex-1 text-[18px] text-dim">
          {hintOpen
            ? "Peta dibuka — poin maksimal soal ini jadi 5."
            : darkMode
              ? "Mode Gelap: Peta Kuno tidak bisa dipakai lagi."
              : "Pakai hint = poin maksimal soal ini turun jadi 5."}
        </p>
      </div>
      {hintOpen && (
        <div className="anim-rise scroll !px-3 !filter-none" role="note">
          <p className="scroll-paper flex items-start gap-3 px-5 py-3 text-[20px] leading-snug">
            <PixelIcon name="map" size={16} className="ink-red mt-1" />
            <span>
              <Rich text={q.hint} />
            </span>
          </p>
        </div>
      )}

      <p aria-live="assertive" className="sr-only">
        {fx ? FX_TEXT[fx] : ""}
      </p>
      {fx && (
        <div
          className={`anim-rise pointer-events-none absolute inset-x-0 -top-5 mx-auto flex w-max items-center gap-2 px-4 py-2 font-pixel text-[12px] shadow-[0_0_0_3px_#0a0810] ${
            fx === "correct" ? "bg-ok text-stone-950" : "bg-bad text-stone-950"
          }`}
          aria-hidden
        >
          <PixelIcon name={FX_ICON[fx]} size={12} />
          {FX_TEXT[fx]}
        </div>
      )}
    </section>
  );
}
