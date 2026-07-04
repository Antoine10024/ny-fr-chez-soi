import { useState } from "react";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { getListing } from "@/lib/listings.functions";
import { formatDateRange, housingLabel } from "@/lib/listing-constants";
import { ContactInquiryDialog } from "@/components/ContactInquiryDialog";
import { Button } from "@/components/ui/button";


const listingQuery = (id: string) =>
  queryOptions({
    queryKey: ["listing", id],
    queryFn: () => getListing({ data: { id } }),
  });

export const Route = createFileRoute("/annonces/$id")({
  loader: async ({ params, context }) => {
    const data = await context.queryClient.ensureQueryData(listingQuery(params.id));
    if (!data) throw notFound();
    return data;
  },
  head: ({ loaderData }) => {
    const title = loaderData
      ? `${loaderData.summary} — Sous-loc NYC`
      : "Annonce — Sous-loc NYC";
    return {
      meta: [
        { title },
        {
          name: "description",
          content: loaderData?.summary ?? "Annonce de sous-location à New York.",
        },
      ],
    };
  },
  component: ListingDetail,
  notFoundComponent: () => (
    <div className="mx-auto max-w-3xl px-5 py-24 text-center">
      <h1 className="font-serif text-3xl">Annonce introuvable</h1>
      <p className="mt-2 text-muted-foreground">
        Elle a peut-être été retirée par son auteur.
      </p>
      <Link to="/annonces" className="mt-6 inline-block text-primary underline">
        Retour aux annonces
      </Link>
    </div>
  ),
});

function ListingDetail() {
  const { id } = Route.useParams();
  const { data: listing } = useSuspenseQuery(listingQuery(id));
  if (!listing) return null;

  const contactHref = buildContactHref(listing.contact_type, listing.contact_value);

  return (
    <div className="mx-auto max-w-5xl px-5 py-12">
      <Link
        to="/annonces"
        className="text-sm text-muted-foreground transition hover:text-foreground"
      >
        ← Toutes les annonces
      </Link>

      <div className="mt-6 grid gap-3 md:grid-cols-2">
        {listing.photos.length > 0 ? (
          <>
            <img
              src={listing.photos[0]}
              alt={`Photo principale — ${listing.neighborhood}`}
              className="aspect-[4/3] w-full rounded-2xl border border-border object-cover md:row-span-2 md:aspect-auto md:h-full"
            />
            {listing.photos.slice(1, 3).map((p, i) => (
              <img
                key={i}
                src={p}
                alt={`Photo ${i + 2}`}
                className="aspect-[4/3] w-full rounded-2xl border border-border object-cover"
              />
            ))}
          </>
        ) : (
          <div className="md:col-span-2 grid aspect-[16/7] place-items-center rounded-2xl border border-dashed border-border bg-card text-muted-foreground">
            <span className="font-serif italic">Pas de photo fournie</span>
          </div>
        )}
      </div>

      <div className="mt-10 grid gap-12 md:grid-cols-[1.6fr_1fr]">
        <article>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="rounded-full bg-primary/10 px-2.5 py-1 font-medium text-primary">
              {listing.neighborhood}
            </span>
            <span className="rounded-full border border-border px-2.5 py-1 text-foreground/70">
              {housingLabel(listing.housing_type)}
            </span>
          </div>
          <h1 className="mt-4 font-serif text-3xl leading-tight text-foreground md:text-4xl">
            {listing.summary}
          </h1>

          <section className="mt-6">
            <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Périodes disponibles
            </h2>
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
                Dates à préciser avec l&apos;auteur.
              </p>
            )}
          </section>

          <section className="mt-8">
            <h2 className="font-serif text-xl text-foreground">Description</h2>
            <p className="mt-3 whitespace-pre-line leading-relaxed text-foreground/90">
              {listing.description}
            </p>
          </section>

          {listing.practical_info ? (
            <section className="mt-8">
              <h2 className="font-serif text-xl text-foreground">Informations pratiques</h2>
              <p className="mt-3 whitespace-pre-line leading-relaxed text-foreground/90">
                {listing.practical_info}
              </p>
            </section>
          ) : null}
        </article>

        <aside className="md:sticky md:top-24 md:self-start">
          <div className="rounded-2xl border border-border bg-card p-6">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Annonce publiée par
            </p>
            <p className="mt-1 font-serif text-xl text-foreground">{listing.author_name}</p>
            <p className="mt-4 text-sm text-muted-foreground">
              Moyen de contact :{" "}
              <span className="text-foreground">
                {listing.contact_label || contactLabel(listing.contact_type)}
              </span>
            </p>
            <a
              href={contactHref}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 inline-flex w-full items-center justify-center rounded-full bg-primary px-5 py-3 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
            >
              Contacter l&apos;auteur de l&apos;annonce
            </a>
            <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
              Les échanges se font directement entre vous et l&apos;annonceur, hors du site.
              Vérifiez bien les conditions de sous-location et de votre bail.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
