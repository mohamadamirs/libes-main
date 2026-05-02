// src/actions/posts.ts
import { defineAction, ActionError } from "astro:actions";
import { z } from "astro:schema";
import { sql } from "../lib/db";
import { v4 as uuidv4 } from "uuid";
import { generateSlug } from "../lib/utils";
import sanitizeHtml from "sanitize-html";

const sanitizeOptions = {
  allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img', 'h1', 'h2', 'blockquote']),
  allowedAttributes: {
    ...sanitizeHtml.defaults.allowedAttributes,
    'img': ['src', 'alt', 'class', 'width', 'height'],
  },
  allowedSchemes: ['http', 'https', 'data'],
};

export const postActions = {
  createPost: defineAction({
    accept: "form",
    input: z.object({
      title: z.string().min(5, "Judul terlalu pendek"),
      content: z.string().optional(),
      status: z.enum(["draft", "pending", "published"]).default("draft"),
      category_id: z.string().uuid("Kategori tidak valid").optional().nullable(),
    }),
    handler: async (input, context) => {
      const user = context.locals.user;
      if (!user) {
        throw new ActionError({
          code: "UNAUTHORIZED",
          message: "Silakan login terlebih dahulu.",
        });
      }

      let finalStatus = input.status;
      if (user.role !== "admin" && finalStatus === "published")
        finalStatus = "pending";

      const id = uuidv4();
      const slug = generateSlug(input.title);
      const safeContent = sanitizeHtml(input.content || "", sanitizeOptions);

      try {
        await sql`
          INSERT INTO posts (id, title, content, status, user_id, slug, updated_at, category_id, rejection_reason)
          VALUES (${id}, ${input.title}, ${safeContent}, ${finalStatus}, ${user.id}, ${slug}, NOW(), ${input.category_id || null}, NULL)
        `;
        return { success: true };
      } catch (e: any) {
        console.error("Create post error:", e);
        throw new ActionError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Gagal menyimpan tulisan ke database.",
        });
      }
    },
  }),

  updatePost: defineAction({
    accept: "form",
    input: z.object({
      id: z.string().uuid(),
      title: z.string().min(5),
      content: z.string().optional(),
      status: z.enum(["draft", "pending", "published"]),
      category_id: z.string().uuid("Kategori tidak valid").optional().nullable(),
      rejection_reason: z.string().optional().nullable(),
    }),
    handler: async (input, context) => {
      const user = context.locals.user;
      if (!user) {
        throw new ActionError({
          code: "UNAUTHORIZED",
          message: "Akses ditolak. Silakan login.",
        });
      }

      const newSlug = generateSlug(input.title);
      const safeContent = sanitizeHtml(input.content || "", sanitizeOptions);

      try {
        if (user.role === "admin") {
          await sql`
            UPDATE posts
            SET title = ${input.title}, content = ${safeContent}, status = ${input.status}, slug = ${newSlug}, category_id = ${input.category_id || null}, updated_at = NOW(), rejection_reason = ${input.rejection_reason || null}
            WHERE id = ${input.id}
          `;
        } else {
          const finalStatus =
            input.status === "published" ? "pending" : input.status;
          await sql`
            UPDATE posts
            SET title = ${input.title}, content = ${safeContent}, status = ${finalStatus}, slug = ${newSlug}, category_id = ${input.category_id || null}, updated_at = NOW(), rejection_reason = NULL
            WHERE id = ${input.id} AND user_id = ${user.id}
          `;
        }
        return { success: true };
      } catch (e: any) {
        console.error("Update post error:", e);
        throw new ActionError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Gagal memperbarui tulisan.",
        });
      }
    },
  }),

  deletePost: defineAction({
    accept: "form",
    input: z.object({ id: z.string().uuid() }),
    handler: async (input, context) => {
      const user = context.locals.user;
      if (!user) {
        throw new ActionError({
          code: "UNAUTHORIZED",
          message: "Akses ditolak.",
        });
      }

      try {
        if (user.role === "admin") {
          await sql`DELETE FROM posts WHERE id = ${input.id}`;
        } else {
          await sql`DELETE FROM posts WHERE id = ${input.id} AND user_id = ${user.id}`;
        }
        return { success: true };
      } catch (e: any) {
        console.error("Delete post error:", e);
        throw new ActionError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Gagal menghapus tulisan.",
        });
      }
    },
  }),

  approvePost: defineAction({
    accept: "form",
    input: z.object({ id: z.string().uuid() }),
    handler: async (input, context) => {
      const user = context.locals.user;
      if (!user || user.role !== "admin") {
        throw new ActionError({
          code: "FORBIDDEN",
          message: "Maaf, akses ditolak. Fitur ini hanya tersedia untuk administrator.",
        });
      }

      try {
        await sql`UPDATE posts SET status = 'published', updated_at = NOW(), rejection_reason = NULL WHERE id = ${input.id}`;
        return { success: true };
      } catch (e: any) {
        console.error("Approve post error:", e);
        throw new ActionError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Gagal menyetujui tulisan.",
        });
      }
    },
  }),

  rejectPost: defineAction({
    accept: "form",
    input: z.object({ 
      id: z.string().uuid(),
      reason: z.string().min(5, "Berikan alasan minimal 5 karakter")
    }),
    handler: async (input, context) => {
      const user = context.locals.user;
      if (!user || user.role !== "admin") {
        throw new ActionError({
          code: "FORBIDDEN",
          message: "Akses ditolak.",
        });
      }

      try {
        await sql`
          UPDATE posts 
          SET status = 'draft', rejection_reason = ${input.reason}, updated_at = NOW() 
          WHERE id = ${input.id}
        `;
        return { success: true };
      } catch (e: any) {
        console.error("Reject post error:", e);
        throw new ActionError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Gagal menolak tulisan.",
        });
      }
    },
  }),
};
