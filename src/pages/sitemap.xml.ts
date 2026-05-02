import type { APIRoute } from 'astro';
import { sql } from '../lib/db';

export const prerender = true;

export const GET: APIRoute = async () => {
  const baseUrl = 'https://literasibrebesan.my.id';

  try {
    const { rows: posts } = await sql`SELECT slug, updated_at FROM posts WHERE status = 'published' ORDER BY updated_at DESC`;
    const { rows: profiles } = await sql`SELECT p.id, MAX(po.updated_at) as last_updated FROM profiles p JOIN posts po ON p.id = po.user_id WHERE po.status = 'published' GROUP BY p.id`;
    const { rows: agendas } = await sql`SELECT id, updated_at FROM agendas WHERE status = 'published' ORDER BY updated_at DESC`;

    const urls: string[] = [];

    // Static
    ['/', '/publikasi', '/dokumentasi'].forEach(path => {
      urls.push(`<url><loc>${baseUrl}${path}</loc><lastmod>${new Date().toISOString()}</lastmod><changefreq>daily</changefreq><priority>1.0</priority></url>`);
    });

    // Posts
    posts.forEach(post => {
      urls.push(`<url><loc>${baseUrl}/publikasi/${post.slug}</loc><lastmod>${new Date(post.updated_at).toISOString()}</lastmod><changefreq>monthly</changefreq><priority>0.8</priority></url>`);
    });

    // Agendas
    agendas.forEach(agenda => {
      urls.push(`<url><loc>${baseUrl}/#agenda</loc><lastmod>${new Date(agenda.updated_at).toISOString()}</lastmod><changefreq>weekly</changefreq><priority>0.6</priority></url>`);
    });

    // Profiles
    profiles.forEach(profile => {
      urls.push(`<url><loc>${baseUrl}/p/${profile.id}</loc><lastmod>${new Date(profile.last_updated).toISOString()}</lastmod><changefreq>weekly</changefreq><priority>0.5</priority></url>`);
    });

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.join('')}</urlset>`;

    return new Response(sitemap, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, s-maxage=3600',
      },
    });
  } catch (error) {
    const emergency = `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${baseUrl}</loc><priority>1.0</priority></url></urlset>`;
    return new Response(emergency, { status: 200, headers: { 'Content-Type': 'application/xml' } });
  }
};
