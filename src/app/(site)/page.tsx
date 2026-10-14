import type { Metadata } from "next";
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
import { TestimonialsSection } from "@/components/site/testimonials-section";
import { FitHeading } from "@/components/site/fit-heading";
import { Stagger,StaggerItem } from "@/components/site/reveal";
import { getBlogPosts, getClientLogos, getGallery, getHomeOfferCards, getHomepageSections, getHomeSliders, getIndustries, getServices, getTestimonials } from "@/lib/data";
import { TrustedByStrip } from "@/components/site/trusted-by-strip";

export const revalidate = 3600;

/**
 * The homepage is the entry point search engines see first, so it carries its
 * own self-referencing canonical and share metadata rather than inheriting the
 * root layout's title alone. `title.absolute` is used deliberately: the root
 * layout templates child titles with "| Rack & Stack", and without `absolute`
 * the brand would be appended a second time.
 */
const HOME_TITLE = "Rack & Stack Storage Systems | Industrial Storage & Warehouse Racking";
const HOME_DESCRIPTION =
  "Rack & Stack Storage Systems designs and manufactures industrial storage, warehouse racking, shelving, mezzanine floors and material-handling systems for businesses across India.";

export const metadata: Metadata = {
  title: { absolute: HOME_TITLE },
  description: HOME_DESCRIPTION,
  alternates: { canonical: "/" },
  openGraph: {
    title: "Rack & Stack Storage Systems | Industrial Storage Solutions",
    description: HOME_DESCRIPTION,
    url: "/",
    siteName: "Rack & Stack Storage Systems",
    type: "website",
    images: [{ url: "/Hero.jpeg", alt: "Industrial pallet racking and warehouse storage installed by Rack & Stack" }],
  },
  twitter: { card: "summary_large_image", title: "Rack & Stack Storage Systems", description: HOME_DESCRIPTION },
};

