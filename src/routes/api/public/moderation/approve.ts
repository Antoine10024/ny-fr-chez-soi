import { createFileRoute } from "@tanstack/react-router";

function page(title: string, body: string) {
  return new Response(
    `<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>${title}</title>
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <style>
      body{font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;background:#faf6ef;color:#1b1b1f;display:grid;place-items:center;min-height:100vh;margin:0;padding:24px}
      .card{max-width:520px;background:#fff;border:1px solid #e8dfd0;border-radius:18px;padding:32px;text-align:center}
      h1{margin:0 0 12px;font-size:24px}
      p{margin:0 0 16px;color:#555}
      a{color:#c2410c;text-decoration:none;font-weight:500}
    </style></head><body><div class="card">${body}</div></body></html>`,
    { status: 200, headers: { "content-type": "text/html; charset=utf-8" } },
  );
}

async function moderate(token: string | null, action: "approved" | "rejected") {
  if (!token) return page("Lien invalide", "<h1>Lien invalide</h1><p>Jeton manquant.</p>");
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: listing, error: fErr } = await supabaseAdmin
    .from("listings")
    .select("id, status, summary")
    .eq("moderation_token", token)
    .maybeSingle();
  if (fErr || !listing) {
    return page("Lien invalide", "<h1>Lien invalide</h1><p>Annonce introuvable.</p>");
  }
  if (listing.status !== "pending") {
    return page(
      "Déjà traitée",
      `<h1>Déjà traitée</h1><p>Cette annonce a déjà le statut <b>${listing.status}</b>.</p><p><a href="/annonces">Voir les annonces</a></p>`,
    );
  }
  const { error: uErr } = await supabaseAdmin
    .from("listings")
    .update({ status: action })
    .eq("id", listing.id);
  if (uErr) return page("Erreur", `<h1>Erreur</h1><p>${uErr.message}</p>`);
  const label = action === "approved" ? "approuvée ✓" : "rejetée ✗";
  return page(
    "Annonce " + label,
    `<h1>Annonce ${label}</h1><p>${listing.summary}</p><p><a href="/annonces">Voir les annonces</a></p>`,
  );
}

export const Route = createFileRoute("/api/public/moderation/approve")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        return moderate(url.searchParams.get("token"), "approved");
      },
    },
  },
});
