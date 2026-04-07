import { defineMiddleware } from "astro:middleware";
import { jwtVerify } from "jose";
import { sql } from "./lib/db";
import { SECRET } from "./lib/jwt";

export const onRequest = defineMiddleware(async (context, next) => {
  const { cookies, url, redirect, locals } = context;
  const token = cookies.get("session")?.value;
  let userData = null;

  console.log("--- DEBUG START ---");
  console.log("Path Akses:", url.pathname);
  console.log("Token ditemukan?", !!token);

  if (token) {
    try {
      const { payload } = await jwtVerify(token, SECRET);
      const userId = payload.userId as string;
      console.log("Token Valid! User ID:", userId);

      // PENTING: Gunakan LEFT JOIN biar kalau profil belum ada tetep bisa masuk
      const { rows } = await sql`
        SELECT u.id, u.email, p.role, p.full_name, p.avatar_url
        FROM users u
        LEFT JOIN profiles p ON u.id = p.id
        WHERE u.id = ${userId}
      `;

      if (rows.length > 0) {
        userData = {
          id: rows[0].id,
          email: rows[0].email,
          role: rows[0].role || "user", // Default role kalau NULL
          fullName: rows[0].full_name || "User Tanpa Nama",
          avatarUrl: rows[0].avatar_url,
        };
        console.log("User ketemu di DB! Role:", userData.role);
      } else {
        console.log("ERROR: Token ada tapi User gak ketemu di DB!");
      }
    } catch (e: any) {
      console.log("ERROR JWT:", e.message);
      cookies.delete("session", { path: "/" });
    }
  }

  locals.user = userData;

  // LOGIKA TENDANG
  const isAuthPage =
    url.pathname.startsWith("/login") || url.pathname.startsWith("/register");
  const isProtected =
    url.pathname.startsWith("/admin") ||
    url.pathname.startsWith("/user") ||
    url.pathname.startsWith("/dashboard");

  if (!userData && isProtected) {
    console.log("TENDANG: User mau masuk halaman rahasia tanpa login!");
    return redirect("/login");
  }

  if (userData && isAuthPage) {
    console.log("BALIKIN: User udah login tapi mau ke halaman login!");
    return redirect("/dashboard");
  }

  console.log("--- DEBUG END ---");
  return next();
});
