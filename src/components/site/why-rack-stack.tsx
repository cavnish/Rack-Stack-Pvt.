import Link from "next/link";
import { ArrowRight, Ruler, ShieldCheck, Warehouse, Zap, type LucideIcon } from "lucide-react";

import { IndiaNetworkVisual } from "./india-network-visual";
import { Reveal, Stagger, StaggerItem } from "./reveal";
import { SmartImage } from "./smart-image";

export type WhyEnvironment = {
  title: string;
  location: string;
  href: string;
  image: string;
};

const advantages: { icon: LucideIcon; title: string; text: string }[] = [
  { icon: Warehouse, title: "Heavy-Duty Racking", text: "High-load warehouse storage" },
  { icon: ShieldCheck, title: "Structural Safety", text: "Engineered for reliable loads" },
  { icon: Ruler, title: "Custom Space Planning", text: "Designed around your facility" },
  { icon: Zap, title: "Fast Installation", text: "Efficient on-site assembly" },
];

const stats = [
  { value: "1,500", suffix: "+", label: "Projects Completed" },
  { value: "99.8", suffix: "%", label: "On-Time Delivery" },
];

const gridStyle = {
  backgroundImage:
    "linear-gradient(rgba(255,255,255,.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.04) 1px, transparent 1px)",
  backgroundSize: "56px 56px",
};

export function WhyRackStack({ environments }: { environments: WhyEnvironment[] }) {
  return (
    <section
      id="why-rack-stack"
      className="relative isolate overflow-hidden bg-[var(--navy)] py-12 text-white sm:py-13 lg:py-14"
    >
      <div
        className="pointer-events-none absolute -left-40 top-0 h-96 w-96 rounded-full bg-[#FF6B1A]/10 blur-[100px]"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -right-40 bottom-0 h-80 w-80 rounded-full bg-[#38BDF8]/[0.06] blur-[100px]"
        aria-hidden="true"
      />
      <div className="pointer-events-none absolute inset-0" style={gridStyle} aria-hidden="true" />

      <div className="container-shell relative">
        <div className="grid grid-cols-1 gap-6 sm:gap-7 lg:grid-cols-12 lg:gap-6">
          <Reveal className="lg:col-start-1 lg:col-span-5 lg:row-start-1">
            <h2 className="text-[1.6rem] font-bold leading-[1.08] tracking-[-0.02em] text-white sm:text-[2.05rem] xl:text-[2.6rem]">
              <span className="block sm:whitespace-nowrap">
                Why{" "}
                <span className="text-[var(--accent)]">Industry Leaders</span>
              </span>
              <span className="block sm:whitespace-nowrap">Choose Rack &amp; Stack</span>
            </h2>

            <p className="mt-3 max-w-md text-sm leading-relaxed text-white/60 sm:text-base">
              Industrial racking and storage systems engineered around your load requirements, available
              space and warehouse workflow.
            </p>

            <Link href="/products" className="btn-accent mt-5">
              Explore Racking Systems
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </Reveal>

          <div className="lg:col-start-6 lg:col-span-4 lg:row-start-1 lg:row-span-2 lg:self-center">
            <IndiaNetworkVisual />
          </div>

          <Reveal
            delay={0.1}
            className="lg:col-start-1 lg:col-span-5 lg:row-start-2 lg:mt-6"
          >
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              {environments.map((environment) => (
                <Link
                  key={environment.title}
                  href={environment.href}
                  className="group relative block aspect-[1.25/1] overflow-hidden rounded-lg border border-white/10"
                >
                  <SmartImage
                    src={environment.image}
                    alt={`${environment.title} — ${environment.location}`}
                    fill
                    sizes="(max-width: 1024px) 30vw, 15vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <span className="absolute inset-0 bg-gradient-to-t from-[#071C27]/90 via-[#071C27]/25 to-transparent" />
                  <span className="absolute inset-x-0 bottom-0 p-2 sm:p-2.5">
                    <span className="block text-[0.6rem] font-bold uppercase leading-tight tracking-wider text-white sm:text-[0.68rem]">
                      {environment.title}
                    </span>
                    <span className="mt-0.5 block text-[0.55rem] leading-tight text-white/60 sm:text-[0.62rem]">
                      {environment.location}
                    </span>
                  </span>
                </Link>
              ))}
            </div>
          </Reveal>

          <Reveal className="lg:col-start-10 lg:col-span-3 lg:row-start-1 lg:row-span-2 lg:self-center">
            <Stagger gap={0.1}>
              <div className="grid grid-cols-1 gap-2 min-[400px]:grid-cols-2 lg:grid-cols-1">
                {advantages.map(({ icon: Icon, title, text }) => (
                  <StaggerItem key={title} className="h-full">
                    <div className="group flex h-full items-center gap-3 rounded-xl border border-white/8 bg-white/[0.035] p-3 transition-all duration-300 hover:-translate-x-1 hover:border-[#FF6B1A]/30 hover:bg-white/[0.07]">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#FF6B1A]/10 text-[#FF6B1A] transition-colors duration-300 group-hover:bg-[#FF6B1A] group-hover:text-white">
                        <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-sm font-bold leading-tight text-white lg:text-[0.82rem]">
                          {title}
                        </span>
                        <span className="mt-0.5 block text-xs leading-snug text-white/55">{text}</span>
                      </span>
                    </div>
                  </StaggerItem>
                ))}
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2">
                {stats.map(({ value, suffix, label }) => (
                  <StaggerItem key={label} className="h-full">
                    <div className="h-full rounded-xl border border-white/10 bg-white/[0.035] p-3">
                      <span className="block text-xl font-black leading-none tracking-tight text-white">
                        {value}
                        <span className="text-[#FF6B1A]">{suffix}</span>
                      </span>
                      <span className="mt-1.5 block text-[0.58rem] font-bold uppercase leading-tight tracking-wider text-white/55">
                        {label}
                      </span>
                    </div>
                  </StaggerItem>
                ))}
              </div>
            </Stagger>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
