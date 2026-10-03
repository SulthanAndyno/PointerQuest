import { MAX_LIVES, TOTAL_ROOMS } from "@/lib/game.ts";
import { PixelIcon } from "./PixelIcon";
import { Sprite } from "./Sprite";

type Props = {
  lives: number;
  score: number;
  room: number; // 1-based
  remainingMs: number;
  totalMs: number;
  muted: boolean;
  onToggleMute: () => void;
  healPulse: number; // berubah tiap +1 nyawa → memicu animasi
};

export function Hud({ lives, score, room, remainingMs, totalMs, muted, onToggleMute, healPulse }: Props) {
  const secs = Math.ceil(remainingMs / 1000);
  const pct = Math.max(0, Math.min(100, (remainingMs / totalMs) * 100));
  const danger = secs <= 5;
  return (
    <header className="px-panel relative z-30 flex flex-wrap items-center gap-x-5 gap-y-3 px-4 py-3">
      <div className="flex items-center gap-1" role="img" aria-label={`Nyawa ${lives} dari ${MAX_LIVES}`}>
        {Array.from({ length: MAX_LIVES }, (_, i) => (
          <Sprite
            key={i < lives ? `f${i}-${healPulse}` : `e${i}`}
            name={i < lives ? "heartFull" : "heartEmpty"}
            scale={2}
            className={i === lives - 1 && healPulse > 0 ? "anim-heart" : ""}
          />
        ))}
      </div>

      <div className="font-pixel text-[11px] leading-5 text-dim">
        RUANG <span className="text-bone">{room}</span>/{TOTAL_ROOMS}
      </div>

      <div className="font-pixel text-[11px] leading-5 text-dim">
        SKOR <span className="text-ember">{score}</span>
      </div>

      <div className="flex min-w-[180px] flex-1 items-center gap-2" aria-live="off">
        <Sprite name="torch" scale={2} fps={danger ? 16 : 9} className={danger ? "anim-blink" : ""} />
        <div
          className="relative h-4 flex-1 bg-stone-950 shadow-[0_0_0_3px_#0a0810]"
          role="progressbar"
          aria-label="Sisa waktu"
          aria-valuemin={0}
          aria-valuemax={Math.round(totalMs / 1000)}
          aria-valuenow={secs}
        >
          <div
            className={`h-full transition-[width] duration-200 ease-linear ${
              danger ? "anim-blink bg-bad" : "bg-gradient-to-r from-torch to-ember"
            }`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className={`w-12 text-right font-pixel text-[12px] ${danger ? "text-bad" : "text-bone"}`}>{secs}s</span>
      </div>

      <button
        type="button"
        onClick={onToggleMute}
        className="px-btn grid size-10 place-items-center text-bone"
        aria-label={muted ? "Nyalakan suara" : "Matikan suara"}
        aria-pressed={muted}
      >
        <PixelIcon name={muted ? "mute" : "speaker"} size={16} />
      </button>
    </header>
  );
}
