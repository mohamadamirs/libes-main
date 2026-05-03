import type { APIRoute } from 'astro';
import { sql } from '../lib/db';

export const GET: APIRoute = async () => {
  const baseUrl = 'https://literasibrebesan.my.id';
  const today = new Date().toISOString().split('T')[0];

  try {
    // 1. Fetch data
    const { rows: posts } = await sql`SELECT slug, updated_at FROM posts WHERE status = 'published' ORDER BY updated_at DESC`;
    const { rows: profiles } = await sql`SELECT id, created_at FROM profiles ORDER BY created_at DESC`;
    const { rows: latestAgenda } = await sql`SELECT updated_at FROM agendas WHERE status = 'published' ORDER BY updated_at DESC LIMIT 1`;

    // Calculate dynamic lastmod for Home
    let homeLastMod = today;
    if (posts.length > 0) {
      const latestPostDate = new Date(posts[0].updated_at).toISOString().split('T')[0];
      if (latestPostDate > homeLastMod) homeLastMod = latestPostDate;
    }
    if (latestAgenda.length > 0) {
      const agendaDate = new Date(latestAgenda[0].updated_at).toISOString().split('T')[0];
      if (agendaDate > homeLastMod) homeLastMod = agendaDate;
    }

    let xml = '<?xml version="1.0" encoding="UTF-8"?>';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">';

    // Helper function (Flattened XML for better parsing)
    const addUrl = (path: string, lastmod: string, changefreq: string, priority: string) => {
      xml += `<url><loc>${baseUrl}${path}</loc><lastmod>${lastmod}</lastmod><changefreq>${changefreq}</changefreq><priority>${priority}</priority></url>`;
    };

    // 2. Home & Static
    addUrl('/', homeLastMod, 'daily', '1.0');
    addUrl('/publikasi', homeLastMod, 'weekly', '0.9');
    addUrl('/dokumentasi', today, 'weekly', '0.9');
    addUrl('/register', today, 'monthly', '0.5');
    addUrl('/login', today, 'monthly', '0.5');

    // 3. Dynamic Posts
    posts.forEach(post => {
      const date = new Date(post.updated_at).toISOString().split('T')[0];
      addUrl(`/publikasi/${post.slug}`, date, 'weekly', '0.9');
    });

    // 4. Dynamic Profiles
    profiles.forEach(profile => {
      const date = new Date(profile.created_at || today).toISOString().split('T')[0];
      addUrl(`/p/${profile.id}`, date, 'monthly', '0.8');
    });

    xml += '</urlset>';

    return new Response(xml, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, s-maxage=3600'
      }
    });
  } catch (error) {
    console.error('Sitemap Error:', error);
    const emergency = `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${baseUrl}/</loc><lastmod>${today}</lastmod></url></urlset>`;
    return new Response(emergency, { status: 200, headers: { 'Content-Type': 'application/xml' } });
  }
};
