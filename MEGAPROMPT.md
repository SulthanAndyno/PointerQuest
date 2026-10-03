# MEGAPROMPT — Pointer Quest: Escape to NULL

Kamu adalah senior frontend developer. Buatkan sebuah **web quiz bertema game dungeon** untuk penilaian praktikum Struktur Data, materi **Singly Linked List (Bagian Pertama)**. Ikuti spesifikasi di bawah ini secara literal. Kalau ada detail yang tidak disebut, pilih solusi paling sederhana yang bekerja. Jangan menambah fitur di luar spesifikasi.

---

## 1. Konteks & Tujuan

- **Pengguna:** praktikan (mahasiswa) mata kuliah Struktur Data.
- **Tujuan:** quiz 10 soal yang hasilnya dipakai untuk **penilaian**. Praktikan men-screenshot (SS) kartu skor di layar akhir dan mengirimkannya ke asprak.
- **Konsep game:** dungeon berbentuk **singly linked list**. Ada 10 ruangan = 10 node, yang terhubung dengan panah `next` dari **HEAD** sampai pintu keluar **NULL**. Setiap jawaban benar membuka pintu `next`, dan karakter berjalan ke node berikutnya (secara harfiah `p = p->next`).
- **Bahasa UI:** Bahasa Indonesia santai tapi jelas.

---

## 2. Tech Stack (wajib)

- **Next.js** (versi stabil terbaru, App Router) + **TypeScript** + **Tailwind CSS**.
- **Static export:** di `next.config.ts` set `output: 'export'` dan `images: { unoptimized: true }`. Tidak ada API route, server action, maupun database. Semua logika berjalan di client.
- **Font:** `next/font/google`, dengan **Press Start 2P** untuk judul/HUD, **VT323** untuk teks isi, dan **JetBrains Mono** untuk potongan kode.
- **Suara:** **Web Audio API** bawaan browser, disintesis lewat kode (oscillator + gain envelope). **Tidak ada file audio** dan tidak ada library audio.
- **State:** `useReducer` + `localStorage`. Tidak perlu Redux/Zustand.
- **Tanpa dependency tambahan** selain yang dibawa `create-next-app`. Confetti dan animasi dibuat dengan CSS.
- Harus bisa di-deploy ke Vercel / Netlify / GitHub Pages dari hasil `npm run build` (folder `out/`).

---

## 3. Struktur Folder

```
pointer-quest/
├─ app/
│  ├─ layout.tsx          # font, metadata, background dungeon
│  ├─ page.tsx            # mengatur layar: start → dungeon → result
│  ├─ globals.css         # Tailwind + keyframes (shake, walk, torch, confetti)
│  └─ cek/page.tsx        # halaman verifikasi kode milik asprak
├─ components/
│  ├─ StartScreen.tsx     # form Nama + NIM, aturan main
│  ├─ DungeonScreen.tsx   # HUD + peta + kartu soal
│  ├─ DungeonMap.tsx      # 10 node [ruang|next] → ... → NULL + karakter
│  ├─ Hud.tsx             # nyawa, skor, timer obor, tombol mute
│  ├─ QuestionCard.tsx    # label materi, soal, kode/visual, 4 pilihan, tombol hint
│  ├─ ListVisual.tsx      # gambar list [data|next] → ... → Nil untuk soal expert
│  └─ ResultScreen.tsx    # kartu skor + ucapan ending
├─ lib/
│  ├─ questions.ts        # bank 10 soal (lihat bagian 9)
│  ├─ game.ts             # reducer, aturan skor, nyawa, shuffle, tier ending
│  ├─ verify.ts           # pembuat kode verifikasi (dipakai game & /cek)
│  ├─ sound.ts            # semua efek suara Web Audio
│  └─ storage.ts          # simpan/muat progres & counter percobaan
├─ lib/game.test.ts       # self-check (lihat bagian 12)
└─ next.config.ts
```

---

## 4. Alur Layar

