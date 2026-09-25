import { readdir } from "node:fs/promises";
import { extname, join } from "node:path";

export type PublicClientLogo = {
  id: number;
  name: string;
  imageUrl: string;
  altText: string;
  width: number | null;
  height: number | null;
};

const imageExtensions = new Set([".avif", ".gif", ".jpeg", ".jpg", ".png", ".svg", ".webp"]);
const canonicalAssetDirectory = join(process.cwd(), "public", "rack-and-stack-clients");
const legacyAssetDirectory = join(process.cwd(), "public", "rack-and-stack-clients)");
const clientNames: Record<string, string> = {
  "165766_dsv_385705.png": "DSV",
  "2017_Eaton_logo.png": "Eaton",
  "274-2743624_novartis-logo-high-resolution-sandoz-logo.png": "Novartis / Sandoz",
  "497-hubtown-limited_logo.jpg": "Hubtown Limited",
  "allcargo_logistic.png": "Allcargo Logistics",
  "aon.png": "Aon",
  "ashar.jpg": "Ashar",
  "Bank_of_America.png": "Bank of America",
  "bec-logo.png": "BEC",
  "cimpress-vector-logo.png": "Cimpress",
  "endurance-technologies-logo.jpg": "Endurance Technologies",
  "fountainhead.png": "Fountainhead",
  "gilpin-travel-management-logo-new.webp": "Gilpin Travel Management",
  "hirco.png": "Hirco",
  "hydropure.png": "HydroPure",
  "IDBI-Bank-Logo.png": "IDBI Bank",
  "incometax.png": "Income Tax",
  "ind_swift.png": "Ind Swift",
  "indian_bank.png": "Indian Bank",
  "information_resource.png": "Information Resource",
  "Jaslok_Hospital_Logo.png": "Jaslok Hospital",
  "jp.png": "JP",
  "KNIGHT_FRANK_PROPERTY_SERVICE.png": "Knight Frank Property Service",
  "Logo_gsmc_my_creation.png": "GSMC",
  "Magma_Logo.jpg": "Magma",
  "MidasCare_Logo.svg.png": "MidasCare",
  "mumbai_metro.png": "Mumbai Metro",
  "neelam.webp": "Neelam",
  "oc.png": "OC",
  "pcs.gif": "PCS",
  "piramal.png": "Piramal",
  "raheja.jpg": "Raheja",
  "refex_energy.png": "Refex Energy",
  "schindler-logo.png": "Schindler",
  "seaspan-india.png": "Seaspan India",
  "siro.png": "Siro",
  "swiggy.png": "Swiggy",
  "the_news_india.jpg": "The News India",
  "vistaprint.png": "Vistaprint",
  "worksphere.png": "Worksphere",
  "wtc-logo.png": "WTC",
  "Zydus_-_Takeda_logo-removebg-preview.png": "Zydus Takeda",
};

function fallbackName(fileName: string) {
  const value = fileName
    .replace(/\.[^.]+$/, "")
    .replace(/[-_]+/g, " ")
    .replace(/\b(?:creation|high|logo|my|new|preview|removebg|resolution|vector)\b/gi, " ")
    .replace(/\b\d{3,}\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return value ? value.replace(/\b\w/g, (character) => character.toUpperCase()) : fileName;
}

function isSupportedAsset(entry: { isFile(): boolean; name: string }) {
  return entry.isFile() && imageExtensions.has(extname(entry.name).toLowerCase());
}

export async function getPublicClientLogos(): Promise<PublicClientLogo[]> {
  const canonicalEntries = await readdir(canonicalAssetDirectory, { withFileTypes: true }).catch(() => []);
  const legacyEntries = await readdir(legacyAssetDirectory, { withFileTypes: true }).catch(() => []);
  const entries = canonicalEntries.some(isSupportedAsset) ? canonicalEntries : legacyEntries;
  return entries
    .filter(isSupportedAsset)
    .map((entry) => entry.name)
    .sort((left, right) => left.localeCompare(right))
    .map((fileName, index) => {
      const name = clientNames[fileName] ?? fallbackName(fileName);
      return {
        id: index + 1,
        name,
        imageUrl: `/rack-and-stack-clients/${encodeURIComponent(fileName)}`,
        altText: `${name} logo`,
        width: null,
        height: null,
      };
    });
}
