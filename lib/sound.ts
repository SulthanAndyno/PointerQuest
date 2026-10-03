import type { Tier } from "./game.ts";

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let muted = false;

/** Panggil dari event klik (aturan autoplay browser). */
export function initAudio() {
  if (typeof window === "undefined") return;
  if (!ctx) {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = muted ? 0 : 0.15;
    master.connect(ctx.destination);
  }
  if (ctx.state === "suspended") void ctx.resume();
}

export function setMuted(m: boolean) {
  muted = m;
  if (master && ctx) master.gain.setValueAtTime(m ? 0 : 0.15, ctx.currentTime);
  const mus = music();
  if (mus) mus.muted = m;
}

// OST: diputar berulang di bawah efek suara (lagu aslinya rata-rata −17,6 dB;
// volume 0.5 ≈ −6 dB; SFX chiptune masih terdengar di atasnya)
const MUSIC_VOL = 0.5;

// Satu-satunya pemutar OST disimpan di globalThis, bukan variabel modul: kalau modul ini
// dimuat ulang (hot reload saat dev), pemutar lama tetap dipakai dan tidak ada OST dobel.
const g = globalThis as { __pqMusic?: HTMLAudioElement };
const music = () => g.__pqMusic;

/** Panggil dari event klik/tombol (aturan autoplay browser). */
export function startMusic() {
  if (typeof window === "undefined") return;
  if (!g.__pqMusic) {
    const a = new Audio("/audio/ost.mp3");
    a.loop = true;
    a.preload = "auto";
    g.__pqMusic = a;
  }
  const m = g.__pqMusic;
  m.volume = MUSIC_VOL;
  m.muted = muted;
  if (m.paused) void m.play().catch(() => {});
}

/** Kecilkan musik sebentar (mis. saat jingle ending) lalu kembalikan. */
function duckMusic(ms: number) {
  const m = music();
  if (!m) return;
  m.volume = MUSIC_VOL * 0.25;
  setTimeout(() => (m.volume = MUSIC_VOL), ms);
}

type Wave = OscillatorType;

/** Satu nada chiptune: freq Hz, mulai `at` detik dari sekarang, durasi `dur` detik. */
function tone(freq: number, at: number, dur: number, wave: Wave = "square", vol = 1, slideTo?: number) {
  if (!ctx || !master || muted) return;
  const t = ctx.currentTime + at;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = wave;
  osc.frequency.setValueAtTime(freq, t);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(g).connect(master);
  osc.start(t);
  osc.stop(t + dur + 0.02);
}

const seq = (notes: [number, number][], step: number, wave: Wave = "square", vol = 0.8) =>
  notes.forEach(([f, len], i) => tone(f, i * step, len, wave, vol));

// frekuensi nada
const N = { C4: 262, E4: 330, G4: 392, A4: 440, B4: 494, C5: 523, D5: 587, E5: 659, F5: 698, G5: 784, A5: 880, C6: 1047, Eb4: 311, D4: 294, Bb3: 233, G3: 196 };

export const sfx = {
  click: () => tone(N.A5, 0, 0.04, "square", 0.4),
  correct: () => seq([[N.C5, 0.1], [N.E5, 0.1], [N.G5, 0.18]], 0.08),
  wrong: () => tone(160, 0, 0.35, "sawtooth", 0.6, 70),
  hint: () => seq([[N.E5, 0.25], [N.A5, 0.4]], 0.14, "triangle", 0.9),
  tick: () => tone(1200, 0, 0.03, "square", 0.3),
  heal: () => seq([[N.G5, 0.08], [N.C6, 0.16]], 0.06, "triangle", 0.9),
  darkMode: () => {
    tone(55, 0, 1.1, "sawtooth", 0.5);
    tone(58, 0, 1.1, "triangle", 0.5);
  },
  step: () => {
    tone(110, 0, 0.06, "triangle", 0.7);
    tone(98, 0.22, 0.06, "triangle", 0.7);
  },
  ending: (tier: Tier) => {
    duckMusic(tier === "lost" ? 2600 : 1600);
    if (tier === "legendary")
      seq([[N.C5, 0.12], [N.E5, 0.12], [N.G5, 0.12], [N.C6, 0.25], [N.G5, 0.12], [N.C6, 0.6]], 0.13);
    else if (tier === "conqueror") seq([[N.G4, 0.12], [N.C5, 0.12], [N.E5, 0.12], [N.G5, 0.4]], 0.14);
    else if (tier === "survivor") seq([[N.C5, 0.18], [N.D5, 0.18], [N.C5, 0.4]], 0.2, "triangle");
    else seq([[N.E4, 0.35], [N.Eb4, 0.35], [N.D4, 0.35], [N.Bb3, 0.5], [N.G3, 0.9]], 0.38, "triangle");
  },
};
