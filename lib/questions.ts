export type Level = "easy" | "expert";

export type Question = {
  id: number;
  level: Level;
  label: string; // label materi
  prompt: string;
  initialList?: number[]; // untuk ListVisual (expert)
  marker?: { value: number; name: string }; // label pointer di atas node tertentu
  code?: string;
  options: string[]; // options[0] = jawaban benar (hanya di data; diacak saat runtime)
  hint: string;
};

export const QUESTIONS: Question[] = [
  {
    id: 1,
    level: "easy",
    label: "Istilah SLL: first/head",
    prompt: "Pointer pada list yang menunjuk alamat elemen pertama disebut…",
    options: ["first/head", "next", "Nil", "info"],
    hint: "Dia selalu berdiri di pintu masuk dungeon.",
  },
  {
    id: 2,
    level: "easy",
    label: "Istilah SLL: NULL/Nil",
    prompt: "Arti dari NULL/Nil adalah…",
    options: [
      "Tidak memiliki nilai / tidak mengacu ke mana pun",
      "Bernilai 0 dan bertipe int",
      "Alamat elemen pertama",
      "Elemen terakhir dalam list",
    ],
    hint: "Pintu keluar dungeon yang tidak mengarah ke ruangan mana pun.",
  },
  {
    id: 3,
    level: "easy",
    label: "Komponen Elemen: Successor",
    prompt: "Bagian elemen yang berfungsi sebagai penghubung antar elemen disebut…",
    options: ["Successor", "Data", "Elemen", "Info"],
    hint: "Bagian ini bukan tempat menyimpan informasi, tapi tempat menyimpan alamat elemen berikutnya.",
  },
  {
    id: 4,
    level: "easy",
    label: "Sifat Singly Linked List",
    prompt: "Pada Singly Linked List, arah pembacaan yang bisa dilakukan adalah…",
    options: ["Hanya maju", "Hanya mundur", "Maju dan mundur", "Acak"],
    hint: "“Singly” artinya hanya punya satu arah pointer.",
  },
  {
    id: 5,
    level: "easy",
    label: "Pengecekan List: isEmpty",
    prompt: "Fungsi `isEmpty()` mengembalikan `true` jika…",
    options: [
      "List kosong (`L.first == Nil`)",
      "List penuh",
      "List memiliki 1 elemen",
      "`next` elemen terakhir bernilai Nil",
    ],
    hint: "Kalau head tidak menunjuk ke mana pun, berarti…",
  },
  {
    id: 6,
    level: "easy",
    label: "Pengalokasian Memori",
    prompt: "Syntax alokasi elemen baru di C++ adalah…",
    options: [
      "`P = new elmlist;`",
      "`P = (address) malloc(sizeof(elmlist));`",
      "`delete P;`",
      "`free(P);`",
    ],
    hint: "Salah satu pilihan itu cara C, bukan C++.",
  },
  {
    id: 7,
    level: "easy",
    label: "Pembentukan List: createList",
    prompt: "Fungsi `createList()` mengeset `L.first` dengan nilai…",
    options: ["Nil", "0", "Alamat elemen pertama", "`new elmlist`"],
    hint: "List yang baru dibuat masih kosong.",
  },
  {
    id: 8,
    level: "expert",
    label: "Insert After",
    prompt: "Diketahui list berikut dan `Q` menunjuk node `9`. Setelah kode dijalankan, isi list menjadi…",
    initialList: [4, 9, 1],
    marker: { value: 9, name: "Q" },
    code: "P = alokasi(6);\nP->next = Q->next;\nQ->next = P;",
    options: ["4 → 9 → 6 → 1", "4 → 6 → 9 → 1", "4 → 9 → 1 → 6", "4 → 9 → 6"],
    hint: "P disisipkan tepat setelah node yang ditunjuk Q.",
  },
  {
    id: 9,
    level: "expert",
    label: "Delete After",
    prompt: "Diketahui list berikut dan `P` menunjuk node `8`. Setelah kode dijalankan, isi list menjadi…",
    initialList: [3, 8, 5, 2],
    marker: { value: 8, name: "P" },
    code: "Q = P->next;\nP->next = Q->next;\nQ->next = Nil;",
    options: ["3 → 8 → 2", "3 → 5 → 2", "3 → 8 → 5", "3 → 2"],
    hint: "Q adalah node yang dilepas, yaitu node tepat setelah P.",
  },
  {
    id: 10,
    level: "expert",
    label: "Kombinasi: Delete First, Insert Last, Insert First",
    prompt: "Diketahui list berikut. Setelah kode dijalankan, isi list menjadi…",
    initialList: [10, 20, 30],
    code: "deleteFirst(L, P);\nQ = alokasi(40);\ninsertLast(L, Q);\ninsertFirst(L, P);",
    options: ["10 → 20 → 30 → 40", "20 → 30 → 40 → 10", "20 → 30 → 40", "10 → 30 → 40"],
    hint: "Node yang dihapus di langkah pertama tidak di-dealokasi, jadi masih bisa dipakai lagi.",
  },
];

export const byId = (id: number): Question => {
  const q = QUESTIONS.find((x) => x.id === id);
  if (!q) throw new Error(`Soal ${id} tidak ada`);
  return q;
};
