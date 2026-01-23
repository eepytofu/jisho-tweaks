# <img src="icons/icon128.png" alt="Jisho Tweaks icon" width="40" height="40" style="vertical-align: text-bottom; margin-right: 8px;" /> Jisho Tweaks

[English](./README.md) | Bahasa Indonesia

Ekstensi Chrome (Manifest v3) untuk jisho.org yang menambahkan terjemahan bahasa Indonesia dan beberapa penyesuaian tampilan.

## Fitur

* Menerjemahkan arti bahasa Inggris ke bahasa Indonesia langsung di halaman.
* Menyembunyikan kolom arti selain bahasa Inggris.
* Memindahkan bacaan tambahan (Nanori, Pinyin, dan Korea) ke bagian atas, tepat di bawah On'yomi (dapat diaktifkan atau dinonaktifkan).
* Menampilkan ulang kode Unicode (U+XXXX) di bawah bagian Variants/Parts.
* Menyimpan hasil terjemahan di `localStorage`.
* Warna teks terjemahan menyesuaikan dengan mode terang atau gelap Jisho.

## Instalasi (developer mode)

1. Unduh atau clone repositori ini.
2. Buka `chrome://extensions`.
3. Aktifkan **Developer mode** (pojok kanan atas).
4. Klik **Load unpacked**.
5. Pilih folder repositori ini (yang berisi `manifest.json`).

## Cara menggunakan

1. Buka jisho.org (halaman kanji atau kosakata).
2. Klik ikon **Jisho Tweaks** di toolbar Chrome untuk membuka popup.
3. Aktifkan atau nonaktifkan fitur yang tersedia melalui toggle.
4. Perubahan diterapkan ke halaman Jisho yang sedang dibuka. Beberapa perubahan mungkin memerlukan refresh halaman.
5. Gunakan **Clear translation cache** jika ingin menghapus data terjemahan.

## Permissions

* `storage`
* `host_permissions`:

  * `https://jisho.org/*`
  * `https://translate.googleapis.com/*`

## Catatan

* Menggunakan endpoint publik Google Translate (gtx). Jika gagal, teks asli tetap ditampilkan tanpa terjemahan tambahan.
* Dilisensikan di bawah GNU GPL v3.0.
