import type { APIRoute } from 'astro';
import { put } from '@vercel/blob';

export const POST: APIRoute = async ({ request, locals }) => {
  const user = locals.user;
  if (!user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get('image') as File;

  if (!file) {
    return new Response(JSON.stringify({ error: "No image file found" }), { status: 400 });
  }

  try {
    const filename = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '')}`;
    const blob = await put(`posts/${filename}`, file, {
      access: 'public',
    });

    return new Response(JSON.stringify({ url: blob.url }), { status: 200 });
  } catch (error) {
    console.error("Blob upload error:", error);
    return new Response(JSON.stringify({ error: "Failed to upload image" }), { status: 500 });
  }
};