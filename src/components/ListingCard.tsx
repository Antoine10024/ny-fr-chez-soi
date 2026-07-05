import { useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  categoryLabel,
  formatLocation,
  formatShortDateRange,
  housingLabel,
} from "@/lib/listing-constants";
import type { Availability } from "@/lib/listings.functions";

export interface ListingCardData {
  id: string;
  neighborhood: string;
  borough: string;
  housing_type: string;
  category: string;
  summary: string;
  photos: string[];
  availabilities: Availability[];
}

function MobilePhotoCarousel({
  photos,
  neighborhood,
}: {
  photos: string[];
  neighborhood: string;
}) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);

  const onScroll = () => {
    const el = scrollerRef.current;
    if (!el) return;
    const i = Math.round(el.scrollLeft / el.clientWidth);
    if (i !== index) setIndex(i);
  };

  return (
    <div className="relative">
      <div
        ref={scrollerRef}
        onScroll={onScroll}
        className="flex aspect-[4/3] w-full snap-x snap-mandatory overflow-x-auto overflow-y-hidden scroll-smooth bg-secondary [scrollbar-width:none] [-webkit-overflow-scrolling:touch] [&::-webkit-scrollbar]:hidden"
      >
        {photos.map((src, i) => (
          <div key={i} className="relative h-full w-full flex-none snap-center snap-always">
            <img
              src={src}
              alt={`Photo ${i + 1} — ${neighborhood}`}
              className="h-full w-full object-cover"
              loading="lazy"
              draggable={false}
            />
          </div>
        ))}
      </div>
      {photos.length > 1 ? (
        <>
          <div className="pointer-events-none absolute right-2 top-2 rounded-full bg-black/55 px-2 py-0.5 text-[11px] font-medium text-white">
            {index + 1}/{photos.length}
          </div>
          <div className="pointer-events-none absolute inset-x-0 bottom-2 flex justify-center gap-1.5">
            {photos.map((_, i) => (
              <span
                key={i}
                className={`h-1.5 rounded-full transition-all ${
                  i === index ? "w-4 bg-white" : "w-1.5 bg-white/60"
                }`}
              />
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}

export function ListingCard({ listing }: { listing: ListingCardData }) {
  const photo = listing.photos[0];
  const hasPhotos = listing.photos.length > 0;
  const shown = listing.availabilities.slice(0, 3);
  const extra = listing.availabilities.length - shown.length;
  return (
    <Link
      to="/annonces/$id"
      params={{ id: listing.id }}
      className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition hover:-translate-y-0.5 hover:shadow-[0_10px_30px_-12px_oklch(0.18_0.015_60/0.18)]"
    >
      {/* Mobile: swipeable carousel */}
      {hasPhotos ? (
        <div
          className="md:hidden"
          onClick={(e) => {
            // Allow horizontal swipe without triggering navigation issues; taps still bubble to Link
            e.stopPropagation();
          }}
        >
          <MobilePhotoCarousel photos={listing.photos} neighborhood={listing.neighborhood} />
        </div>
      ) : (
        <div className="grid aspect-[4/3] w-full place-items-center bg-secondary text-muted-foreground md:hidden">
          <span className="font-serif italic">Photo à venir</span>
        </div>
      )}

      {/* Desktop: single hero image (unchanged) */}
      <div className="hidden aspect-[4/3] w-full overflow-hidden bg-secondary md:block">
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
            {formatLocation(listing.neighborhood, listing.borough)}
          </span>
          <span className="rounded-full border border-border px-2.5 py-1 text-foreground/70">
            {housingLabel(listing.housing_type)}
          </span>
          {listing.category ? (
            <span className="rounded-full border border-border bg-secondary px-2.5 py-1 text-foreground/70">
              {categoryLabel(listing.category)}
            </span>
          ) : null}
        </div>
        <p className="font-serif text-lg leading-snug text-foreground">
          {listing.summary}
        </p>
        <div className="mt-auto text-sm text-muted-foreground">
          {shown.length > 0 ? (
            <ul className="space-y-1">
              {shown.map((a, i) => (
                <li key={a.id ?? i} className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                  <span>{formatShortDateRange(a.start_date, a.end_date)}</span>
                </li>
              ))}
              {extra > 0 ? (
                <li className="pl-3.5 text-xs italic text-primary">
                  … et {extra} autre{extra > 1 ? "s" : ""} période{extra > 1 ? "s" : ""}
                </li>
              ) : null}
            </ul>
          ) : (
            <span className="italic">Dates à préciser</span>
          )}
        </div>
      </div>
    </Link>
  );
}
