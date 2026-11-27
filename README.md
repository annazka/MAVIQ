# MAVIQ

MAVIQ (Merchant Analytics & Venture Intelligence Quotient) adalah platform pengelolaan bisnis dan pendukung keputusan berbasis AI untuk UMKM Indonesia, dengan fokus awal pada sektor kuliner. Dashboard menyatukan pencatatan pembelian, stok bahan, resep, penjualan, estimasi HPP, dan arus kas dalam rupiah. Periode laporan menggunakan Asia/Jakarta.

## Preview dan pengembangan

```sh
npm ci
npm run dev
npm test
npm run build
```

Impor repo ke Vercel sebagai proyek Vite dan pilih branch yang ingin diuji untuk membuat Preview Deployment. Build memakai Node.js 22 atau lebih baru dan menghasilkan folder `dist`. Pengunjung bisa membaca halaman publik. Untuk menggunakan dashboard, masuk atau buat akun dengan Google atau email.

Halaman publik tersedia di `/` dan dashboard di `/app/`. Maskot **Panduan** dapat diseret, membuka tautan ke bagian halaman, dan memulai tur otomatis yang berhenti saat pengunjung kembali menggulir.

## Usaha dengan Supabase

1. Jalankan [migrasi workspace](migrations/001_maviq_workspace.sql) pada Supabase SQL Editor. Migrasi menyiapkan tabel dan bucket privat dengan kebijakan akses per pemilik.
2. Salin nama variabel dari [.env.example](.env.example) ke Vercel Project Settings → Environment Variables. Isi `VITE_SUPABASE_URL` dan `VITE_SUPABASE_PUBLISHABLE_KEY` untuk Auth. Isi `SUPABASE_URL` dan `SUPABASE_SECRET_KEY` untuk fungsi server. Aktifkan variabel pada cakupan Preview yang digunakan.
3. Di Supabase Auth → URL Configuration, tetapkan Site URL dan tambahkan redirect `https://<host-aktif>/app/**` untuk setiap domain MAVIQ yang dipakai. Pola tersebut mencakup parameter callback di bawah `/app/`. Masuk atau daftar dari menu akun di MAVIQ.
4. Isi nilai `VERYFI_CLIENT_ID`, `VERYFI_USERNAME`, dan `VERYFI_API_KEY` untuk OCR. Isi `GEMINI_API_KEY` untuk narasi briefing. Saat penyedia gagal atau belum dikonfigurasi, pembelian tetap dapat diisi manual dan briefing memakai ringkasan otomatis.

Simpan `SUPABASE_SECRET_KEY`, `VERYFI_*`, dan `GEMINI_API_KEY` di Environment Variables Vercel atau di environment lokal yang diabaikan Git. `.env.example` berfungsi sebagai daftar variabel tanpa kredensial. Hanya URL Supabase dan publishable key atau legacy anon key yang diperlukan di browser. Build menolak key dengan peran selain `anon` pada variabel publishable serta nama variabel privat yang keliru memakai awalan `VITE_`.

### Login Google

1. Di Google Cloud Console, siapkan layar persetujuan OAuth dan buat OAuth Client bertipe **Web application**. Jika aplikasi Google masih berstatus Testing, tambahkan email penguji.
2. Isi **Authorized redirect URI** di Google dengan callback Supabase untuk proyek ini, biasanya `https://<project-ref>.supabase.co/auth/v1/callback`. Salin URL persisnya dari pengaturan provider Google di Supabase.
3. Di Supabase Auth → Sign In / Providers → Google, aktifkan Google dan simpan Google Client ID serta Client Secret di sana. Aplikasi MAVIQ memakai Supabase sebagai perantara OAuth.
4. Buka **Masuk → Lanjutkan dengan Google** pada domain MAVIQ yang tercantum di redirect allowlist Supabase. Untuk konfirmasi email atau reset kata sandi, buka tautan di peramban yang sama agar callback PKCE bisa diverifikasi.

Kredensial Google Client Secret dikelola di Supabase. Endpoint usaha memeriksa token pengguna dan mengambil data berdasarkan pemilik. Pengunjung tanpa sesi diarahkan ke formulir masuk.

Frontend Vite dapat dijalankan sendiri untuk meninjau halaman publik dan tampilan formulir. Gunakan `vercel dev` atau Preview Deployment saat menguji fungsi server. Penyimpanan MVP menggunakan satu snapshot PostgreSQL per pemilik dengan pembaruan bersyarat pada revisi yang sama. Server memvalidasi perintah dan menyimpan perubahan stok, kas, dan riwayat sebagai satu pembaruan atomik. Kiriman ulang menggunakan ID perintah. Unggahan struk disimpan di bucket privat per pemilik.

Uji lokal mencakup pembanding finansial pada workflow. Konfigurasi Auth, OCR, dan Gemini perlu diuji dengan kredensial preview yang sebenarnya sebelum pengujian end-to-end. Ekspor berada di luar cakupan preview ini.

## Harga pasar harian

Menu **Harga Pasar** mengambil harga referensi pasar tradisional dari [PIHPS Nasional Bank Indonesia](https://www.bi.go.id/hargapangan/TabelHarga/PasarTradisionalDaerah) melalui endpoint publik yang digunakan tabel PIHPS. Ringkasan nasional tersedia di landing page dan filter lengkap tersedia setelah masuk. PIHPS dapat diakses tanpa API key tambahan. Pilih data nasional atau provinsi yang tersedia di PIHPS dan tanggal hingga satu tahun terakhir.

Harga mencantumkan satuan, tanggal publikasi per komoditas, dan perubahan dari publikasi sebelumnya dalam delapan hari terakhir. Jika data belum terbit, aplikasi menampilkan publikasi terakhir yang tersedia pada rentang tersebut. Jika sumber sedang gagal, aplikasi dapat menampilkan salinan terakhir di peramban untuk wilayah dan tanggal yang sama. Harga referensi ditampilkan terpisah dari transaksi dan HPP MAVIQ.

## Asisten MAVIQ

Maskot 2D di kanan bawah menampilkan bubble setelah 15–45 detik tanpa interaksi, lalu memberi jeda acak 40–85 detik antar-bubble saat pengguna tetap idle. Bubble otomatis muncul selama sekitar 6,5 detik. Mengarahkan kursor ke maskot juga memicu animasi dan bubble, yang menghilang ketika kursor meninggalkan maskot. Bubble pertama memprioritaskan peringatan stok jika ada, lalu bergantian antara sapaan waktu WIB, pengingat transaksi jika hari masih kosong, dan tawaran bantuan. Panel dibuka lewat klik, ketukan, atau Enter.

Asisten memakai ringkasan milik pengguna dan Gemini untuk pertanyaan bebas melalui endpoint workspace. Chatbot dan briefing berbagi `GEMINI_API_KEY` dan `GEMINI_MODEL`. Percakapan berada di memori peramban selama halaman aktif. Chatbot hanya memberi informasi.