### 4.1 Layar Start
- Judul besar **"POINTER QUEST"** dengan subjudul **"Escape to NULL"**, ditambah animasi obor berkedip.
- Input **Nama** dan **NIM** (wajib diisi). Validasi: nama minimal 3 karakter, NIM hanya angka dengan panjang 8–15 digit. Tombol mulai nonaktif sampai input valid.
- Kotak **Aturan Main** (ringkas, berupa bullet): 10 ruangan, poin, hint, nyawa, timer, kunci jawaban tidak ditampilkan, SS kartu skor di akhir, dan peringatan bahwa refresh tidak mengulang dari awal.
- Tombol **"⚔️ MASUK DUNGEON"**. Klik pertama pada tombol ini juga menginisialisasi `AudioContext`, karena aturan autoplay browser mengharuskan audio dimulai dari aksi pengguna.

### 4.2 Layar Dungeon (soal 1–10)
- **HUD atas:** ❤️ nyawa (maksimal 3), skor, `Ruang X/10`, timer obor, dan tombol 🔊/🔇.
- **Peta dungeon:** `HEAD → [R1|next] → [R2|next] → … → [R10|next] → NULL`.
  - Node yang sudah dilewati diberi warna hijau kalau dijawab benar dan merah kalau salah/timeout, node aktif menyala, node berikutnya redup.
  - Ada sprite karakter (cukup emoji 🧙 atau div pixel) di atas node aktif, dan label kecil `p` di bawahnya yang menunjukkan posisi pointer `p`.
  - Di layar < 640px, tampilkan peta versi ringkas (kotak nomor saja). Kalau masih kurang lebar, peta di-scroll horizontal **di dalam kontainernya sendiri**, bukan seluruh halaman.
- **Kartu soal:**
  - Badge level (**EASY** hijau / **EXPERT** ungu) + label `📖 Materi: <label>`.
  - Teks soal. Untuk soal expert, tampilkan `ListVisual` (list awal) dan blok kode yang diberi syntax highlight sederhana.
  - 4 tombol pilihan jawaban A–D, dengan urutan diacak.
  - Tombol **"🗺️ Peta Kuno (Hint)"**. Begitu ditekan, teks hint tampil di bawah soal dan poin maksimal soal itu turun menjadi 5. Hint hanya bisa dibuka sekali per soal.
- **Setelah menjawab:** semua tombol dikunci, lalu muncul feedback selama **0,8 detik**:
  - Kalau benar, tampil "✅ Pintu terbuka!", tombol yang dipilih berwarna hijau, dan suara benar diputar.
  - Kalau salah, tampil "❌ Kena jebakan!", layar bergetar (shake), tombol yang dipilih berwarna merah, dan suara salah diputar.
  - **JANGAN tampilkan jawaban yang benar** ketika praktikan salah.
  - Setelah itu karakter beranimasi berjalan ke node berikutnya (±0,6 detik), lalu soal berikutnya muncul otomatis. Tidak ada tombol "Next".
- **Timeout:** perlakuannya sama dengan jawaban salah (0 poin, −1 nyawa), dengan pesan "⌛ Obormu padam!", lalu lanjut otomatis.

### 4.3 Layar Akhir "YOU ESCAPED!"
Lihat bagian 7 (tier ending) dan bagian 8 (kartu skor).

---

## 5. Aturan Skor, Timer, dan Urutan

| Kejadian | Poin |
|---|---|
| Benar tanpa hint | **10** |
| Benar dengan hint | **5** |
| Salah / timeout | **0** |

- Skor maksimal **100**.
- **Timer per soal:** EASY **30 detik**, EXPERT **90 detik**.
  - Timer divisualkan sebagai obor/bar yang makin pendek. Bar menjadi merah dan berkedip di 5 detik terakhir, disertai suara tik setiap detik.
  - Simpan **deadline (timestamp)** di state, bukan sisa detik, supaya timer tetap akurat setelah refresh atau ketika tab sempat tidak aktif.
- **Urutan soal:** 7 soal EASY diacak di antara mereka sendiri dan menempati ruang 1–7. 3 soal EXPERT diacak di antara mereka sendiri dan menempati ruang 8–10.
- **Urutan pilihan jawaban** diacak per soal. Acakan dibuat sekali di awal sesi lalu disimpan, sehingga tidak berubah setelah refresh.
- Gunakan Fisher–Yates untuk shuffle.

---

