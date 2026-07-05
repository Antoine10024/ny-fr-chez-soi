import { useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Props {
  photos: string[];
  alt: string;
  className?: string;
}

export function PhotoCarousel({ photos, alt, className }: Props) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);

  const onScroll = () => {
    const el = scrollerRef.current;
    if (!el) return;
    const i = Math.round(el.scrollLeft / el.clientWidth);
    if (i !== index) setIndex(i);
  };

  const scrollTo = (i: number) => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollTo({ left: i * el.clientWidth, behavior: "smooth" });
  };

  const go = (delta: number) => {
    const next = Math.min(Math.max(index + delta, 0), photos.length - 1);
    scrollTo(next);
  };

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-border bg-secondary ${className ?? ""}`}
    >
      <div
        ref={scrollerRef}
        onScroll={onScroll}
        className="flex aspect-[16/10] w-full snap-x snap-mandatory overflow-x-auto overflow-y-hidden scroll-smooth [scrollbar-width:none] [-webkit-overflow-scrolling:touch] [&::-webkit-scrollbar]:hidden"
      >
        {photos.map((src, i) => (
          <div key={i} className="h-full w-full flex-none snap-center snap-always">
            <img
              src={src}
              alt={`${alt} — photo ${i + 1}`}
              className="h-full w-full object-cover"
              loading={i === 0 ? "eager" : "lazy"}
              draggable={false}
            />
          </div>
        ))}
      </div>

      {photos.length > 1 ? (
        <>
          <div className="pointer-events-none absolute right-3 top-3 rounded-full bg-black/55 px-2.5 py-1 text-xs font-medium text-white">
            {index + 1}/{photos.length}
          </div>

          {/* Desktop/tablet arrows */}
          <button
            type="button"
            aria-label="Photo précédente"
            onClick={() => go(-1)}
            disabled={index === 0}
            className="absolute left-3 top-1/2 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-foreground shadow transition hover:bg-white disabled:opacity-0 sm:flex"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            aria-label="Photo suivante"
            onClick={() => go(1)}
            disabled={index === photos.length - 1}
            className="absolute right-3 top-1/2 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-foreground shadow transition hover:bg-white disabled:opacity-0 sm:flex"
          >
            <ChevronRight className="h-5 w-5" />
          </button>

          <div className="pointer-events-none absolute inset-x-0 bottom-3 flex justify-center gap-1.5">
            {photos.map((_, i) => (
              <span
                key={i}
                className={`h-1.5 rounded-full transition-all ${
                  i === index ? "w-5 bg-white" : "w-1.5 bg-white/60"
                }`}
              />
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}
