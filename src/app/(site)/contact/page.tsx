import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Clock,
  Compass,
  FileText,
  Headphones,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Ruler,
  ShieldCheck,
  Upload,
  Warehouse,
  Wrench,
} from "lucide-react";
import { getGallery, getGlobalFaqs, getProducts, getSiteSettings } from "@/lib/data";
import { catalogueProducts } from "@/lib/catalogue";
import { PageHero, SectionHeading } from "@/components/site/ui";
import { ContactForm } from "@/components/site/contact-form";
import { FAQ } from "@/components/site/faq";
import { SmartImage } from "@/components/site/smart-image";
import { Reveal, Stagger, StaggerItem } from "@/components/site/reveal";
import { phoneHref, whatsappHref } from "@/lib/utils";
import { notFound } from "next/navigation";

export const metadata: Metadata = {
  title: "Contact | Rack & Stack Storage Systems",
  description:
    "Contact Rack & Stack Storage Systems about racking, shelving, mezzanine and custom storage requirements. Call, WhatsApp, email or visit our office.",
};

const whyItems = [
  {
    icon: Ruler,
    title: "Technical Guidance",
    text: "Load calculations, bay sizing and layout planning from an engineer — not a sales guess.",
  },
  {
    icon: Wrench,
    title: "Custom Solutions",
    text: "Systems designed around your space, stock and handling method — not a catalogue default.",
  },
  {
    icon: Compass,
    title: "Pan-India Support",
    text: "Supply and installation across India, with local site coordination wherever you operate.",
  },
  {
    icon: Headphones,
    title: "Complete Assistance",
    text: "From first survey to final handover — one team for planning, manufacturing and installation.",
  },
];