## 6. Sistem Nyawa (bukan hiasan)

- Praktikan mulai dengan **3 ❤️**.
- Jawaban **salah atau timeout** mengurangi **1 ❤️**.
- **Combo:** setiap **3 jawaban benar berturut-turut** memberi **+1 ❤️** (maksimal 3), dengan animasi hati berdenyut + suara heal. Combo direset ketika praktikan salah.
- **Nyawa = 0 → MODE GELAP:**
  - Tampilan dungeon menjadi gelap (vignette tebal, hanya kartu soal yang terang) dan muncul banner "🌑 Mode Gelap: Peta Kuno tidak bisa dipakai lagi".
  - **Tombol hint dinonaktifkan** selama nyawa 0.
  - Game **TETAP lanjut** sampai ruang 10. Tidak ada game over, supaya semua praktikan mengerjakan 10 soal dan penilaiannya adil.
  - Kalau combo memberi +1 ❤️, Mode Gelap berakhir dan hint bisa dipakai lagi.
- Nyawa **tidak mengubah skor** secara langsung. Sisa nyawa ditampilkan di kartu skor sebagai pencapaian.

---

## 7. Tier Ending (berdasarkan JUMLAH JAWABAN BENAR, bukan poin)

Setiap tier memiliki judul, warna, ucapan, animasi, dan jingle sendiri.

| Benar | Judul | Warna | Ucapan | Animasi | Jingle |
|---|---|---|---|---|---|
| **10** | 🏆 **LEGENDARY POINTER MASTER** | emas | "SEMPURNA! Kamu menelusuri setiap node dari HEAD sampai NULL tanpa satu pun pointer yang tersesat. Linked list tunduk padamu!" | confetti emas + mahkota berkilau | fanfare mayor naik, 6–8 nada, megah |
| **7–9** | ⚔️ **DUNGEON CONQUEROR** | biru | "Mantap! Kamu berhasil keluar dari dungeon dengan gagah. Sedikit lagi jadi legenda, cek lagi materi yang masih keliru ya!" | pedang berkilat | jingle ceria mayor, 4–5 nada |
| **4–6** | 🛡️ **SURVIVOR** | oranye | "Kamu selamat, tapi beberapa pointer masih nyasar di jalan. Pelajari lagi materi di bawah ini, kamu pasti bisa lebih baik!" | perisai bergetar ringan | jingle netral, 3–4 nada |
| **0–3** | 💀 **LOST IN THE HEAP** | abu-merah | "Pointer-mu tersesat di memori... Jangan menyerah! Baca lagi materi dasar Singly Linked List lalu buktikan kamu bisa keluar!" | tengkorak + efek fade gelap | nada minor turun, lambat |

Di bawah ucapan tampilkan **"📚 Materi yang perlu dipelajari lagi:"** berisi daftar **label materi** dari soal yang salah/timeout. Yang ditampilkan hanya labelnya, **bukan** kunci jawaban. Untuk tier 10, ganti dengan "Tidak ada, semua materi sudah kamu kuasai! 🎉".

---

## 8. Kartu Skor (yang di-SS praktikan)

Kartu terpusat dan rapi, dan seluruhnya harus muat di satu layar laptop maupun HP tanpa scroll supaya mudah di-SS. Isinya:

- Judul tier + ikon
- **Nama** dan **NIM**
- **Skor: XX / 100** (besar)
- Benar: X / 10 · Hint dipakai: X · Sisa nyawa: ❤️❤️🖤
- Total waktu: mm:ss
- **Percobaan ke-N**
- Tanggal & jam selesai, dalam format lokal Indonesia (`id-ID`)
- **Kode Verifikasi: `XXXXXX`** (monospace, mencolok)
- Teks kecil: "📸 Screenshot kartu ini dan kirim ke asprak."

Di bawah kartu (boleh ikut terpotong dari SS) ada tombol **"🔁 Main Lagi"** dengan dialog konfirmasi: "Percobaan berikutnya akan tercatat sebagai Percobaan ke-(N+1). Lanjut?"

---

## 9. Bank Soal (gunakan PERSIS seperti ini)

Format data di `lib/questions.ts`:

