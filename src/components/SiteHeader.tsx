import { Link } from "@tanstack/react-router";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
        <Link to="/" className="group flex items-baseline gap-1.5">
          <span className="font-serif text-xl leading-none font-medium text-foreground">
            Logements
          </span>
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary" aria-hidden />
          <span className="font-serif text-xl leading-none text-muted-foreground">
            NYC
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
            <span className="sm:hidden">Publier</span>
            <span className="hidden sm:inline">Publier une annonce</span>
          </Link>
        </nav>
      </div>
    </header>
  );
}
