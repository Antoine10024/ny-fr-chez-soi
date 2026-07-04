export const NEIGHBORHOODS = [
  "West Village",
  "East Village",
  "Lower East Side",
  "SoHo",
  "Chelsea",
  "Midtown",
  "Upper West Side",
  "Upper East Side",
  "Harlem",
  "Washington Heights",
  "Williamsburg",
  "Bushwick",
  "Greenpoint",
  "Park Slope",
  "DUMBO",
  "Bedford-Stuyvesant",
  "Astoria",
  "Long Island City",
  "Sunnyside",
  "Autre",
] as const;

export const HOUSING_TYPES = [
  { value: "chambre", label: "Chambre" },
  { value: "studio", label: "Studio" },
  { value: "1-bed", label: "1-bed (1 chambre)" },
  { value: "2-bed", label: "2-bed (2 chambres)" },
  { value: "autre", label: "3-bedroom et +" },
] as const;

export const CONTACT_TYPES = [
  { value: "email", label: "Email" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "facebook", label: "Facebook" },
  { value: "instagram", label: "Instagram" },
  { value: "telegram", label: "Telegram" },
  { value: "autre", label: "Autre" },
] as const;

export type HousingType = (typeof HOUSING_TYPES)[number]["value"];
export type ContactType = (typeof CONTACT_TYPES)[number]["value"];

export function housingLabel(value: string): string {
  return HOUSING_TYPES.find((h) => h.value === value)?.label ?? value;
}

export function contactLabel(value: string): string {
  return CONTACT_TYPES.find((c) => c.value === value)?.label ?? value;
}

export function buildContactHref(type: string, value: string): string {
  switch (type) {
    case "email":
      return `mailto:${value}`;
    case "whatsapp": {
      const digits = value.replace(/[^\d]/g, "");
      return `https://wa.me/${digits}`;
    }
    case "facebook":
      return value.startsWith("http") ? value : `https://facebook.com/${value.replace(/^@/, "")}`;
    case "instagram":
      return value.startsWith("http")
        ? value
        : `https://instagram.com/${value.replace(/^@/, "")}`;
    case "telegram":
      return value.startsWith("http")
        ? value
        : `https://t.me/${value.replace(/^@/, "")}`;
    default:
      return value.startsWith("http") ? value : `mailto:${value}`;
  }
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
