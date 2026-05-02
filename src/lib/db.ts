import { sql } from "@vercel/postgres";

// Mencegah file ini tidak sengaja ter-import di sisi client (browser)
if (typeof window !== "undefined") {
  throw new Error("Database library hanya boleh dijalankan di sisi Server.");
}

// SDK Vercel Postgres mencari process.env.POSTGRES_URL.
// Di Astro, kita pastikan tersedia dari import.meta.env jika di lingkungan dev/prod.
if (!process.env.POSTGRES_URL && import.meta.env.POSTGRES_URL) {
  process.env.POSTGRES_URL = import.meta.env.POSTGRES_URL;
}

export { sql };
