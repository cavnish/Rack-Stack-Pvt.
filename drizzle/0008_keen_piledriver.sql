CREATE TYPE "public"."video_source" AS ENUM('CLOUDINARY', 'INSTAGRAM');--> statement-breakpoint
ALTER TABLE "videos" ADD COLUMN "source" "video_source" DEFAULT 'CLOUDINARY' NOT NULL;--> statement-breakpoint
ALTER TABLE "videos" ADD COLUMN "instagram_url" text;--> statement-breakpoint
ALTER TABLE "videos" ADD COLUMN "is_active" boolean DEFAULT true NOT NULL;--> statement-breakpoint
CREATE INDEX "videos_source_idx" ON "videos" USING btree ("source");