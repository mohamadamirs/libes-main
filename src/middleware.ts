import { defineMiddleware } from "astro:middleware";
import { jwtVerify } from "jose";
import { sql } from "./lib/db";
import { SECRET } from "./lib/jwt";

export const onRequest = defineMiddleware(async (context, next) => {
  const { cookies, url, redirect, locals } = context;
  const token = cookies.get("session")?.value;
  let userData = null;

  if (token) {
    try {
      const { payload } = await jwtVerify(token, SECRET);
      
      // Data diambil langsung dari payload JWT tanpa ke Database!
      userData = {
        id: payload.userId as string,
        role: payload.role as string,
        fullName: payload.fullName as string,
        avatarUrl: payload.avatarUrl as string | undefined,
      };
    } catch (e: any) {
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
    return redirect("/login");
  }

  if (userData && isAuthPage) {
    return redirect("/dashboard");
  }

  return next();
});
