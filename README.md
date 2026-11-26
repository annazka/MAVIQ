# MAVIQ

Aplikasi operasional untuk UMKM kuliner. Dashboard menyatukan pencatatan pembelian, stok bahan, resep, penjualan, estimasi HPP, dan arus kas dalam rupiah. Periode laporan menggunakan Asia/Jakarta.

## Preview dan pengembangan

```sh
npm ci
npm run dev
npm test
npm run build
```

Impor repo ke Vercel sebagai proyek Vite dan pilih branch `tes` untuk membuat Preview Deployment. Build memakai Node.js 22 atau lebih baru dan menghasilkan folder `dist`. Mode demo langsung dapat dipakai tanpa konfigurasi. Data simulasi tersimpan per peramban di localStorage.

Pada branch `landing-page`, halaman publik tersedia di `/` dan dashboard di `/app/`. Pilih branch tersebut untuk meninjau landing page di Vercel. Maskot **Panduan** dapat diseret, membuka tautan ke bagian halaman, dan memulai tur otomatis yang berhenti saat pengunjung kembali menggulir.

## Usaha dengan Supabase

1. Jalankan [migrasi workspace](migrations/001_maviq_workspace.sql) pada Supabase SQL Editor. Migrasi menyiapkan tabel dan bucket privat dengan kebijakan akses per pemilik.
2. Salin nama variabel dari [.env.example](.env.example) ke Vercel Project Settings → Environment Variables. Isi `VITE_SUPABASE_URL` dan `VITE_SUPABASE_PUBLISHABLE_KEY` untuk Auth. Isi `SUPABASE_URL` dan `SUPABASE_SECRET_KEY` untuk fungsi server. Aktifkan variabel pada cakupan Preview yang digunakan.
3. Tambahkan URL deployment dan path `/app/` ke daftar redirect URL Supabase Auth, lalu deploy ulang. Masuk atau daftar dari menu akun di MAVIQ.
4. Isi nilai `VERYFI_CLIENT_ID`, `VERYFI_USERNAME`, dan `VERYFI_API_KEY` untuk OCR. Isi `GEMINI_API_KEY` untuk narasi briefing. Saat penyedia gagal atau belum dikonfigurasi, pembelian tetap dapat diisi manual dan briefing memakai ringkasan otomatis.

Kredensial server harus disimpan sebagai secret Vercel. Variabel dengan awalan `VITE_` dikirim ke peramban pada waktu build.

Frontend Vite dapat dijalankan sendiri untuk demo. Gunakan `vercel dev` atau Preview Deployment saat menguji fungsi server. Penyimpanan MVP menggunakan satu snapshot PostgreSQL per pemilik dengan pembaruan bersyarat pada revisi yang sama. Server memvalidasi perintah dan menyimpan perubahan stok, kas, dan riwayat sebagai satu pembaruan atomik. Kiriman ulang menggunakan ID perintah. Unggahan struk disimpan di bucket privat per pemilik.

Uji lokal mencakup pembanding finansial pada workflow. Konfigurasi Auth, OCR, dan Gemini perlu diuji dengan kredensial preview yang sebenarnya sebelum demonstrasi end-to-end. Ekspor berada di luar cakupan preview ini.

## Harga pasar harian

Menu **Harga Pasar** mengambil harga referensi pasar tradisional dari [PIHPS Nasional Bank Indonesia](https://www.bi.go.id/hargapangan/TabelHarga/PasarTradisionalDaerah) melalui endpoint publik yang digunakan tabel PIHPS. Fitur ini berjalan di mode demo dan akun usaha, tanpa API key tambahan. Pilih data nasional atau provinsi yang tersedia di PIHPS dan tanggal hingga satu tahun terakhir.

Harga mencantumkan satuan, tanggal publikasi per komoditas, dan perubahan dari publikasi sebelumnya dalam delapan hari terakhir. Jika data belum terbit, aplikasi menampilkan publikasi terakhir yang tersedia pada rentang tersebut. Jika sumber sedang gagal, aplikasi dapat menampilkan salinan terakhir di peramban untuk wilayah dan tanggal yang sama. Harga referensi ditampilkan terpisah dari transaksi dan HPP MAVIQ.

## Asisten MAVIQ

Maskot 2D di kanan bawah menampilkan bubble setelah 15–45 detik tanpa interaksi, lalu memberi jeda acak 40–85 detik antar-bubble saat pengguna tetap idle. Bubble otomatis muncul selama sekitar 6,5 detik. Mengarahkan kursor ke maskot juga memicu animasi dan bubble, yang menghilang ketika kursor meninggalkan maskot. Bubble pertama memprioritaskan peringatan stok jika ada, lalu bergantian antara sapaan waktu WIB, pengingat transaksi jika hari masih kosong, dan tawaran bantuan. Panel dibuka lewat klik, ketukan, atau Enter.

Di mode demo, pertanyaan stok, kas, penjualan, dan harga pasar dijawab dari data simulasi. Akun usaha memakai ringkasan milik pengguna dan Gemini untuk pertanyaan bebas melalui endpoint workspace. Chatbot dan briefing berbagi `GEMINI_API_KEY` dan `GEMINI_MODEL`. Percakapan berada di memori peramban selama halaman aktif. Chatbot hanya memberi informasi.
