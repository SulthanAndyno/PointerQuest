"use client";

import { useEffect, useRef, useState } from "react";
import {
  correctCount,
  hintCount,
  MAX_LIVES,
  score,
  tierOf,
  TOTAL_ROOMS,
  weakTopics,
  type Session,
  type Tier,
} from "@/lib/game.ts";
import { sfx } from "@/lib/sound.ts";
import { addText, dataUrlToBytes } from "@/lib/png.ts";
import { fileName, recordOf, toText } from "@/lib/result.ts";
import { PixelIcon } from "./PixelIcon";
import { Sprite, type SpriteName } from "./Sprite";

type TierStyle = {
  title: string;
  msg: string;
  text: string;
  ring: string;
  sprite: SpriteName;
  anim: string;
};

const TIERS: Record<Tier, TierStyle> = {
  legendary: {
    title: "LEGENDARY POINTER MASTER",
    msg: "SEMPURNA! Kamu menelusuri setiap node dari HEAD sampai NULL tanpa satu pun pointer yang tersesat. Linked list tunduk padamu!",
    text: "text-gold",
    ring: "shadow-[0_0_0_3px_#0a0810,0_0_0_6px_var(--color-gold),0_0_0_9px_#0a0810,0_0_40px_6px_rgb(255_213_74/0.35)]",
    sprite: "chest",
    anim: "anim-glint",
  },
  conqueror: {
    title: "DUNGEON CONQUEROR",
    msg: "Mantap! Kamu berhasil keluar dari dungeon dengan gagah. Sedikit lagi jadi legenda, cek lagi materi yang masih keliru ya!",
    text: "text-ice",
    ring: "shadow-[0_0_0_3px_#0a0810,0_0_0_6px_var(--color-ice),0_0_0_9px_#0a0810]",
    sprite: "goldSword",
    anim: "anim-glint",
  },
  survivor: {
    title: "SURVIVOR",
    msg: "Kamu selamat, tapi beberapa pointer masih nyasar di jalan. Pelajari lagi materi di bawah ini, kamu pasti bisa lebih baik!",
    text: "text-torch",
    ring: "shadow-[0_0_0_3px_#0a0810,0_0_0_6px_var(--color-torch),0_0_0_9px_#0a0810]",
    sprite: "knight",
    anim: "anim-wobble",
  },
  lost: {
    title: "LOST IN THE HEAP",
    msg: "Pointer-mu tersesat di memori... Jangan menyerah! Baca lagi materi dasar Singly Linked List lalu buktikan kamu bisa keluar!",
    text: "text-bad",
    ring: "shadow-[0_0_0_3px_#0a0810,0_0_0_6px_#7f1d1d,0_0_0_9px_#0a0810]",
    sprite: "skull",
    anim: "anim-fade-dark",
  },
};

const CONFETTI_COLORS = ["#ffd54a", "#ffcf5a", "#ff9f3a", "#fff3b0"];

type Props = { session: Session; muted: boolean; onToggleMute: () => void; onReplay: () => void };

