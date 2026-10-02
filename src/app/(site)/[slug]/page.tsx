import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPage, getPageSlugs } from "@/lib/data";
import { PageHero } from "@/components/site/ui";
import { Stagger,StaggerItem } from "@/components/site/reveal";

/**
 * How long a CMS page stays cached before it re-renders.
 *
 * Matches the `revalidate` the rest of the public site uses, so a page published
 * through the admin still goes live without a redeploy.
 */
export const revalidate = 3600;

/**
 * Prerender every published CMS page.
 *
 * This route is a catch-all, so without this list Next has no idea which slugs
 * exist and cannot produce static output for them — every visit rendered the page
 * on demand, and the render fell through to the database whenever the published
 * file did not already contain the slug. A CMS page therefore cost a live query
 * per visitor, which is the opposite of the static-first rule this site is built
 * on, and it meant a page created in the admin was unavailable if the database
 * was unreachable.
 *
 * The list is read from the published collection, which is the same static-first
 * source `getPage` uses, so prerendering and rendering agree on what exists.
 * `dynamicParams` stays on so a page published after this build is still reachable
 * on demand rather than 404ing until the next build.
 */
export async function generateStaticParams() {
  const slugs = await getPageSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({params}:{params:Promise<{slug:string}>}):Promise<Metadata>{const page=await getPage((await params).slug);return page?{title:page.metaTitle||page.title,description:page.metaDescription||page.heroDescription,alternates:{canonical:page.canonicalUrl||`/${page.slug}`}}:{}}
export default async function CmsPage({params}:{params:Promise<{slug:string}>}){const page=await getPage((await params).slug);if(!page)notFound();return <main><PageHero title={page.heroTitle||page.title} description={page.heroDescription} image={page.heroImage}/><article className="container-shell max-w-3xl py-20"><Stagger className="prose-copy text-lg">{page.content.split(/\n\n+/).map((p,i)=><StaggerItem key={i}><p>{p}</p></StaggerItem>)}</Stagger></article></main>}
