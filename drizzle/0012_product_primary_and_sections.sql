CREATE TABLE "product_sections" (
	"id" serial PRIMARY KEY NOT NULL,
	"product_id" integer NOT NULL,
	"key" text NOT NULL,
	"eyebrow" text,
	"title" text NOT NULL,
	"body" text,
	"layout" text DEFAULT 'text' NOT NULL,
	"image_url" text,
	"image_public_id" text,
	"alt_text" text,
	"cta_label" text,
	"cta_href" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "product_gallery_images" ADD COLUMN "is_primary" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "product_sections" ADD CONSTRAINT "product_sections_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "product_sections_product_idx" ON "product_sections" USING btree ("product_id");--> statement-breakpoint
CREATE UNIQUE INDEX "product_sections_key_unique" ON "product_sections" USING btree ("product_id","key");--> statement-breakpoint
-- Backfill: the first active row of each existing gallery was already what the
-- page treated as the main image, so it becomes the explicit primary. Without
-- this every existing product would show "no primary chosen" until an editor
-- re-saved it, and the positional fallback would be doing the work the flag
-- exists for. `DISTINCT ON` picks exactly one row per product; an `EXISTS`
-- guard against the same table would read a pre-update snapshot and flag every
-- row instead of the first.
UPDATE "product_gallery_images" AS target
SET "is_primary" = true
FROM (
  SELECT DISTINCT ON ("product_id") "id"
  FROM "product_gallery_images"
  WHERE "is_active" = true
  ORDER BY "product_id", "display_order", "id"
) AS first_row
WHERE target."id" = first_row."id";