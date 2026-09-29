import Link from "next/link";
import { ArrowDown, ArrowRight, MoveUpRight } from "lucide-react";
import { SmartImage } from "@/components/site/smart-image";
import { HomeAbout } from "@/components/site/home-about";
import { buildHomeAboutContent } from "@/lib/home-about";
import { homeWhyEnvironments } from "@/lib/home-offer-cards";
import { ProductCard, type ProductCardProduct } from "@/components/site/product-card";
import { HomeHeroSlider } from "@/components/site/home-hero-slider";
import { WhyRackStack, type WhyEnvironment } from "@/components/site/why-rack-stack";
import { SectionHeading } from "@/components/site/ui";
import { FitHeading } from "@/components/site/fit-heading";
import { Stagger,StaggerItem } from "@/components/site/reveal";
import { getBlogPosts, getGallery, getHomeOfferCards, getHomepageSections, getHomeSliders, getIndustries, getServices, getTestimonials } from "@/lib/data";
import { getPublicClientLogos } from "@/lib/client-assets";
import { TrustedByStrip } from "@/components/site/trusted-by-strip";
export const revalidate = 3600;
type Dict=Record<string,unknown>;
const dict=(value:unknown):Dict=>value&&typeof value==="object"?value as Dict:{};
export default async function HomePage() {
  // The Reel shelf lives on /gallery only, so the homepage does not query it.
  const [sections, services, industries, clientLogos, testimonials, gallery, posts, slides, offerCards] = await Promise.all([
    getHomepageSections(),
    getServices(true),
    getIndustries(),
    getPublicClientLogos(),
    getTestimonials(),
    getGallery(),
    getBlogPosts(),
    getHomeSliders(),
    getHomeOfferCards(),
  ]);
  // `getHomeOfferCards` has already merged each card with the product it points
  // at, so the card's name, image, description, badge and URL all follow the
  // product automatically. Anything set on the card is an override of that.
  const homeProducts: ProductCardProduct[] = offerCards.map((card) => ({
    id: card.id,
    name: card.name,
    slug: card.slug,
    href: card.href,
    category: card.category,
    shortDescription: card.shortDescription,
    image: card.image,
    alt: card.alt,
    showQuoteButton: card.showQuoteButton,
    ctaLabel: card.ctaLabel,
  }));
  const whyEnvironments: WhyEnvironment[] = homeWhyEnvironments.flatMap(({ slug, title, location }) => {
    const card = offerCards.find((item) => item.slug === slug);
    return card?.image ? [{ title, location, href: card.href, image: card.image }] : [];
  });

  const hero=sections.hero;
  const hc=dict(hero?.content);
  const about=sections.about;
  // `getHomepageSections` only returns enabled rows, so a section that is
  // missing here is one an editor switched off. Gate the render on the row, not
  // on the data being present, or the "Visible on homepage" toggle would do
  // nothing for these two.
  const offers=sections.offers;
  const oc=dict(offers?.content);
  const manufacturing=sections.manufacturing;
  const mc=dict(manufacturing?.content);
  const cta=sections.cta;
  return <main>
{slides.length>0?<HomeHeroSlider slides={slides} />:<section className="relative isolate min-h-[calc(100svh-72px)] overflow-hidden bg-zinc-950 text-white"><div className="absolute inset-0 -z-20"><SmartImage src={String(hc.image||"")} alt="Modern warehouse pallet racking and storage aisle" fill priority className="object-cover" sizes="100vw"/></div><div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(10,11,12,.94)_0%,rgba(10,11,12,.73)_50%,rgba(10,11,12,.16)_100%)]"/><div className="container-shell flex min-h-[calc(100svh-72px)] flex-col justify-center py-20"><div className="max-w-5xl"><p className="eyebrow text-red-400">{String(hc.eyebrow||"")}</p><h1 className="hero-heading mt-7 text-balance">SMART STORAGE.<br/><span className="text-red-500">{String(hc.highlight||"BUILT TO LAST.")}</span></h1><p className="hero-description mt-5 text-zinc-300">{hero?.subtitle}</p><div className="mt-9 flex flex-wrap gap-3"><Link href="/products" className="btn-primary">{String(hc.primaryCta||"View Our Products")} <ArrowRight size={17}/></Link><Link href="/request-a-quote" className="btn-light">{String(hc.secondaryCta||"Request a Quote")}</Link><Link href="/contact" className="inline-flex items-center px-3 text-xs font-bold text-zinc-300 hover:text-white">{String(hc.tertiaryCta||"Talk to Us")} <MoveUpRight className="ml-2" size={15}/></Link></div></div><a href="#home-about" aria-label="Scroll to about" className="absolute bottom-7 right-6 hidden items-center gap-3 text-[.62rem] font-bold uppercase tracking-[.16em] text-zinc-400 md:flex">Discover <span className="grid h-10 w-10 place-items-center rounded-full border border-white/25"><ArrowDown size={15}/></span></a></div></section>}
<TrustedByStrip logos={clientLogos}/>
{about&&<HomeAbout content={buildHomeAboutContent(about)}/>}

