import type { APIRoute } from "astro";

export const POST: APIRoute = ({ cookies, redirect }) => {
  // 1. Hapus cookie session
  // Pastikan path-nya "/" biar beneran ilang dari semua folder
  cookies.delete("session", {
    path: "/",
  });

  // 2. Redirect ke login dengan pesan sukses (optional)
  return redirect("/login?message=Anda telah berhasil keluar dari sistem.");
};

// Kalau ada yang iseng akses lewat browser langsung (GET),
// kita tendang juga ke login atau dashboard.
export const GET: APIRoute = ({ redirect }) => {
  return redirect("/dashboard");
};
