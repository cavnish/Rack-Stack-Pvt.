import type { Metadata } from "next";
import { getGallery } from "@/lib/data";
import { CTASection,PageHero,SectionHeading } from "@/components/site/ui";
import { GalleryGrid } from "@/components/site/gallery-grid";
export const metadata:Metadata={title:"Gallery",description:"Warehouse, racking, shelving, installation and industrial storage imagery from Rack & Stack."};
export default async function GalleryPage(){const items=await getGallery();return <main><PageHero eyebrow="Gallery" title="Storage systems in their operating environment." description="Browse published manufacturing, warehouse, installation, racking, shelving and mezzanine imagery." image={items[0]?.imageUrl} breadcrumb={[{label:"Gallery"}]}/><section className="py-24"><div className="container-shell"><SectionHeading eyebrow="Visual library" title="Explore by application."/><div className="mt-10"><GalleryGrid items={items}/></div></div></section><CTASection title="See a configuration relevant to your requirement?"/></main>}
