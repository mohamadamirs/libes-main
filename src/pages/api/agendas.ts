import type { APIRoute } from "astro";
import { sql } from "../../lib/db";

export const GET: APIRoute = async () => {
  try {
    const { rows } = await sql`
      SELECT * FROM agendas
      WHERE event_date >= CURRENT_DATE
        AND status = 'published'
      ORDER BY event_date ASC
      LIMIT 1
    `;

    return new Response(JSON.stringify(rows[0] || null), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, s-maxage=3600",
      },
    });
  } catch (e: any) {
    console.error("❌ [API AGENDAS] Error:", e);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
    });
  }
};
