CREATE TABLE "home_offer_cards" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"slug" text,
	"description" text,
	"image_url" text,
	"image_public_id" text,
	"alt_text" text,
	"category" text,
	"href" text,
	"cta_label" text,
	"display_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product_gallery_images" (
	"id" serial PRIMARY KEY NOT NULL,
	"product_id" integer NOT NULL,
	"slot" text NOT NULL,
	"label" text,
	"image_url" text NOT NULL,
	"cloudinary_public_id" text,
	"alt_text" text NOT NULL,
	"caption" text,
	"width" integer,
	"height" integer,
	"display_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "gallery_heading" text;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "features_heading" text;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "overview_heading" text;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "overview_body" text;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "applications_heading" text;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "applications_intro" text;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "cta_title" text;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "cta_subtitle" text;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "primary_cta_label" text;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "primary_cta_href" text;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "secondary_cta_label" text;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "secondary_cta_href" text;--> statement-breakpoint
ALTER TABLE "services" ADD COLUMN "hero_heading" text;--> statement-breakpoint
ALTER TABLE "services" ADD COLUMN "intro_heading" text;--> statement-breakpoint
ALTER TABLE "services" ADD COLUMN "intro_description" text;--> statement-breakpoint
ALTER TABLE "services" ADD COLUMN "intro_bullets" jsonb DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "services" ADD COLUMN "capabilities" jsonb DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "services" ADD COLUMN "applications" jsonb DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "services" ADD COLUMN "why_choose_points" jsonb DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "services" ADD COLUMN "location_coverage" jsonb DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "services" ADD COLUMN "related_product_slugs" jsonb DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "services" ADD COLUMN "gallery_image_ids" jsonb DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "product_gallery_images" ADD CONSTRAINT "product_gallery_images_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "home_offer_cards_order_idx" ON "home_offer_cards" USING btree ("is_active","display_order");--> statement-breakpoint
CREATE UNIQUE INDEX "home_offer_cards_slug_unique" ON "home_offer_cards" USING btree ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX "product_gallery_slot_unique" ON "product_gallery_images" USING btree ("product_id","slot");--> statement-breakpoint
CREATE INDEX "product_gallery_product_idx" ON "product_gallery_images" USING btree ("product_id");