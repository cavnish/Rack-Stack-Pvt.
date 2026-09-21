CREATE TABLE "analytics_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"event_name" text NOT NULL,
	"entity_type" text,
	"entity_id" text,
	"path" text,
	"consent_level" text DEFAULT 'essential' NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "catalog_downloads" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text,
	"company" text,
	"email" text,
	"phone" text,
	"catalog_url" text,
	"source_page" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product_industries" (
	"id" serial PRIMARY KEY NOT NULL,
	"product_id" integer NOT NULL,
	"industry_id" integer NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product_projects" (
	"id" serial PRIMARY KEY NOT NULL,
	"product_id" integer NOT NULL,
	"project_id" integer NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product_related_products" (
	"id" serial PRIMARY KEY NOT NULL,
	"product_id" integer NOT NULL,
	"related_product_id" integer NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "service_industries" (
	"id" serial PRIMARY KEY NOT NULL,
	"service_id" integer NOT NULL,
	"industry_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "service_projects" (
	"id" serial PRIMARY KEY NOT NULL,
	"service_id" integer NOT NULL,
	"project_id" integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE "site_settings" ADD COLUMN "catalog_title" text DEFAULT 'Rack & Stack Product Catalog' NOT NULL;--> statement-breakpoint
ALTER TABLE "site_settings" ADD COLUMN "catalog_description" text DEFAULT 'Review our storage system categories and discuss the right configuration for your operation.' NOT NULL;--> statement-breakpoint
ALTER TABLE "site_settings" ADD COLUMN "catalog_lead_gated" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "product_industries" ADD CONSTRAINT "product_industries_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_industries" ADD CONSTRAINT "product_industries_industry_id_industries_id_fk" FOREIGN KEY ("industry_id") REFERENCES "public"."industries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_projects" ADD CONSTRAINT "product_projects_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_projects" ADD CONSTRAINT "product_projects_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_related_products" ADD CONSTRAINT "product_related_products_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_related_products" ADD CONSTRAINT "product_related_products_related_product_id_products_id_fk" FOREIGN KEY ("related_product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_industries" ADD CONSTRAINT "service_industries_service_id_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_industries" ADD CONSTRAINT "service_industries_industry_id_industries_id_fk" FOREIGN KEY ("industry_id") REFERENCES "public"."industries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_projects" ADD CONSTRAINT "service_projects_service_id_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_projects" ADD CONSTRAINT "service_projects_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "analytics_event_name_idx" ON "analytics_events" USING btree ("event_name");--> statement-breakpoint
CREATE INDEX "analytics_created_idx" ON "analytics_events" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "catalog_downloads_created_idx" ON "catalog_downloads" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "product_industry_unique" ON "product_industries" USING btree ("product_id","industry_id");--> statement-breakpoint
CREATE INDEX "product_industry_product_idx" ON "product_industries" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "product_industry_industry_idx" ON "product_industries" USING btree ("industry_id");--> statement-breakpoint
CREATE UNIQUE INDEX "product_project_unique" ON "product_projects" USING btree ("product_id","project_id");--> statement-breakpoint
CREATE INDEX "product_project_product_idx" ON "product_projects" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "product_project_project_idx" ON "product_projects" USING btree ("project_id");--> statement-breakpoint
CREATE UNIQUE INDEX "product_related_unique" ON "product_related_products" USING btree ("product_id","related_product_id");--> statement-breakpoint
CREATE INDEX "product_related_product_idx" ON "product_related_products" USING btree ("product_id");--> statement-breakpoint
CREATE UNIQUE INDEX "service_industry_unique" ON "service_industries" USING btree ("service_id","industry_id");--> statement-breakpoint
CREATE INDEX "service_industry_service_idx" ON "service_industries" USING btree ("service_id");--> statement-breakpoint
CREATE UNIQUE INDEX "service_project_unique" ON "service_projects" USING btree ("service_id","project_id");--> statement-breakpoint
CREATE INDEX "service_project_service_idx" ON "service_projects" USING btree ("service_id");--> statement-breakpoint
CREATE INDEX "products_category_idx" ON "products" USING btree ("category");--> statement-breakpoint
CREATE INDEX "products_featured_idx" ON "products" USING btree ("featured");