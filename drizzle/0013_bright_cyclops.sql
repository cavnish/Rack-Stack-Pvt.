ALTER TABLE "product_features" ADD COLUMN "short_description" text;--> statement-breakpoint
ALTER TABLE "product_features" ADD COLUMN "is_active" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "product_related_products" ADD COLUMN "is_active" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "product_specifications" ADD COLUMN "unit" text;--> statement-breakpoint
ALTER TABLE "product_specifications" ADD COLUMN "description" text;--> statement-breakpoint
ALTER TABLE "product_specifications" ADD COLUMN "is_active" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "is_active" boolean DEFAULT true NOT NULL;