import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPage } from "@/lib/data";
import { PageHero } from "@/components/site/ui";
import { Stagger,StaggerItem } from "@/components/site/reveal";
export async function generateMetadata({params}:{params:Promise<{slug:string}>}):Promise<Metadata>{const page=await getPage((await params).slug);return page?{title:page.metaTitle||page.title,description:page.metaDescription||page.heroDescription,alternates:{canonical:page.canonicalUrl||`/${page.slug}`}}:{}}
export default async function CmsPage({params}:{params:Promise<{slug:string}>}){const page=await getPage((await params).slug);if(!page)notFound();return <main><PageHero eyebrow="Rack & Stack" title={page.heroTitle||page.title} description={page.heroDescription} image={page.heroImage} breadcrumb={[{label:page.title}]}/><article className="container-shell max-w-3xl py-20"><Stagger className="prose-copy text-lg">{page.content.split(/\n\n+/).map((p,i)=><StaggerItem key={i}><p>{p}</p></StaggerItem>)}</Stagger></article></main>}
