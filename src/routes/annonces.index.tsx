import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { Check, ChevronDown, SlidersHorizontal } from "lucide-react";
import { listListings } from "@/lib/listings.functions";
import { ListingCard } from "@/components/ListingCard";
import { DateRangePicker, type DateRangeValue } from "@/components/DateRangePicker";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
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
          "Toutes les annonces de logements partagées par la communauté française à New York : séjours temporaires, reprises de bail, colocations. Filtrez par quartier, taille et dates.",
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
      if (category && l.category !== category) return false;
      if (range.from && range.to) {
        const ok = l.availabilities.some(
          (a) => a.start_date <= range.from! && a.end_date >= range.to!,
        );
        if (!ok) return false;
      }
      return true;
    });
  }, [listings, borough, neighborhoods, housing, category, range]);

  const hasFilters =
    borough || neighborhoods.length > 0 || housing || category || range.from || range.to;

  const neighborhoodLabel =
    neighborhoods.length === 0
      ? borough
        ? "Tous"
        : "Tous"
      : neighborhoods.length === 1
        ? neighborhoods[0]
        : `${neighborhoods.length} quartiers`;

  const advancedCount =
    (borough ? 1 : 0) + (neighborhoods.length > 0 ? 1 : 0) + (housing ? 1 : 0);
  const [sheetOpen, setSheetOpen] = useState(false);

  const categoryLabelActive =
    LISTING_CATEGORIES.find((c) => c.value === category)?.label ?? "Catégorie";
  const dateLabelActive =
    range.from && range.to
      ? "Dates sélectionnées"
      : range.from
        ? "Dates (partiel)"
        : "Dates";

  return (
    <div className="mx-auto max-w-6xl px-5 py-8 md:py-12">
      <div>
        <h1 className="font-serif text-3xl text-foreground md:text-5xl">Annonces</h1>
        <p className="mt-2 text-sm text-muted-foreground md:text-base">
          Parcourez les logements proposés par la communauté française à New York, pour un séjour temporaire ou une reprise de bail.
        </p>
      </div>

      {/* Mobile compact filter bar */}
      <div className="sticky top-[64px] z-20 -mx-5 mt-5 border-b border-border bg-background/90 px-5 py-3 backdrop-blur md:hidden">
        <div className="flex items-center gap-2 overflow-x-auto [-webkit-overflow-scrolling:touch] [&::-webkit-scrollbar]:hidden">
          <label className={pillClasses(!!category)}>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
              aria-label="Catégorie"
            >
              <option value="">Toutes catégories</option>
              {LISTING_CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
            <span className="truncate">{category ? categoryLabelActive : "Catégorie"}</span>
            <ChevronDown className="h-3.5 w-3.5 shrink-0 opacity-60" />
          </label>


          <div className="shrink-0">
            <DateRangePicker
              value={range}
              onChange={setRange}
              placeholder="Dates"
              minDate={new Date()}
              numberOfMonths={1}
              className={pillClasses(!!range.from) + " !w-auto !justify-start !pl-3"}
            />
          </div>


          <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
            <SheetTrigger asChild>
              <button type="button" className={pillClasses(advancedCount > 0)}>
                <SlidersHorizontal className="h-3.5 w-3.5" />
                <span>Filtres</span>
                {advancedCount > 0 ? (
                  <span className="grid h-4 min-w-[1rem] place-items-center rounded-full bg-primary px-1 text-[10px] font-medium text-primary-foreground">
                    {advancedCount}
                  </span>
                ) : null}
              </button>
            </SheetTrigger>
            <SheetContent side="bottom" className="flex h-[90vh] flex-col gap-0 rounded-t-3xl p-0">
              <SheetHeader className="border-b border-border px-5 py-4 text-left">
                <SheetTitle className="font-serif text-xl">Filtres</SheetTitle>
              </SheetHeader>
              <div className="flex-1 space-y-6 overflow-y-auto px-5 py-5">
                <SheetField label="Catégorie">
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm"
                  >
                    <option value="">Toutes</option>
                    {LISTING_CATEGORIES.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </SheetField>
                <SheetField label="Borough">
                  <select
                    value={borough}
                    onChange={(e) => {
                      setBorough(e.target.value as BoroughValue | "");
                      setNeighborhoods([]);
                    }}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm"
                  >
                    <option value="">Tous</option>
                    {BOROUGHS.map((b) => (
                      <option key={b.value} value={b.value}>
                        {b.label}
                      </option>
                    ))}
                  </select>
                </SheetField>
                <SheetField label="Quartier">
                  {neighborhoodOptions.length === 0 ? (
                    <p className="rounded-lg border border-dashed border-border px-3 py-2.5 text-sm text-muted-foreground">
                      Sélectionne d&apos;abord un borough.
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {neighborhoodOptions.map((n) => {
                        const checked = neighborhoods.includes(n);
                        return (
                          <button
                            key={n}
                            type="button"
                            onClick={() => toggleNeighborhood(n)}
                            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition ${
                              checked
                                ? "border-primary bg-primary text-primary-foreground"
                                : "border-border bg-background text-foreground/70"
                            }`}
                          >
                            {checked ? <Check className="h-3 w-3" /> : null}
                            {n}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </SheetField>
                <SheetField label="Taille">
                  <select
                    value={housing}
                    onChange={(e) => setHousing(e.target.value)}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm"
                  >
                    <option value="">Toutes</option>
                    {HOUSING_TYPES.map((h) => (
                      <option key={h.value} value={h.value}>
                        {h.label}
                      </option>
                    ))}
                  </select>
                </SheetField>
                <SheetField label="Dates">
                  <DateRangePicker
                    value={range}
                    onChange={setRange}
                    placeholder="Sélectionner"
                    minDate={new Date()}
                    numberOfMonths={1}
                  />
                </SheetField>
              </div>
              <div className="flex items-center gap-3 border-t border-border px-5 py-4">
                <button
                  type="button"
                  onClick={() => {
                    setBorough("");
                    setNeighborhoods([]);
                    setHousing("");
                    setCategory("");
                    setRange({});
                  }}
                  className="text-sm font-medium text-foreground underline underline-offset-4"
                >
                  Réinitialiser
                </button>
                <button
                  type="button"
                  onClick={() => setSheetOpen(false)}
                  className="ml-auto rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
                >
                  Voir les annonces
                </button>
              </div>
            </SheetContent>
          </Sheet>

          {hasFilters ? (
            <button
              type="button"
              onClick={() => {
                setBorough("");
                setNeighborhoods([]);
                setHousing("");
                setCategory("");
                setRange({});
              }}
              className="shrink-0 text-xs text-muted-foreground underline underline-offset-2"
            >
              Réinitialiser
            </button>
          ) : null}
        </div>
      </div>

      {/* Desktop filters (unchanged) */}
      <div className="sticky top-[72px] z-20 mt-8 hidden rounded-2xl border border-border bg-background/90 p-4 backdrop-blur md:block">
        <div className="grid gap-3 md:grid-cols-6">
          <Field label="Catégorie">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">Toutes</option>
              {LISTING_CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </Field>
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
          <Field label="Taille">
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
          <Field label="Dates">
            <DateRangePicker
              value={range}
              onChange={setRange}
              placeholder="Sélectionner"
              minDate={new Date()}
            />
          </Field>
          <Field label=" ">
            <button
              type="button"
              onClick={() => {
                setBorough("");
                setNeighborhoods([]);
                setHousing("");
                setCategory("");
                setRange({});
              }}
              disabled={!hasFilters}
              className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground transition hover:bg-secondary disabled:opacity-50"
            >
              Réinitialiser
            </button>
          </Field>

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
    <label className="flex h-full flex-col">
      <span className="mb-1 block min-h-[1.25rem] text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label.trim() ? label : "\u00A0"}
      </span>
      <div className="mt-auto">{children}</div>
    </label>
  );
}

function SheetField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      {children}
    </div>
  );
}

function pillClasses(active: boolean) {
  return `relative inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-medium transition ${
    active
      ? "border-foreground/40 bg-foreground/[0.04] text-foreground"
      : "border-border bg-background text-foreground/75 hover:border-foreground/30"
  }`;
}

function MobilePill({
  active,
  children,
}: {
  active: boolean;
  children: React.ReactNode;
}) {
  return <span className={pillClasses(active)}>{children}</span>;
}

