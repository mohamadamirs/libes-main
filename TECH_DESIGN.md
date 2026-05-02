# Technical Design Document - Literasi Brebesan (libes-main)

Dokumen ini merinci arsitektur teknis, tumpukan teknologi, dan desain sistem untuk proyek **Literasi Brebesan**.

## 1. Tumpukan Teknologi (Tech Stack)

| Komponen | Teknologi |
| :--- | :--- |
| **Framework Utama** | [Astro](https://astro.build/) (v4.x) |
| **UI Library (Islands)** | [Preact](https://preactjs.com/) |
| **Bahasa Pemrograman** | [TypeScript](https://www.typescriptlang.org/) |
| **Database** | PostgreSQL (Vercel Postgres) |
| **ORM** | [Drizzle ORM](https://orm.drizzle.team/) |
| **Otentikasi** | JWT (JSON Web Tokens) & Cookies |
| **Penyimpanan Gambar/Arsip** | Google Drive API |
| **Styling** | Vanilla CSS & Tailwind CSS |

## 2. Arsitektur Sistem

Proyek ini menggunakan pola arsitektur **Islands Architecture** khas Astro dengan pemisahan tanggung jawab yang ketat:

### A. Middleware (`src/middleware.ts`)
Bertanggung jawab atas:
- Verifikasi keamanan pada setiap permintaan (request).
- Validasi JWT dari cookies.
- Proteksi rute berdasarkan peran (Role-based Access Control):
    - `/admin/*`: Hanya untuk admin.
    - `/dashboard`, `/profile`: Hanya untuk pengguna terotentikasi.
- Redireksi otomatis jika pengguna tidak memiliki akses.

### B. Astro Actions (`src/actions/`)
Logika bisnis sisi server yang dipisahkan berdasarkan domain:
- `auth.ts`: Registrasi, login, dan logout.
- `posts.ts`: CRUD untuk artikel dan publikasi.
- `agenda.ts`: Pengelolaan jadwal kegiatan.
- `profile.ts`: Pembaruan informasi pengguna.

### C. Library & Utilitas (`src/lib/`)
- `db.ts`: Inisialisasi koneksi database menggunakan Drizzle.
- `googleDrive.ts`: Abstraksi API Google Drive untuk navigasi folder dan pengambilan file.
- `jwt.ts`: Utilitas untuk pembuatan dan verifikasi token.
- `utils.ts`: Fungsi pembantu umum (format tanggal, manipulasi string, dll).

## 3. Integrasi Google Drive

Sistem integrasi Google Drive dirancang untuk mengelola arsip dokumentasi secara dinamis tanpa membebani penyimpanan server utama:

- **Navigasi:** Folder di Google Drive dipetakan ke struktur navigasi di situs.
- **Caching:** Menggunakan mekanisme cache internal untuk mengurangi latensi panggilan API Google Drive.
- **Image Proxy (`/api/drive-image/[id]`)**: Karena Google Drive tidak mengizinkan akses gambar langsung (hotlinking) dengan mudah, sistem ini menggunakan API route sebagai proxy untuk mengalirkan data gambar ke frontend.

## 4. Model Data

Skema database didefinisikan secara relasional untuk mendukung fitur komunitas:

- **Users & Profiles:** Memisahkan data kredensial (email, password) dengan data publik (nama, bio, foto).
- **Posts:** Mendukung sistem kategori, slug unik untuk SEO, dan status publikasi (Draft/Published).
- **Agendas:** Menyimpan data kegiatan dengan detail waktu dan lokasi.

## 5. Struktur Folder Utama

```text
src/
├── actions/      # Logika server-side (Astro Actions)
├── components/   # UI Components (Astro & Preact)
│   ├── main/     # Komponen landing page
│   └── docs/     # Komponen galeri/arsip Drive
├── layouts/      # Template halaman utama
├── lib/          # Utilitas inti dan konfigurasi DB
└── pages/        # Definisi rute (file-based routing)
    ├── admin/    # Panel admin
    ├── api/      # Endpoint API internal
    └── publikasi/# Halaman konten publik
```

## 6. Alur Kerja Pengembangan

1. **Reproduction:** Selalu buat test case atau script reproduksi sebelum memperbaiki bug.
2. **Type Safety:** Pastikan semua data memiliki interface/type yang jelas.
3. **Performance:** Gunakan komponen Astro (static) sebanyak mungkin, dan gunakan Preact (client islands) hanya saat interaktivitas diperlukan.
