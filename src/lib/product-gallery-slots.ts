/**
 * The fixed gallery contract for a product page.
 *
 * Every product page shows the same six views in the same order, so the set of
 * slots is a product of the design rather than a per-product preference. Keeping
 * the definition in one module means the admin editor, the validator, the seed
 * import and the renderer cannot disagree about how many slots exist, what they
 * are called, or what order they render in.
 *
 * `slot` is the stable database key: it survives a rename of `label`, so a copy
 * tweak never orphans an uploaded image.
 */

export type ProductGallerySlot = {
  /** Stable key stored in `product_gallery_images.slot`. */
  slot: string;
  /** Editor-facing name of the view. */
  label: string;
  /** Shown under the main image when no caption is set for the slot. */
  fallbackCaption: string;
  /** Suggested alt text describing what this view shows. */
  altHint: string;
  /** Lucide icon name, used by the admin editor to label the slot. */
  icon: string;
  help: string;
};

export const productGallerySlots = [
  {
    slot: "main",
    label: "Main Product Image",
    fallbackCaption: "Product overview",
    altHint: "Full view of the storage system installed",
    icon: "Image",
    help: "The lead shot. Used as the card image, the share image and the first gallery slide.",
  },
  {
    slot: "installation",
    label: "Warehouse Installation",
    fallbackCaption: "Installed in your warehouse",
    altHint: "Storage system installed inside a warehouse or facility",
    icon: "Warehouse",
    help: "Shows the system in place. Use a real site photograph where possible.",
  },
  {
    slot: "close-up",
    label: "Close-Up View",
    fallbackCaption: "Build detail",
    altHint: "Close-up of joints, beams and finish",
    icon: "ScanSearch",
    help: "Frames, beams, joints or surface finish. This is where build quality is judged.",
  },
  {
    slot: "configurations",
    label: "Many Configurations",
    fallbackCaption: "Available configurations",
    altHint: "Several size and layout configurations of the same system",
    icon: "LayoutGrid",
    help: "A single frame showing more than one layout, bay size or capacity option.",
  },
  {
    slot: "heavy-load",
    label: "Heavy Load Storage",
    fallbackCaption: "Built for heavy loads",
    altHint: "Heavy materials and pallets stored on the racking",
    icon: "Weight",
    help: "Loaded with pallets or heavy stock so the load capacity is visible.",
  },
  {
    slot: "in-operation",
    label: "Organized Storage / In Operation",
    fallbackCaption: "In everyday operation",
    altHint: "Organised storage aisle with stock in everyday use",
    icon: "Boxes",
    help: "Day-to-day use: labelled stock, tidy aisles, people working around the racking.",
  },
] as const satisfies readonly ProductGallerySlot[];

export const productGallerySlotKeys = productGallerySlots.map((slot) => slot.slot) as string[];

const slotByKey = new Map<string, ProductGallerySlot>(
  productGallerySlots.map((slot) => [slot.slot, slot]),
);

export function getProductGallerySlot(slot: string): ProductGallerySlot | undefined {
  return slotByKey.get(slot);
}

export function isProductGallerySlot(value: unknown): value is string {
  return typeof value === "string" && slotByKey.has(value);
}

/** The canonical render order. Gallery rows are always sorted through this. */
export function productGalleryOrder(slot: string): number {
  const index = productGallerySlotKeys.indexOf(slot);
  return index === -1 ? productGallerySlots.length : index;
}

/** Default alt text for a slot, given the product it belongs to. */
export function defaultGalleryAltText(slot: string, productName: string): string {
  const definition = slotByKey.get(slot);
  return definition ? `${productName}: ${definition.altHint}` : productName;
}

/** Default caption for a slot, given the product it belongs to. */
export function defaultGalleryCaption(slot: string, productName: string): string {
  const definition = slotByKey.get(slot);
  return definition ? definition.fallbackCaption : productName;
}
