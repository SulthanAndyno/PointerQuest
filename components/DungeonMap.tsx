import { TOTAL_ROOMS } from "@/lib/game.ts";
import { PixelIcon } from "./PixelIcon";
import { Sprite } from "./Sprite";

type Props = {
  results: boolean[]; // hasil ruang yang sudah dilewati (true = benar)
  heroAt: number; // 0..TOTAL_ROOMS (TOTAL_ROOMS = NULL)
  walking: boolean;
};

const COLS = TOTAL_ROOMS + 2; // HEAD + 10 node + NULL

/** Peta dungeon = singly linked list: HEAD → [R1|next] → … → [R10|next] → NULL */
export function DungeonMap({ results, heroAt, walking }: Props) {
  const heroCol = heroAt + 1; // kolom 0 = HEAD
  return (
    <nav aria-label={`Peta dungeon, posisi pointer p di ruang ${Math.min(heroAt + 1, TOTAL_ROOMS)}`} className="px-panel relative z-10 px-2 pt-16 pb-7 sm:px-4">
      {/* karakter + pointer p */}
      <div
        className="absolute top-2 flex -translate-x-1/2 flex-col items-center transition-[left] duration-[600ms] ease-linear"
        style={{ left: `calc(${((heroCol + 0.5) / COLS) * 100}% )` }}
        aria-hidden
      >
        <Sprite name={walking ? "knightRun" : "knight"} scale={2} fps={walking ? 12 : 7} />
      </div>

      <ol className="grid items-center" style={{ gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))` }}>
        <li className="flex items-center justify-center font-pixel text-[7px] text-ember sm:text-[9px]">
          HEAD<span className="hidden sm:inline">→</span>
        </li>
        {Array.from({ length: TOTAL_ROOMS }, (_, i) => {
          const done = i < results.length;
          const active = i === heroAt;
          const tone = done
            ? results[i]
              ? "border-ok bg-ok/15 text-ok"
              : "border-bad bg-bad/15 text-bad"
            : active
              ? "border-ember bg-ember/15 text-ember shadow-[0_0_14px_rgb(255_207_90/0.55)]"
              : "border-stone-3 text-dim/60";
          const state = done ? (results[i] ? "benar" : "salah") : active ? "aktif" : "belum";
          return (
            <li key={i} className="relative flex items-center justify-center px-px">
              <div className={`flex border-2 font-pixel text-[8px] sm:text-[9px] ${tone}`} aria-label={`Ruang ${i + 1}: ${state}`}>
                <span className="grid min-w-5 place-items-center px-1 py-1 sm:px-1.5">
                  {done ? <PixelIcon name={results[i] ? "check" : "cross"} size={9} /> : i + 1}
                </span>
                <span className="hidden border-l-2 border-current px-1 py-1 sm:inline">•</span>
              </div>
              <span aria-hidden className="ml-0.5 hidden text-[14px] text-torch/80 lg:inline">
                →
              </span>
              {active && (
                <span className="absolute -bottom-6 font-code text-[13px] font-bold text-ember" aria-hidden>
                  ↑p
                </span>
              )}
            </li>
          );
        })}
        <li className="flex items-center justify-center font-pixel text-[7px] text-bad sm:text-[9px]">NULL</li>
      </ol>
    </nav>
  );
}
