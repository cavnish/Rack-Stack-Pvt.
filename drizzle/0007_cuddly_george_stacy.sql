CREATE TABLE "video_products" (
	"id" serial PRIMARY KEY NOT NULL,
	"video_id" integer NOT NULL,
	"product_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "video_services" (
	"id" serial PRIMARY KEY NOT NULL,
	"video_id" integer NOT NULL,
	"service_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "videos" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"category" text DEFAULT 'WAREHOUSE' NOT NULL,
	"description" text,
	"video_url" text NOT NULL,
	"cloudinary_public_id" text,
	"poster_url" text,
	"poster_public_id" text,
	"duration_seconds" integer,
	"width" integer,
	"height" integer,
	"cta_text" text,
	"cta_url" text,
	"href" text,
	"show_on_home" boolean DEFAULT true NOT NULL,
	"show_on_products" boolean DEFAULT false NOT NULL,
	"show_on_services" boolean DEFAULT false NOT NULL,
	"autoplay" boolean DEFAULT true NOT NULL,
	"muted" boolean DEFAULT true NOT NULL,
	"loop" boolean DEFAULT true NOT NULL,
	"status" "content_status" DEFAULT 'PUBLISHED' NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL,
	"meta_title" text,
	"meta_description" text,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "video_products" ADD CONSTRAINT "video_products_video_id_videos_id_fk" FOREIGN KEY ("video_id") REFERENCES "public"."videos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "video_products" ADD CONSTRAINT "video_products_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "video_services" ADD CONSTRAINT "video_services_video_id_videos_id_fk" FOREIGN KEY ("video_id") REFERENCES "public"."videos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "video_services" ADD CONSTRAINT "video_services_service_id_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "video_products_unique" ON "video_products" USING btree ("video_id","product_id");--> statement-breakpoint
CREATE INDEX "video_products_product_idx" ON "video_products" USING btree ("product_id");--> statement-breakpoint
CREATE UNIQUE INDEX "video_services_unique" ON "video_services" USING btree ("video_id","service_id");--> statement-breakpoint
CREATE INDEX "video_services_service_idx" ON "video_services" USING btree ("service_id");--> statement-breakpoint
CREATE INDEX "videos_status_idx" ON "videos" USING btree ("status");--> statement-breakpoint
CREATE INDEX "videos_display_order_idx" ON "videos" USING btree ("display_order");--> statement-breakpoint
CREATE INDEX "videos_public_id_idx" ON "videos" USING btree ("cloudinary_public_id");