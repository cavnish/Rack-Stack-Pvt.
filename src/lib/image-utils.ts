export function optimizeImage(src: string | null | undefined, width = 1400) {
  if (!src) return "";
  if (typeof src !== "string" || !src.includes("res.cloudinary.com") || !src.includes("/upload/")) return src;
  return src.replace("/upload/", `/upload/f_auto,q_auto,c_limit,w_${width}/`);
}