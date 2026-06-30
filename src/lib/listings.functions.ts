import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";

type PublicListing = Database["public"]["Views"]["public_listings"]["Row"];

function serverClient() {
  return createClient<Database>(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_PUBLISHABLE_KEY!,
    { auth: { storage: undefined, persistSession: false, autoRefreshToken: false } },
  );
}

async function resolvePhotos(photos: string[] | null): Promise<string[]> {
  if (!photos || photos.length === 0) return [];
  const out: string[] = [];
  let admin: Awaited<ReturnType<typeof import("@/integrations/supabase/client.server")>>["supabaseAdmin"] | null = null;
  for (const p of photos) {
    if (!p) continue;
    if (/^https?:\/\//.test(p)) {
      out.push(p);
      continue;
    }
    if (!admin) {
      const mod = await import("@/integrations/supabase/client.server");
      admin = mod.supabaseAdmin;
    }
    const { data } = await admin.storage
      .from("listing-photos")
      .createSignedUrl(p, 60 * 60 * 24 * 7);
    if (data?.signedUrl) out.push(data.signedUrl);
  }
  return out;
}

export const listListings = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = serverClient();
  const { data, error } = await supabase
    .from("public_listings")
    .select("*")
    .order("start_date", { ascending: true });
  if (error) throw new Error(error.message);
  const rows = (data ?? []) as PublicListing[];
  // Only resolve first photo for the listing grid
  return await Promise.all(
    rows.map(async (r) => ({
      ...r,
      photos: r.photos && r.photos.length > 0 ? [await firstPhoto(r.photos)] : [],
    })),
  );
});

async function firstPhoto(photos: string[]): Promise<string> {
  const first = photos[0];
  if (!first) return "";
  if (/^https?:\/\//.test(first)) return first;
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin.storage
    .from("listing-photos")
    .createSignedUrl(first, 60 * 60 * 24 * 7);
  return data?.signedUrl ?? "";
}

export const getListing = createServerFn({ method: "GET" })
  .inputValidator((input: { id: string }) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data }) => {
    const supabase = serverClient();
    const { data: row, error } = await supabase
      .from("public_listings")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!row) return null;
    const photos = await resolvePhotos(row.photos);
    return { ...row, photos };
  });

const submitSchema = z.object({
  author_name: z.string().trim().min(1).max(100),
  author_email: z.string().trim().email().max(255),
  contact_type: z.enum(["email", "whatsapp", "facebook", "instagram", "telegram", "autre"]),
  contact_value: z.string().trim().min(1).max(300),
  contact_label: z.string().trim().max(60).optional().or(z.literal("")),
  neighborhood: z.string().trim().min(1).max(80),
  housing_type: z.enum(["chambre", "studio", "1-bed", "2-bed", "autre"]),
  start_date: z.string().min(1),
  end_date: z.string().min(1),
  summary: z.string().trim().min(10).max(240),
  description: z.string().trim().min(20).max(4000),
  practical_info: z.string().trim().max(2000).optional().or(z.literal("")),
  photos: z.array(z.string().max(500)).max(10).default([]),
});

export const submitListing = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => submitSchema.parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await supabaseAdmin
      .from("listings")
      .insert({
        author_name: data.author_name,
        author_email: data.author_email,
        contact_type: data.contact_type,
        contact_value: data.contact_value,
        contact_label: data.contact_label || null,
        neighborhood: data.neighborhood,
        housing_type: data.housing_type,
        start_date: data.start_date,
        end_date: data.end_date,
        summary: data.summary,
        description: data.description,
        practical_info: data.practical_info || null,
        photos: data.photos,
      })
      .select("id, moderation_token")
      .single();
    if (error) throw new Error(error.message);

    // Log moderation link (will be emailed once email domain is configured)
    console.log(
      `[moderation] new listing ${row.id} — approve token: ${row.moderation_token}`,
    );
    return { ok: true as const };
  });
