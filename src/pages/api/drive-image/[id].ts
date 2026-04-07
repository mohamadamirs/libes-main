import type { APIRoute } from "astro";

export const GET: APIRoute = async ({ params, url }) => {
  const { id } = params;
  const sz = url.searchParams.get("sz") || "600";

  if (!id) return new Response(null, { status: 400 });

  // Gunakan URL thumbnail resmi Google Drive
  const googleUrl = `https://drive.google.com/thumbnail?id=${id}&sz=w${sz}`;
  
  try {
    const response = await fetch(googleUrl);
    
    if (!response.ok) {
      return new Response(null, { status: response.status });
    }

    const buffer = await response.arrayBuffer();
    const contentType = response.headers.get("Content-Type") || "image/jpeg";

    return new Response(buffer, {
      headers: {
        "Content-Type": contentType,
        // Cache gambar di Edge Network selama 1 hari (s-maxage)
        // Dan di browser pengguna selama 1 hari (max-age)
        "Cache-Control": "public, max-age=86400, s-maxage=86400, stale-while-revalidate=3600",
      }
    });
  } catch (e) {
    console.error("❌ [PROXY ERROR]:", e);
    return new Response(null, { status: 500 });
  }
};
