import type { Metadata } from "next";
import { PageHero,SectionHeading,ServiceCard,CTASection } from "@/components/site/ui";
import { Stagger,StaggerItem } from "@/components/site/reveal";
import { ReelShowcase } from "@/components/media/reel-showcase";
import { getServices,getServicesReelVideos } from "@/lib/data";
export const revalidate=3600;
export const metadata:Metadata={title:"Storage Planning & Installation Services",description:"Storage planning, site surveys, rack design, warehouse layout, installation and optimization services."};
export default async function ServicesPage(){const [services,reels]=await Promise.all([getServices(),getServicesReelVideos(10)]);return <main><PageHero title="More Than Just Racks" description="From planning and site surveys to installation, our services make sure your storage works right." image={services[0]?.heroImage}/><section className="py-24"><div className="container-shell grid gap-14 lg:grid-cols-[.8fr_1.2fr]"><SectionHeading eyebrow="How we help" title="Practical Help at Every Stage" description="Use one service or combine several with a storage system plan."/><Stagger>{services.map((service,i)=><StaggerItem key={service.id}><ServiceCard service={service} index={i}/></StaggerItem>)}</Stagger></div></section><ReelShowcase videos={reels} subtitle="The work behind the plan — surveyed, installed and handed over on site." cta={{label:"Talk to Us",href:"/contact"}}/><CTASection title="Tell Us Your Storage Problem — We'll Solve It"/></main>}
