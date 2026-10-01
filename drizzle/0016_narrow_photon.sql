CREATE TABLE "about_sections" (
	"id" serial PRIMARY KEY NOT NULL,
	"section_key" text NOT NULL,
	"label" text NOT NULL,
	"kind" text NOT NULL,
	"eyebrow" text,
	"title" text,
	"description" text,
	"caption" text,
	"image_url" text,
	"image_public_id" text,
	"image_alt" text,
	"cta_primary_label" text,
	"cta_primary_href" text,
	"cta_secondary_label" text,
	"cta_secondary_href" text,
	"theme" text DEFAULT 'light' NOT NULL,
	"body" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "about_sections_key_unique" ON "about_sections" USING btree ("section_key");--> statement-breakpoint
CREATE INDEX "about_sections_order_idx" ON "about_sections" USING btree ("display_order");