```ts
export type Question = {
  id: number;
  level: 'easy' | 'expert';
  label: string;          // label materi
  prompt: string;         // teks soal
  initialList?: number[]; // untuk ListVisual (expert)
  code?: string;          // potongan kode (expert)
  options: string[];      // options[0] SELALU jawaban benar; diacak saat runtime
  hint: string;
};
```

> Catatan: `options[0]` adalah jawaban benar **hanya di dalam data**. Saat runtime urutannya diacak, dan yang disimpan adalah teks jawaban yang benar.

### EASY

**1** · Label: `Istilah SLL: first/head`
Soal: Pointer pada list yang menunjuk alamat elemen pertama disebut…
- ✅ first/head
- next
- Nil
- info

Hint: Dia selalu berdiri di pintu masuk dungeon.

**2** · Label: `Istilah SLL: NULL/Nil`
Soal: Arti dari NULL/Nil adalah…
- ✅ Tidak memiliki nilai / tidak mengacu ke mana pun
- Bernilai 0 dan bertipe int
- Alamat elemen pertama
- Elemen terakhir dalam list

Hint: Pintu keluar dungeon yang tidak mengarah ke ruangan mana pun.

**3** · Label: `Komponen Elemen: Successor`
Soal: Bagian elemen yang berfungsi sebagai penghubung antar elemen disebut…
- ✅ Successor
- Data
- Elemen
- Info

Hint: Bagian ini bukan tempat menyimpan informasi, tapi tempat menyimpan alamat elemen berikutnya.

**4** · Label: `Sifat Singly Linked List`
Soal: Pada Singly Linked List, arah pembacaan yang bisa dilakukan adalah…
- ✅ Hanya maju
- Hanya mundur
- Maju dan mundur
- Acak

Hint: "Singly" artinya hanya punya satu arah pointer.

**5** · Label: `Pengecekan List: isEmpty`
Soal: Fungsi `isEmpty()` mengembalikan `true` jika…
- ✅ List kosong (`L.first == Nil`)
- List penuh
- List memiliki 1 elemen
- `next` elemen terakhir bernilai Nil

Hint: Kalau head tidak menunjuk ke mana pun, berarti…

**6** · Label: `Pengalokasian Memori`
Soal: Syntax alokasi elemen baru di C++ adalah…
- ✅ `P = new elmlist;`
- `P = (address) malloc(sizeof(elmlist));`
- `delete P;`
- `free(P);`

Hint: Salah satu pilihan itu cara C, bukan C++.

**7** · Label: `Pembentukan List: createList`
Soal: Fungsi `createList()` mengeset `L.first` dengan nilai…
- ✅ Nil
- 0
- Alamat elemen pertama
- `new elmlist`

Hint: List yang baru dibuat masih kosong.

### EXPERT

**8** · Label: `Insert After`
Soal: Diketahui list berikut dan `Q` menunjuk node `9`. Setelah kode dijalankan, isi list menjadi…
initialList: `[4, 9, 1]` (tandai node 9 dengan label `Q`)
```cpp
P = alokasi(6);
P->next = Q->next;
Q->next = P;
```
- ✅ `4 → 9 → 6 → 1`
- `4 → 6 → 9 → 1`
- `4 → 9 → 1 → 6`
- `4 → 9 → 6`

Hint: P disisipkan tepat setelah node yang ditunjuk Q.

**9** · Label: `Delete After`
Soal: Diketahui list berikut dan `P` menunjuk node `8`. Setelah kode dijalankan, isi list menjadi…
initialList: `[3, 8, 5, 2]` (tandai node 8 dengan label `P`)
```cpp
Q = P->next;
P->next = Q->next;
Q->next = Nil;
```
- ✅ `3 → 8 → 2`
- `3 → 5 → 2`
- `3 → 8 → 5`
- `3 → 2`

Hint: Q adalah node yang dilepas, yaitu node tepat setelah P.

**10** · Label: `Kombinasi: Delete First, Insert Last, Insert First`
Soal: Diketahui list berikut. Setelah kode dijalankan, isi list menjadi…
initialList: `[10, 20, 30]`
```cpp
deleteFirst(L, P);
Q = alokasi(40);
insertLast(L, Q);
insertFirst(L, P);
```
- ✅ `10 → 20 → 30 → 40`
- `20 → 30 → 40 → 10`
- `20 → 30 → 40`
- `10 → 30 → 40`

