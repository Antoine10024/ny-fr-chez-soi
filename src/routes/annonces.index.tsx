import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { Check, ChevronDown } from "lucide-react";
import { listListings } from "@/lib/listings.functions";
import { ListingCard } from "@/components/ListingCard";
import { DateRangePicker, type DateRangeValue } from "@/components/DateRangePicker";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  BOROUGHS,
  HOUSING_TYPES,
  LISTING_CATEGORIES,
  NEIGHBORHOODS_BY_BOROUGH,
  type BoroughValue,
} from "@/lib/listing-constants";

const listingsQuery = queryOptions({
  queryKey: ["listings"],
  queryFn: () => listListings(),
});

export const Route = createFileRoute("/annonces/")({
  head: () => ({
    meta: [
      { title: "Annonces de logements à NYC — Logements NYC" },
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
  const [borough, setBorough] = useState<BoroughValue | "">("");
  const [neighborhoods, setNeighborhoods] = useState<string[]>([]);
  const [housing, setHousing] = useState<string>("");
  const [category, setCategory] = useState<string>("");
  const [range, setRange] = useState<DateRangeValue>({});

  const neighborhoodOptions = borough ? NEIGHBORHOODS_BY_BOROUGH[borough] : [];

  function toggleNeighborhood(value: string) {
    setNeighborhoods((prev) =>
      prev.includes(value) ? prev.filter((n) => n !== value) : [...prev, value],
    );
  }

  const filtered = useMemo(() => {
    return listings.filter((l) => {
      if (borough && l.borough !== borough) return false;
      if (neighborhoods.length > 0 && !neighborhoods.includes(l.neighborhood)) return false;
      if (housing && l.housing_type !== housing) return false;
      if (range.from && range.to) {
        const ok = l.availabilities.some(
          (a) => a.start_date <= range.from! && a.end_date >= range.to!,
        );
        if (!ok) return false;
      }
      return true;
    });
  }, [listings, borough, neighborhoods, housing, range]);

  const hasFilters =
    borough || neighborhoods.length > 0 || housing || range.from || range.to;

  const neighborhoodLabel =
    neighborhoods.length === 0
      ? borough
        ? "Tous"
        : "Choisir un borough"
      : neighborhoods.length === 1
        ? neighborhoods[0]
        : `${neighborhoods.length} quartiers`;

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
          Publier une annonce
        </Link>
      </div>

      <div className="sticky top-[72px] z-20 mt-8 rounded-2xl border border-border bg-background/90 p-4 backdrop-blur">
        <div className="grid gap-3 md:grid-cols-5">
          <Field label="Borough">
            <select
              value={borough}
              onChange={(e) => {
                setBorough(e.target.value as BoroughValue | "");
                setNeighborhoods([]);
              }}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">Tous</option>
              {BOROUGHS.map((b) => (
                <option key={b.value} value={b.value}>
                  {b.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Quartier">
            <Popover>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  disabled={!borough}
                  className="flex w-full items-center justify-between gap-2 rounded-lg border border-input bg-background px-3 py-2 text-left text-sm disabled:opacity-60"
                >
                  <span className={neighborhoods.length === 0 ? "text-muted-foreground" : "text-foreground"}>
                    {neighborhoodLabel}
                  </span>
                  <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                </button>
              </PopoverTrigger>
              <PopoverContent align="start" className="max-h-72 w-64 overflow-y-auto p-1">
                {neighborhoodOptions.length === 0 ? (
                  <p className="p-3 text-sm text-muted-foreground">
                    Sélectionne d&apos;abord un borough.
                  </p>
                ) : (
                  <>
                    {neighborhoods.length > 0 ? (
                      <button
                        type="button"
                        onClick={() => setNeighborhoods([])}
                        className="mb-1 w-full rounded-md px-3 py-1.5 text-left text-xs text-muted-foreground hover:bg-secondary"
                      >
                        Tout désélectionner
                      </button>
                    ) : null}
                    {neighborhoodOptions.map((n) => {
                      const checked = neighborhoods.includes(n);
                      return (
                        <button
                          key={n}
                          type="button"
                          onClick={() => toggleNeighborhood(n)}
                          className="flex w-full items-center gap-2 rounded-md px-3 py-1.5 text-left text-sm text-foreground hover:bg-secondary"
                        >
                          <span
                            className={`grid h-4 w-4 shrink-0 place-items-center rounded border ${
                              checked
                                ? "border-primary bg-primary text-primary-foreground"
                                : "border-input bg-background"
                            }`}
                          >
                            {checked ? <Check className="h-3 w-3" /> : null}
                          </span>
                          <span>{n}</span>
                        </button>
                      );
                    })}
                  </>
                )}
              </PopoverContent>
            </Popover>
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
          <Field label="Arrivée → Départ">
            <DateRangePicker
              value={range}
              onChange={setRange}
              placeholder="Sélectionner"
              minDate={new Date()}
            />
          </Field>
          <div className="flex items-end">
            <button
              type="button"
              onClick={() => {
                setBorough("");
                setNeighborhoods([]);
                setHousing("");
                setRange({});
              }}
              disabled={!hasFilters}
              className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground transition hover:bg-secondary disabled:opacity-50"
            >
              Réinitialiser
            </button>
          </div>

        </div>
        {range.from && !range.to ? (
          <p className="mt-2 text-xs text-muted-foreground">
            Sélectionnez aussi la date de départ pour filtrer.
          </p>
        ) : null}
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