{offers&&homeProducts.length>0&&<section className="bg-[#f6f6f3] py-14"><div className="container-shell"><div className="flex flex-col justify-between gap-7 md:flex-row md:items-end"><SectionHeading title={String(offers.title||"What We Offer")} description={offers.subtitle||"We offer great service at a very competitive price and never compromise on quality."}/><Link href={String(oc.ctaHref||"/products")} className="btn-secondary shrink-0">{String(oc.ctaLabel||"View All Systems")} <ArrowRight size={16}/></Link></div><div className="mt-14 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">{homeProducts.map((product,i)=> <ProductCard key={product.id} product={product} index={i} />)}</div></div></section>}
<WhyRackStack environments={whyEnvironments} />
<section className="py-14"><div className="container-shell grid gap-14 lg:grid-cols-[.85fr_1.15fr]"><div className="lg:sticky lg:top-32 lg:self-start"><SectionHeading compact title="Good Storage Starts With a Plan" description="We help you plan, survey and coordinate everything before you buy."/><Link href="/services" className="btn-primary mt-8">Explore Services <ArrowRight size={16}/></Link></div><Stagger>{services.map((service,i)=><StaggerItem key={service.id}><Link href={`/services/${service.slug}`} className="group flex items-start gap-5 border-t border-zinc-300 py-7 transition-colors hover:bg-zinc-950 hover:px-6 hover:text-white"><span className="mt-1 text-xs font-bold text-red-600">{String(i+1).padStart(2,"0")}</span><div className="grow"><h3 className="text-xl font-semibold tracking-tight">{service.name}</h3><p className="mt-2 max-w-lg text-sm leading-6 text-zinc-600 group-hover:text-zinc-400">{service.shortDescription}</p></div><ArrowRight className="mt-1 shrink-0 transition-transform group-hover:translate-x-1" size={19}/></Link></StaggerItem>)}</Stagger></div></section>
<section className="overflow-hidden bg-[#ececea] py-14"><div className="container-shell"><SectionHeading compact title="Storage for Every Industry" description="We plan around what you store, how you access it and how your team moves it."/><div className="mt-12 flex snap-x gap-4 overflow-x-auto pb-5 no-scrollbar">{industries.map((industry,i)=><Link href={`/industries/${industry.slug}`} key={industry.id} className="group relative h-[390px] min-w-[82vw] snap-start overflow-hidden bg-zinc-900 text-white sm:min-w-[360px]"><SmartImage src={industry.heroImage||""} alt={`${industry.name} storage environment`} fill className="object-cover opacity-55 transition duration-700 group-hover:scale-105" sizes="360px"/><div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent"/><div className="absolute inset-x-0 bottom-0 p-6"><span className="text-xs font-bold text-red-400">{String(i+1).padStart(2,"0")}</span><h3 className="card-title mt-2">{industry.name}</h3><p className="mt-2 line-clamp-2 text-sm text-zinc-300">{industry.shortDescription}</p></div></Link>)}</div></div></section>
{manufacturing&&<section className="bg-zinc-950 text-white"><div className="grid min-h-[610px] lg:grid-cols-2"><div className="relative min-h-[420px]"><SmartImage src={String(mc.image||"")} alt="Storage system installation and coordination" fill className="object-cover opacity-80" sizes="50vw"/></div><div className="dark-grid flex items-center p-8 sm:p-14 lg:p-20"><div><FitHeading className="mt-5 text-balance section-heading text-white">{manufacturing.title}</FitHeading><p className="section-description mt-5 text-zinc-400">{manufacturing.subtitle}</p><Link href="/contact" className="btn-light mt-8">{String(mc.cta||"Discuss your requirement")} <ArrowRight size={16}/></Link></div></div></div></section>}
{testimonials.length>0&&<section className="bg-[#f4f4f1] py-14"><div className="container-shell"><SectionHeading eyebrow="Client feedback" title="What Our Clients Say"/><div className="mt-10 grid gap-4 md:grid-cols-2">{testimonials.map(item=><blockquote key={item.id} className="bg-white p-8"><p className="text-lg leading-8">“{item.content}”</p><footer className="mt-6 text-sm font-semibold">{item.clientName}{item.company&&<span className="block text-xs font-normal text-zinc-500">{item.company}</span>}</footer></blockquote>)}</div></div></section>}
{gallery.length>0&&<section className="py-14"><div className="container-shell"><div className="flex items-end justify-between gap-6"><SectionHeading compact title="See Our Work"/><Link className="btn-secondary hidden sm:inline-flex" href="/gallery">View Gallery</Link></div><div className="mt-10 grid auto-rows-[220px] gap-4 md:grid-cols-4">{gallery.slice(0,5).map((item,i)=><Link href="/gallery" key={item.id} className={`group relative overflow-hidden ${i===0?"md:col-span-2 md:row-span-2":""}`}><SmartImage src={item.imageUrl} alt={item.altText} fill className="object-cover transition duration-700 group-hover:scale-105" sizes={i===0?"50vw":"25vw"}/><span className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"/><strong className="absolute bottom-4 left-4 text-sm text-white">{item.title}</strong></Link>)}</div></div></section>}
{posts.length>0&&<section className="bg-[#f4f4f1] py-14"><div className="container-shell"><SectionHeading compact title="Tips for Smarter Storage"/><div className="mt-10 grid gap-5 md:grid-cols-2">{posts.slice(0,2).map(({post,category})=><Link href={`/blog/${post.slug}`} key={post.id} className="group grid overflow-hidden bg-white sm:grid-cols-[220px_1fr]"><div className="relative min-h-52"><SmartImage src={post.featuredImage||""} alt={post.title} fill className="object-cover transition duration-700 group-hover:scale-105" sizes="220px"/></div><div className="p-6"><p className="text-[.62rem] font-bold uppercase tracking-widest text-red-600">{category?.name||"Insight"}</p><h3 className="card-title mt-2 transition-colors group-hover:text-red-600">{post.title}</h3><p className="mt-2 text-sm leading-6 text-zinc-500">{post.excerpt}</p></div></Link>)}</div></div></section>}
{cta&&<section className="relative isolate overflow-hidden bg-red-700 py-14 text-white"><div aria-hidden className="absolute inset-0 -z-20"><SmartImage src="/Footer%20imagesbg.png" alt="" fill sizes="100vw" className="object-cover object-[68%_50%]"/></div><div aria-hidden className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(58,7,12,.9)_0%,rgba(58,7,12,.88)_42%,rgba(58,7,12,.74)_64%,rgba(58,7,12,.52)_82%,rgba(58,7,12,.46)_100%)]"/><div aria-hidden className="absolute inset-0 -z-10 bg-red-950/45 lg:hidden"/><div className="container-shell flex flex-col justify-between gap-9 lg:flex-row lg:items-end"><div className="max-w-4xl"><FitHeading className="section-heading mt-4 text-balance">{cta.title}</FitHeading><p className="section-description mt-5 text-red-100">{cta.subtitle}</p></div><Link href="/request-a-quote" className="btn-light shrink-0">Request a Quote <ArrowRight size={17}/></Link></div></section>}
</main>}

