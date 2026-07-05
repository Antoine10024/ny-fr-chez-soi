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
  neighborhood: string;
  borough: string;
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
    neighborhood: (row.neighborhood as string) ?? "",
    borough: (row.borough as string) ?? "autre",
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
  borough: z.enum(["manhattan", "brooklyn", "queens", "new_jersey", "autre"]),
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
    const { getRequestHeader } = await import("@tanstack/react-start/server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await supabaseAdmin
      .from("listings")
      .insert({
        author_name: data.author_name,
        author_email: data.author_email,
        contact_type: data.contact_type,
        contact_value: data.contact_value,
        contact_label: data.contact_label || null,
        borough: data.borough,
        neighborhood: data.neighborhood,
        housing_type: data.housing_type,
        summary: data.summary,
        description: data.description,
        practical_info: data.practical_info || null,
        photos: data.photos,
      })
      .select("id, moderation_token, management_token")
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

    // Send the management link email to the owner. Failure must NOT block
    // listing creation — the confirmation screen still shows the token.
    try {
      const { SITE_URL } = await import("@/lib/email/config.server");
      const origin =
        SITE_URL ||
        getRequestHeader("origin") ||
        (getRequestHeader("host")
          ? `https://${getRequestHeader("host")}`
          : "");
      if (origin) {
        const { sendTemplatedEmail } = await import("@/lib/email/send.server");
        const manageUrl = `${origin.replace(/\/$/, "")}/manage/${row.management_token}`;
        await sendTemplatedEmail({
          templateName: "listing-management-link",
          to: data.author_email,
          idempotencyKey: `listing-mgmt-${row.id}`,
          templateData: {
            authorName: data.author_name,
            listingSummary: data.summary,
            manageUrl,
          },
        });
      } else {
        console.warn(
          "Skipping management email — no origin available to build absolute URL",
        );
      }
    } catch (err) {
      console.error("Failed to send listing management email", err);
    }

    // Send admin notification about the new pending listing.
    try {
      const { sendTemplatedEmail } = await import("@/lib/email/send.server");
      const { ADMIN_EMAIL_ADDRESS } = await import("@/lib/email/config.server");
      const housingLabels: Record<string, string> = {
        chambre: "Chambre",
        studio: "Studio",
        "1-bed": "1 chambre",
        "2-bed": "2 chambres",
        autre: "Autre",
      };
      const fmt = (iso: string) => {
        const [y, m, d] = iso.split("-");
        return `${d}/${m}/${y}`;
      };
      const availabilitiesText = data.availabilities
        .map((a) => `du ${fmt(a.start_date)} au ${fmt(a.end_date)}`)
        .join("\n");
      await sendTemplatedEmail({
        templateName: "listing-submission-admin",
        to: ADMIN_EMAIL_ADDRESS,
        idempotencyKey: `listing-admin-${row.id}`,
        templateData: {
          authorName: data.author_name,
          authorEmail: data.author_email,
          neighborhood: data.neighborhood,
          housingType: housingLabels[data.housing_type] ?? data.housing_type,
          summary: data.summary,
          availabilities: availabilitiesText,
          listingId: row.id,
        },
      });
    } catch (err) {
      console.error("Failed to send admin notification email", err);
    }

    return { ok: true as const, management_token: row.management_token as string };
  });

export interface ManagedListingDTO extends ListingDTO {
  status: "pending" | "approved" | "rejected" | "withdrawn";
  author_email: string;
  photo_paths: string[];
}

export const getListingByManagementToken = createServerFn({ method: "GET" })
  .inputValidator((input: { token: string }) =>
    z.object({ token: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data }): Promise<ManagedListingDTO | null> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await supabaseAdmin
      .from("listings")
      .select(
        "id, created_at, status, author_name, author_email, contact_type, contact_value, contact_label, neighborhood, borough, housing_type, summary, description, practical_info, photos, listing_availabilities(id, start_date, end_date, status)",
      )
      .eq("management_token", data.token)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!row) return null;
    const availabilities: Availability[] = (row.listing_availabilities ?? [])
      .map((a) => ({
        id: a.id,
        start_date: a.start_date,
        end_date: a.end_date,
        status: a.status,
      }))
      .sort((a, b) => a.start_date.localeCompare(b.start_date));
    const photoPaths = (row.photos as string[] | null) ?? [];
    return {
      id: row.id,
      created_at: row.created_at,
      status: row.status,
      author_name: row.author_name,
      author_email: row.author_email,
      contact_type: row.contact_type,
      contact_value: row.contact_value,
      contact_label: row.contact_label,
      neighborhood: row.neighborhood,
      borough: row.borough,
      housing_type: row.housing_type,
      summary: row.summary,
      description: row.description,
      practical_info: row.practical_info,
      photos: await resolvePhotos(photoPaths),
      photo_paths: photoPaths,
      availabilities,
    };
  });

