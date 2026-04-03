import type { Client } from "../types";

/** Client-side preview of server `bill_to_snapshot` formatting. */
export function formatBillToPreview(c: Client | undefined): string | null {
  if (!c) return null;
  const lines: string[] = [];
  if (c.name) lines.push(c.name);
  if (c.company) lines.push(c.company);
  const addr: string[] = [];
  if (c.address_line1) addr.push(c.address_line1);
  if (c.address_line2) addr.push(c.address_line2);
  const cityParts = [c.city, c.region, c.postal_code].filter(Boolean);
  if (cityParts.length) addr.push(cityParts.join(", "));
  if (c.country_code) addr.push(c.country_code.toUpperCase());
  lines.push(...addr);
  if (c.email) lines.push(c.email);
  if (c.phone) lines.push(c.phone);
  const t = lines.join("\n").trim();
  return t || null;
}
