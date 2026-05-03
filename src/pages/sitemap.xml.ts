import type { APIRoute } from 'astro';
import { sql } from '../lib/db';

export const GET: APIRoute = async () => {
  const baseUrl = 'https://literasibrebesan.my.id';
  const today = new Date().toISOString().split('T')[0];

  try {
    // 1. Fetch data: Posts (Published) and Profiles (Public)
    const { rows: posts } = await sql`SELECT slug, updated_at FROM posts WHERE status = 'published' ORDER BY updated_at DESC`;
    const { rows: profiles } = await sql`SELECT id, created_at FROM profiles ORDER BY created_at DESC`;

    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

    // Helper function to build URL nodes
    const addUrl = (path: string, lastmod: string, changefreq: string, priority: string) => {
      xml += `  <url>\n    <loc>${baseUrl}${path}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>\n  </url>\n`;
    };

    // 2. Home Page
    addUrl('/', today, 'daily', '1.0');

    // 3. Static Public Pages
    addUrl('/publikasi', today, 'weekly', '0.9');
    addUrl('/dokumentasi', today, 'weekly', '0.9');
    addUrl('/register', today, 'monthly', '0.5');

    // 4. Dynamic Content: Posts
    posts.forEach(post => {
      const date = new Date(post.updated_at).toISOString().split('T')[0];
      addUrl(`/publikasi/${post.slug}`, date, 'monthly', '0.8');
    });

    // 5. Dynamic Content: Author Profiles
    profiles.forEach(profile => {
      const date = new Date(profile.created_at || today).toISOString().split('T')[0];
      addUrl(`/p/${profile.id}`, date, 'monthly', '0.6');
    });

    xml += '</urlset>';

    return new Response(xml.trim(), {
      status: 200,
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, s-maxage=3600'
      }
    });
  } catch (error) {
    console.error('Sitemap Generation Error:', error);
    const emergency = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url>\n    <loc>${baseUrl}/</loc>\n    <lastmod>${today}</lastmod>\n  </url>\n</urlset>`;
    return new Response(emergency, { status: 200, headers: { 'Content-Type': 'application/xml' } });
  }
};
