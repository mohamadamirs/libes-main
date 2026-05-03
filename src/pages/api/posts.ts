import type { APIRoute } from "astro";
import { sql } from "../../lib/db";

export const GET: APIRoute = async ({ url }) => {
  const limit = parseInt(url.searchParams.get("limit") || "9", 10);
  const offset = parseInt(url.searchParams.get("offset") || "0", 10);
  const categoryId = url.searchParams.get("category");

  try {
    let query;
    if (categoryId) {
      query = sql`
        SELECT
          p.title,
          p.content,
          p.slug,
          p.updated_at,
          p.user_id,
          pr.full_name as author_name,
          pr.instagram as author_instagram,
          pr.avatar_url as author_avatar,
          c.name as category_name
        FROM posts p
        LEFT JOIN profiles pr ON p.user_id = pr.id
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE p.status = 'published' AND p.category_id = ${categoryId}
        ORDER BY p.updated_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `;
    } else {
      query = sql`
        SELECT
          p.title,
          p.content,
          p.slug,
          p.updated_at,
          p.user_id,
          pr.full_name as author_name,
          pr.instagram as author_instagram,
          pr.avatar_url as author_avatar,
          c.name as category_name
        FROM posts p
        LEFT JOIN profiles pr ON p.user_id = pr.id
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE p.status = 'published'
        ORDER BY p.updated_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `;
    }

    const { rows: posts } = await query;

    return new Response(JSON.stringify(posts), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=1800",
      },
    });
  } catch (e: any) {
    console.error("❌ [API POSTS] Error:", e);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
    });
  }
};
