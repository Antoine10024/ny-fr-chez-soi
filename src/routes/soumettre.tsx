import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useServerFn } from "@tanstack/react-start";
import { submitListing } from "@/lib/listings.functions";
import { supabase } from "@/integrations/supabase/client";
import {
  CONTACT_TYPES,
  HOUSING_TYPES,
  NEIGHBORHOODS,
} from "@/lib/listing-constants";

export const Route = createFileRoute("/soumettre")({
  head: () => ({
    meta: [
      { title: "Soumettre une annonce — Sous-loc NYC" },
      {
        name: "description",
        content:
          "Publiez votre annonce de sous-location temporaire à New York en quelques minutes. Validation manuelle avant publication.",
      },
    ],
  }),
  component: SubmitPage,
});

const schema = z.object({
  author_name: z.string().trim().min(1, "Votre nom est requis").max(100),
  author_email: z.string().trim().email("Email invalide").max(255),
  contact_type: z.enum(["email", "whatsapp", "facebook", "instagram", "telegram", "autre"]),
  contact_value: z.string().trim().min(1, "Indiquez un contact").max(300),
  contact_label: z.string().trim().max(60).optional(),
  neighborhood: z.string().trim().min(1, "Choisissez un quartier").max(80),
  housing_type: z.enum(["chambre", "studio", "1-bed", "2-bed", "autre"]),
  start_date: z.string().min(1, "Date de début requise"),
  end_date: z.string().min(1, "Date de fin requise"),
  summary: z
    .string()
    .trim()
    .min(10, "Le résumé doit faire au moins 10 caractères")
    .max(240, "240 caractères maximum"),
  description: z
    .string()
    .trim()
    .min(20, "La description doit faire au moins 20 caractères")
    .max(4000),
  practical_info: z.string().trim().max(2000).optional(),
});
type FormValues = z.infer<typeof schema>;

