DROP INDEX "product_gallery_slot_unique";--> statement-breakpoint
ALTER TABLE "product_gallery_images" ALTER COLUMN "slot" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "product_gallery_images" ADD COLUMN "is_active" boolean DEFAULT true NOT NULL;