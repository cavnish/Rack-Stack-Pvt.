import Link from "next/link";
import { ArrowUpRight, Mail, MapPin, Phone } from "lucide-react";
import { Logo } from "./logo";
import { NewsletterForm } from "./newsletter-form";
import { SocialLinksRow } from "./social-links";
import type { siteSettings } from "@/db/schema";
type Settings=typeof siteSettings.$inferSelect;

export function Footer({settings}:{settings:Settings}){
  const columns=[
    {title:"Solutions",links:[["Products","/products"],["Services","/services"],["Industries","/industries"],["Storage Planning","/services/storage-planning"]]},
    {title:"Company",links:[["About","/about"],["Projects","/projects"],["Clients","/clients"],["Gallery","/gallery"]]},
    {title:"Resources",links:[["Insights","/blog"],["FAQs","/contact#faqs"],["Request a Quote","/request-a-quote"],["Download Catalog","/rack-and-stack-brochure.pdf"]]},
  ];
  const socialLinks=(settings.socialLinks??{}) as Record<string,string>;
  return <footer className="bg-zinc-950 text-white"><div className="container-shell grid gap-12 py-16 md:grid-cols-2 lg:grid-cols-[1.4fr_.8fr_.8fr_.8fr]">
    <div>
      <Logo light iconBackground="bg-zinc-950"/>
      <p className="mt-6 max-w-sm text-sm leading-7 text-zinc-400">{settings.footerContent}</p>
      <div className="mt-7 space-y-3 text-xs text-zinc-400">
        <a className="flex items-start gap-3 hover:text-white" href={`tel:${settings.primaryPhone.replace(/\s/g,"")}`}><Phone size={15} className="mt-0.5 text-red-500"/>{settings.primaryPhone}{settings.secondaryPhone&&` · ${settings.secondaryPhone}`}</a>
        <a className="flex items-start gap-3 hover:text-white" href={`mailto:${settings.email}`}><Mail size={15} className="mt-0.5 text-red-500"/>{settings.email}</a>
        <p className="flex max-w-xs items-start gap-3"><MapPin size={15} className="mt-0.5 shrink-0 text-red-500"/>{settings.address}</p>
      </div>
      {/*
        Connect with us. Visible at every width, including phones, because this
        is the one footer row that is not part of the link groups hidden on
        mobile below. Each URL comes from `settings.socialLinks` when the admin
        has set one, otherwise from the canonical list in `@/lib/social-links`,
        so all four official profiles always show.
      */}
      <div className="mt-7">
        <p className="text-[.7rem] font-bold uppercase tracking-[.18em] text-zinc-400">Connect With Us</p>
        <SocialLinksRow tone="dark" className="mt-4" overrides={socialLinks} />
      </div>
    </div>
    {/*
      The three link groups are hidden below `md`.

      On a phone they were three stacked headings and twelve links before the
      copyright bar, so the contact details above them were pushed up and the
      footer was several screens long. The columns come back from `md` up, where
      there is room to sit them side by side.
    */}
    {columns.map(c=><div key={c.title} className="hidden md:block"><h3 className="text-[.7rem] font-bold uppercase tracking-[.18em] text-zinc-400">{c.title}</h3><ul className="mt-6 space-y-4">{c.links.map(([label,href])=><li key={label}>{href.endsWith(".pdf")?<a className="group inline-flex items-center gap-1 text-sm text-zinc-300 hover:text-white" href={href} download>{label}<ArrowUpRight size={12} className="opacity-0 transition-opacity group-hover:opacity-100"/></a>:<Link className="group inline-flex items-center gap-1 text-sm text-zinc-300 hover:text-white" href={href}>{label}<ArrowUpRight size={12} className="opacity-0 transition-opacity group-hover:opacity-100"/></Link>}</li>)}</ul>{c.title==="Resources"&&<NewsletterForm/>}</div>)}
  </div><div className="border-t border-white/10"><div className="container-shell flex flex-col gap-4 py-6 text-[.68rem] text-zinc-400 sm:flex-row sm:items-center sm:justify-between"><p>© {new Date().getFullYear()} {settings.copyright}</p><div className="flex flex-wrap gap-5"><Link href="/privacy-policy">Privacy</Link><Link href="/terms-and-conditions">Terms</Link><Link href="/cookie-policy">Cookies</Link></div></div></div></footer>}
