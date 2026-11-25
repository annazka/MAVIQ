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

## Usaha dengan Supabase

1. Jalankan [migrasi workspace](migrations/001_maviq_workspace.sql) pada Supabase SQL Editor. Migrasi menyiapkan tabel dan bucket privat dengan kebijakan akses per pemilik.
2. Salin nama variabel dari [.env.example](.env.example) ke Vercel Project Settings → Environment Variables. Isi `VITE_SUPABASE_URL` dan `VITE_SUPABASE_PUBLISHABLE_KEY` untuk Auth. Isi `SUPABASE_URL` dan `SUPABASE_SECRET_KEY` untuk fungsi server. Aktifkan variabel pada cakupan Preview yang digunakan.
3. Tambahkan URL deployment ke pengaturan URL Supabase Auth, lalu deploy ulang. Masuk atau daftar dari menu akun di MAVIQ.
4. Isi nilai `VERYFI_CLIENT_ID`, `VERYFI_USERNAME`, dan `VERYFI_API_KEY` untuk OCR. Isi `GEMINI_API_KEY` untuk narasi briefing. Saat penyedia gagal atau belum dikonfigurasi, pembelian tetap dapat diisi manual dan briefing memakai ringkasan otomatis.

Kredensial server harus disimpan sebagai secret Vercel. Variabel dengan awalan `VITE_` dikirim ke peramban pada waktu build.

Frontend Vite dapat dijalankan sendiri untuk demo. Gunakan `vercel dev` atau Preview Deployment saat menguji fungsi server. Penyimpanan MVP menggunakan satu snapshot PostgreSQL per pemilik dengan pembaruan bersyarat pada revisi yang sama. Server memvalidasi perintah dan menyimpan perubahan stok, kas, dan riwayat sebagai satu pembaruan atomik. Kiriman ulang menggunakan ID perintah. Unggahan struk disimpan di bucket privat per pemilik.

Uji lokal mencakup pembanding finansial pada workflow. Konfigurasi Auth, OCR, dan Gemini perlu diuji dengan kredensial preview yang sebenarnya sebelum demonstrasi end-to-end. Harga pasar dan ekspor berada di luar cakupan preview ini.
