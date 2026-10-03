"use client";

import { useEffect, useEffectEvent, useRef, useState } from "react";
import { canUseHint, roomQuestion, score, SECONDS, TOTAL_ROOMS, type Session } from "@/lib/game.ts";
import { sfx } from "@/lib/sound.ts";
import { DungeonMap } from "./DungeonMap";
import { Hud } from "./Hud";
import { QuestionCard, type Fx } from "./QuestionCard";
import { Sprite, type SpriteName } from "./Sprite";

const FEEDBACK_MS = 800;
const WALK_MS = 600;

// penjaga tiap ruang: 7 monster kecil untuk easy, 3 boss untuk expert
const GUARDIANS: SpriteName[] = ["skelet", "goblin", "imp", "chort", "maskedOrc", "necromancer", "iceZombie", "ogre", "bigZombie", "bigDemon"];
const BANNERS: SpriteName[] = ["bannerRed", "bannerBlue", "bannerGreen", "bannerYellow"];

type Anim = { room: number; picked: string | null; fx: Fx; walking: boolean };

type Props = {
  session: Session;
  muted: boolean;
  onToggleMute: () => void;
  onAnswer: (picked: string | null) => void;
  onHint: () => void;
  onAnimEnd: () => void;
};

function useNow(active: boolean) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!active) return;
    const t = setInterval(() => setNow(Date.now()), 200);
    return () => clearInterval(t);
  }, [active]);
  return now;
}