const updateSchema = z.object({
  token: z.string().uuid(),
  summary: z.string().trim().min(10, "Le titre doit faire au moins 10 caractères").max(240),
  description: z.string().trim().min(20, "La description doit faire au moins 20 caractères").max(4000),
  practical_info: z.string().trim().max(2000).optional().or(z.literal("")),
  photos: z.array(z.string().max(500)).max(10).default([]),
  availabilities: z.array(availabilitySchema).min(1, "Ajoutez au moins une période").max(20),
});

export const updateListingByManagementToken = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => updateSchema.parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: existing, error: findErr } = await supabaseAdmin
      .from("listings")
      .select("id")
      .eq("management_token", data.token)
      .maybeSingle();
    if (findErr) throw new Error(findErr.message);
    if (!existing) throw new Error("Lien de gestion invalide.");

    const { error: updErr } = await supabaseAdmin
      .from("listings")
      .update({
        summary: data.summary,
        description: data.description,
        practical_info: data.practical_info || null,
        photos: data.photos,
      })
      .eq("id", existing.id);
    if (updErr) throw new Error(updErr.message);

    const { error: delErr } = await supabaseAdmin
      .from("listing_availabilities")
      .delete()
      .eq("listing_id", existing.id);
    if (delErr) throw new Error(delErr.message);

    const { error: insErr } = await supabaseAdmin
      .from("listing_availabilities")
      .insert(
        data.availabilities.map((a) => ({
          listing_id: existing.id,
          start_date: a.start_date,
          end_date: a.end_date,
        })),
      );
    if (insErr) throw new Error(insErr.message);

    return { ok: true as const };
  });

export const withdrawListingByManagementToken = createServerFn({ method: "POST" })
  .inputValidator((input: { token: string }) =>
    z.object({ token: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: existing, error: findErr } = await supabaseAdmin
      .from("listings")
      .select("id")
      .eq("management_token", data.token)
      .maybeSingle();
    if (findErr) throw new Error(findErr.message);
    if (!existing) throw new Error("Lien de gestion invalide.");
    const { error: updErr } = await supabaseAdmin
      .from("listings")
      .update({ status: "withdrawn" })
      .eq("id", existing.id);
    if (updErr) throw new Error(updErr.message);
    return { ok: true as const };
  });

const inquirySchema = z.object({
  listing_id: z.string().uuid(),
  visitor_first_name: z.string().trim().min(1, "Prénom requis").max(80),
  visitor_email: z.string().trim().email("Email invalide").max(255),
  start_date: z.string().min(1, "Date d'arrivée requise"),
  end_date: z.string().min(1, "Date de départ requise"),
  message: z.string().trim().min(1, "Message requis").max(4000),
}).refine((v) => v.end_date >= v.start_date, {
  message: "La date de départ doit être après l'arrivée",
  path: ["end_date"],
});

export const createInquiry = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => inquirySchema.parse(input))
  .handler(async ({ data }) => {
    const supabase = serverClient();
    // Verify requested range fits fully within one availability of the approved listing.
    const { data: avails, error: aErr } = await supabase
      .from("listing_availabilities")
      .select("start_date, end_date, status")
      .eq("listing_id", data.listing_id);
    if (aErr) throw new Error(aErr.message);
    const fits = (avails ?? []).some(
      (a) =>
        a.status !== "unavailable" &&
        data.start_date >= a.start_date &&
        data.end_date <= a.end_date,
    );

    if (!fits) {
      throw new Error("Les dates choisies ne sont pas disponibles.");
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: inquiry, error } = await supabaseAdmin
      .from("listing_inquiries")
      .insert({
        listing_id: data.listing_id,
        visitor_first_name: data.visitor_first_name,
        visitor_email: data.visitor_email,
        start_date: data.start_date,
        end_date: data.end_date,
        message: data.message,
      })
      .select("id")
      .single();

    if (error) throw new Error(error.message);

    // Fetch owner email and listing context (server-only — never exposed to the visitor).
    const { data: listing } = await supabaseAdmin
      .from("listings")
      .select("author_email, summary, neighborhood")
      .eq("id", data.listing_id)
      .eq("status", "approved")
      .maybeSingle();

    if (!listing?.author_email) {
      // Inquiry is recorded; surface a soft failure so the UI can inform the visitor.
      return { ok: true as const, emailSent: false as const };
    }

    try {
      const { sendTemplatedEmail } = await import("@/lib/email/send.server");
      const fmt = (iso: string) => {
        const [y, m, d] = iso.split("-");
        return `${d}/${m}/${y}`;
      };
      await sendTemplatedEmail({
        templateName: "inquiry-notification",
        to: listing.author_email,
        replyTo: data.visitor_email,
        idempotencyKey: `inquiry-${inquiry.id}`,
        bcc: true,
        templateData: {
          visitorFirstName: data.visitor_first_name,
          visitorEmail: data.visitor_email,
          startDate: fmt(data.start_date),
          endDate: fmt(data.end_date),
          message: data.message,
          listingSummary: listing.summary,
          listingNeighborhood: listing.neighborhood,
        },
      });
      return { ok: true as const, emailSent: true as const };
    } catch (err) {
      console.error("Failed to send inquiry notification", err);
      return { ok: true as const, emailSent: false as const };
    }
  });


