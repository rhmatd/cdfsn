# C-DFS PHP/XAMPP

Struktur:
C-DFS-PHP/
├── index.html
├── img/ (logo-cdfs.png, favicon.png, logo-cdfs-full.jpg)
├── css/style.css
├── js/app.js
├── php/config.php
├── php/api.php
├── database/cdfs.sql
├── database/migrasi_role_jobseeker.sql
├── database/migrasi_kompetensi.sql
├── database/migrasi_jobmatching.sql
└── README.md

Jalankan:
1. Copy folder ke C:\xampp\htdocs\C-DFS
2. Start Apache + MySQL.
3. Import database/cdfs.sql melalui phpMyAdmin.
4. Pastikan php/config.php cocok dengan MySQL.
5. Buka http://localhost/C-DFS/

Jangan membuka index.html dengan double-click jika ingin PHP/MySQL aktif.

Registrasi (3 langkah, tanpa verifikasi OTP):
1. Informasi Diri (nama, email, instansi)
2. Pilih Peran: Jobseeker atau Jobprovider
3. Registrasi Selesai

Antarmuka Jobseeker:
- Dashboard            : pilih Jalur Pendidikan & Program Studi lewat kolom pencarian
                         (ketik nama atau kode, mis. "TRSE"; jalur ikut terisi otomatis)
                         * Akademis  : Matematika, Pendidikan Anak Usia Dini (PAUD)
                         * Vocational: Teknologi Rekayasa Sistem Elektronika (TRSE), Manajemen Pemasaran (MP)
- Job Matching         : 1) upload transkrip nilai (PDF) -> mata kuliah, SKS, nilai, prodi, dan IPK terdeteksi otomatis
                            (dibaca di browser dengan pdf.js; format Rekap Hasil Studi SIAKAD UM sudah diuji)
                         2) upload sertifikat (PDF/JPG/PNG, boleh banyak) -> jenis BNSP/Non-BNSP, nama skema, dan LSP terdeteksi
                            (hasil deteksi bisa dikoreksi langsung di daftar)
                         3) "Analisis dengan AI" -> nilai terbaik, pekerjaan yang paling cocok, dan kecocokan/peluang per lowongan
                         Lowongan = kebutuhan kompetensi tiap Jobprovider per program studi (menu Kelola Kompetensi).
                         Kecocokan = 30% prodi sesuai + 70% rata-rata bukti kompetensi
                                     (bukti: mata kuliah terkait = nilai/4; sertifikat BNSP 1,0 / Non-BNSP 0,8; profil prodi 0,5)
                         Peluang   = 60% kecocokan + 25% IPK/4 + 15% kekuatan sertifikat  ->  Tinggi >=75, Sedang 50-74, Rendah <50
                         Profil pekerjaan ada di js/app.js -> JOB_ROLES (sesuaikan dengan profil lulusan prodi).
                         File yang di-upload TIDAK disimpan di server; yang disimpan hanya data hasil deteksinya.

Analisis AI (opsional, disarankan):
- Isi AI_API_KEY di php/config.php dengan API key Claude (console.anthropic.com); AI_MODEL bisa disesuaikan.
- Dengan API key: transkrip hasil scan / format lain dan sertifikat berupa gambar dibaca oleh AI,
  dan ringkasan analisis ditulis oleh AI.
- Tanpa API key: transkrip PDF berbasis teks dan sertifikat PDF tetap terdeteksi otomatis; sertifikat gambar
  perlu dikoreksi manual; ringkasan dibuat otomatis dari skor.
- Pastikan ekstensi cURL aktif di XAMPP (php.ini: extension=curl). Batas file untuk AI 5 MB
  (sesuai post_max_size bawaan XAMPP 8M).

- Kebutuhan Industri & Future Skills : satu halaman dengan 2 tab
- Analisis Gap & Kurikulum           : satu halaman dengan 3 tab (Analisis Gap, Rekomendasi Kurikulum, Kurikulum / Peta)
- Tracer Study, Laporan
Daftar prodi ada di js/app.js (PRODI_BY_JALUR) dan php/api.php (PRODI_BY_JALUR) — ubah keduanya bila menambah prodi.

Antarmuka Jobprovider (menu sidebar otomatis menyesuaikan peran saat login):
- Ringkasan Rekrutmen  : nama perusahaan, jumlah kompetensi, kandidat cocok, shortlist,
                         kompetensi per prodi, dan 5 kandidat teratas
- Kelola Kompetensi    : tambah/hapus kompetensi yang dibutuhkan + program studi terkait
                         (ada saran kompetensi per prodi, tinggal klik)
- Rekomendasi Kandidat : Jobseeker diurutkan menurut skor kecocokan, filter prodi/skor, bisa di-shortlist
                         Skor = 40% jika prodi kandidat termasuk prodi pada daftar kompetensi
                              + 60% porsi kompetensi yang ada di profil kompetensi prodi kandidat
                         (profil kompetensi ada di js/app.js -> PRODI_SKILLS; sesuaikan dengan CPL prodi)
Tanpa PHP/MySQL aktif, halaman berjalan dalam mode demo (kandidat berlabel "DATA CONTOH").

Database lama yang sudah terlanjur di-import:
1. database/migrasi_role_jobseeker.sql  (jika masih memakai role Administrator PT / Dosen)
2. database/migrasi_kompetensi.sql      (tabel kompetensi & shortlist_kandidat)
3. database/migrasi_jobmatching.sql     (tabel jobseeker_profil: transkrip & sertifikat)

Registrasi demo memakai password awal CDFS@12345.
