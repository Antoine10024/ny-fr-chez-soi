import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/moderation/reject")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const token = url.searchParams.get("token");
        if (!token) {
          return new Response("Jeton manquant", { status: 400 });
        }
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data: listing } = await supabaseAdmin
          .from("listings")
          .select("id, status, summary")
          .eq("moderation_token", token)
          .maybeSingle();
        const body =
          !listing
            ? "<h1>Lien invalide</h1>"
            : listing.status !== "pending"
              ? `<h1>Déjà traitée</h1><p>Statut actuel : ${listing.status}</p>`
              : await (async () => {
                  await supabaseAdmin
                    .from("listings")
                    .update({ status: "rejected" })
                    .eq("id", listing.id);
                  return `<h1>Annonce rejetée ✗</h1><p>${listing.summary}</p>`;
                })();
        return new Response(
          `<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>Modération</title>
          <style>body{font-family:system-ui;background:#faf6ef;color:#1b1b1f;display:grid;place-items:center;min-height:100vh;margin:0;padding:24px}.c{max-width:520px;background:#fff;border:1px solid #e8dfd0;border-radius:18px;padding:32px;text-align:center}a{color:#c2410c}</style>
          </head><body><div class="c">${body}<p><a href="/annonces">Voir les annonces</a></p></div></body></html>`,
          { status: 200, headers: { "content-type": "text/html; charset=utf-8" } },
        );
      },
    },
  },
});
