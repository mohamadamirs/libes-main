import { defineAction, ActionError } from "astro:actions";
import { z } from "astro:schema";
import { sql } from "../lib/db";
import { put, del } from "@vercel/blob";
import bcrypt from "bcryptjs";

export const profileActions = {
  updateProfile: defineAction({
    accept: "form",
    input: z.object({
      fullName: z.string().min(3, "Nama minimal 3 karakter."),
      bio: z.string().max(200, "Bio maksimal 200 karakter.").optional().nullable(),
      instagram: z.string().optional().nullable(),
    }),
    handler: async (input, context) => {
      const user = context.locals.user;
      if (!user) {
        throw new ActionError({
          code: "UNAUTHORIZED",
          message: "Anda harus login untuk memperbarui profil.",
        });
      }

      try {
        await sql`
          UPDATE profiles 
          SET 
            full_name = ${input.fullName}, 
            bio = ${input.bio || null}, 
            instagram = ${input.instagram || null}
          WHERE id = ${user.id}
        `;
        return { success: true };
      } catch (e: any) {
        console.error("Update profile error:", e);
        throw new ActionError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Gagal memperbarui profil.",
        });
      }
    },
  }),

  updateAvatar: defineAction({
    accept: "form",
    input: z.object({
      avatar: z.instanceof(File),
    }),
    handler: async (input, context) => {
      const user = context.locals.user;
      if (!user) throw new ActionError({ code: "UNAUTHORIZED", message: "Silakan login." });

      try {
        // Ambil data profil untuk hapus foto lama jika ada
        const { rows } = await sql`SELECT avatar_url FROM profiles WHERE id = ${user.id}`;
        const oldAvatar = rows[0]?.avatar_url;

        if (oldAvatar) {
          try {
            await del(oldAvatar, {
              token: import.meta.env.BLOB_READ_WRITE_TOKEN || process.env.BLOB_READ_WRITE_TOKEN,
            });
          } catch (delError) {
            console.error("Gagal hapus avatar lama:", delError);
          }
        }

        const blob = await put(`avatars/${user.id}-${Date.now()}-${input.avatar.name}`, input.avatar, {
          access: "public",
          token: import.meta.env.BLOB_READ_WRITE_TOKEN || process.env.BLOB_READ_WRITE_TOKEN,
        });

        await sql`UPDATE profiles SET avatar_url = ${blob.url} WHERE id = ${user.id}`;
        return { success: true, url: blob.url };
      } catch (e: any) {
        console.error("Update avatar error:", e);
        throw new ActionError({ code: "INTERNAL_SERVER_ERROR", message: "Gagal mengunggah foto profil." });
      }
    },
  }),

  changePassword: defineAction({
    accept: "form",
    input: z.object({
      currentPassword: z.string().min(1, "Password saat ini wajib diisi."),
      newPassword: z.string().min(6, "Password baru minimal 6 karakter."),
      confirmPassword: z.string(),
    }).refine(data => data.newPassword === data.confirmPassword, {
      message: "Konfirmasi password baru tidak cocok.",
      path: ["confirmPassword"],
    }),
    handler: async (input, context) => {
      const user = context.locals.user;
      if (!user) throw new ActionError({ code: "UNAUTHORIZED", message: "Silakan login." });

      try {
        const { rows } = await sql`SELECT password_hash FROM users WHERE id = ${user.id}`;
        const userData = rows[0];

        const isMatch = await bcrypt.compare(input.currentPassword, userData.password_hash);
        if (!isMatch) {
          throw new ActionError({ code: "BAD_REQUEST", message: "Password saat ini salah." });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(input.newPassword, salt);

        await sql`UPDATE users SET password_hash = ${hashedPassword} WHERE id = ${user.id}`;
        return { success: true };
      } catch (e: any) {
        if (e instanceof ActionError) throw e;
        console.error("Change password error:", e);
        throw new ActionError({ code: "INTERNAL_SERVER_ERROR", message: "Gagal mengganti password." });
      }
    },
  }),
};
