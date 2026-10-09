/**
 * Strips a trailing "| Rack & Stack …" suffix from a title headed for the root
 * layout's `%s | Rack & Stack` template. CMS authors sometimes already include
 * the brand ("Privacy Policy | Rack & Stack"); without this those titles render
 * as "… | Rack & Stack | Rack & Stack" once the template runs.
 */
export function cleanTitle(title?: string | null): string {
  if (!title) return "";
  return title.trim().replace(/\s*\|\s*Rack\s*&\s*Stack.*$/i, "");
}