import test from "node:test";
import assert from "node:assert/strict";
import { answer, newSession, openHint, points, score, shuffle, tierOf, isSession, catchUp, type Session } from "./game.ts";
import { byId, QUESTIONS } from "./questions.ts";
import { makeCode, isScoreConsistent } from "./verify.ts";
import { check, parseText, recordOf, toCsv, toText } from "./result.ts";
import { addText, readText } from "./png.ts";

const start = () => newSession("Budi", "1301220001", "25-02", 1, 0);
const right = (s: Session) => byId(s.order[s.answers.length]).options[0];
const wrong = (s: Session) => byId(s.order[s.answers.length]).options[1];

test("skor: benar 10, benar+hint 5, salah 0, timeout 0", () => {
  assert.equal(points({ picked: "x", correct: true, hint: false }), 10);
  assert.equal(points({ picked: "x", correct: true, hint: true }), 5);
  let s = start();
  s = answer(s, right(s), 1);
  s = answer(openHint(s), right(s), 2);
  s = answer(s, wrong(s), 3);
  s = answer(s, null, 4);
  assert.equal(score(s), 15);
  assert.deepEqual(s.answers.map((a) => a.correct), [true, true, false, false]);
});

test("nyawa: min 0, combo +1 maks 3, hint ditolak saat nyawa 0", () => {
  let s = start();
  for (let i = 0; i < 4; i++) s = answer(s, wrong(s), i);
  assert.equal(s.lives, 0);
  assert.equal(openHint(s).hintOpen, false);
  for (let i = 0; i < 3; i++) s = answer(s, right(s), 10 + i);
  assert.equal(s.lives, 1);
  assert.equal(openHint(s).hintOpen, true);
  let full = start();
  for (let i = 0; i < 3; i++) full = answer(full, right(full), i);
  assert.equal(full.lives, 3);
});

test("urutan: 7 easy lalu 3 expert, tanpa hilang/dobel", () => {
  for (let k = 0; k < 50; k++) {
    const s = start();
    assert.deepEqual(s.order.slice(0, 7).map((id) => byId(id).level), Array(7).fill("easy"));
    assert.deepEqual(s.order.slice(7).map((id) => byId(id).level), Array(3).fill("expert"));
    assert.deepEqual([...s.order].sort((a, b) => a - b), QUESTIONS.map((q) => q.id));
    assert.ok(isSession(s));
  }
  assert.deepEqual(shuffle([1, 2, 3, 4]).sort(), [1, 2, 3, 4]);
});

test("timer: deadline lewat dihitung timeout, sesi selesai terkunci", () => {
  let s = start();
  assert.equal(s.deadline, 30_000);
  s = catchUp(s, 31_000);
  assert.equal(s.answers[0].picked, null);
  assert.equal(s.deadline, 31_000 + 30_000);
  while (s.finishedAt === null) s = answer(s, right(s), 99);
  assert.equal(answer(s, "x", 100), s);
});

test("tier ending", () => {
  assert.equal(tierOf(10), "legendary");
  assert.equal(tierOf(9), "conqueror");
  assert.equal(tierOf(7), "conqueror");
  assert.equal(tierOf(6), "survivor");
  assert.equal(tierOf(4), "survivor");
  assert.equal(tierOf(3), "lost");
  assert.equal(tierOf(0), "lost");
});

test("kode verifikasi deterministik & sensitif tiap field", () => {
  const base = { nama: "Budi  Santoso ", nim: "1301220001", kelas: "25-02", skor: 85, benar: 9, hint: 1, percobaan: 1 };
  const c = makeCode(base);
  assert.match(c, /^[0-9A-Z]{6}$/);
  assert.equal(makeCode({ ...base, nama: "budi santoso", kelas: " 25-02 " }), c);
  for (const [k, v] of Object.entries({ nim: "1301220002", kelas: "25-03", skor: 90, benar: 8, hint: 2, percobaan: 2 }))
    assert.notEqual(makeCode({ ...base, [k]: v }), c, k);
  assert.ok(isScoreConsistent(85, 9, 1));
  assert.ok(!isScoreConsistent(95, 9, 1));
  assert.ok(!isScoreConsistent(80, 9, 1));
});

test("isSession menolak data rusak", () => {
  assert.equal(isSession(null), false);
  assert.equal(isSession({ ...start(), lives: 99 }), false);
  assert.equal(isSession({ ...start(), order: [1, 1, 2, 3, 4, 5, 6, 7, 8, 9] }), false);
});

test("file hasil: simpan → baca ulang tetap VALID, edit → TIDAK VALID", () => {
  let s = start();
  while (s.finishedAt === null) s = answer(s, right(s), 5_000);
  const rec = recordOf(s);
  const back = parseText(toText(rec));
  assert.deepEqual(back, rec);
  assert.deepEqual(check(back!), { valid: true, consistent: true });
  const forged = parseText(toText(rec).replace("Skor: 100", "Skor: 90"));
  assert.equal(check(forged!).valid, false);
  assert.equal(parseText("bukan file hasil"), null);
  assert.equal(parseText(toText(rec).replace(/Kode: .*/, "")), null);
  assert.match(toCsv([{ ...rec, nama: "=HYPERLINK(1)", status: "VALID" }]), /"'=HYPERLINK/);
});

test("PNG: data hasil disisipkan & dibaca ulang utuh (termasuk nama non-ASCII)", () => {
  // PNG 1x1 valid
  const png = Uint8Array.from(Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==", "base64"));
  const text = toText({ ...recordOf(newSession("Ñoño Śmith", "1301220001", "25-02", 1, 0)), kode: "ABC123" });
  const out = addText(png, text);
  assert.equal(readText(out), text);
  assert.deepEqual([...out.slice(-12, -8)], [0, 0, 0, 0]); // IEND tetap terakhir
  assert.equal(readText(png), null);
  assert.equal(readText(new Uint8Array([1, 2, 3])), null);
});
