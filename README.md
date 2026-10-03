# Pointer Quest: Escape to NULL

Quiz dungeon 10 soal untuk penilaian praktikum Struktur Data, materi Singly Linked List (Bagian Pertama).
Dibangun dengan Next.js 16 (static export), TypeScript, dan Tailwind CSS. Tidak ada server maupun database.

## Menjalankan

```bash
npm install
npm run dev        # http://localhost:3000
npm test           # self-check logika game (Node >= 22.18)
npm run build      # hasil statis di folder out/
```

## Deploy ke Vercel

1. Push folder ini ke repo GitHub.
2. Buka vercel.com, pilih **Add New → Project**, lalu import repo tersebut. Framework akan terdeteksi otomatis sebagai Next.js.
3. Klik **Deploy**. Security headers (CSP, anti-iframe, dan lainnya) otomatis terpasang dari `vercel.json`.

Netlify / Cloudflare Pages: set build command ke `npm run build` dan publish directory ke `out`. Headers diambil dari `public/_headers`.

## Mengganti soal

Edit `lib/questions.ts`. `options[0]` **selalu** jawaban benar, karena urutan pilihan diacak saat game berjalan.
Soal `easy` mengisi ruang 1–7 dan soal `expert` mengisi ruang 8–10. Jumlahnya harus tetap 7 easy + 3 expert.
Setelah mengedit, jalankan `npm test`.

## Mengumpulkan & mengecek hasil

Di layar akhir, praktikan klik **SIMPAN HASIL** untuk mengunduh gambar kartu skor `PointerQuest_<kelas>_<NIM>_<nama>.png`, lalu meng-upload PNG itu ke form quiz. Data hasilnya ikut tersimpan di dalam PNG sebagai metadata: tidak terlihat di gambar, tapi bisa dibaca oleh `/cek`.

Buka `/cek` (halaman ini tidak ditautkan dari mana pun):

- **Cek file (banyak sekaligus)**: seret semua file `.png` hasil SIMPAN HASIL ke kotak unggah. Statusnya muncul per praktikan:
  - **VALID**: data asli.
  - **TIDAK VALID**: isi file diedit.
  - **SKOR JANGGAL**: kode cocok, tapi angka skornya tidak masuk akal.
  - **BUKAN FILE HASIL**: file lain, file rusak, atau screenshot biasa (screenshot tidak membawa metadata, jadi pakai cek manual).

  Klik **EKSPOR CSV** untuk rekap nilai (bisa dibuka di Excel atau Google Sheets). Percobaan ke-2 dan seterusnya ditandai oranye.
- **Cek manual dari screenshot**: ketik nama, NIM, kelas, skor, jumlah benar, hint, percobaan, dan kode dari SS, lalu klik **CEK**. Penulisan harus persis sama dengan yang ada di SS.

Semua pengecekan berjalan di browser asprak. File praktikan tidak diunggah ke server mana pun.

## Batasan keamanan (by design, karena tanpa server)

- Kunci jawaban dan salt kode verifikasi ikut ter-bundle di JavaScript. Praktikan yang paham DevTools tetap bisa membongkarnya. Kode verifikasi hanya penghalang ringan terhadap edit screenshot.
- Counter percobaan dan progres disimpan di `localStorage`. Kalau praktikan membersihkan data browser atau pindah browser, percobaan kembali ke 1.
- Kalau dibutuhkan penilaian anti-curang yang sebenarnya, jawaban harus dinilai dan disimpan di server (perlu backend).

## Kredit aset

Semua aset berlisensi CC0 (bebas dipakai tanpa atribusi):
- Karakter, monster, dan tile dungeon: [16x16 DungeonTileset II oleh 0x72](https://0x72.itch.io/dungeontileset-ii)
- Obor: [Simple Torch Animation 16x16](https://opengameart.org/content/simple-torch-animation-16x16). Anglo: [16x16 Torch](https://opengameart.org/content/16x16-torch)
- Plakat judul: [Parchment GUI](https://opengameart.org/content/parchment-gui)
- Gulungan scroll dan ikon pixel digambar dengan CSS/SVG di dalam kode
Font: Press Start 2P, VT323, dan JetBrains Mono (Google Fonts, OFL), di-host sendiri lewat `next/font`.
Efek suara disintesis dengan Web Audio API.

**OST** (`public/audio/ost.mp3`): [This Game 8 Bit- No Game No Life OP](https://youtu.be/Wo4HJvo7Wh4) oleh [Famitunes - Chiptune Covers](https://www.youtube.com/@famitunes-chiptunecovers9596), cover chiptune dari "This Game" (OP *No Game No Life*, Konomi Suzuki). Hak cipta lagu dan aransemennya milik pemiliknya masing-masing, dan lagu ini **bukan** aset CC0. Dipakai hanya untuk praktikum non-komersial. Kalau ada keberatan dari pemilik hak cipta, atau web dibuat publik, ganti file tersebut dengan musik berlisensi bebas (nama file tetap `ost.mp3`).
