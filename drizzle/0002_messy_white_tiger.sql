CREATE TYPE "public"."slider_text_align" AS ENUM('left', 'center', 'right');--> statement-breakpoint
CREATE TABLE "home_sliders" (
	"id" serial PRIMARY KEY NOT NULL,
	"eyebrow" text,
	"title" text,
	"highlighted_text" text,
	"description" text,
	"image_url" text,
	"image_public_id" text,
	"mobile_image_url" text,
	"mobile_image_public_id" text,
	"image_alt" text,
	"primary_button_text" text DEFAULT 'Explore Solutions',
	"primary_button_url" text,
	"secondary_button_text" text DEFAULT 'Request a Quote',
	"secondary_button_url" text,
	"status" "content_status" DEFAULT 'DRAFT' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"overlay_opacity" integer DEFAULT 72 NOT NULL,
	"text_alignment" "slider_text_align" DEFAULT 'left' NOT NULL,
	"autoplay" boolean DEFAULT true NOT NULL,
	"duration" integer DEFAULT 7000 NOT NULL,
	"start_at" timestamp with time zone,
	"end_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "home_sliders_status_idx" ON "home_sliders" USING btree ("status");--> statement-breakpoint
CREATE INDEX "home_sliders_sort_idx" ON "home_sliders" USING btree ("sort_order");