ALTER TABLE "home_offer_cards" ALTER COLUMN "title" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "home_offer_cards" ADD COLUMN "product_id" integer;--> statement-breakpoint
ALTER TABLE "home_offer_cards" ADD COLUMN "show_quote_button" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "home_offer_cards" ADD CONSTRAINT "home_offer_cards_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "home_offer_cards_product_idx" ON "home_offer_cards" USING btree ("product_id");