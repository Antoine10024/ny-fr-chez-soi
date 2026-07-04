import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { getListingByManagementToken } from "@/lib/listings.functions";
import {
  contactLabel,
  formatDateRange,
  housingLabel,
} from "@/lib/listing-constants";

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
      { title: "Gestion de mon annonce — Sous-loc NYC" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: ManagePage,
  errorComponent: InvalidToken,
  notFoundComponent: InvalidToken,
});

function InvalidToken() {
  return (
    <div className="mx-auto max-w-2xl px-5 py-24 text-center">
      <h1 className="font-serif text-3xl text-foreground">Lien invalide ou expiré</h1>
      <p className="mt-3 text-muted-foreground">
        Ce lien de gestion n&apos;existe pas ou n&apos;est plus valable. Vérifie l&apos;URL que
        tu as reçue lors de la publication de ton annonce.
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
};

function ManagePage() {
  const { token } = Route.useParams();
  const { data: listing } = useSuspenseQuery(manageQuery(token));
  if (!listing) return null;
  const status = STATUS_LABEL[listing.status] ?? STATUS_LABEL.pending;

  return (
    <div className="mx-auto max-w-4xl px-5 py-12">
      <div className="rounded-2xl border border-primary/30 bg-primary/5 p-6">
        <p className="text-xs font-medium uppercase tracking-wide text-primary">
          Page privée
        </p>
        <h1 className="mt-2 font-serif text-3xl text-foreground">
          Ta fiche de gestion
        </h1>
        <p className="mt-2 text-sm text-foreground/90">
          Seules les personnes disposant de ce lien peuvent voir cette page. Conserve
          l&apos;URL précieusement — l&apos;édition et la suppression arriveront prochainement.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
          <span className="text-muted-foreground">Statut :</span>
          <span
            className={`rounded-full border px-2.5 py-1 font-medium ${status.className}`}
          >
            {status.label}
          </span>
        </div>
      </div>

      <section className="mt-10">
        <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Photos
        </h2>
        {listing.photos.length > 0 ? (
          <div className="mt-3 grid gap-3 sm:grid-cols-2 md:grid-cols-3">
            {listing.photos.map((p, i) => (
              <img
                key={i}
                src={p}
                alt={`Photo ${i + 1}`}
                className="aspect-[4/3] w-full rounded-xl border border-border object-cover"
              />
            ))}
          </div>
        ) : (
          <p className="mt-2 text-sm italic text-muted-foreground">
            Aucune photo.
          </p>
        )}
      </section>

      <div className="mt-10 grid gap-10 md:grid-cols-[1.6fr_1fr]">
        <article>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="rounded-full bg-primary/10 px-2.5 py-1 font-medium text-primary">
              {listing.neighborhood}
            </span>
            <span className="rounded-full border border-border px-2.5 py-1 text-foreground/70">
              {housingLabel(listing.housing_type)}
            </span>
          </div>
          <h2 className="mt-4 font-serif text-2xl text-foreground">
            {listing.summary}
          </h2>

          <section className="mt-6">
            <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Périodes de disponibilité
            </h3>
            {listing.availabilities.length > 0 ? (
              <ul className="mt-3 space-y-2">
                {listing.availabilities.map((a, i) => (
                  <li
                    key={a.id ?? i}
                    className="flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground"
                  >
                    <span className="h-2 w-2 rounded-full bg-primary" />
                    {formatDateRange(a.start_date, a.end_date)}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm italic text-muted-foreground">
                Aucune période enregistrée.
              </p>
            )}
          </section>

          <section className="mt-8">
            <h3 className="font-serif text-xl text-foreground">Description</h3>
            <p className="mt-3 whitespace-pre-line leading-relaxed text-foreground/90">
              {listing.description}
            </p>
          </section>

          {listing.practical_info ? (
            <section className="mt-8">
              <h3 className="font-serif text-xl text-foreground">
                Informations pratiques
              </h3>
              <p className="mt-3 whitespace-pre-line leading-relaxed text-foreground/90">
                {listing.practical_info}
              </p>
            </section>
          ) : null}
        </article>

        <aside className="md:sticky md:top-24 md:self-start">
          <div className="rounded-2xl border border-border bg-card p-6">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Auteur
            </p>
            <p className="mt-1 font-serif text-lg text-foreground">
              {listing.author_name}
            </p>
            <p className="mt-1 text-sm text-muted-foreground break-words">
              {listing.author_email}
            </p>

            <div className="mt-5 border-t border-border pt-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Contact public
              </p>
              <p className="mt-1 text-sm text-foreground">
                {listing.contact_label || contactLabel(listing.contact_type)}
              </p>
              <p className="mt-1 text-sm text-muted-foreground break-words">
                {listing.contact_value}
              </p>
            </div>

            <div className="mt-6 rounded-lg border border-dashed border-border p-3 text-xs text-muted-foreground">
              L&apos;édition et la suppression seront disponibles dans une prochaine
              étape.
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
