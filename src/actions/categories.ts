// src/actions/categories.ts
import { defineAction, ActionError } from "astro:actions";
import { z } from "astro:schema";
import { sql } from "../lib/db";
import { v4 as uuidv4 } from "uuid";

export const categoryActions = {
  createCategory: defineAction({
    accept: "form",
    input: z.object({
      name: z.string().min(2, "Nama kategori terlalu pendek"),
      description: z.string().optional(),
    }),
    handler: async (input, context) => {
      const user = context.locals.user;
      if (!user || user.role !== "admin") {
        throw new ActionError({
          code: "UNAUTHORIZED",
          message: "Hanya admin yang dapat melakukan aksi ini.",
        });
      }

      const id = uuidv4();
      const slug = input.name
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, "")
        .replace(/[\s_-]+/g, "-")
        .replace(/^-+|-+$/g, "");

      try {
        await sql`
          INSERT INTO categories (id, name, slug, description, created_at)
          VALUES (${id}, ${input.name}, ${slug}, ${input.description || null}, NOW())
        `;
        return { success: true };
      } catch (e: any) {
        console.error("Create category error:", e);
        if (e.message?.includes("unique_slug")) {
           throw new ActionError({
            code: "CONFLICT",
            message: "Slug kategori sudah ada. Gunakan nama lain.",
          });
        }
        throw new ActionError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Gagal membuat kategori.",
        });
      }
    },
  }),

  updateCategory: defineAction({
    accept: "form",
    input: z.object({
      id: z.string().uuid(),
      name: z.string().min(2),
      description: z.string().optional(),
    }),
    handler: async (input, context) => {
      const user = context.locals.user;
      if (!user || user.role !== "admin") {
        throw new ActionError({
          code: "UNAUTHORIZED",
          message: "Hanya admin yang dapat melakukan aksi ini.",
        });
      }

      const slug = input.name
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, "")
        .replace(/[\s_-]+/g, "-")
        .replace(/^-+|-+$/g, "");

      try {
        await sql`
          UPDATE categories
          SET name = ${input.name}, slug = ${slug}, description = ${input.description || null}
          WHERE id = ${input.id}
        `;
        return { success: true };
      } catch (e: any) {
        console.error("Update category error:", e);
        throw new ActionError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Gagal memperbarui kategori.",
        });
      }
    },
  }),

  deleteCategory: defineAction({
    accept: "form",
    input: z.object({ id: z.string().uuid() }),
    handler: async (input, context) => {
      const user = context.locals.user;
      if (!user || user.role !== "admin") {
        throw new ActionError({
          code: "UNAUTHORIZED",
          message: "Hanya admin yang dapat melakukan aksi ini.",
        });
      }

      try {
        // Cek apakah ada post yang menggunakan kategori ini
        const { rows } = await sql`SELECT COUNT(*) as count FROM posts WHERE category_id = ${input.id}`;
        if (parseInt(rows[0].count) > 0) {
           throw new ActionError({
            code: "CONFLICT",
            message: "Kategori tidak bisa dihapus karena masih digunakan oleh beberapa artikel.",
          });
        }

        await sql`DELETE FROM categories WHERE id = ${input.id}`;
        return { success: true };
      } catch (e: any) {
        if (e instanceof ActionError) throw e;
        console.error("Delete category error:", e);
        throw new ActionError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Gagal menghapus kategori.",
        });
      }
    },
  }),
};
