import { sql } from '../lib/db';
import { ActionError, defineAction } from 'astro:actions';
import { z } from 'astro:schema';
import { put } from '@vercel/blob';

export const agendaActions = {
  saveAgenda: defineAction({
    accept: 'form',
    input: z.object({
      id: z.string().optional(),
      title: z.string().min(3),
      description: z.string().min(10),
      event_date: z.string(),
      event_time: z.string(),
      location: z.string(),
      wa_link: z.string().url(),
      status: z.enum(['draft', 'published', 'scheduled']),
      publish_at: z.string().optional().nullable(),
      poster: z.instanceof(File).optional(),
      // TAMBAHAN: Menangkap nilai checkbox
      override_published: z.preprocess((val) => val === 'on' || val === 'true', z.boolean()).optional(),
    }),
    handler: async (input, context) => {
      const { user } = context.locals;
      if (!user || user.role !== 'admin') {
        throw new ActionError({ code: 'UNAUTHORIZED', message: 'Hanya admin!' });
      }

      // --- LOGIKA BARU: TIMPA AGENDA PUBLISHED ---
      if (input.status === 'published') {
        let existing = [];
        try {
          if (input.id) {
            const res = await sql`SELECT id, title FROM agendas WHERE status = 'published' AND event_date >= CURRENT_DATE AND id != ${input.id} LIMIT 1`;
            existing = res.rows;
          } else {
            const res = await sql`SELECT id, title FROM agendas WHERE status = 'published' AND event_date >= CURRENT_DATE LIMIT 1`;
            existing = res.rows;
          }
        } catch (dbError) {
          throw new ActionError({ code: 'INTERNAL_SERVER_ERROR', message: 'Error ngecek database.' });
        }

        if (existing.length > 0) {
          // Kalau admin centang override, jadikan agenda lama draft!
          if (input.override_published) {
            try {
              await sql`UPDATE agendas SET status = 'draft' WHERE id = ${existing[0].id}`;
            } catch (e) {
              throw new ActionError({ code: 'INTERNAL_SERVER_ERROR', message: 'Gagal mengubah agenda lama menjadi draft.' });
            }
          } else {
            // Kalau nggak dicentang tapi maksain publish, tolak.
            throw new ActionError({
              code: 'CONFLICT',
              message: `Agenda "${existing[0].title}" sedang tayang. Centang opsi timpa agenda jika ingin melanjutkan.`
            });
          }
        }
      }

      let publishTime = null;
      if (input.status === 'scheduled') {
        if (!input.publish_at) throw new ActionError({ code: 'BAD_REQUEST', message: 'Isi tanggal rilis otomatis.' });
        publishTime = input.publish_at;
      } else if (input.status === 'published') {
        publishTime = new Date().toISOString();
      }

      let imageUrl = null;
      if (input.poster && input.poster.size > 0) {
        try {
          const blob = await put(`agenda-posters/${Date.now()}-${input.poster.name}`, input.poster, {
            access: 'public',
            token: import.meta.env.BLOB_READ_WRITE_TOKEN || process.env.BLOB_READ_WRITE_TOKEN,
          });
          imageUrl = blob.url;
        } catch (blobError: any) {
          throw new ActionError({ code: 'INTERNAL_SERVER_ERROR', message: 'Gagal mengunggah gambar.' });
        }
      }

      try {
        if (input.id) {
          if (imageUrl) {
            await sql`UPDATE agendas SET title=${input.title}, description=${input.description}, event_date=${input.event_date}, event_time=${input.event_time}, location=${input.location}, wa_link=${input.wa_link}, status=${input.status}, publish_at=${publishTime}, image_url=${imageUrl} WHERE id=${input.id}`;
          } else {
            await sql`UPDATE agendas SET title=${input.title}, description=${input.description}, event_date=${input.event_date}, event_time=${input.event_time}, location=${input.location}, wa_link=${input.wa_link}, status=${input.status}, publish_at=${publishTime} WHERE id=${input.id}`;
          }
          return { success: true };
        } else {
          await sql`INSERT INTO agendas (title, description, event_date, event_time, location, wa_link, status, publish_at, image_url) VALUES (${input.title}, ${input.description}, ${input.event_date}, ${input.event_time}, ${input.location}, ${input.wa_link}, ${input.status}, ${publishTime}, ${imageUrl})`;
          return { success: true };
        }
      } catch (dbError) {
        throw new ActionError({ code: 'INTERNAL_SERVER_ERROR', message: 'Gagal menyimpan ke database.' });
      }
    },
  }),

  deleteAgenda: defineAction({
    accept: 'form',
    input: z.object({ id: z.string() }),
    handler: async ({ id }, context) => {
      const { user } = context.locals;
      if (!user || user.role !== 'admin') throw new ActionError({ code: 'UNAUTHORIZED', message: 'Ditolak' });
      try {
        await sql`DELETE FROM agendas WHERE id = ${id}`;
        return { success: true };
      } catch (error) {
        throw new ActionError({ code: 'INTERNAL_SERVER_ERROR', message: 'Gagal hapus.' });
      }
    }
  })
};