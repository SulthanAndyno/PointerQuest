// /page/ 

"use client";

import { useCallback, useEffect, useReducer, useState } from "react";
import { DungeonScreen } from "@/components/DungeonScreen";
import { ResultScreen } from "@/components/ResultScreen";
import { StartScreen } from "@/components/StartScreen";
import { catchUp, reducer } from "@/lib/game.ts";
import { initAudio, setMuted as setAudioMuted, startMusic } from "@/lib/sound.ts";
import { loadAttempts, loadMuted, loadSession, saveAttempts, saveMuted, saveSession } from "@/lib/storage.ts";

export default function Home() {
  const [session, dispatch] = useReducer(reducer, null);
  const [ready, setReady] = useState(false);
  const [attempt, setAttempt] = useState(1);
  const [muted, setMuted] = useState(false);
  // false selama animasi jawaban terakhir masih berjalan
  const [showResult, setShowResult] = useState(true);

  // muat dari localStorage setelah mount (hindari mismatch hidrasi)
  useEffect(() => {
    const s = loadSession();
    const m = loadMuted();
    setAudioMuted(m);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sinkronisasi sekali dari localStorage
    setMuted(m);
    setAttempt(loadAttempts());
    dispatch({ type: "load", session: s && catchUp(s, Date.now()) });
    setReady(true);
    // setelah refresh, browser butuh interaksi dulu sebelum audio boleh bunyi
    if (!s) return;
    const unlock = () => {
      initAudio();
      startMusic();
    };
    window.addEventListener("pointerdown", unlock, { once: true });
    window.addEventListener("keydown", unlock, { once: true });
    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };
  }, []);

  useEffect(() => {
    if (ready) saveSession(session);
  }, [ready, session]);

  const toggleMute = useCallback(() => {
    initAudio();
    startMusic();
    setMuted((m) => {
      setAudioMuted(!m);
      saveMuted(!m);
      return !m;
    });
  }, []);

  const onAnimEnd = useCallback(() => setShowResult(true), []);

  if (!ready) return null;

  if (!session)
    return (
      <StartScreen
        attempt={attempt}
        onStart={(nama, nim, kelas) => {
          initAudio();
          startMusic();
          dispatch({ type: "start", nama, nim, kelas, attempt, now: Date.now() });
        }}
      />
    );

  if (session.finishedAt !== null && showResult)
    return (
      <ResultScreen
        session={session}
        muted={muted}
        onToggleMute={toggleMute}
        onReplay={() => {
          const next = session.attempt + 1;
          saveAttempts(next);
          setAttempt(next);
          dispatch({ type: "reset" });
        }}
      />
    );

  return (
    <DungeonScreen
      session={session}
      muted={muted}
      onToggleMute={toggleMute}
      onAnswer={(picked) => {
        if (session.answers.length === 9) setShowResult(false);
        dispatch({ type: "answer", picked, now: Date.now() });
      }}
      onHint={() => dispatch({ type: "hint" })}
      onAnimEnd={onAnimEnd}
    />
  );
}