Hint: Node yang dihapus di langkah pertama tidak di-dealokasi, jadi masih bisa dipakai lagi.

`ListVisual` menggambar setiap node sebagai kotak dua sel `[data | next]` dengan panah ke node berikutnya, diakhiri `Nil`. Pointer `L.first` mengarah ke node pertama, dan label pointer (Q/P) diletakkan di atas node yang ditunjuk.

---

## 10. Suara (`lib/sound.ts`, Web Audio API)

Buat satu `AudioContext` lazy (dibuat saat klik "Masuk Dungeon"). Setiap efek berupa fungsi kecil, menggunakan oscillator `square`/`triangle` dengan envelope gain singkat (gaya chiptune):

| Fungsi | Kapan | Karakter suara |
|---|---|---|
| `click()` | klik tombol pilihan | blip pendek |
| `correct()` | jawaban benar | arpeggio naik 3 nada |
| `wrong()` | salah / timeout | buzz rendah turun |
| `hint()` | buka Peta Kuno | chime lembut 2 nada |
| `tick()` | 5 detik terakhir timer | tik pendek |
| `heal()` | +1 nyawa dari combo | 2 nada naik cepat |
| `darkMode()` | nyawa jadi 0 | drone rendah ±1 detik |
| `step()` | karakter berjalan | 2 langkah pelan |
| `ending(tier)` | layar akhir | jingle beda tiap tier (lihat bagian 7) |

- Tombol 🔊/🔇 di HUD dan layar akhir, dengan pilihan yang disimpan di `localStorage`.
- Volume master tidak terlalu keras (gain ±0.15).

---

## 11. Persistensi, Anti-Curang, dan Verifikasi

### 11.1 Progres (anti-refresh) — `lib/storage.ts`
- Simpan seluruh state sesi ke `localStorage` dengan key `pq_session`: nama, NIM, urutan soal & opsi hasil acakan, index ruang, jawaban per soal, hint per soal, nyawa, combo, deadline timer, waktu mulai, dan status selesai.
- Saat halaman dibuka:
  - Kalau ada sesi yang belum selesai, **lanjutkan langsung** di ruang yang sama dengan deadline yang sama. Kalau deadline sudah lewat selama halaman tertutup, soal itu dihitung timeout.
  - Kalau ada sesi yang sudah selesai, tampilkan langsung layar akhir (kartu skor yang sama).
- Counter percobaan disimpan di key `pq_attempts` (dimulai dari 1) dan bertambah saat "Main Lagi" dikonfirmasi.
- Semua akses `localStorage` dibungkus `try/catch`. Kalau storage tidak tersedia, game tetap bisa dimainkan tanpa persistensi.

### 11.2 Kode Verifikasi — `lib/verify.ts`
- `makeCode({ nama, nim, skor, benar, hint, percobaan }) → string` (6 karakter).
- Langkah pembuatannya: normalisasi nama (`trim`, spasi ganda menjadi satu, lowercase), lalu gabungkan semua field dengan `|` ditambah konstanta `SALT = 'pq-sll-2526'`. Hash hasilnya dengan **FNV-1a 32-bit**, ubah ke base36 uppercase, dan ambil 6 karakter (pad `0` di depan jika kurang).
- Fungsi yang sama dipakai oleh game dan halaman `/cek`.
- Tambahkan komentar di kode: kode ini hanya penghalang ringan, karena salt ada di bundle client.

### 11.3 Halaman `/cek` (untuk asprak)
- Tidak ada link ke halaman ini dari halaman mana pun. Pasang `<meta name="robots" content="noindex">`.
- Isinya form: Nama, NIM, Skor, Jumlah Benar, Hint dipakai, Percobaan ke-, dan Kode.
- Setelah tombol **Cek** ditekan, tampilkan "✅ VALID" (hijau) jika kode cocok dengan hasil `makeCode`, atau "❌ TIDAK VALID: data di SS kemungkinan diedit" (merah) jika tidak cocok.
- Tambahkan juga cek konsistensi: skor harus sama dengan `10×(benar−hint_benar) + 5×hint_benar`. Karena hint_benar tidak diketahui, cukup cek bahwa skor kelipatan 5, skor ≤ benar×10, dan skor ≥ benar×10 − hint×5.

