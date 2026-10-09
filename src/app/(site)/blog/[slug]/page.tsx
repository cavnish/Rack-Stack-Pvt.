import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getBlogPost, getBlogPosts } from "@/lib/data";
import { cleanTitle } from "@/lib/meta";
import { absoluteUrl } from "@/lib/site-url";
import { CTASection,JsonLd } from "@/components/site/ui";
import { Reveal,Stagger,StaggerItem } from "@/components/site/reveal";
import { SmartImage } from "@/components/site/smart-image";
import { formatDate } from "@/lib/utils";
export async function generateStaticParams() {
  const posts = await getBlogPosts();
  return posts.map((row) => ({ slug: row.post.slug }));
}

export async function generateMetadata({params}:{params:Promise<{slug:string}>}):Promise<Metadata>{const row=await getBlogPost((await params).slug);return row?(()=>{const title=cleanTitle(row.post.metaTitle||row.post.title);const description=row.post.metaDescription||row.post.excerpt;const canonical=row.post.canonicalUrl||`/blog/${row.post.slug}`;return {title,description,alternates:{canonical},openGraph:{title,description,url:canonical,siteName:"Rack & Stack Storage Systems",type:"article",images:row.post.featuredImage?[{url:row.post.featuredImage,alt:row.post.title}]:[]},twitter:{card:"summary_large_image",title,description}}})():{}}
export const revalidate = 3600;
export default async function BlogPostPage({params}:{params:Promise<{slug:string}>}){const {slug}=await params;const row=await getBlogPost(slug,false);if(!row)notFound();const {post,category}=row;const schema={"@context":"https://schema.org","@type":"Article",headline:post.title,description:post.excerpt,image:post.featuredImage,datePublished:post.publishedAt?.toISOString(),dateModified:post.updatedAt?.toISOString(),mainEntityOfPage:absoluteUrl(post.canonicalUrl||`/blog/${post.slug}`),publisher:{"@type":"Organization",name:"Rack & Stack Storage Systems Pvt. Ltd."}};return <main><JsonLd data={schema}/><article><header className="bg-zinc-950 py-20 text-white"><Reveal><div className="container-shell max-w-5xl"><p className="eyebrow text-red-400">{category?.name||"Resource"}</p><h1 className="hero-heading mt-5 text-balance">{post.title}</h1><p className="hero-description mt-5 text-zinc-300">{post.excerpt}</p><p className="mt-8 text-xs text-zinc-500">Published {formatDate(post.publishedAt)}</p></div></Reveal></header>{post.featuredImage&&<div className="container-shell -mt-1"><div className="relative h-[50vw] max-h-[650px] min-h-72"><SmartImage src={post.featuredImage} alt={post.title} fill priority className="object-cover" sizes="100vw"/></div></div>}<div className="container-shell max-w-3xl py-20"><Stagger className="prose-copy text-lg">{post.content.split(/\n\n+/).map((paragraph,i)=><StaggerItem key={i}><p>{paragraph}</p></StaggerItem>)}</Stagger><Link href="/blog" className="btn-secondary mt-8">← All Resources</Link></div></article><CTASection title="Ready to Plan Your Storage?"/></main>}
