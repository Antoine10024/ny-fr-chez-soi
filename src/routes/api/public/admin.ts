import { createFileRoute } from "@tanstack/react-router";
import { formatCalendarDate } from "@/lib/listing-constants";

function esc(s: string): string {
  return s.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!,
  );
}


export const Route = createFileRoute("/api/public/admin")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const secret = url.searchParams.get("secret");
        if (!secret || secret !== process.env.ADMIN_MODERATION_SECRET) {
          return new Response("Forbidden", { status: 403 });
        }
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data, error } = await supabaseAdmin
          .from("listings")
          .select(
            "id, created_at, author_name, author_email, neighborhood, housing_type, summary, moderation_token, listing_availabilities(start_date, end_date, status)",
          )
          .eq("status", "pending")
          .order("created_at", { ascending: false });
        if (error) return new Response(error.message, { status: 500 });

        const origin = url.origin;
        const rows = (data ?? [])
          .map((r) => {
            const periods = (r.listing_availabilities ?? [])
              .map(
                (a) =>
                  `${dateFmt.format(new Date(a.start_date))} → ${dateFmt.format(new Date(a.end_date))}`,
              )
              .join(" · ");
            return `
            <article class="row">
              <header>
                <strong>${esc(r.summary ?? "")}</strong>
                <span class="meta">${esc(r.neighborhood ?? "")} · ${esc(r.housing_type ?? "")}</span>
                <span class="meta">${esc(periods || "Aucune période")}</span>
              </header>
              <p class="who">Par <b>${esc(r.author_name ?? "")}</b> · ${esc(r.author_email ?? "")}</p>
              <p class="actions">
                <a class="ok" href="${origin}/api/public/moderation/approve?token=${r.moderation_token}">Approuver</a>
                <a class="ko" href="${origin}/api/public/moderation/reject?token=${r.moderation_token}">Rejeter</a>
              </p>
            </article>`;
          })
          .join("");

        const html = `<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>Modération — Logements NYC</title>
          <meta name="viewport" content="width=device-width,initial-scale=1">
          <style>
            body{font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;background:#faf6ef;color:#1b1b1f;margin:0;padding:32px;max-width:760px;margin-inline:auto}
            h1{font-family:Georgia,serif}
            .row{background:#fff;border:1px solid #e8dfd0;border-radius:14px;padding:18px;margin-bottom:14px}
            .meta{display:block;color:#666;font-size:13px;margin-top:4px}
            .who{color:#555;font-size:14px;margin:8px 0}
            .actions a{display:inline-block;padding:8px 14px;border-radius:999px;text-decoration:none;font-weight:500;font-size:14px;margin-right:8px}
            .ok{background:#c2410c;color:#fff}
            .ko{background:#fff;color:#1b1b1f;border:1px solid #ddd}
            .empty{color:#666;background:#fff;border:1px dashed #ddd;border-radius:14px;padding:32px;text-align:center}
          </style></head><body>
          <h1>Annonces en attente (${(data ?? []).length})</h1>
          ${rows || '<p class="empty">Aucune annonce en attente. ✨</p>'}
          </body></html>`;
        return new Response(html, {
          status: 200,
          headers: { "content-type": "text/html; charset=utf-8" },
        });
      },
    },
  },
});