---

## 12. Kualitas & Pengujian

- **Self-check** `lib/game.test.ts` menggunakan `node:test` + `node:assert`, dijalankan dengan `node --test lib/game.test.ts` (Node ≥ 23.6, type stripping bawaan; jangan tambah vitest/jest). Uji:
  1. Perhitungan skor: benar = 10, benar+hint = 5, salah = 0, timeout = 0.
  2. Nyawa: salah mengurangi 1 dan tidak bisa di bawah 0, combo 3 benar memberi +1 dan tidak bisa di atas 3, hint ditolak saat nyawa 0.
  3. Urutan: 7 soal pertama selalu easy dan 3 soal terakhir selalu expert, dan shuffle tidak menghilangkan/menggandakan soal.
  4. Tier ending: 10 → legendary, 9 & 7 → conqueror, 6 & 4 → survivor, 3 & 0 → lost.
  5. `makeCode` deterministik, dan mengubah salah satu field menghasilkan kode berbeda.
- Fungsi-fungsi di `lib/game.ts` dibuat **murni** (tanpa React) supaya bisa diuji.
- Tidak ada error/warning TypeScript, dan `npm run build` berhasil menghasilkan `out/`.

## 13. Desain Visual & Aksesibilitas

- Gaya **pixel dungeon gelap**: latar batu gelap (`#1a1625`-ish), aksen obor oranye, hijau untuk benar, merah untuk salah, ungu untuk expert, emas untuk legendary. Border tebal ala pixel (`box-shadow` bertingkat), tanpa sudut membulat besar.
- Responsif: wajib nyaman dimainkan di HP (lebar 360px), dengan side gutter 16px dan **tanpa scroll horizontal halaman**.
- Tombol pilihan minimal 44px tinggi, dan bisa dipilih dengan keyboard (tombol `1–4` atau `A–D`). Hint bisa dibuka dengan tombol `H`.
- Hormati `prefers-reduced-motion`: matikan shake, confetti, dan animasi jalan, cukup ganti warna saja.
- Kontras teks memenuhi WCAG AA. Teks isi minimal 18px (VT323 kecil sulit dibaca).
- Feedback benar/salah tidak boleh hanya mengandalkan warna. Wajib ada ikon ✅/❌ dan teks.

## 14. Kriteria Selesai (Acceptance Criteria)

1. Praktikan tidak bisa mulai tanpa Nama & NIM yang valid.
2. 10 soal muncul dengan easy di ruang 1–7 dan expert di ruang 8–10, dan urutan serta opsinya teracak.
3. Setelah memilih jawaban, game otomatis lanjut tanpa tombol Next. Kunci jawaban tidak pernah ditampilkan.
4. Timer 30s/90s berjalan, dan ketika habis dihitung salah lalu otomatis lanjut.
5. Hint memotong poin menjadi 5, dan tidak bisa dipakai saat nyawa 0 (Mode Gelap).
6. Nyawa berkurang saat salah/timeout dan bertambah dari combo 3 benar.
7. Refresh di tengah game melanjutkan ke soal yang sama, dan timer tidak ter-reset.
8. Layar akhir menampilkan salah satu dari 4 tier (10 / 7–9 / 4–6 / 0–3) dengan ucapan, warna, animasi, dan jingle yang berbeda, plus daftar materi yang perlu dipelajari.
9. Kartu skor memuat semua field di bagian 8 dan muat dalam satu layar.
10. Halaman `/cek` memvalidasi kode dengan benar.
11. Suara berfungsi dan bisa di-mute.
12. `node --test lib/game.test.ts` lulus dan `npm run build` sukses.

## 15. Deploy

Tulis `README.md` singkat berisi: cara menjalankan lokal (`npm install`, `npm run dev`), build (`npm run build`, lalu hasilnya ada di `out/`), langkah deploy ke Vercel, cara mengganti bank soal di `lib/questions.ts`, dan cara memakai halaman `/cek`.
