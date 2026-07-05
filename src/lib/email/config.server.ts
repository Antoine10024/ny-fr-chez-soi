/**
 * Central email configuration.
 *
 * All sending addresses used by the app live here. To change the sender or
 * BCC address later (e.g. when moving to a different sender domain in the
 * production domain), update these constants or set the matching
 * environment variables — no other code needs to change.
 *
 * Environment overrides (optional):
 *   INQUIRY_FROM_ADDRESS   full email address emails are sent from
 *   INQUIRY_FROM_NAME      display name shown in the recipient inbox
 *   INQUIRY_BCC_ADDRESS    email address that receives a BCC copy of every
 *                          inquiry notification (leave empty to disable)
 *
 * Notes:
 * - The domain of INQUIRY_FROM_ADDRESS must match the verified sending
 *   subdomain (see SENDER_DOMAIN in the transactional send route). The
 *   display name is cosmetic.
 * - The BCC is implemented by enqueueing an additional copy of the same
 *   email to the BCC address. Remove INQUIRY_BCC_ADDRESS to stop copies.
 */

export const EMAIL_SENDER_DOMAIN = "notify.logements.nyc";

export const INQUIRY_FROM_ADDRESS =
  process.env.INQUIRY_FROM_ADDRESS ?? "bonjour@notify.logements.nyc";

export const INQUIRY_FROM_NAME =
  process.env.INQUIRY_FROM_NAME ?? "Logements NYC";

export const INQUIRY_BCC_ADDRESS =
  process.env.INQUIRY_BCC_ADDRESS ?? "bonjour@logements.nyc";

export const ADMIN_EMAIL_ADDRESS =
  process.env.ADMIN_EMAIL_ADDRESS ?? "bonjour@logements.nyc";

/**
 * Public base URL used to build absolute links in emails (e.g. management
 * links). Set SITE_URL in production; the server also falls back to the
 * request Origin header when available.
 */
export const SITE_URL = process.env.SITE_URL ?? "https://logements.nyc";

export function formatFrom(name: string, address: string): string {
  return `${name} <${address}>`;
}