function SubmitPage() {
  const submit = useServerFn(submitListing);
  const [photos, setPhotos] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [done, setDone] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      contact_type: "whatsapp",
      housing_type: "studio",
      neighborhood: "",
    },
  });

  async function handlePhotos(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    const newPaths: string[] = [];
    try {
      for (const file of Array.from(files).slice(0, 10 - photos.length)) {
        if (file.size > 8 * 1024 * 1024) {
          alert(`Le fichier ${file.name} dépasse 8 Mo`);
          continue;
        }
        const ext = file.name.split(".").pop() ?? "jpg";
        const path = `${crypto.randomUUID()}.${ext}`;
        const { error } = await supabase.storage
          .from("listing-photos")
          .upload(path, file, { contentType: file.type, upsert: false });
        if (error) {
          alert(`Échec d'envoi de ${file.name}: ${error.message}`);
          continue;
        }
        newPaths.push(path);
      }
      setPhotos((p) => [...p, ...newPaths]);
    } finally {
      setUploading(false);
    }
  }

  async function onSubmit(values: FormValues) {
    setServerError(null);
    try {
      await submit({
        data: {
          ...values,
          contact_label: values.contact_label || "",
          practical_info: values.practical_info || "",
          photos,
        },
      });
      setDone(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e) {
      setServerError(e instanceof Error ? e.message : "Une erreur est survenue");
    }
  }

  if (done) {
    return (
      <div className="mx-auto max-w-2xl px-5 py-24 text-center">
        <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          ✓
        </span>
        <h1 className="mt-6 font-serif text-3xl text-foreground">Merci&nbsp;!</h1>
        <p className="mt-3 text-muted-foreground">
          Votre annonce a bien été reçue. Elle est <strong>en attente de validation</strong> et
          sera publiée dès qu&apos;un modérateur l&apos;aura relue.
        </p>
        <Link
          to="/annonces"
          className="mt-8 inline-flex items-center rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
        >
          Voir les annonces
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-5 py-12">
      <h1 className="font-serif text-4xl text-foreground md:text-5xl">
        Soumettre une annonce
      </h1>
      <p className="mt-3 text-muted-foreground">
        Ça prend 2-3 minutes. Votre annonce sera publiée après une relecture rapide
        par un modérateur.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-10 space-y-10">
        <Section title="Vous" desc="Comment vous joindre — votre email reste privé.">
          <Grid>
            <FormField label="Votre nom" error={errors.author_name?.message}>
              <input className={inputCls} {...register("author_name")} />
            </FormField>
            <FormField label="Votre email (privé)" error={errors.author_email?.message}>
              <input type="email" className={inputCls} {...register("author_email")} />
            </FormField>
          </Grid>
          <Grid>
            <FormField label="Moyen de contact public" error={errors.contact_type?.message}>
              <select className={inputCls} {...register("contact_type")}>
                {CONTACT_TYPES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </FormField>
            <FormField
              label="Valeur du contact"
              hint="ex. +13475550100, votre.email@…, https://facebook.com/…"
              error={errors.contact_value?.message}
            >
              <input className={inputCls} {...register("contact_value")} />
            </FormField>
          </Grid>
          <FormField label="Étiquette du contact (optionnel)" hint="ex. 'WhatsApp en soirée'">
            <input className={inputCls} {...register("contact_label")} />
          </FormField>
        </Section>

        <Section title="Logement">
          <Grid>
            <FormField label="Quartier" error={errors.neighborhood?.message}>
              <select className={inputCls} {...register("neighborhood")}>
                <option value="">— Choisir —</option>
                {NEIGHBORHOODS.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </FormField>
            <FormField label="Type de logement" error={errors.housing_type?.message}>
              <select className={inputCls} {...register("housing_type")}>
                {HOUSING_TYPES.map((h) => (
                  <option key={h.value} value={h.value}>
                    {h.label}
                  </option>
                ))}
              </select>
            </FormField>
          </Grid>
          <Grid>
            <FormField label="Date de début" error={errors.start_date?.message}>
              <input type="date" className={inputCls} {...register("start_date")} />
            </FormField>
            <FormField label="Date de fin" error={errors.end_date?.message}>
              <input type="date" className={inputCls} {...register("end_date")} />
            </FormField>
          </Grid>
        </Section>

        <Section title="Description">
          <FormField
            label="Résumé court"
            hint="Une phrase qui apparaîtra sur la carte de l'annonce (max 240 caractères)."
            error={errors.summary?.message}
          >
            <input className={inputCls} {...register("summary")} />
          </FormField>
          <FormField label="Description détaillée" error={errors.description?.message}>
            <textarea rows={6} className={inputCls} {...register("description")} />
          </FormField>
          <FormField
            label="Informations pratiques (optionnel)"
            hint="Wifi, lave-linge, vélo, animaux, étage…"
          >
            <textarea rows={3} className={inputCls} {...register("practical_info")} />
          </FormField>
        </Section>

        <Section title="Photos" desc="Jusqu'à 10 photos, 8 Mo max chacune.">
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => handlePhotos(e.target.files)}
            disabled={uploading || photos.length >= 10}
            className="block w-full text-sm text-foreground file:mr-4 file:rounded-full file:border-0 file:bg-secondary file:px-4 file:py-2 file:text-sm file:font-medium file:text-foreground hover:file:bg-secondary/80"
          />
          {uploading ? (
            <p className="mt-2 text-sm text-muted-foreground">Envoi en cours…</p>
          ) : null}
          {photos.length > 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">
              {photos.length} photo{photos.length > 1 ? "s" : ""} prête{photos.length > 1 ? "s" : ""} à être publiée{photos.length > 1 ? "s" : ""}.
            </p>
          ) : null}
        </Section>

        {serverError ? (
          <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
            {serverError}
          </div>
        ) : null}

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-6">
          <p className="text-xs text-muted-foreground">
            En publiant, vous confirmez avoir le droit de sous-louer ce logement.
          </p>
          <button
            type="submit"
            disabled={isSubmitting || uploading}
            className="inline-flex items-center rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition hover:bg-primary/90 disabled:opacity-60"
          >
            {isSubmitting ? "Envoi…" : "Envoyer mon annonce"}
          </button>
        </div>
      </form>
    </div>
  );
}

const inputCls =
  "w-full rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-sm focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/30";

function Section({
  title,
  desc,
  children,
}: {
  title: string;
  desc?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-5">
      <header>
        <h2 className="font-serif text-2xl text-foreground">{title}</h2>
        {desc ? <p className="mt-1 text-sm text-muted-foreground">{desc}</p> : null}
      </header>
      {children}
    </section>
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-4 md:grid-cols-2">{children}</div>;
}

function FormField({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-foreground">{label}</span>
      {children}
      {hint && !error ? (
        <span className="mt-1 block text-xs text-muted-foreground">{hint}</span>
      ) : null}
      {error ? (
        <span className="mt-1 block text-xs text-destructive">{error}</span>
      ) : null}
    </label>
  );
}
