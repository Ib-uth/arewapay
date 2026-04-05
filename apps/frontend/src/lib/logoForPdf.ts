/** Resolve org logo for @react-pdf/renderer (data URL is more reliable than http src in the browser). */
export async function logoDataUrlForPdf(logoUrl: string | null | undefined): Promise<string | undefined> {
  if (!logoUrl?.trim()) return undefined;
  const u = logoUrl.trim();
  const abs = u.startsWith("http") ? u : `${window.location.origin}${u.startsWith("/") ? u : `/${u}`}`;
  try {
    const res = await fetch(abs, { credentials: "include" });
    if (!res.ok) return abs;
    const blob = await res.blob();
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(blob);
    });
  } catch {
    return abs;
  }
}
