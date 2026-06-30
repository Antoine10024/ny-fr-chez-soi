
## Objectif

Un site en français, simple et chaleureux, où la communauté française à NYC publie et consulte des annonces de sous-location temporaire. Aucune notion de prix, paiement ou réservation.

## Pages

1. **Accueil (`/`)** — Hero "Sous-locations entre Français à NYC", court paragraphe, boutons "Voir les annonces" et "Soumettre une annonce", section "Comment ça marche" en 3 étapes, disclaimer en footer.
2. **Annonces (`/annonces`)** — Grille de cartes (photo, quartier, type, dates, résumé). Filtres : dates de disponibilité, type de logement (chambre, studio, 1-bed, 2-bed, autre), quartier (liste de quartiers NYC). État vide géré.
3. **Détail annonce (`/annonces/$id`)** — Galerie photos, quartier, type, dates, description, infos pratiques, bloc contact avec bouton "Contacter l'auteur de l'annonce" qui ouvre le moyen de contact choisi (mailto, lien WhatsApp/Facebook/autre).
4. **Soumettre une annonce (`/soumettre`)** — Formulaire validé (zod) : nom, email, moyen de contact public (type + valeur), quartier, type, date début/fin, photos (upload multiple), description, infos utiles. Soumission → statut `pending`, message de remerciement, email envoyé à l'admin avec lien d'approbation/rejet.

Footer global avec disclaimer sur toutes les pages.

## Backend (Lovable Cloud)

**Table `listings`** (RLS activée) :
- `id`, `created_at`, `status` (`pending` | `approved` | `rejected`)
- `author_name`, `author_email` (privé, jamais exposé publiquement)
- `contact_type` (`email` | `whatsapp` | `facebook` | `instagram` | `autre`), `contact_value`, `contact_label`
- `neighborhood`, `housing_type`, `start_date`, `end_date`
- `summary`, `description`, `practical_info`
- `photos` (text[] — URLs storage)
- `moderation_token` (uuid pour les liens email)

Policies :
- `anon` + `authenticated` SELECT : uniquement `status = 'approved'`, et **vue publique** (ou `SECURITY DEFINER` fonction) qui n'expose pas `author_email` ni `moderation_token`.
- `anon` INSERT : autorisé, force `status='pending'`.
- Approbation/rejet via server function publique appelée avec `moderation_token` (vérif token côté serveur, pas d'auth user).

**Storage** : bucket public `listing-photos` pour les photos.

## Modération par email

- Pas de page admin, pas de login.
- À chaque soumission, une server function envoie un email à une adresse admin (configurée via secret `ADMIN_EMAIL`) contenant : résumé de l'annonce + 2 liens signés (`/api/public/moderation/approve?token=…` et `/reject?token=…`).
- Les routes publiques `/api/public/moderation/*` valident le `moderation_token`, mettent à jour `status`, et affichent une page de confirmation simple.
- Email envoyé via **Lovable Emails** (built-in). Prérequis : configuration du domaine d'email (dialog présenté à l'utilisateur).

## Données de démo

Seed migration avec 6-8 annonces fictives `approved` couvrant West Village, Williamsburg, Astoria, Harlem, LES, Bushwick, UWS, Long Island City — variées en type (chambre, studio, 1-bed, 2-bed) et dates étalées sur les prochains mois. Photos depuis Unsplash.

## Direction visuelle

- **Ton** : chaleureux, éditorial, légère touche française (sans cliché tour Eiffel). Inspiré "petit carnet de quartier".
- **Palette** : fond crème `#FAF6EF`, texte encre `#1B1B1F`, accent terracotta/brique NYC `#C2410C`, secondaire bleu nuit `#1E3A5F`, bordures douces sable.
- **Typo** : titres en serif éditorial (Fraunces), corps en sans-serif lisible (Inter). Chargés via `@fontsource`.
- **Composants** : cartes avec coins arrondis `rounded-2xl`, ombres très douces, photos en ratio 4/3, badges quartier/type discrets, filtres en barre sticky sur desktop / drawer mobile.
- **Animations** : transitions sobres via Tailwind (hover lift sur cartes, fade-in liste).
- Tokens sémantiques dans `src/styles.css` (oklch), pas de classes couleur en dur.

## Étapes techniques

1. Activer Lovable Cloud.
2. Migration : table `listings`, vue publique sans champs sensibles, RLS, bucket storage, seed.
3. Setup Lovable Emails (domaine d'email — dialog utilisateur) + scaffold transactional email + template "Nouvelle annonce à modérer".
4. Design system dans `src/styles.css` + chargement fonts.
5. Routes : `index.tsx`, `annonces.tsx`, `annonces.$id.tsx`, `soumettre.tsx`, layout `__root.tsx` (header + footer + disclaimer).
6. Server functions : `listListings`, `getListing`, `submitListing` (+ envoi email admin). Server routes publiques `/api/public/moderation/approve` et `/reject`.
7. Composants : `ListingCard`, `ListingFilters`, `ListingGallery`, `ContactButton`, `SubmitForm` (avec upload photos vers storage).
8. SEO : `head()` distinct par page (titres et descriptions en français), og tags.

## Hors scope (confirmé)

Pas de paiement, pas de réservation, pas de login utilisateur, pas de messagerie interne, pas de notation/avis.
