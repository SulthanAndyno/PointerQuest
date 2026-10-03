import { QUESTIONS, byId, type Level, type Question } from "./questions.ts";
import { normalizeKelas } from "./verify.ts";

export const TOTAL_ROOMS = 10;
export const MAX_LIVES = 3;
export const COMBO_FOR_HEAL = 3;
export const SECONDS: Record<Level, number> = { easy: 30, expert: 90 };

export type Answer = {
  picked: string | null; // null = timeout
  correct: boolean;
  hint: boolean;
};

export type Session = {
  v: 2;
  nama: string;
  nim: string;
  kelas: string;
  attempt: number;
  order: number[]; // id soal per ruang
  options: string[][]; // opsi teracak per ruang
  answers: Answer[]; // panjang = ruang yang sudah dilewati
  hintOpen: boolean; // hint di ruang aktif sudah dibuka
  lives: number;
  combo: number;
  deadline: number; // epoch ms
  startedAt: number;
  finishedAt: number | null;
};

export type Rand = () => number;

export function shuffle<T>(arr: readonly T[], rand: Rand = Math.random): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export const roomQuestion = (s: Session, room = s.answers.length): Question => byId(s.order[room]);

export function newSession(nama: string, nim: string, kelas: string, attempt: number, now: number, rand: Rand = Math.random): Session {
  const easy = shuffle(QUESTIONS.filter((q) => q.level === "easy"), rand);
  const expert = shuffle(QUESTIONS.filter((q) => q.level === "expert"), rand);
  const qs = [...easy, ...expert];
  return {
    v: 2,
    nama: nama.trim().replace(/\s+/g, " "),
    nim: nim.trim(),
    kelas: normalizeKelas(kelas),
    attempt,
    order: qs.map((q) => q.id),
    options: qs.map((q) => shuffle(q.options, rand)),
    answers: [],
    hintOpen: false,
    lives: MAX_LIVES,
    combo: 0,
    deadline: now + SECONDS[qs[0].level] * 1000,
    startedAt: now,
    finishedAt: null,
  };
}

export const canUseHint = (s: Session) => s.finishedAt === null && !s.hintOpen && s.lives > 0;

export const openHint = (s: Session): Session => (canUseHint(s) ? { ...s, hintOpen: true } : s);

/** picked = null berarti waktu habis. */
export function answer(s: Session, picked: string | null, now: number): Session {
  if (s.finishedAt !== null) return s;
  const q = roomQuestion(s);
  const correct = picked !== null && picked === q.options[0];
  let { lives, combo } = s;
  if (correct) {
    combo += 1;
    if (combo % COMBO_FOR_HEAL === 0) lives = Math.min(MAX_LIVES, lives + 1);
  } else {
    combo = 0;
    lives = Math.max(0, lives - 1);
  }
  const answers = [...s.answers, { picked, correct, hint: s.hintOpen }];
  const done = answers.length >= TOTAL_ROOMS;
  return {
    ...s,
    answers,
    lives,
    combo,
    hintOpen: false,
    deadline: done ? s.deadline : now + SECONDS[byId(s.order[answers.length]).level] * 1000,
    finishedAt: done ? now : null,
  };
}

/** Dipanggil saat halaman dibuka lagi: soal yang deadline-nya lewat dihitung timeout. */
export const catchUp = (s: Session, now: number): Session =>
  s.finishedAt === null && now >= s.deadline ? answer(s, null, now) : s;

export const points = (a: Answer) => (a.correct ? (a.hint ? 5 : 10) : 0);
export const score = (s: Session) => s.answers.reduce((t, a) => t + points(a), 0);
export const correctCount = (s: Session) => s.answers.filter((a) => a.correct).length;
export const hintCount = (s: Session) => s.answers.filter((a) => a.hint).length;

export type Tier = "legendary" | "conqueror" | "survivor" | "lost";

export function tierOf(benar: number): Tier {
  if (benar >= 10) return "legendary";
  if (benar >= 7) return "conqueror";
  if (benar >= 4) return "survivor";
  return "lost";
}

export const weakTopics = (s: Session) =>
  s.answers.flatMap((a, i) => (a.correct ? [] : [roomQuestion(s, i).label]));

/** Validasi data dari localStorage; data rusak/dimanipulasi dibuang. */
export function isSession(x: unknown): x is Session {
  if (!x || typeof x !== "object") return false;
  const s = x as Session;
  const ids = QUESTIONS.map((q) => q.id).sort((a, b) => a - b);
  return (
    s.v === 2 &&
    typeof s.nama === "string" &&
    typeof s.nim === "string" &&
    typeof s.kelas === "string" &&
    Number.isInteger(s.attempt) &&
    s.attempt >= 1 &&
    Array.isArray(s.order) &&
    s.order.length === TOTAL_ROOMS &&
    [...s.order].sort((a, b) => a - b).every((id, i) => id === ids[i]) &&
    Array.isArray(s.options) &&
    s.options.every(
      (opts, i) =>
        Array.isArray(opts) &&
        [...opts].sort().join("\u0000") === [...byId(s.order[i]).options].sort().join("\u0000"),
    ) &&
    Array.isArray(s.answers) &&
    s.answers.length <= TOTAL_ROOMS &&
    s.answers.every((a) => a && typeof a.correct === "boolean" && typeof a.hint === "boolean") &&
    typeof s.hintOpen === "boolean" &&
    Number.isInteger(s.lives) &&
    s.lives >= 0 &&
    s.lives <= MAX_LIVES &&
    Number.isInteger(s.combo) &&
    typeof s.deadline === "number" &&
    typeof s.startedAt === "number" &&
    (s.finishedAt === null || typeof s.finishedAt === "number") &&
    (s.finishedAt !== null) === (s.answers.length === TOTAL_ROOMS)
  );
}

export type Action =
  | { type: "load"; session: Session | null }
  | { type: "start"; nama: string; nim: string; kelas: string; attempt: number; now: number }
  | { type: "hint" }
  | { type: "answer"; picked: string | null; now: number }
  | { type: "reset" };

export function reducer(state: Session | null, action: Action): Session | null {
  switch (action.type) {
    case "load":
      return action.session;
    case "start":
      return newSession(action.nama, action.nim, action.kelas, action.attempt, action.now);
    case "hint":
      return state && openHint(state);
    case "answer":
      return state && answer(state, action.picked, action.now);
    case "reset":
      return null;
  }
}
