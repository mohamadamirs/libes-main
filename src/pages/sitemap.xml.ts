import type { APIRoute } from 'astro';
import { sql } from '../lib/db';

export const GET: APIRoute = async () => {
  const baseUrl = 'https://literasibrebesan.my.id';

  try {
    // Ambil semua artikel yang sudah di-publish
    const { rows: posts } = await sql`
      SELECT slug, updated_at
      FROM posts
      WHERE status = 'published'
      ORDER BY updated_at DESC
    `;

    // Ambil profil public (agar masuk sitemap)
    const { rows: profiles } = await sql`
      SELECT p.id, MAX(po.updated_at) as last_updated
      FROM profiles p
      JOIN posts po ON p.id = po.user_id
      WHERE po.status = 'published'
      GROUP BY p.id
    `;

    // URL Statis
    const urls = [
      { loc: '', lastmod: new Date().toISOString() },
      { loc: '/publikasi', lastmod: new Date().toISOString() },
      { loc: '/dokumentasi', lastmod: new Date().toISOString() },
      { loc: '/login', lastmod: new Date().toISOString() },
      { loc: '/register', lastmod: new Date().toISOString() },
    ];

    // URL Dinamis (Profil Penulis)
    profiles.forEach((profile) => {
      urls.push({
        loc: `/p/${profile.id}`,
        lastmod: new Date(profile.last_updated).toISOString(),
      });
    });

    // URL Dinamis (Artikel)
    posts.forEach((post) => {
      urls.push({
        loc: `/publikasi/${post.slug}`,
        lastmod: new Date(post.updated_at).toISOString(),
      });
    });

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((url) => `  <url>
    <loc>${baseUrl}${url.loc}</loc>
    <lastmod>${url.lastmod}</lastmod>
  </url>`).join('\n')}
</urlset>`;

    return new Response(sitemap, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=600', // Cache di Edge/Vercel CDN selama 1 jam
      },
    });
  } catch (error) {
    console.error("Gagal generate sitemap:", error);
    return new Response("Gagal membuat sitemap", { status: 500 });
  }
};
