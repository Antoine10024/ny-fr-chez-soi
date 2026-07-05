import { Link, createFileRoute } from "@tanstack/react-router";
import { Luggage, Key } from "lucide-react";
import brownstoneImg from "@/assets/brownstone.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Logements NYC — Logements entre Français à New York" },
      {
        name: "description",
        content:
          "Le site des Français qui cherchent ou proposent un logement à New York. Pas de commission, juste de la mise en relation, 100% gratuit.",
      },
    ],
  }),
  component: Home,
});

function Home() {
  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="paper-grain absolute inset-0 opacity-60" aria-hidden />
        <div className="relative mx-auto grid max-w-6xl gap-12 px-5 py-20 md:grid-cols-[1.05fr_0.95fr] md:py-28">
          <div>
            <h1 className="mt-5 font-serif text-5xl leading-[1.05] text-foreground md:text-6xl">
              Logements <span className="italic text-primary">NYC</span>
            </h1>
            <p className="mt-5 max-w-xl font-serif text-xl italic leading-snug text-foreground/85 md:text-2xl">
              Un espace d'entraide dédié au Français qui cherchent ou proposent un logement à New York - sans intermédiaire.
            </p>
            <p className="mt-8 text-center font-sans text-[11px] font-semibold uppercase tracking-[0.25em] text-muted-foreground">
              Trouvez le logement qui vous convient
            </p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col rounded-2xl border border-border bg-card/30 p-5">
                <Luggage className="h-10 w-10 text-primary" />
                <h3 className="mt-4 font-serif text-base font-medium text-primary">Séjour temporaire</h3>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">Pour trouver un logement le temps de votre séjour à New York.</p>
              </div>
              <div className="flex flex-col rounded-2xl border border-border bg-card/30 p-5">
                <Key className="h-10 w-10 text-primary" />
                <h3 className="mt-4 font-serif text-base font-medium text-primary">Reprise de bail</h3>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">Pour reprendre un bail existant et vous installer durablement à New York.</p>
              </div>
            </div>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/annonces"
                className="inline-flex items-center rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground shadow-sm transition hover:bg-primary/90"
              >
                Voir les annonces
              </Link>
              <Link
                to="/soumettre"
                className="inline-flex items-center rounded-full border border-border bg-card px-6 py-3 text-sm font-medium text-foreground transition hover:bg-secondary"
              >
                Publier une annonce
              </Link>
            </div>
          </div>
          <div className="relative">
            <div className="absolute -left-6 top-6 hidden h-full w-full rounded-3xl border border-border md:block" />
            <img
              src={brownstoneImg}
              alt="Brownstone à New York"
              width={1024}
              height={1280}
              className="relative aspect-[4/5] w-full rounded-3xl border border-border object-cover shadow-[0_30px_60px_-30px_oklch(0.18_0.015_60/0.4)]"
            />
          </div>
        </div>
      </section>

      {/* Comment ça fonctionne */}
      <section className="border-t border-border bg-card/40">
        <div className="mx-auto max-w-6xl px-5 py-20">
          <h2 className="font-serif text-3xl text-foreground md:text-4xl">
            Comment ça fonctionne
          </h2>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Trois étapes, sans intermédiaire.
          </p>
          <ol className="mt-10 grid gap-6 md:grid-cols-3">
            {[
              {
                n: "01",
                t: "Trouvez un logement",
                d: "Parcourez les annonces et filtrez par borough, quartier, type de logement et dates de disponibilité.",
              },
              {
                n: "02",
                t: "Contactez le propriétaire",
                d: "Envoyez votre demande directement depuis le site. Le propriétaire reçoit votre message par email et peut vous répondre en toute confidentialité.",
              },
              {
                n: "03",
                t: "Organisez-vous librement",
                d: "Vous échangez directement avec le propriétaire pour convenir des dates et des modalités de votre location.",
              },
            ].map((s) => (
              <li
                key={s.n}
                className="rounded-2xl border border-border bg-background p-6"
              >
                <span className="font-serif text-2xl text-primary">{s.n}</span>
                <h3 className="mt-3 font-serif text-xl text-foreground">{s.t}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.d}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-5 py-20">
        <div className="overflow-hidden rounded-3xl border border-border bg-accent text-accent-foreground">
          <div className="grid gap-6 px-8 py-12 md:grid-cols-[1fr_auto] md:items-center md:px-12">
            <div>
              <h2 className="font-serif text-3xl md:text-4xl">
                Vous avez un logement disponible&nbsp;?
              </h2>
              <p className="mt-3 max-w-xl text-sm text-accent-foreground/85">
                Publiez votre annonce en quelques minutes et proposez votre logement à la communauté française de New York.
              </p>
            </div>
            <Link
              to="/soumettre"
              className="inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
            >
              Publier une annonce
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