export function DungeonScreen({ session, muted, onToggleMute, onAnswer, onHint, onAnimEnd }: Props) {
  const [anim, setAnim] = useState<Anim | null>(null);
  const [healPulse, setHealPulse] = useState(0);
  const prevLives = useRef(session.lives);
  const lastTick = useRef(-1);

  // saat animasi berjalan, layar tetap menampilkan ruang yang baru dijawab
  const room = anim ? anim.room : session.answers.length;
  const q = roomQuestion(session, Math.min(room, TOTAL_ROOMS - 1));
  const options = session.options[Math.min(room, TOTAL_ROOMS - 1)];
  const now = useNow(!anim && session.finishedAt === null);
  const remaining = Math.max(0, session.deadline - now);
  const darkMode = session.lives === 0;

  function submit(picked: string | null) {
    if (anim || session.finishedAt !== null) return;
    const correct = picked !== null && picked === q.options[0];
    const fx: Fx = picked === null ? "timeout" : correct ? "correct" : "wrong";
    if (picked !== null) sfx.click();
    if (correct) sfx.correct();
    else sfx.wrong();
    // jawaban langsung disimpan (refresh di tengah animasi tidak bisa mengulang soal)
    onAnswer(picked);
    setAnim({ room, picked, fx, walking: false });
  }

  // timer: tik di 5 detik terakhir, timeout saat deadline lewat
  const onTimer = useEffectEvent((t: number) => {
    const left = session.deadline - t;
    if (left <= 0) return submit(null);
    const s = Math.ceil(left / 1000);
    if (s <= 5 && s !== lastTick.current) {
      lastTick.current = s;
      sfx.tick();
    }
  });
  useEffect(() => {
    if (anim || session.finishedAt !== null) return;
    const t = setInterval(() => onTimer(Date.now()), 200);
    return () => clearInterval(t);
  }, [anim, session.finishedAt, session.deadline]);

  // urutan animasi: feedback → jalan → ruang berikutnya
  useEffect(() => {
    if (!anim) return;
    if (!anim.walking) {
      const t = setTimeout(() => {
        sfx.step();
        setAnim((a) => a && { ...a, walking: true });
      }, FEEDBACK_MS);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => {
      setAnim(null);
      lastTick.current = -1;
      onAnimEnd();
    }, WALK_MS);
    return () => clearTimeout(t);
  }, [anim, onAnimEnd]);

  // efek perubahan nyawa: heal / mode gelap
  useEffect(() => {
    if (session.lives > prevLives.current) {
      sfx.heal();
      setHealPulse((n) => n + 1);
    } else if (session.lives === 0 && prevLives.current > 0) {
      sfx.darkMode();
    }
    prevLives.current = session.lives;
  }, [session.lives]);

  function hint() {
    if (anim || !canUseHint(session)) return;
    sfx.hint();
    onHint();
  }

  // keyboard: 1–4 / A–D pilih jawaban, H buka hint
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const k = e.key.toLowerCase();
      const idx = "1234".indexOf(k) >= 0 ? "1234".indexOf(k) : "abcd".indexOf(k);
      if (idx >= 0 && k.length === 1 && options[idx]) submit(options[idx]);
      else if (k === "h") hint();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const results = session.answers.map((a) => a.correct);
  const heroAt = anim?.walking ? anim.room + 1 : room;
  const guardian = GUARDIANS[Math.min(room, TOTAL_ROOMS - 1)];
  const isBoss = q.level === "expert";
  // SLL hanya bisa maju: benar atau salah, p = p->next tetap jalan.
  // Benar → penjaga kalah & pintu terbuka; salah → kena jebakan dulu, baru pintu terbuka saat berjalan.
  const defeated = anim?.fx === "correct";
  const opened = defeated || !!anim?.walking;
  const trapped = anim && anim.fx !== "correct";

  return (
    <main className={`mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 ${trapped && !anim.walking ? "anim-shake" : ""}`}>
      {darkMode && <div className="dark-vignette" aria-hidden />}

      <Hud
        lives={session.lives}
        score={score(session)}
        room={Math.min(room + 1, TOTAL_ROOMS)}
        remainingMs={anim ? 0 : remaining}
        totalMs={SECONDS[q.level] * 1000}
        muted={muted}
        onToggleMute={onToggleMute}
        healPulse={healPulse}
      />

      {darkMode && (
        <p role="status" className="px-panel relative z-30 bg-stone-950 px-4 py-2 text-center font-pixel text-[10px] leading-5 text-arcane">
          MODE GELAP — Peta Kuno terkunci. Jawab 3 benar beruntun untuk memulihkan nyawa.
        </p>
      )}

      <DungeonMap results={results} heroAt={heroAt} walking={!!anim?.walking} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[300px_minmax(0,1fr)]">
        {/* adegan ruang: dinding, pintu next, penjaga */}
        <section
          aria-label={`Ruang ${room + 1}, penjaga ${isBoss ? "boss" : "monster"}`}
          className="px-panel relative z-10 flex h-44 items-end justify-center overflow-hidden lg:h-auto lg:min-h-80"
          style={{
            backgroundImage: "url(/sprites/wall_mid.png)",
            backgroundSize: "48px 48px",
            imageRendering: "pixelated",
          }}
        >
          <div className="absolute inset-x-0 bottom-0 h-1/3 bg-[url(/sprites/floor_tile.png)] bg-[length:192px_192px] [image-rendering:pixelated]" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/50" />
          <Sprite name={BANNERS[room % 4]} scale={3} className="absolute top-4 left-6" />
          <Sprite name={BANNERS[(room + 1) % 4]} scale={3} className="absolute top-4 right-6" />
          <div className="absolute top-4 left-1/2 hidden -translate-x-1/2 flex-col lg:flex" aria-hidden>
            <Sprite name="fountainTop" scale={3} />
            <Sprite name={isBoss ? "fountainRed" : "fountainBlue"} scale={3} />
          </div>
          <Sprite name="column" scale={3} className="absolute bottom-0 left-0 hidden lg:block" />
          <Sprite name="column" scale={3} className="absolute right-0 bottom-0 hidden lg:block" />
          <Sprite name="torch" scale={4} fps={9} className="absolute top-12 left-[15%] lg:top-24" />
          <Sprite name="torch" scale={4} fps={9} className="absolute top-12 right-[15%] lg:top-24" style={{ animationDelay: "-0.25s" }} />
          {/* cahaya obor */}
          <div className="pointer-events-none absolute top-6 left-[8%] size-28 rounded-full bg-torch/15 blur-2xl lg:top-20" />
          <div className="pointer-events-none absolute top-6 right-[8%] size-28 rounded-full bg-torch/15 blur-2xl lg:top-20" />

          <div className="relative mb-6 flex items-end gap-4">
            <div className="relative">
              <Sprite name={opened ? "doorOpen" : "doorClosed"} scale={3} label={opened ? "Pintu next terbuka" : "Pintu next tertutup"} />
              <span className="absolute -top-6 left-1/2 -translate-x-1/2 font-code text-[13px] text-ember">next</span>
            </div>
            <Sprite name="brazier" scale={3} fps={10} />
            <Sprite
              key={`${room}-${anim?.fx ?? ""}`}
              name={guardian}
              scale={isBoss ? 3 : 4}
              className={defeated ? "anim-poof" : ""}
              label={isBoss ? "Boss penjaga" : "Monster penjaga"}
            />
          </div>
          {anim?.walking && (
            <p className="anim-rise absolute top-1/3 left-1/2 -translate-x-1/2 bg-stone-950/85 px-3 py-1 font-code text-[15px] whitespace-nowrap text-ember shadow-[0_0_0_2px_#0a0810]" aria-hidden>
              p = p-&gt;next
            </p>
          )}
          {trapped && !anim.walking && (
            <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2" aria-hidden>
              <Sprite name="spikes" scale={3} once fps={14} />
              <Sprite name="spikes" scale={3} once fps={14} />
              <Sprite name="spikes" scale={3} once fps={14} />
            </div>
          )}
          <p className="absolute top-2 left-1/2 -translate-x-1/2 font-pixel text-[9px] whitespace-nowrap text-bone/90 drop-shadow-[2px_2px_0_#000]">
            {isBoss ? `BOSS · RUANG ${room + 1}` : `RUANG ${room + 1}`}
          </p>
        </section>

        <QuestionCard
          key={room}
          q={q}
          options={options}
          hintOpen={anim ? session.answers[anim.room]?.hint ?? false : session.hintOpen}
          canHint={canUseHint(session)}
          darkMode={darkMode}
          locked={!!anim}
          picked={anim?.picked ?? null}
          fx={anim?.fx ?? null}
          onPick={submit}
          onHint={hint}
        />
      </div>
    </main>
  );
}
