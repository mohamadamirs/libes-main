import type { APIRoute } from 'astro';
import { sql } from '../lib/db';

export const GET: APIRoute = async ({ url: requestUrl }) => {
  // Gunakan origin dari request atau hardcode domain produksi
  const baseUrl = 'https://literasibrebesan.my.id';

  try {
    // 1. Ambil semua artikel (Posts) yang sudah di-publish
    const { rows: posts } = await sql`
      SELECT slug, updated_at
      FROM posts
      WHERE status = 'published'
      ORDER BY updated_at DESC
    `;

    // 2. Ambil profil penulis yang aktif (minimal punya 1 post published)
    const { rows: profiles } = await sql`
      SELECT p.id, MAX(po.updated_at) as last_updated
      FROM profiles p
      JOIN posts po ON p.id = po.user_id
      WHERE po.status = 'published'
      GROUP BY p.id
    `;

    // 3. Ambil Agenda yang sudah di-publish
    const { rows: agendas } = await sql`
      SELECT id, updated_at
      FROM agendas
      WHERE status = 'published'
      ORDER BY updated_at DESC
    `;

    // Struktur Data Sitemap
    const urls: { loc: string; lastmod: string; changefreq: string; priority: string }[] = [];

    // --- Halaman Statis ---
    const staticPages = [
      { path: '/', changefreq: 'daily', priority: '1.0' },
      { path: '/publikasi', changefreq: 'daily', priority: '0.9' },
      { path: '/dokumentasi', changefreq: 'weekly', priority: '0.8' },
    ];

    staticPages.forEach(page => {
      urls.push({
        loc: `${baseUrl}${page.path}`,
        lastmod: new Date().toISOString(),
        changefreq: page.changefreq,
        priority: page.priority
      });
    });

    // --- Halaman Dinamis: Artikel (Posts) ---
    posts.forEach((post) => {
      urls.push({
        loc: `${baseUrl}/publikasi/${post.slug}`,
        lastmod: new Date(post.updated_at).toISOString(),
        changefreq: 'monthly',
        priority: '0.7',
      });
    });

    // --- Halaman Dinamis: Agenda ---
    agendas.forEach((agenda) => {
      urls.push({
        loc: `${baseUrl}/#agenda`, // Karena agenda biasanya tampil di Home (ID anchor) atau halaman khusus
        lastmod: new Date(agenda.updated_at).toISOString(),
        changefreq: 'weekly',
        priority: '0.6',
      });
    });

    // --- Halaman Dinamis: Profil Penulis ---
    profiles.forEach((profile) => {
      urls.push({
        loc: `${baseUrl}/p/${profile.id}`,
        lastmod: new Date(profile.last_updated).toISOString(),
        changefreq: 'weekly',
        priority: '0.5',
      });
    });

    // Konstruksi XML yang bersih tanpa spasi di awal
    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((url) => `  <url>
    <loc>${url.loc}</loc>
    <lastmod>${url.lastmod}</lastmod>
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority}</priority>
  </url>`).join('\n')}
</urlset>`.trim();

    return new Response(sitemap, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'X-Content-Type-Options': 'nosniff',
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=600',
      },
    });
  } catch (error) {
    console.error("Gagal generate sitemap:", error);
    // Kembalikan sitemap minimal jika error agar crawler tidak bingung
    return new Response(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>`, {
      status: 200, // Tetap 200 agar Google bisa baca sitemap darurat ini
      headers: { 'Content-Type': 'application/xml' },
    });
  }
};