export default async function ContactPage() {
  const [settings, faqs, gallery, products] = await Promise.all([
    getSiteSettings(),
    getGlobalFaqs(),
    getGallery(),
    getProducts(),
  ]);
  if (!settings) notFound();

  const allProducts = [...catalogueProducts, ...products].filter(
    (product, index, all) => all.findIndex((candidate) => candidate.slug === product.slug) === index,
  );

  const contacts = [
    {
      label: "Call Us",
      value: `${settings.primaryPhone}${settings.secondaryPhone ? ` / ${settings.secondaryPhone}` : ""}`,
      href: phoneHref(settings.primaryPhone),
      Icon: Phone,
    },
    {
      label: "WhatsApp",
      value: settings.whatsapp,
      href: whatsappHref(settings.whatsapp),
      Icon: MessageCircle,
    },
    {
      label: "Email",
      value: settings.email,
      href: `mailto:${settings.email}`,
      Icon: Mail,
    },
    {
      label: "Working Hours",
      value: settings.workingHours,
      Icon: Clock,
    },
  ];

  return (
    <main>
      <PageHero
        title="Let's Build the Right Storage Solution"
        description="Share your space, stock and handling details. We'll help you plan the right system — from survey to installation."
        image={gallery[0]?.imageUrl}
      />

      <section className="py-12 lg:py-14">
        <div className="container-shell">
          <Stagger className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {contacts.map(({ label, value, href, Icon }) => (
              <StaggerItem key={label}>
                {href ? (
                  <a
                    href={href}
                    target={label === "WhatsApp" ? "_blank" : undefined}
                    rel="noreferrer"
                    className="group flex h-full flex-col border border-zinc-200 bg-white p-5 transition-all duration-300 hover:border-zinc-800 hover:shadow-lg"
                  >
                    <span className="grid h-11 w-11 place-items-center rounded-lg bg-red-50 text-red-600 transition-colors group-hover:bg-red-600 group-hover:text-white">
                      <Icon size={20} />
                    </span>
                    <span className="mt-3 text-[.65rem] font-bold uppercase tracking-[.14em] text-zinc-400">
                      {label}
                    </span>
                    <span className="mt-1 text-sm font-semibold text-zinc-900">{value}</span>
                  </a>
                ) : (
                  <div className="flex h-full flex-col border border-zinc-200 bg-white p-5">
                    <span className="grid h-11 w-11 place-items-center rounded-lg bg-red-50 text-red-600">
                      <Icon size={20} />
                    </span>
                    <span className="mt-3 text-[.65rem] font-bold uppercase tracking-[.14em] text-zinc-400">
                      {label}
                    </span>
                    <span className="mt-1 text-sm font-semibold text-zinc-900">{value}</span>
                  </div>
                )}
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      <section className="border-y border-zinc-200 bg-[#f8f8f6] py-12 lg:py-14">
        <div className="container-shell">
          <div className="grid gap-10 lg:grid-cols-[.85fr_1.15fr] lg:gap-14">
            <div>
              <SectionHeading
                eyebrow="Our Locations"
                title="Visit Our Office"
                description="Walk in, call or WhatsApp — we're happy to discuss your storage requirement in person."
              />
              <Reveal delay={0.1} className="mt-8">
                <div className="border border-zinc-200 bg-white p-6">
                  <div className="flex items-start gap-4">
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-red-50 text-red-600">
                      <MapPin size={20} />
                    </span>
                    <div>
                      <p className="text-[.65rem] font-bold uppercase tracking-[.14em] text-zinc-400">
                        Head Office
                      </p>
                      <p className="mt-1 text-sm font-semibold text-zinc-900">
                        {settings.companyName}
                      </p>
                      <p className="mt-1 text-sm leading-6 text-zinc-600">
                        {settings.address}
                      </p>
                    </div>
                  </div>
                  <div className="mt-5 grid gap-3 border-t border-zinc-100 pt-5 text-sm">
                    <p className="flex items-center gap-3 text-zinc-600">
                      <Phone size={15} className="shrink-0 text-red-600" />
                      <a href={phoneHref(settings.primaryPhone)} className="hover:text-red-600">
                        {settings.primaryPhone}
                      </a>
                      {settings.secondaryPhone && (
                        <>
                          <span className="text-zinc-300">/</span>
                          <a href={phoneHref(settings.secondaryPhone)} className="hover:text-red-600">
                            {settings.secondaryPhone}
                          </a>
                        </>
                      )}
                    </p>
                    <p className="flex items-center gap-3 text-zinc-600">
                      <Mail size={15} className="shrink-0 text-red-600" />
                      <a href={`mailto:${settings.email}`} className="hover:text-red-600">
                        {settings.email}
                      </a>
                    </p>
                    <p className="flex items-center gap-3 text-zinc-600">
                      <Clock size={15} className="shrink-0 text-red-600" />
                      {settings.workingHours}
                    </p>
                  </div>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(settings.address)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-secondary mt-6 w-full justify-center sm:w-auto"
                  >
                    <Compass size={16} />
                    Get Directions
                  </a>
                </div>
              </Reveal>
            </div>
            <Reveal delay={0.15}>
              <div className="flex h-full flex-col border border-zinc-200 bg-white p-6 sm:p-8">
                <h2 className="heading-md text-balance">Send Us a Message</h2>
                <p className="mt-2 text-sm leading-6 text-zinc-500">
                  Fill in the form and our team will get back to you — usually within one business day.
                </p>
                <div className="mt-6">
                  <ContactForm products={allProducts} />
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="py-12 lg:py-14">
        <div className="container-shell">
          <SectionHeading
            eyebrow="Find Us"
            title="Our Location on the Map"
            description="Vasai-Virar, Maharashtra — serving clients across India."
            align="center"
          />
          <Reveal delay={0.1} className="mt-10">
            <div className="relative overflow-hidden border border-zinc-200 bg-zinc-100">
              <div className="grid min-h-[400px] place-items-center p-8 sm:min-h-[480px]">
                <div className="text-center">
                  <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-red-600 text-white shadow-lg">
                    <MapPin size={28} />
                  </span>
                  <p className="mt-4 text-lg font-bold text-zinc-900">{settings.companyName}</p>
                  <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-zinc-600">
                    {settings.address}
                  </p>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(settings.address)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-primary mt-6"
                  >
                    <Compass size={16} />
                    Open in Google Maps
                  </a>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="dark-grid bg-zinc-950 py-12 text-white lg:py-14">
        <div className="container-shell">
          <SectionHeading
            eyebrow="Why Rack & Stack"
            title="The Right Team for Your Storage Project"
            description="We bring engineering knowledge, custom manufacturing and pan-India installation to every project."
            light
            align="center"
          />
          <Stagger className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {whyItems.map(({ icon: Icon, title, text }) => (
              <StaggerItem key={title}>
                <div className="group h-full rounded-xl border border-white/10 bg-white/[0.04] p-6 transition-all duration-300 hover:border-[#FF6B1A]/30 hover:bg-white/[0.07]">
                  <span className="grid h-12 w-12 place-items-center rounded-lg bg-[#FF6B1A]/10 text-[#FF6B1A] transition-colors group-hover:bg-[#FF6B1A] group-hover:text-white">
                    <Icon size={22} />
                  </span>
                  <h3 className="mt-4 text-base font-bold text-white">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-zinc-400">{text}</p>
                </div>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      {gallery.length > 0 && (
        <section className="py-12 lg:py-14">
          <div className="container-shell">
            <SectionHeading
              eyebrow="Our Work"
              title="Industrial Image Gallery"
              description="A look at our storage systems installed and in operation."
              align="center"
            />
            <Stagger className="mt-10 grid auto-rows-[200px] gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {gallery.slice(0, 6).map((item, i) => (
                <StaggerItem
                  key={item.id}
                  className={`group relative overflow-hidden ${i === 0 ? "sm:col-span-2 sm:row-span-2" : ""}`}
                >
                  <SmartImage
                    src={item.imageUrl}
                    alt={item.altText}
                    fill
                    className="object-cover transition duration-700 group-hover:scale-105"
                    sizes={i === 0 ? "50vw" : "25vw"}
                  />
                  <span className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                  <span className="absolute bottom-4 left-4 text-sm font-semibold text-white">
                    {item.title}
                  </span>
                </StaggerItem>
              ))}
            </Stagger>
            <Reveal delay={0.2} className="mt-8 text-center">
              <Link href="/gallery" className="btn-secondary">
                View Full Gallery
                <ArrowRight size={16} />
              </Link>
            </Reveal>
          </div>
        </section>
      )}

      {faqs.length > 0 && (
        <section className="border-t border-zinc-200 bg-[#f8f8f6] py-12 lg:py-14">
          <div className="container-shell grid gap-10 lg:grid-cols-[.7fr_1.3fr]">
            <div>
              <SectionHeading
                eyebrow="FAQs"
                title="Common Questions"
                description="Quick answers to what people usually ask before starting a storage project."
              />
              <Reveal delay={0.1} className="mt-6">
                <Link href="/contact" className="btn-secondary">
                  Ask a Question
                  <ArrowRight size={16} />
                </Link>
              </Reveal>
            </div>
            <Reveal delay={0.15}>
              <FAQ items={faqs} />
            </Reveal>
          </div>
        </section>
      )}

      <section className="relative isolate overflow-hidden bg-[var(--navy)] py-12 text-white lg:py-14">
        <div
          className="pointer-events-none absolute -left-40 top-0 h-96 w-96 rounded-full bg-[#FF6B1A]/10 blur-[100px]"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -right-40 bottom-0 h-80 w-80 rounded-full bg-[#38BDF8]/[0.06] blur-[100px]"
          aria-hidden="true"
        />
        <div className="container-shell relative text-center">
          <Reveal>
            <p className="eyebrow text-[#FF6B1A]">Start Your Project</p>
            <h2 className="section-heading mx-auto mt-4 max-w-3xl text-balance">
              Planning Your Next Storage Project?
            </h2>
            <p className="section-description mx-auto mt-4 max-w-2xl text-zinc-400">
              Tell us about your space and storage needs. We'll help you plan the right system and prepare a quote.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link href="/request-a-quote" className="btn-primary">
                Get a Quote
                <ArrowRight size={17} />
              </Link>
              <a
                href={whatsappHref(settings.whatsapp)}
                target="_blank"
                rel="noreferrer"
                className="btn-light"
              >
                <MessageCircle size={16} />
                WhatsApp Us
              </a>
            </div>
          </Reveal>
        </div>
      </section>
    </main>
  );
}
