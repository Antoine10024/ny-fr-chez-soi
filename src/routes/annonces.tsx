import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { listListings } from "@/lib/listings.functions";
import { ListingCard } from "@/components/ListingCard";
import { HOUSING_TYPES, NEIGHBORHOODS } from "@/lib/listing-constants";

const listingsQuery = queryOptions({
  queryKey: ["listings"],
  queryFn: () => listListings(),
});

export const Route = createFileRoute("/annonces")({
  head: () => ({
    meta: [
      { title: "Annonces de sous-location à NYC — Sous-loc NYC" },
      {
        name: "description",
        content:
          "Toutes les annonces de sous-location temporaire partagées par la communauté française à New York. Filtrez par quartier, type de logement et dates.",
      },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(listingsQuery),
  component: AnnoncesPage,
});

function AnnoncesPage() {
  const { data: listings } = useSuspenseQuery(listingsQuery);
  const [neighborhood, setNeighborhood] = useState<string>("");
  const [housing, setHousing] = useState<string>("");
  const [from, setFrom] = useState<string>("");
  const [to, setTo] = useState<string>("");

  const filtered = useMemo(() => {
    return listings.filter((l) => {
      if (neighborhood && l.neighborhood !== neighborhood) return false;
      if (housing && l.housing_type !== housing) return false;
      // overlap test: listing range must overlap [from, to]
      if (from && l.end_date < from) return false;
      if (to && l.start_date > to) return false;
      return true;
    });
  }, [listings, neighborhood, housing, from, to]);

  const hasFilters = neighborhood || housing || from || to;

  return (
    <div className="mx-auto max-w-6xl px-5 py-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-4xl text-foreground md:text-5xl">Annonces</h1>
          <p className="mt-2 text-muted-foreground">
            {listings.length} sous-location{listings.length > 1 ? "s" : ""} partagée
            {listings.length > 1 ? "s" : ""} par la communauté.
          </p>
        </div>
        <Link
          to="/soumettre"
          className="inline-flex items-center rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
        >
          Soumettre une annonce
        </Link>
      </div>

      <div className="sticky top-[72px] z-20 mt-8 rounded-2xl border border-border bg-background/90 p-4 backdrop-blur">
        <div className="grid gap-3 md:grid-cols-5">
          <Field label="Quartier">
            <select
              value={neighborhood}
              onChange={(e) => setNeighborhood(e.target.value)}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">Tous</option>
              {NEIGHBORHOODS.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Type">
            <select
              value={housing}
              onChange={(e) => setHousing(e.target.value)}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">Tous</option>
              {HOUSING_TYPES.map((h) => (
                <option key={h.value} value={h.value}>
                  {h.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Disponible à partir du">
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
            />
          </Field>
          <Field label="Jusqu'au">
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
            />
          </Field>
          <div className="flex items-end">
            <button
              type="button"
              onClick={() => {
                setNeighborhood("");
                setHousing("");
                setFrom("");
                setTo("");
              }}
              disabled={!hasFilters}
              className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground transition hover:bg-secondary disabled:opacity-50"
            >
              Réinitialiser
            </button>
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="mt-12 rounded-2xl border border-dashed border-border bg-card p-12 text-center">
          <h2 className="font-serif text-xl text-foreground">Aucune annonce ne correspond</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Essayez d&apos;élargir vos filtres, ou{" "}
            <Link to="/soumettre" className="text-primary underline">
              publiez votre annonce
            </Link>
            .
          </p>
        </div>
      ) : (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((l) => (
            <ListingCard key={l.id} listing={l} />
          ))}
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      {children}
    </label>
  );
}