type Dict=Record<string,unknown>;
const dict=(value:unknown):Dict=>value&&typeof value==="object"?value as Dict:{};
export default async function HomePage() {
  // The Reel shelf lives on /gallery only, so the homepage does not query it.
  const [sections, services, industries, clientLogos, testimonials, gallery, posts, slides, offerCards] = await Promise.all([
    getHomepageSections(),
    getServices(true),
    getIndustries(),
    getClientLogos(),
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
  const cta=sections.cta;
  return <main>
{slides.length>0?<HomeHeroSlider slides={slides} />:<section className="hero-carousel relative isolate overflow-hidden bg-zinc-950 text-white"><div className="absolute inset-0 -z-20"><SmartImage src={String(hc.image||"/assets/images/hero/home-sliders-uny8efktot7jpzcmos1k-2a270d4046.webp")} alt="Industrial warehouse pallet racking" fill priority className="object-cover" sizes="100vw"/></div><div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,#060709_0%,#060709_32%,rgba(6,7,9,0.92)_52%,rgba(6,7,9,0.4)_78%,rgba(6,7,9,0.12)_100%)] max-md:bg-[linear-gradient(180deg,#060709_0%,rgba(6,7,9,0.94)_65%,rgba(6,7,9,0.65)_100%)]"/><div className="absolute inset-0 -z-10 bg-gradient-to-t from-black/60 via-transparent to-black/35 pointer-events-none"/><div className="container-shell hero-shell relative flex flex-col justify-center"><div className="max-w-4xl"><div className="inline-flex items-center relative mb-5 select-none"><span className="relative z-10 bg-[#E31E24] text-white font-black uppercase text-[0.72rem] sm:text-xs md:text-sm tracking-[0.16em] px-4 sm:px-5 py-1.5 sm:py-2 shadow-lg hero-badge-angled pr-7 sm:pr-8">{String(hc.eyebrow||"RACK & STACK STORAGE SYSTEMS")}</span><span className="absolute -bottom-1.5 right-0.5 w-3.5 h-2 bg-[#8b0f14] [clip-path:polygon(0_0,100%_0,0_100%)] -z-0" aria-hidden="true"/></div><h1 className="hero-industrial-title text-balance text-left"><span className="text-white drop-shadow-md block">PRECISION STORAGE</span><span className="text-[#E31E24] drop-shadow-md block mt-1.5 sm:mt-2">RACKING SOLUTIONS</span></h1><div className="w-16 sm:w-20 md:w-24 h-1 sm:h-1.5 bg-[#E31E24] mt-5 sm:mt-6 mb-4 sm:mb-5" aria-hidden="true"/><h2 className="text-base sm:text-lg md:text-xl font-black uppercase tracking-wider text-white drop-shadow-sm">{String(hc.highlight||"ENGINEERED FOR INDUSTRIAL STORAGE")}</h2><p className="hero-description text-zinc-300 text-sm sm:text-base leading-relaxed max-w-2xl text-pretty font-normal mt-3">{hero?.subtitle||"We design, manufacture and install high-quality industrial storage and warehouse racking systems that maximise space utilisation, improve inventory organisation and support efficient material handling."}</p><div className="mt-8 flex flex-wrap items-center gap-3 sm:gap-4"><Link href="/products" className="btn-primary group w-full sm:w-auto font-bold uppercase tracking-wider text-xs sm:text-sm px-6 py-3.5 shadow-lg shadow-red-950/40">{String(hc.primaryCta||"View Products")} <MoveUpRight size={17}/></Link><Link href="/request-a-quote" className="btn-light w-full sm:w-auto font-bold uppercase tracking-wider text-xs sm:text-sm px-6 py-3.5 backdrop-blur-sm bg-white/10 hover:bg-white hover:text-zinc-950 transition-colors">{String(hc.secondaryCta||"Request a Quote")}</Link><Link href="/contact" className="group inline-flex items-center gap-2 border-b border-white/25 px-1 pb-1 text-xs font-bold uppercase tracking-[.14em] text-zinc-200 transition-colors hover:border-[#E31E24] hover:text-white">{String(hc.tertiaryCta||"Talk to Us")} <MoveUpRight size={14}/></Link></div></div><a href="#home-about" aria-label="Scroll to about" className="absolute bottom-7 right-6 hidden items-center gap-3 text-[.62rem] font-bold uppercase tracking-[.16em] text-zinc-400 md:flex">Discover <span className="grid h-10 w-10 place-items-center rounded-full border border-white/25"><ArrowDown size={15}/></span></a></div></section>}
<TrustedByStrip logos={clientLogos}/>
{about&&<HomeAbout content={buildHomeAboutContent(about)}/>}

{offers&&homeProducts.length>0&&<section className="bg-[#f6f6f3] py-14"><div className="container-shell"><div className="flex flex-col justify-between gap-7 md:flex-row md:items-end"><SectionHeading title={String(offers.title||"What We Offer")} description={offers.subtitle||"We offer great service at a very competitive price and never compromise on quality."}/><Link href={String(oc.ctaHref||"/products")} className="btn-secondary shrink-0">{String(oc.ctaLabel||"View All Systems")} <ArrowRight size={16}/></Link></div><div className="mt-14 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">{homeProducts.map((product,i)=> <ProductCard key={product.id} product={product} index={i} />)}</div></div></section>}
<WhyRackStack environments={whyEnvironments} />
<section className="py-14"><div className="container-shell grid gap-14 lg:grid-cols-[.85fr_1.15fr]"><div className="lg:sticky lg:top-32 lg:self-start"><SectionHeading compact title="Good Storage Starts With a Plan" description="We help you plan, survey and coordinate everything before you buy."/><Link href="/services" className="btn-primary mt-8">Explore Services <ArrowRight size={16}/></Link></div><Stagger>{services.map((service,i)=><StaggerItem key={service.id}><Link href={`/services/${service.slug}`} className="group flex items-start gap-5 border-t border-zinc-300 py-7 transition-colors hover:bg-zinc-950 hover:px-6 hover:text-white"><span className="mt-1 text-xs font-bold text-red-600">{String(i+1).padStart(2,"0")}</span><div className="grow"><h3 className="text-xl font-semibold tracking-tight">{service.name}</h3><p className="mt-2 max-w-lg text-sm leading-6 text-zinc-600 group-hover:text-zinc-400">{service.shortDescription}</p></div><ArrowRight className="mt-1 shrink-0 transition-transform group-hover:translate-x-1" size={19}/></Link></StaggerItem>)}</Stagger></div></section>
<section className="overflow-hidden bg-[#ececea] py-14"><div className="container-shell"><SectionHeading compact title="Storage for Every Industry" description="We plan around what you store, how you access it and how your team moves it."/><div className="mt-12 flex snap-x gap-4 overflow-x-auto pb-5 no-scrollbar">{industries.map((industry,i)=><Link href={`/industries/${industry.slug}`} key={industry.id} className="group relative h-[390px] min-w-[82vw] snap-start overflow-hidden bg-zinc-900 text-white sm:min-w-[360px]"><SmartImage src={industry.heroImage||""} alt={`${industry.name} storage environment`} fill className="object-cover opacity-55 transition duration-700 group-hover:scale-105" sizes="360px"/><div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent"/><div className="absolute inset-x-0 bottom-0 p-6"><span className="text-xs font-bold text-red-400">{String(i+1).padStart(2,"0")}</span><h3 className="card-title mt-2">{industry.name}</h3><p className="mt-2 line-clamp-2 text-sm text-zinc-300">{industry.shortDescription}</p></div></Link>)}</div></div></section>
{testimonials.length>0&&<TestimonialsSection items={testimonials}/>}
{gallery.length>0&&<section className="py-14"><div className="container-shell"><div className="flex items-end justify-between gap-6"><SectionHeading compact title="See Our Work"/><Link className="btn-secondary hidden sm:inline-flex" href="/gallery">View Gallery</Link></div><div className="mt-10 grid auto-rows-[220px] gap-4 md:grid-cols-4">{gallery.slice(0,5).map((item,i)=><Link href="/gallery" key={item.id} className={`group relative overflow-hidden ${i===0?"md:col-span-2 md:row-span-2":""}`}><SmartImage src={item.imageUrl} alt={item.altText} fill className="object-cover transition duration-700 group-hover:scale-105" sizes={i===0?"50vw":"25vw"}/><span className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"/><strong className="absolute bottom-4 left-4 text-sm text-white">{item.title}</strong></Link>)}</div></div></section>}
{posts.length>0&&<section className="bg-[#f4f4f1] py-14"><div className="container-shell"><SectionHeading compact title="Tips for Smarter Storage"/><div className="mt-10 grid gap-5 md:grid-cols-2">{posts.slice(0,2).map(({post,category})=><Link href={`/blog/${post.slug}`} key={post.id} className="group grid overflow-hidden bg-white sm:grid-cols-[220px_1fr]"><div className="relative min-h-52"><SmartImage src={post.featuredImage||""} alt={post.title} fill className="object-cover transition duration-700 group-hover:scale-105" sizes="220px"/></div><div className="p-6"><p className="text-[.62rem] font-bold uppercase tracking-widest text-red-600">{category?.name||"Insight"}</p><h3 className="card-title mt-2 transition-colors group-hover:text-red-600">{post.title}</h3><p className="mt-2 text-sm leading-6 text-zinc-500">{post.excerpt}</p></div></Link>)}</div></div></section>}
{cta&&<section className="relative isolate overflow-hidden bg-red-700 py-14 text-white"><div aria-hidden className="absolute inset-0 -z-20"><SmartImage src="/Footer%20imagesbg.png" alt="" fill sizes="100vw" className="object-cover object-[68%_50%]"/></div><div aria-hidden className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(58,7,12,.9)_0%,rgba(58,7,12,.88)_42%,rgba(58,7,12,.74)_64%,rgba(58,7,12,.52)_82%,rgba(58,7,12,.46)_100%)]"/><div aria-hidden className="absolute inset-0 -z-10 bg-red-950/45 lg:hidden"/><div className="container-shell flex flex-col justify-between gap-9 lg:flex-row lg:items-end"><div className="max-w-4xl"><FitHeading className="section-heading mt-4 text-balance">{cta.title}</FitHeading><p className="section-description mt-5 text-red-100">{cta.subtitle}</p></div><Link href="/request-a-quote" className="btn-light shrink-0">Request a Quote <ArrowRight size={17}/></Link></div></section>}
</main>}

