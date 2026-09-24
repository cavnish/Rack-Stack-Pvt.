import type { Metadata } from "next";
import { getGallery } from "@/lib/data";
import { CTASection,PageHero,SectionHeading } from "@/components/site/ui";
import { GalleryGrid } from "@/components/site/gallery-grid";
export const metadata:Metadata={title:"Gallery",description:"Warehouse, racking, shelving, installation and industrial storage photos from Rack & Stack."};
export default async function GalleryPage(){const items=await getGallery();return <main><PageHero eyebrow="Gallery" title="Storage Systems in Real Workplaces" description="Browse photos of manufacturing, warehouse, installation, racking, shelving and mezzanine projects." image={items[0]?.imageUrl} breadcrumb={[{label:"Gallery"}]}/><section className="py-24"><div className="container-shell"><SectionHeading eyebrow="Photo gallery" title="Explore by Use"/><div className="mt-10"><GalleryGrid items={items}/></div></div></section><CTASection title="See Something That Fits Your Needs?"/></main>}
