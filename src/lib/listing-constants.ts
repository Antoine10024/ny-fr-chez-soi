export const BOROUGHS = [
  { value: "manhattan", label: "Manhattan" },
  { value: "brooklyn", label: "Brooklyn" },
  { value: "queens", label: "Queens" },
  { value: "new_jersey", label: "New Jersey" },
  { value: "autre", label: "Autre" },
] as const;

export type BoroughValue = (typeof BOROUGHS)[number]["value"];

export const OTHER_NEIGHBORHOOD = "Autre quartier";

export const NEIGHBORHOODS_BY_BOROUGH: Record<BoroughValue, readonly string[]> = {
  manhattan: [
    "Upper West Side",
    "Upper East Side",
    "Harlem",
    "Washington Heights / Inwood",
    "Hell's Kitchen",
    "Midtown",
    "Chelsea",
    "Flatiron / Gramercy",
    "West Village",
    "Greenwich Village",
    "East Village",
    "SoHo / NoHo / Nolita",
    "Lower East Side / Chinatown",
    "Tribeca",
    "Financial District / Battery Park City",
    "Murray Hill / Kips Bay",
    "Roosevelt Island",
    OTHER_NEIGHBORHOOD,
  ],
  brooklyn: [
    "Williamsburg",
    "Greenpoint",
    "DUMBO / Brooklyn Heights",
    "Downtown Brooklyn",
    "Fort Greene / Clinton Hill",
    "Bed-Stuy",
    "Bushwick",
    "Park Slope",
    "Prospect Heights / Crown Heights",
    "Carroll Gardens / Cobble Hill / Boerum Hill",
    "Red Hook / Gowanus",
    "Sunset Park",
    OTHER_NEIGHBORHOOD,
  ],
  queens: [
    "Long Island City",
    "Astoria",
    "Sunnyside / Woodside",
    "Jackson Heights / Elmhurst",
    "Forest Hills / Rego Park",
    "Flushing",
    "Ridgewood",
    OTHER_NEIGHBORHOOD,
  ],
  new_jersey: [
    "Jersey City",
    "Newport",
    "Hoboken",
    "Weehawken",
    "Journal Square",
    "Exchange Place",
    OTHER_NEIGHBORHOOD,
  ],
  autre: [
    "Westchester",
    "Bronx",
    "Staten Island",
    OTHER_NEIGHBORHOOD,
  ],
};

export const HOUSING_TYPES = [
  { value: "chambre", label: "Chambre" },
  { value: "studio", label: "Studio" },
  { value: "1-bed", label: "1-bed (1 chambre)" },
  { value: "2-bed", label: "2-bed (2 chambres)" },
  { value: "autre", label: "3-bedroom et +" },
] as const;

export type HousingType = (typeof HOUSING_TYPES)[number]["value"];

export function housingLabel(value: string): string {
  return HOUSING_TYPES.find((h) => h.value === value)?.label ?? value;
}

export function boroughLabel(value: string | null | undefined): string {
  if (!value) return "";
  return BOROUGHS.find((b) => b.value === value)?.label ?? "";
}

export const LISTING_CATEGORIES = [
  { value: "sejour_temporaire", label: "Séjour temporaire" },
  { value: "reprise_bail", label: "Reprise de bail" },
  { value: "colocation", label: "Colocation" },
] as const;

export type ListingCategory = (typeof LISTING_CATEGORIES)[number]["value"];

export function categoryLabel(value: string | null | undefined): string {
  if (!value) return "";
  return LISTING_CATEGORIES.find((c) => c.value === value)?.label ?? "";
}

export function formatLocation(
  neighborhood: string | null | undefined,
  borough: string | null | undefined,
): string {
  const n = (neighborhood ?? "").trim();
  const b = boroughLabel(borough);
  if (n && b) return `${n}, ${b}`;
  return n || b || "";
}


const longFmt = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "short",
  year: "numeric",
});
const shortFmt = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short" });

export function formatDateRange(start: string, end: string): string {
  return `Du ${longFmt.format(new Date(start))} au ${longFmt.format(new Date(end))}`;
}

export function formatShortDateRange(start: string, end: string): string {
  return `${shortFmt.format(new Date(start))} → ${shortFmt.format(new Date(end))}`;
}

export function formatISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
