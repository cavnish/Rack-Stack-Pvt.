ALTER TABLE "home_sliders" ADD COLUMN "tertiary_button_text" text;--> statement-breakpoint
ALTER TABLE "home_sliders" ADD COLUMN "tertiary_button_url" text;--> statement-breakpoint
ALTER TABLE "home_sliders" ADD COLUMN "trust_points" jsonb DEFAULT '[]'::jsonb NOT NULL;