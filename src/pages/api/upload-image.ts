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
    // Persingkat nama file untuk menghindari URL yang terlalu panjang
    const extension = file.name.split('.').pop() || 'jpg';
    const filename = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}.${extension}`;
    
    // Pastikan token tersedia
    const token = process.env.BLOB_READ_WRITE_TOKEN || import.meta.env.BLOB_READ_WRITE_TOKEN;

    const blob = await put(`posts/${filename}`, file, {
      access: 'public',
      token: token,
      contentType: file.type, // PENTING: Beritahu Vercel tipe konten aslinya
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