export function ResultScreen({ session, muted, onToggleMute, onReplay }: Props) {
  const benar = correctCount(session);
  const tier = tierOf(benar);
  const t = TIERS[tier];
  const skor = score(session);
  const hint = hintCount(session);
  const topics = [...new Set(weakTopics(session))];
  const durasi = Math.max(0, Math.round(((session.finishedAt ?? 0) - session.startedAt) / 1000));
  const rec = recordOf(session);
  const kode = rec.kode;
  const selesai = new Date(session.finishedAt ?? 0).toLocaleString("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  // React StrictMode (dev) menjalankan efek dua kali — jingle cukup sekali
  const played = useRef(false);
  useEffect(() => {
    if (played.current) return;
    played.current = true;
    window.scrollTo(0, 0); // posisi scroll dari layar soal jangan terbawa ke kartu skor
    sfx.ending(tier);
  }, [tier]);

  const cardRef = useRef<HTMLDivElement>(null);
  const [saving, setSaving] = useState<"idle" | "busy" | "error">("idle");

  // Simpan kartu skor sebagai PNG; data hasil ikut disisipkan (chunk tEXt) untuk /cek
  async function savePng() {
    if (!cardRef.current || saving === "busy") return;
    setSaving("busy");
    try {
      const { domToPng } = await import("modern-screenshot");
      const url = await domToPng(cardRef.current, { scale: 2, backgroundColor: "#120f19" });
      const png = addText(dataUrlToBytes(url), toText(rec));
      const href = URL.createObjectURL(new Blob([png.slice()], { type: "image/png" }));
      const a = document.createElement("a");
      a.href = href;
      a.download = fileName(rec).replace(/\.txt$/, ".png");
      document.body.append(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(href), 1000);
      setSaving("idle");
    } catch {
      setSaving("error");
    }
  }

  function replay() {
    if (window.confirm(`Percobaan berikutnya akan tercatat sebagai Percobaan ke-${session.attempt + 1}. Lanjut?`)) onReplay();
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-xl flex-col items-center justify-center-safe gap-3 px-4 py-2">
      {tier === "legendary" &&
        Array.from({ length: 36 }, (_, i) => (
          <span
            key={i}
            aria-hidden
            className="confetti"
            style={{
              left: `${(i * 37) % 100}%`,
              background: CONFETTI_COLORS[i % 4],
              animationDuration: `${2.6 + ((i * 7) % 10) / 4}s`,
              animationDelay: `${-((i * 13) % 30) / 10}s`,
            }}
          />
        ))}
      {tier === "lost" && <div className="dark-vignette !z-0" aria-hidden />}

      {/* padding pembungkus supaya bingkai warna tier ikut tertangkap di PNG */}
      <div ref={cardRef} className="relative z-10 w-full p-3">
      <article
        className={`relative flex w-full flex-col gap-2 bg-stone p-4 sm:gap-3 sm:p-6 ${t.ring}`}
        aria-labelledby="tier-title"
      >
        <p className="text-center font-pixel text-[10px] tracking-widest text-dim">YOU ESCAPED! · POINTER QUEST</p>

        <div className="flex items-center justify-center gap-4">
          <div className={t.anim}>
            {tier === "legendary" ? (
              <div className="flex items-end gap-2">
                <Sprite name="goldSword" scale={2} />
                <Sprite name="chest" scale={3} once fps={4} />
                <Sprite name="goldSword" scale={2} style={{ transform: "scaleX(-1)" }} />
              </div>
            ) : (
              <Sprite name={t.sprite} scale={tier === "conqueror" ? 2 : 3} />
            )}
          </div>
        </div>

        <h1 id="tier-title" className={`text-center font-pixel text-[15px] leading-6 sm:text-[18px] ${t.text}`}>
          {t.title}
        </h1>
        <p className="text-center text-[18px] leading-tight sm:text-[19px]">{t.msg}</p>

        <div className="grid grid-cols-[auto_1fr] gap-x-3 border-y-2 border-stone-3 py-2 text-[19px]">
          <span className="text-dim">Nama</span>
          <span className="truncate font-bold">{session.nama}</span>
          <span className="text-dim">NIM</span>
          <span className="font-code text-[17px]">{session.nim}</span>
          <span className="text-dim">Kelas</span>
          <span className="font-code text-[17px]">{session.kelas}</span>
        </div>

        <div className="flex items-baseline justify-center gap-2">
          <span className="font-pixel text-[12px] text-dim">SKOR</span>
          <span className={`font-pixel text-[32px] leading-none sm:text-[40px] ${t.text}`}>{skor}</span>
          <span className="font-pixel text-[14px] text-dim">/100</span>
        </div>

        <dl className="grid grid-cols-3 gap-px bg-stone-3 text-center shadow-[0_0_0_2px_var(--color-stone-3)]">
          {[
            ["BENAR", `${benar}/${TOTAL_ROOMS}`],
            ["HINT", String(hint)],
            ["WAKTU", `${String(Math.floor(durasi / 60)).padStart(2, "0")}:${String(durasi % 60).padStart(2, "0")}`],
          ].map(([k, v]) => (
            <div key={k} className="bg-stone-950 px-2 py-1.5">
              <dt className="font-pixel text-[8px] tracking-wider text-dim">{k}</dt>
              <dd className="text-[22px] leading-tight">{v}</dd>
            </div>
          ))}
        </dl>
        <div className="flex items-center justify-between text-[18px]">
          <span className="flex items-center gap-1" role="img" aria-label={`Sisa nyawa ${session.lives} dari ${MAX_LIVES}`}>
            {Array.from({ length: MAX_LIVES }, (_, i) => (
              <Sprite key={i} name={i < session.lives ? "heartFull" : "heartEmpty"} scale={1.5} />
            ))}
          </span>
          <span>Percobaan ke-{session.attempt}</span>
        </div>

        <div className="text-[18px]">
          <p className="font-pixel text-[8px] tracking-wider text-dim">MATERI YANG PERLU DIPELAJARI LAGI</p>
          {topics.length ? (
            <ul className="mt-1 flex flex-wrap gap-1.5">
              {topics.map((tp) => (
                <li key={tp} className="bg-stone-950 px-2 py-0.5 text-[16px] text-torch">
                  {tp}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-ok">Tidak ada — semua materi sudah kamu kuasai.</p>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 bg-stone-950 px-4 py-2 shadow-[inset_0_0_0_2px_var(--color-stone-3)]">
          <span className="font-pixel text-[9px] text-dim">KODE VERIFIKASI</span>
          <span className="font-code text-[24px] font-bold tracking-[0.25em] text-ember">{kode}</span>
        </div>
        <p className="text-center text-[17px] leading-tight text-dim">
          Selesai {selesai} · Klik SIMPAN HASIL, lalu upload PNG-nya ke form.
        </p>
      </article>
      </div>

      <div className="relative z-10 flex flex-wrap justify-center gap-4">
        <button
          type="button"
          onClick={() => void savePng()}
          disabled={saving === "busy"}
          className="px-btn flex items-center gap-2 px-4 py-3 font-pixel text-[10px] text-ok disabled:text-dim/60"
        >
          <PixelIcon name="download" size={14} />
          {saving === "busy" ? "MENYIMPAN…" : "SIMPAN HASIL"}
        </button>
        <button type="button" onClick={replay} className="px-btn flex items-center gap-2 px-4 py-3 font-pixel text-[10px] text-ember">
          <PixelIcon name="replay" size={14} />
          MAIN LAGI
        </button>
        <button
          type="button"
          onClick={onToggleMute}
          className="px-btn grid size-11 place-items-center text-bone"
          aria-label={muted ? "Nyalakan suara" : "Matikan suara"}
          aria-pressed={muted}
        >
          <PixelIcon name={muted ? "mute" : "speaker"} size={16} />
        </button>
      </div>
      {saving === "error" && (
        <p role="alert" className="relative z-10 text-[18px] text-bad">
          Gagal menyimpan gambar. Screenshot kartu ini saja, ya.
        </p>
      )}
    </main>
  );
}
