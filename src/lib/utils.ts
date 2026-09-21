export function cn(...values: Array<string | false | null | undefined>) { return values.filter(Boolean).join(" "); }
export function slugify(value: string) { return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""); }
export function initials(value: string) { return value.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase(); }
export function formatDate(value: Date | string | null | undefined) { if (!value) return "—"; return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(new Date(value)); }
export function phoneHref(value: string) { return `tel:${value.replace(/[^+\d]/g, "")}`; }
export function whatsappHref(value: string, message = "Hello, I would like to discuss a storage requirement.") { return `https://wa.me/${value.replace(/\D/g, "")}?text=${encodeURIComponent(message)}`; }
