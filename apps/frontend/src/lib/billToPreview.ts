import type { Client } from "../types";

/** Remove client email/phone lines from a stored snapshot (legacy invoices). */
export function stripContactLinesFromBillTo(text: string, c: Client | undefined): string {
  const em = (c?.email ?? "").trim().toLowerCase();
  const ph = (c?.phone ?? "").trim();
  const phDigits = ph.replace(/\D/g, "");
  const lines = text.split("\n").filter((line) => {
    const t = line.trim();
    if (!t) return false;
    if (em && t.toLowerCase() === em) return false;
    if (ph && t === ph) return false;
    if (phDigits.length >= 7 && t.replace(/\D/g, "") === phDigits) return false;
    return true;
  });
  return lines.join("\n").trim();
}

/** Bill-to text for PDFs and display: no email/phone. */
export function billToTextForInvoice(
  snapshot: string | null | undefined,
  client: Client | undefined,
  clientName: string,
): string {
  const snap = snapshot?.trim();
  if (snap) {
    const cleaned = stripContactLinesFromBillTo(snap, client);
    return cleaned || clientName;
  }
  return formatBillToPreview(client) ?? clientName;
}

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
  const t = lines.join("\n").trim();
  return t || null;
}
