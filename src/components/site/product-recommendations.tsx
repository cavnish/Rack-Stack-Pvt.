import { SectionHeading } from "@/components/site/ui";
import { Stagger, StaggerItem } from "@/components/site/reveal";
import { ProductCard, type ProductCardProduct } from "@/components/site/product-card";
import { getRelatedProductImages } from "@/lib/product-primary-images";
import { resolveRecommendationCopy, type RecommendationCopy } from "@/lib/recommendations";

/**
 * How many recommendations the section shows.
 *
 * The band is a four-across row, so a fifth card would wrap onto a second line
 * and break the composition the whole section is built around. Editors may
 * choose and order more than four — which of the enabled rows are the "first
 * four" is their call — but only the leading four are rendered.
 */
const MAX_CARDS = 4;

export type RecommendationProduct = ProductCardProduct & {
  /** Overrides the category-based default for the subheading. */
  category?: string;
};


/**
 * "Recommended systems" — the section at the foot of a product page.
 *
 * One component, used by every product page and by the industry pages, so the
 * wording, the grid and the card proportions cannot drift apart between them.
 * The markup and the responsive behaviour are the industry page's
 * "Recommended systems" band: a four-across row on desktop, two on tablet, one
 * on a phone.
 *
 * The cards are the site's existing {@link ProductCard}, not a second card
 * built for this section. That is deliberate. The card already has the anatomy
 * this section needs — a fixed-ratio image, the product name, the short
 * description, a divider, the red "Get a Quote" button and the "VIEW →" link,
 * all at equal height — and it is the same component the homepage "What We
 * Offer" grid uses. A second card would be a second set of borders, radii and
 * line-clamps to keep in step, and the two sections would slowly stop matching.
 *
 * Async because each card's image is resolved here rather than read off the
 * related row. A related row only carries the product's raw `thumbnail` and
 * `heroImage` columns, while a product page leads with the first of its gallery
 * images, so trusting the column would show a different photograph from the page
 * the card links to, and would stop following the admin as soon as the gallery
 * was reordered. `getRelatedProductImages` answers the same question the
 * product page answers, for every card in one batch.
 */
export async function ProductRecommendations({
  products,
  copy,
  category,
}: {
  products: readonly RecommendationProduct[];
  /** Raw, per-product copy. Blanks are filled in from the defaults. */
  copy?: RecommendationCopy;
  /** Used only for the default title. A product's own category. */
  category?: string;
}) {
  if (!products.length) return null;

  const cards = products.slice(0, MAX_CARDS);
  const images = await getRelatedProductImages(cards);
  const { heading, subheading, description } = resolveRecommendationCopy(copy ?? {}, category);

  return (
    <section className="py-14">
      <div className="container-shell">
        <SectionHeading eyebrow={heading} title={subheading} description={description} />
        {/*
          Four across on desktop, two on tablet, one on a phone. The gap is
          larger than the homepage grid's because these cards carry a
          description and two CTAs each, and a tight gap makes that much content
          read as a wall.
        */}
        <Stagger className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {cards.map((product, index) => (
            <StaggerItem key={product.id} className="h-full">
              <ProductCard
                product={{
                  ...product,
                  image: images.get(String(product.id)) ?? product.image ?? null,
                }}
                index={index}
              />
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}
