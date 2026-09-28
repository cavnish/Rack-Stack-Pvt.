import { officeStorageContent } from "./office-storage";
import { industrialStorageContent } from "./industrial-storage";
import { materialHandlingContent } from "./material-handling";
import type { CatalogueSeoContent } from "./types";

export type { CatalogueSeoContent };

/**
 * Product copy keyed by catalogue slug. A slug with no entry keeps whatever the
 * product record already carries, so adding a product never breaks the build.
 */
export const catalogueSeoContent: Record<string, CatalogueSeoContent> = {
  ...officeStorageContent,
  ...industrialStorageContent,
  ...materialHandlingContent,
};
