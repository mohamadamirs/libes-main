import type { APIRoute } from 'astro';
import { sql } from '../lib/db';

export const GET: APIRoute = async () => {
  const baseUrl = 'https://literasibrebesan.my.id';

  try {
    const { rows: posts } = await sql`SELECT slug, updated_at FROM posts WHERE status = 'published' ORDER BY updated_at DESC`;
    const { rows: profiles } = await sql`SELECT p.id, MAX(po.updated_at) as last_updated FROM profiles p JOIN posts po ON p.id = po.user_id WHERE po.status = 'published' GROUP BY p.id`;
    const { rows: agendas } = await sql`SELECT id, updated_at FROM agendas WHERE status = 'published' ORDER BY updated_at DESC`;

    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

    // Home
    xml += `  <url>\n    <loc>${baseUrl}/</loc>\n    <lastmod>${new Date().toISOString()}</lastmod>\n    <changefreq>daily</changefreq>\n    <priority>1.0</priority>\n  </url>\n`;

    // Static Pages
    ['/publikasi', '/dokumentasi'].forEach(path => {
      xml += `  <url>\n    <loc>${baseUrl}${path}</loc>\n    <lastmod>${new Date().toISOString()}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.9</priority>\n  </url>\n`;
    });

    // Posts
    posts.forEach(post => {
      xml += `  <url>\n    <loc>${baseUrl}/publikasi/${post.slug}</loc>\n    <lastmod>${new Date(post.updated_at).toISOString()}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.8</priority>\n  </url>\n`;
    });

    // Agendas
    agendas.forEach(agenda => {
      xml += `  <url>\n    <loc>${baseUrl}/#agenda</loc>\n    <lastmod>${new Date(agenda.updated_at).toISOString()}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.7</priority>\n  </url>\n`;
    });

    xml += '</urlset>';

    return new Response(xml, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'X-Content-Type-Options': 'nosniff',
        'Cache-Control': 'public, s-maxage=3600'
      }
    });
  } catch (error) {
    console.error("Sitemap error:", error);
    const emergency = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url>\n    <loc>${baseUrl}/</loc>\n    <priority>1.0</priority>\n  </url>\n</urlset>`;
    return new Response(emergency, { 
      status: 200, 
      headers: { 'Content-Type': 'application/xml; charset=utf-8' } 
    });
  }
};
