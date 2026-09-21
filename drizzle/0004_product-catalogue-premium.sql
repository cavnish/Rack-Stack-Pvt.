CREATE TABLE "product_benefits" (
	"id" serial PRIMARY KEY NOT NULL,
	"product_id" integer NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product_components" (
	"id" serial PRIMARY KEY NOT NULL,
	"product_id" integer NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"image" text,
	"image_public_id" text,
	"alt_text" text,
	"display_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product_configurations" (
	"id" serial PRIMARY KEY NOT NULL,
	"product_id" integer NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"image" text,
	"image_public_id" text,
	"alt_text" text,
	"display_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product_stored_materials" (
	"id" serial PRIMARY KEY NOT NULL,
	"product_id" integer NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"image" text,
	"image_public_id" text,
	"alt_text" text,
	"display_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product_stories" (
	"id" serial PRIMARY KEY NOT NULL,
	"product_id" integer NOT NULL,
	"title" text,
	"description" text NOT NULL,
	"image" text NOT NULL,
	"image_public_id" text,
	"alt_text" text NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product_workflows" (
	"id" serial PRIMARY KEY NOT NULL,
	"product_id" integer NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
ALTER TABLE "product_applications" ADD COLUMN "title" text;--> statement-breakpoint
ALTER TABLE "product_applications" ADD COLUMN "description" text;--> statement-breakpoint
ALTER TABLE "product_applications" ADD COLUMN "image" text;--> statement-breakpoint
ALTER TABLE "product_applications" ADD COLUMN "image_public_id" text;--> statement-breakpoint
ALTER TABLE "product_applications" ADD COLUMN "alt_text" text;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "hero_title" text;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "hero_description" text;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "spec_highlights" jsonb DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "technical_image" text;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "technical_image_public_id" text;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "technical_description" text;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "technical_enabled" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "show_gallery" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "show_features" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "show_specifications" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "show_configurations" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "show_applications" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "show_stored_materials" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "show_stories" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "show_workflow" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "show_benefits" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "show_components" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "show_faq" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "show_related" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "product_benefits" ADD CONSTRAINT "product_benefits_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_components" ADD CONSTRAINT "product_components_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_configurations" ADD CONSTRAINT "product_configurations_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_stored_materials" ADD CONSTRAINT "product_stored_materials_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_stories" ADD CONSTRAINT "product_stories_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_workflows" ADD CONSTRAINT "product_workflows_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
UPDATE "product_applications" SET "title" = "application" WHERE "title" IS NULL OR "title" = '';