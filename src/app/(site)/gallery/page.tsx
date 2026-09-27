import type { Metadata } from "next";
import { getGallery, getHomeReelVideos } from "@/lib/data";
import { CTASection,PageHero,SectionHeading } from "@/components/site/ui";
import { GalleryGrid } from "@/components/site/gallery-grid";
import { ReelShowcase } from "@/components/media/reel-showcase";
export const revalidate=3600;
export const metadata:Metadata={title:"Gallery",description:"Warehouse, racking, shelving, installation and industrial storage photos from Rack & Stack."};
/**
 * The Reel shelf lives here and nowhere else.
 *
 * Same CMS data and same admin CRUD as everywhere else — only the page and the
 * light surface differ, so the Reels read as part of a bright gallery page
 * rather than as a dark block dropped into it. Renders nothing when no Reels
 * are flagged for the homepage, so the gallery never gains an empty heading.
 */
export default async function GalleryPage(){const [items,reels]=await Promise.all([getGallery(),getHomeReelVideos(10)]);return <main><PageHero eyebrow="Gallery" title="Storage Systems in Real Workplaces" description="Browse photos of manufacturing, warehouse, installation, racking, shelving and mezzanine projects." image={items[0]?.imageUrl} breadcrumb={[{label:"Gallery"}]}/><section className="py-24"><div className="container-shell"><SectionHeading eyebrow="Photo gallery" title="Explore by Use"/><div className="mt-10"><GalleryGrid items={items}/></div></div></section><ReelShowcase videos={reels} surface="light" cta={{label:"Explore Our Solutions",href:"/products"}}/><CTASection title="See Something That Fits Your Needs?"/></main>}
