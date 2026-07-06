export function SiteFooter() {
  return (
    <footer className="border-t border-border/60 bg-background">
      <div className="mx-auto max-w-6xl px-5 py-10 text-sm text-muted-foreground">
        <p className="max-w-3xl leading-relaxed">
          Ce site est un outil communautaire de mise en relation. Chaque personne
          est responsable de vérifier les conditions prévues par son bail,
          les règles de son immeuble et les modalités de contact avec
          l&apos;annonceur.
        </p>
        <p className="mt-4 max-w-3xl leading-relaxed">
          Contact :{" "}
          <a
            href="mailto:bonjour@logements.nyc"
            className="text-primary underline underline-offset-2 transition hover:text-primary/80"
          >
            bonjour@logements.nyc
          </a>
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 text-xs">
          <span>© {new Date().getFullYear()} Logements NYC — projet communautaire, sans but commercial.</span>
          <span className="font-serif italic flex items-center gap-1.5">
            <svg width="16" height="12" viewBox="0 0 16 12" xmlns="http://www.w3.org/2000/svg" className="inline-block flex-shrink-0 rounded-[2px]" aria-hidden="true">
              <rect width="5.33" height="12" fill="#002395"/>
              <rect x="5.33" width="5.34" height="12" fill="#FFFFFF"/>
              <rect x="10.67" width="5.33" height="12" fill="#ED2939"/>
            </svg>
            Créé par et pour la communauté des Français à New York.
          </span>
        </div>
      </div>
    </footer>
  );
}
