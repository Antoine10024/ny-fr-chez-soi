import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import {
  queryOptions,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Trash2, X } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import {
  getListingByManagementToken,
  updateListingByManagementToken,
  withdrawListingByManagementToken,
} from "@/lib/listings.functions";
import { supabase } from "@/integrations/supabase/client";
import { DateRangePicker } from "@/components/DateRangePicker";
import { categoryLabel, formatLocation, housingLabel } from "@/lib/listing-constants";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const manageQuery = (token: string) =>
  queryOptions({
    queryKey: ["manage", token],
    queryFn: () => getListingByManagementToken({ data: { token } }),
    staleTime: 0,
  });

export const Route = createFileRoute("/manage/$token")({
  loader: async ({ params, context }) => {
    const data = await context.queryClient.ensureQueryData(manageQuery(params.token));
    if (!data) throw notFound();
    return data;
  },
  head: () => ({
    meta: [
      { title: "Gestion de mon annonce — Logements NYC" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: ManagePage,
  errorComponent: () => <InvalidToken />,
  notFoundComponent: () => <InvalidToken />,
});

function InvalidToken() {
  return (
    <div className="mx-auto max-w-2xl px-5 py-24 text-center">
      <h1 className="font-serif text-3xl text-foreground">Lien invalide ou expiré</h1>
      <p className="mt-3 text-muted-foreground">
        Ce lien de gestion n&apos;existe pas ou n&apos;est plus valable. Vérifie l&apos;URL
        que tu as reçue lors de la publication de ton annonce.
      </p>
      <Link
        to="/annonces"
        className="mt-8 inline-flex items-center rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
      >
        Retour aux annonces
      </Link>
    </div>
  );
}

const STATUS_LABEL: Record<string, { label: string; className: string }> = {
  pending: {
    label: "En attente de validation",
    className: "bg-amber-100 text-amber-800 border-amber-200",
  },
  approved: {
    label: "Publiée",
    className: "bg-emerald-100 text-emerald-800 border-emerald-200",
  },
  rejected: {
    label: "Refusée",
    className: "bg-red-100 text-red-800 border-red-200",
  },
  withdrawn: {
    label: "Retirée du site",
    className: "bg-slate-100 text-slate-700 border-slate-200",
  },
};

const availabilitySchema = z
  .object({
    start_date: z.string().min(1, "Date de début requise"),
    end_date: z.string().min(1, "Date de fin requise"),
  })
  .refine((v) => v.end_date >= v.start_date, {
    message: "La date de fin doit être après la date de début",
    path: ["end_date"],
  });

const formSchema = z.object({
  summary: z
    .string()
    .trim()
    .min(10, "Le titre doit faire au moins 10 caractères")
    .max(240),
  description: z
    .string()
    .trim()
    .min(20, "La description doit faire au moins 20 caractères")
    .max(4000),
  practical_info: z.string().trim().max(2000).optional(),
  availabilities: z
    .array(availabilitySchema)
    .min(1, "Ajoute au moins une période")
    .max(20),
});
type FormValues = z.infer<typeof formSchema>;

interface PhotoItem {
  path: string;
  url: string;
  isNew?: boolean;
}

function ManagePage() {
  const { token } = Route.useParams();
  const { data: listing } = useSuspenseQuery(manageQuery(token));
  const queryClient = useQueryClient();
  const update = useServerFn(updateListingByManagementToken);
  const withdraw = useServerFn(withdrawListingByManagementToken);

  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [withdrawing, setWithdrawing] = useState(false);
  const [withdrawnAt, setWithdrawnAt] = useState<number | null>(null);
  const [withdrawError, setWithdrawError] = useState<string | null>(null);

  useEffect(() => {
    if (!listing) return;
    setPhotos(
      listing.photo_paths.map((path, i) => ({
        path,
        url: listing.photos[i] ?? "",
      })),
    );
  }, [listing]);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      summary: listing?.summary ?? "",
      description: listing?.description ?? "",
      practical_info: listing?.practical_info ?? "",
      availabilities:
        listing?.availabilities.map((a) => ({
          start_date: a.start_date,
          end_date: a.end_date,
        })) ?? [{ start_date: "", end_date: "" }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "availabilities",
  });
  const availabilitiesValue = watch("availabilities");

  async function handlePhotos(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    const added: PhotoItem[] = [];
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
          alert(`Échec d'envoi de ${file.name} : ${error.message}`);
          continue;
        }
        added.push({
          path,
          url: URL.createObjectURL(file),
          isNew: true,
        });
      }
      setPhotos((prev) => [...prev, ...added]);
    } finally {
      setUploading(false);
    }
  }

  function removePhoto(index: number) {
    setPhotos((prev) => {
      const next = [...prev];
      const [removed] = next.splice(index, 1);
      if (removed?.isNew && removed.url.startsWith("blob:")) {
        try {
          URL.revokeObjectURL(removed.url);
        } catch {
          /* noop */
        }
      }
      return next;
    });
  }

  async function onSubmit(values: FormValues) {
    setServerError(null);
    setSavedAt(null);
    try {
      await update({
        data: {
          token,
          summary: values.summary,
          description: values.description,
          practical_info: values.practical_info || "",
          photos: photos.map((p) => p.path),
          availabilities: values.availabilities,
        },
      });
      await queryClient.invalidateQueries({ queryKey: ["manage", token] });
      const fresh = await queryClient.fetchQuery(manageQuery(token));
      if (fresh) {
        reset({
          summary: fresh.summary,
          description: fresh.description,
          practical_info: fresh.practical_info ?? "",
          availabilities: fresh.availabilities.map((a) => ({
            start_date: a.start_date,
            end_date: a.end_date,
          })),
        });
      }
      setSavedAt(Date.now());
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e) {
      setServerError(e instanceof Error ? e.message : "Une erreur est survenue");
    }
  }

  if (!listing) return null;
  const status = STATUS_LABEL[listing.status] ?? STATUS_LABEL.pending;

  return (
    <div className="mx-auto max-w-3xl px-5 py-12">
      <div className="rounded-2xl border border-primary/30 bg-primary/5 p-6">
        <p className="text-xs font-medium uppercase tracking-wide text-primary">
          Page privée
        </p>
        <h1 className="mt-2 font-serif text-3xl text-foreground">
          Gérer mon annonce
        </h1>
        <p className="mt-2 text-sm text-foreground/90">
          Modifie ton annonce depuis cette page. Conserve précieusement l&apos;URL —
          c&apos;est ta seule clé d&apos;accès.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
          <span className="text-muted-foreground">Statut :</span>
          <span
            className={`rounded-full border px-2.5 py-1 font-medium ${status.className}`}
          >
            {status.label}
          </span>
          <span className="ml-2 rounded-full bg-primary/10 px-2.5 py-1 font-medium text-primary">
            {formatLocation(listing.neighborhood, listing.borough)}
          </span>
          <span className="rounded-full border border-border px-2.5 py-1 text-foreground/70">
            {housingLabel(listing.housing_type)}
          </span>
        </div>
      </div>

      {withdrawnAt || listing.status === "withdrawn" ? (
        <div className="mt-6 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-800">
          Ton annonce a bien été retirée du site. Elle reste conservée dans notre base
          de données mais n&apos;apparaît plus publiquement.
        </div>
      ) : null}

      {savedAt ? (
        <div className="mt-6 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
          Modifications enregistrées avec succès.
        </div>
      ) : null}

      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-10">
        <Section title="Photos" desc="Jusqu'à 10 photos.">
          {photos.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
              {photos.map((p, i) => (
                <div
                  key={p.path}
                  className="group relative overflow-hidden rounded-xl border border-border"
                >
                  {p.url ? (
                    <img
                      src={p.url}
                      alt={`Photo ${i + 1}`}
                      className="aspect-[4/3] w-full object-cover"
                    />
                  ) : (
                    <div className="aspect-[4/3] w-full bg-secondary" />
                  )}
                  <button
                    type="button"
                    onClick={() => removePhoto(i)}
                    aria-label="Supprimer cette photo"
                    className="absolute right-2 top-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-background/90 text-foreground shadow transition hover:bg-destructive hover:text-destructive-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm italic text-muted-foreground">
              Aucune photo pour le moment.
            </p>
          )}
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => handlePhotos(e.target.files)}
            disabled={uploading || photos.length >= 10}
            className="mt-4 block w-full text-sm text-foreground file:mr-4 file:rounded-full file:border-0 file:bg-secondary file:px-4 file:py-2 file:text-sm file:font-medium file:text-foreground hover:file:bg-secondary/80"
          />
          {uploading ? (
            <p className="mt-2 text-sm text-muted-foreground">Envoi en cours…</p>
          ) : null}
        </Section>

        <Section title="Description">
          <FormField label="Titre" error={errors.summary?.message}>
            <input className={inputCls} {...register("summary")} />
          </FormField>
          <FormField label="Description" error={errors.description?.message}>
            <textarea rows={6} className={inputCls} {...register("description")} />
          </FormField>
          <FormField
            label="Informations pratiques (optionnel)"
            hint="Wifi, lave-linge, vélo, animaux, étage…"
            error={errors.practical_info?.message}
          >
            <textarea
              rows={3}
              className={inputCls}
              {...register("practical_info")}
            />
          </FormField>
        </Section>

        <Section
          title="Disponibilités"
          desc="Ajoute, modifie ou supprime des périodes."
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
                  <div className="min-w-[260px] flex-1">
                    <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Période {index + 1}
                    </span>
                    <DateRangePicker
                      value={{ from: current?.start_date, to: current?.end_date }}
                      onChange={(v) => {
                        setValue(
                          `availabilities.${index}.start_date`,
                          v.from ?? "",
                          { shouldValidate: true, shouldDirty: true },
                        );
                        setValue(
                          `availabilities.${index}.end_date`,
                          v.to ?? "",
                          { shouldValidate: true, shouldDirty: true },
                        );
                      }}
                      placeholder="Choisir les dates"
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
            <p className="text-xs text-destructive">
              {errors.availabilities.message}
            </p>
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

        {serverError ? (
          <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
            {serverError}
          </div>
        ) : null}

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-6">
          <p className="text-xs text-muted-foreground">
            {isDirty
              ? "Modifications non enregistrées."
              : "Aucune modification en attente."}
          </p>
          <button
            type="submit"
            disabled={isSubmitting || uploading}
            className="inline-flex items-center rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition hover:bg-primary/90 disabled:opacity-60"
          >
            {isSubmitting ? "Enregistrement…" : "Enregistrer les modifications"}
          </button>
        </div>
      </form>

      <section className="mt-16 rounded-2xl border border-destructive/30 bg-destructive/5 p-6">
        <h2 className="font-serif text-xl text-foreground">Retirer mon annonce</h2>
        <p className="mt-2 text-sm text-foreground/90">
          Ton annonce ne sera plus visible sur le site.
        </p>
        {withdrawError ? (
          <p className="mt-3 text-sm text-destructive">{withdrawError}</p>
        ) : null}
        <div className="mt-5">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button
                type="button"
                disabled={
                  withdrawing ||
                  listing.status === "withdrawn" ||
                  listing.status === "rejected"
                }
                className="inline-flex items-center rounded-full border border-destructive bg-background px-5 py-2.5 text-sm font-medium text-destructive transition hover:bg-destructive hover:text-destructive-foreground disabled:opacity-50"
              >
                {listing.status === "withdrawn"
                  ? "Déjà retirée du site"
                  : "Retirer mon annonce du site"}
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Retirer l&apos;annonce du site public ?</AlertDialogTitle>
                <AlertDialogDescription asChild>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <p>
                      Ton annonce ne s&apos;affichera plus sur la liste publique et ne
                      recevra plus de nouvelles demandes de contact.
                    </p>
                    <p>
                      <strong className="text-foreground">
                        Elle ne sera pas supprimée définitivement.
                      </strong>{" "}
                      Les photos, les disponibilités et le contenu restent conservés dans
                      notre base de données. Ton lien de gestion reste valable.
                    </p>
                  </div>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Annuler</AlertDialogCancel>
                <AlertDialogAction
                  onClick={async (e) => {
                    e.preventDefault();
                    setWithdrawError(null);
                    setWithdrawing(true);
                    try {
                      await withdraw({ data: { token } });
                      await queryClient.invalidateQueries({
                        queryKey: ["manage", token],
                      });
                      await queryClient.fetchQuery(manageQuery(token));
                      setWithdrawnAt(Date.now());
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    } catch (err) {
                      setWithdrawError(
                        err instanceof Error
                          ? err.message
                          : "Une erreur est survenue",
                      );
                    } finally {
                      setWithdrawing(false);
                    }
                  }}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Oui, retirer l&apos;annonce
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </section>
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
