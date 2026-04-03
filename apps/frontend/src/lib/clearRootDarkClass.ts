/** Remove legacy `dark` on &lt;html&gt; so marketing/login stay light. Call on public routes. */
export function clearRootDarkClass(): void {
  document.documentElement.classList.remove("dark");
}
