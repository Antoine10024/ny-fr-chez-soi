import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";

export interface Availability {
  id?: string;
  start_date: string;
  end_date: string;
  status?: "available" | "booked" | "unavailable";
}

export interface ListingDTO {
  id: string;
  created_at: string;
  author_name: string;
  contact_type: string;
  contact_value: string;
  contact_label: string | null;
  neighborhood: string;
  housing_type: string;
  summary: string;
  description: string;
  practical_info: string | null;
  photos: string[];
  availabilities: Availability[];
}

function serverClient() {
  return createClient<Database>(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_PUBLISHABLE_KEY!,
    { auth: { storage: undefined, persistSession: false, autoRefreshToken: false } },
  );
}

async function signOne(p: string): Promise<string> {
  if (/^https?:\/\//.test(p)) return p;
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin.storage
    .from("listing-photos")
    .createSignedUrl(p, 60 * 60 * 24 * 7);
  return data?.signedUrl ?? "";
}

async function resolvePhotos(photos: string[] | null): Promise<string[]> {
  if (!photos || photos.length === 0) return [];
  const out: string[] = [];
  for (const p of photos) {
    if (!p) continue;
    const url = await signOne(p);
    if (url) out.push(url);
  }
  return out;
}

function asListing(row: Record<string, unknown>): ListingDTO {
  const raw = (row.availabilities as unknown) ?? [];
  const availabilities: Availability[] = Array.isArray(raw)
    ? (raw as Array<Record<string, unknown>>).map((a) => ({
        id: a.id as string | undefined,
        start_date: a.start_date as string,
        end_date: a.end_date as string,
        status: (a.status as Availability["status"]) ?? "available",
      }))
    : [];
  return {
    id: row.id as string,
    created_at: row.created_at as string,
    author_name: (row.author_name as string) ?? "",
    contact_type: (row.contact_type as string) ?? "email",
    contact_value: (row.contact_value as string) ?? "",
    contact_label: (row.contact_label as string | null) ?? null,
    neighborhood: (row.neighborhood as string) ?? "",
    housing_type: (row.housing_type as string) ?? "autre",
    summary: (row.summary as string) ?? "",
    description: (row.description as string) ?? "",
    practical_info: (row.practical_info as string | null) ?? null,
    photos: (row.photos as string[] | null) ?? [],
    availabilities,
  };
}

export const listListings = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = serverClient();
  const { data, error } = await supabase
    .from("public_listings")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  const rows = (data ?? []).map((r) => asListing(r as Record<string, unknown>));
  return await Promise.all(
    rows.map(async (r) => ({
      ...r,
      photos: r.photos.length > 0 ? [await signOne(r.photos[0])] : [],
    })),
  );
});

export const getListing = createServerFn({ method: "GET" })
  .inputValidator((input: { id: string }) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data }): Promise<ListingDTO | null> => {
    const supabase = serverClient();
    const { data: row, error } = await supabase
      .from("public_listings")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!row) return null;
    const listing = asListing(row as Record<string, unknown>);
    listing.photos = await resolvePhotos(listing.photos);
    return listing;
  });

const availabilitySchema = z
  .object({
    start_date: z.string().min(1, "Date de début requise"),
    end_date: z.string().min(1, "Date de fin requise"),
  })
  .refine((v) => v.end_date >= v.start_date, {
    message: "La date de fin doit être après la date de début",
    path: ["end_date"],
  });

const submitSchema = z.object({
  author_name: z.string().trim().min(1).max(100),
  author_email: z.string().trim().email().max(255),
  contact_type: z.enum(["email", "whatsapp", "facebook", "instagram", "telegram", "autre"]),
  contact_value: z.string().trim().min(1).max(300),
  contact_label: z.string().trim().max(60).optional().or(z.literal("")),
  neighborhood: z.string().trim().min(1).max(80),
  housing_type: z.enum(["chambre", "studio", "1-bed", "2-bed", "autre"]),
  availabilities: z.array(availabilitySchema).min(1, "Ajoutez au moins une période").max(20),
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
        summary: data.summary,
        description: data.description,
        practical_info: data.practical_info || null,
        photos: data.photos,
      })
      .select("id, moderation_token")
      .single();
    if (error) throw new Error(error.message);

    const { error: availErr } = await supabaseAdmin
      .from("listing_availabilities")
      .insert(
        data.availabilities.map((a) => ({
          listing_id: row.id,
          start_date: a.start_date,
          end_date: a.end_date,
        })),
      );
    if (availErr) throw new Error(availErr.message);

    console.log(
      `[moderation] new listing ${row.id} — token: ${row.moderation_token}`,
    );
    return { ok: true as const };
  });
