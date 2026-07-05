import { Link } from "@tanstack/react-router";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
        <Link to="/" className="group flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-full bg-primary text-primary-foreground font-serif text-base">
            F
          </span>
          <span className="font-serif text-lg leading-none">
            <span className="font-medium">Sous-loc</span>
            <span className="text-muted-foreground"> · NYC</span>
          </span>
        </Link>
        <nav className="flex items-center gap-1 text-sm">
          <Link
            to="/annonces"
            className="rounded-full px-3 py-2 text-foreground/80 transition hover:bg-secondary hover:text-foreground"
            activeProps={{ className: "rounded-full px-3 py-2 bg-secondary text-foreground" }}
          >
            Annonces
          </Link>
          <Link
            to="/soumettre"
            className="ml-2 inline-flex items-center rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition hover:bg-primary/90"
          >
            Publier une annonce
          </Link>
        </nav>
      </div>
    </header>
  );
}
