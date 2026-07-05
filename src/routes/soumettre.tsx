import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Trash2 } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { submitListing } from "@/lib/listings.functions";
import { supabase } from "@/integrations/supabase/client";
import { DateRangePicker } from "@/components/DateRangePicker";
import {
  BOROUGHS,
  HOUSING_TYPES,
  NEIGHBORHOODS_BY_BOROUGH,
  OTHER_NEIGHBORHOOD,
  type BoroughValue,
} from "@/lib/listing-constants";

export const Route = createFileRoute("/soumettre")({
  head: () => ({
    meta: [
      { title: "Publier une annonce — Sous-loc NYC" },
      {
        name: "description",
        content:
          "Publie ton annonce de sous-location temporaire à New York en quelques minutes. Validation manuelle avant publication.",
      },
    ],
  }),
  component: SubmitPage,
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

const schema = z.object({
  author_name: z.string().trim().min(1, "Ton prénom est requis").max(100),
  author_email: z.string().trim().email("Email invalide").max(255),
  contact_type: z.enum(["email", "whatsapp", "facebook", "instagram", "telegram", "autre"]),
  contact_value: z.string().trim().max(300),
  contact_label: z.string().trim().max(60).optional(),
  neighborhood: z.string().trim().min(1, "Choisis un quartier").max(80),
  housing_type: z.enum(["chambre", "studio", "1-bed", "2-bed", "autre"]),
  availabilities: z
    .array(availabilitySchema)
    .min(1, "Ajoute au moins une période")
    .max(20, "20 périodes maximum"),
  summary: z
    .string()
    .trim()
    .min(10, "Le titre doit faire au moins 10 caractères")
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
  const [managementToken, setManagementToken] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      contact_type: "email",
      contact_value: "",
      contact_label: "",
      housing_type: "studio",
      neighborhood: "",
      availabilities: [{ start_date: "", end_date: "" }],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "availabilities" });
  const availabilitiesValue = watch("availabilities");

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
      const res = await submit({
        data: {
          ...values,
          contact_type: "email",
          contact_value: values.author_email,
          contact_label: "",
          practical_info: values.practical_info || "",
          photos,
        },
      });
      setManagementToken(res.management_token);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e) {
      setServerError(e instanceof Error ? e.message : "Une erreur est survenue");
    }
  }

  if (managementToken) {
    const manageUrl =
      typeof window !== "undefined"
        ? `${window.location.origin}/manage/${managementToken}`
        : `/manage/${managementToken}`;
    async function copy() {
      try {
        await navigator.clipboard.writeText(manageUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {
        /* noop */
      }
    }
    return (
      <div className="mx-auto max-w-2xl px-5 py-20">
        <div className="text-center">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            ✓
          </span>
          <h1 className="mt-6 font-serif text-3xl text-foreground">Merci&nbsp;!</h1>
          <p className="mt-3 text-muted-foreground">
            Ton annonce a bien été enregistrée&nbsp;: elle est{" "}
            <strong>en attente de validation</strong> et sera publiée après une
            relecture rapide.
          </p>
        </div>

        <div className="mt-10 rounded-2xl border border-primary/30 bg-primary/5 p-6">
          <h2 className="font-serif text-xl text-foreground">Ton lien de gestion</h2>
          <p className="mt-2 text-sm text-foreground/90">
            Conserve ce lien précieusement. Il te permettra de modifier ou supprimer
            ton annonce. Nous te l&apos;enverrons également par email dans une prochaine
            étape.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <input
              readOnly
              value={manageUrl}
              onFocus={(e) => e.currentTarget.select()}
              className="flex-1 min-w-[240px] rounded-lg border border-border bg-background px-3 py-2 font-mono text-xs text-foreground"
            />
            <button
              type="button"
              onClick={copy}
              className="rounded-full bg-primary px-4 py-2 text-xs font-medium text-primary-foreground transition hover:bg-primary/90"
            >
              {copied ? "Copié !" : "Copier le lien"}
            </button>
            <a
              href={manageUrl}
              className="rounded-full border border-border px-4 py-2 text-xs font-medium text-foreground transition hover:bg-secondary"
            >
              Ouvrir
            </a>
          </div>
        </div>

        <div className="mt-8 flex justify-center">
          <Link
            to="/annonces"
            className="text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
          >
            Voir toutes les annonces
          </Link>
        </div>
      </div>
    );
  }


  return (
    <div className="mx-auto max-w-3xl px-5 py-12">
      <h1 className="font-serif text-4xl text-foreground md:text-5xl">
        Publier une annonce
      </h1>
      <p className="mt-3 text-muted-foreground">
        Ça prend 2-3 minutes. Ton annonce sera publiée après une relecture rapide
        par un modérateur.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-10 space-y-10">
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
        </Section>

        <Section
          title="Disponibilités"
          desc="Ajoute une ou plusieurs périodes pendant lesquelles ton logement est disponible."
        >
          <div className="space-y-3">
            {fields.map((field, index) => {
              const current = availabilitiesValue?.[index];
              const err = errors.availabilities?.[index];
              return (
                <div
                  key={field.id}
                  className="flex flex-wrap items-start gap-3 rounded-xl border border-border bg-card p-3"
                >
                  <div className="flex-1 min-w-[260px]">
                    <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Période {index + 1}
                    </span>
                    <DateRangePicker
                      value={{ from: current?.start_date, to: current?.end_date }}
                      onChange={(v) => {
                        setValue(`availabilities.${index}.start_date`, v.from ?? "", {
                          shouldValidate: true,
                        });
                        setValue(`availabilities.${index}.end_date`, v.to ?? "", {
                          shouldValidate: true,
                        });
                      }}
                      placeholder="Choisir les dates"
                      minDate={new Date()}
                    />
                    {err?.start_date?.message ? (
                      <span className="mt-1 block text-xs text-destructive">
                        {err.start_date.message}
                      </span>
                    ) : null}
                    {err?.end_date?.message ? (
                      <span className="mt-1 block text-xs text-destructive">
                        {err.end_date.message}
                      </span>
                    ) : null}
                  </div>
                  {fields.length > 1 ? (
                    <button
                      type="button"
                      onClick={() => remove(index)}
                      aria-label="Supprimer cette période"
                      className="mt-6 inline-flex h-9 w-9 items-center justify-center rounded-full border border-border text-muted-foreground transition hover:border-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  ) : null}
                </div>
              );
            })}
          </div>
          {errors.availabilities?.message ? (
            <p className="text-xs text-destructive">{errors.availabilities.message}</p>
          ) : null}
          <button
            type="button"
            onClick={() => append({ start_date: "", end_date: "" })}
            disabled={fields.length >= 20}
            className="inline-flex items-center gap-2 rounded-full border border-dashed border-border bg-card px-4 py-2 text-sm text-foreground transition hover:bg-secondary disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />
            Ajouter une période
          </button>
        </Section>

        <Section title="Photos" desc="Jusqu'à 10 photos.">
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

        <Section title="Description">
          <FormField
            label="Titre"
            hint="Une phrase qui apparaîtra sur la carte de l'annonce (ex : Studio lumineux dans l'UWS)."
            error={errors.summary?.message}
          >
            <input className={inputCls} {...register("summary")} />
          </FormField>
          <FormField label="Description" error={errors.description?.message}>
            <textarea rows={6} className={inputCls} {...register("description")} />
          </FormField>
          <FormField
            label="Informations pratiques (optionnel)"
            hint="Wifi, lave-linge, vélo, animaux, étage…"
          >
            <textarea rows={3} className={inputCls} {...register("practical_info")} />
          </FormField>
        </Section>

        <Section title="Toi" desc="Comment te joindre — ton email reste privé.">
          <Grid>
            <FormField label="Prénom" error={errors.author_name?.message}>
              <input className={inputCls} {...register("author_name")} />
            </FormField>
            <FormField
              label="Ton email"
              hint="Il ne sera jamais affiché publiquement. Il servira uniquement à t'envoyer ton lien de gestion et les demandes de contact."
              error={errors.author_email?.message}
            >
              <input type="email" className={inputCls} {...register("author_email")} />
            </FormField>
          </Grid>
        </Section>

        {serverError ? (
          <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
            {serverError}
          </div>
        ) : null}

        <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 text-sm text-foreground/90">
          Tu pourras modifier ou retirer ton annonce à tout moment. Un lien
          privé te sera envoyé par email une fois ton annonce enregistrée.
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-6">
          <p className="text-xs text-muted-foreground">
            En publiant, tu confirmes avoir le droit de sous-louer ce logement.
          </p>
          <button
            type="submit"
            disabled={isSubmitting || uploading}
            className="inline-flex items-center rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition hover:bg-primary/90 disabled:opacity-60"
          >
            {isSubmitting ? "Envoi…" : "Publier mon annonce"}
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
