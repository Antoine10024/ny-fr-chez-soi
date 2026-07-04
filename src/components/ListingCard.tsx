import { Link } from "@tanstack/react-router";
import { formatShortDateRange, housingLabel } from "@/lib/listing-constants";
import type { Availability } from "@/lib/listings.functions";

export interface ListingCardData {
  id: string;
  neighborhood: string;
  housing_type: string;
  summary: string;
  photos: string[];
  availabilities: Availability[];
}

export function ListingCard({ listing }: { listing: ListingCardData }) {
  const photo = listing.photos[0];
  const [first, ...rest] = listing.availabilities;
  return (
    <Link
      to="/annonces/$id"
      params={{ id: listing.id }}
      className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition hover:-translate-y-0.5 hover:shadow-[0_10px_30px_-12px_oklch(0.18_0.015_60/0.18)]"
    >
      <div className="aspect-[4/3] w-full overflow-hidden bg-secondary">
        {photo ? (
          <img
            src={photo}
            alt={`Photo — ${listing.neighborhood}`}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
            loading="lazy"
          />
        ) : (
          <div className="grid h-full w-full place-items-center text-muted-foreground">
            <span className="font-serif italic">Photo à venir</span>
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="rounded-full bg-primary/10 px-2.5 py-1 font-medium text-primary">
            {listing.neighborhood}
          </span>
          <span className="rounded-full border border-border px-2.5 py-1 text-foreground/70">
            {housingLabel(listing.housing_type)}
          </span>
        </div>
        <p className="font-serif text-lg leading-snug text-foreground">
          {listing.summary}
        </p>
        <div className="mt-auto text-sm text-muted-foreground">
          {first ? (
            <>
              <span>{formatShortDateRange(first.start_date, first.end_date)}</span>
              {rest.length > 0 ? (
                <span className="ml-2 text-xs text-primary">
                  +{rest.length} autre{rest.length > 1 ? "s" : ""} période
                  {rest.length > 1 ? "s" : ""}
                </span>
              ) : null}
            </>
          ) : (
            <span className="italic">Dates à préciser</span>
          )}
        </div>
      </div>
    </Link>
  );
}
