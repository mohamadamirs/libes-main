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
    
    // Pastikan token tersedia (Astro menggunakan import.meta.env, SDK Vercel biasanya mencari process.env)
    const token = process.env.BLOB_READ_WRITE_TOKEN || import.meta.env.BLOB_READ_WRITE_TOKEN;

    const blob = await put(`posts/${filename}`, file, {
      access: 'public',
      token: token,
    });

    return new Response(JSON.stringify({ url: blob.url }), { status: 200 });
  } catch (error: any) {
    console.error("Blob upload error details:", error.message);
    return new Response(JSON.stringify({ 
      error: "Failed to upload image", 
      details: error.message 
    }), { status: 500 });
  }
};