export function SiteFooter() {
  return (
    <footer className="border-t border-border/60 bg-background">
      <div className="mx-auto max-w-6xl px-5 py-10 text-sm text-muted-foreground">
        <p className="max-w-3xl leading-relaxed">
          Ce site est un outil communautaire de mise en relation. Chaque personne
          est responsable de vérifier les conditions de sous-location, son bail,
          les règles de son immeuble et les modalités de contact avec
          l&apos;annonceur.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 text-xs">
          <span>© {new Date().getFullYear()} Logements NYC — projet communautaire, sans but commercial.</span>
          <span className="font-serif italic">🇫🇷 Créé par et pour la communauté des Français à New York.</span>
        </div>
      </div>
    </footer>
  );
}
