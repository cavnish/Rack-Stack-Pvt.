"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Activity, BadgeCheck, BookOpen, BriefcaseBusiness, ChevronLeft, ChevronRight, Files, GalleryHorizontal, Home,
  Image as ImageIcon, LayoutDashboard, LogOut, Menu, MessageSquare, PanelsTopLeft, Search, Settings, ShieldCheck,
  SlidersHorizontal, Star, Users, X,
} from "lucide-react";
import { useState } from "react";
import { Logo } from "@/components/site/logo";

const CATALOG_HREF = "/admin/settings/1/edit#catalog";
const nav = [
  ["Dashboard", "/admin", LayoutDashboard],
  ["Homepage", "/admin/homepage", Home],
  ["Home Slider", "/admin/home-slider", SlidersHorizontal],
  ["Pages", "/admin/pages", Files],
  ["Products", "/admin/products", PanelsTopLeft],
  ["Services", "/admin/services", Settings],
  ["Projects", "/admin/projects", BriefcaseBusiness],
  ["Industries", "/admin/industries", LayoutDashboard],
  ["Clients", "/admin/clients", Users],
  ["Client Logos", "/admin/client-logos", BadgeCheck],
  ["Testimonials", "/admin/testimonials", Star],
  ["Gallery", "/admin/gallery", GalleryHorizontal],
  ["Blog", "/admin/blog", BookOpen],
  ["FAQs", "/admin/faqs", MessageSquare],
  ["Catalog", CATALOG_HREF, BookOpen],
  ["Inquiries", "/admin/inquiries", MessageSquare],
  ["Contact Messages", "/admin/contact-messages", MessageSquare],
  ["Media Library", "/admin/media", ImageIcon],
  ["SEO", "/admin/seo", Search],
  ["Site Settings", "/admin/settings", Settings],
  ["Users", "/admin/users", ShieldCheck],
  ["Activity Logs", "/admin/activity", Activity],
] as const;

export function AdminShell({ children, user }: { children: React.ReactNode; user: { name: string; email: string; role: string } }) {
  const path = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  function isActive(href: string) {
    if (href === CATALOG_HREF) return path === "/admin/settings/1/edit";
    if (href === "/admin/settings") return path === "/admin/settings";
    return href === "/admin" ? path === href : path.startsWith(href);
  }

  const sidebar = (
    <>
      <div className="flex h-[72px] items-center justify-between border-b border-white/10 px-5">
        <Logo light compact={collapsed} iconBackground="bg-zinc-950" />
        <button className="text-zinc-300 hover:text-white lg:hidden" onClick={() => setOpen(false)} aria-label="Close menu">
          <X />
        </button>
      </div>
      <nav aria-label="Admin sections" className="no-scrollbar h-[calc(100vh-144px)] overflow-y-auto px-3 py-5">
        {nav
          .filter(([label]) => !(label === "Users" && user.role !== "SUPER_ADMIN"))
          .map(([label, href, Icon]) => {
            const active = isActive(href);
            return (
              <Link
                onClick={() => setOpen(false)}
                title={label}
                href={href}
                key={href}
                aria-current={active ? "page" : undefined}
                className={`mb-1 flex items-center gap-3 rounded-lg px-3 py-2.5 text-[.78rem] font-semibold transition ${
                  active ? "bg-red-600 text-white shadow-sm" : "text-white hover:bg-white/10 hover:text-white"
                }`}
              >
                <Icon size={17} className="shrink-0" />
                {!collapsed && label}
              </Link>
            );
          })}
      </nav>
      <button
        onClick={() => setCollapsed(!collapsed)}
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        className="hidden h-[72px] w-full items-center justify-center border-t border-white/10 text-zinc-300 hover:bg-white/5 hover:text-white lg:flex"
      >
        {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
      </button>
    </>
  );

  return (
    <div className="min-h-screen bg-[#f5f6f7] text-zinc-900">
      <aside className={`fixed inset-y-0 left-0 z-50 hidden bg-zinc-950 transition-all lg:block ${collapsed ? "w-[76px]" : "w-[248px]"}`}>
        {sidebar}
      </aside>
      {open && (
        <aside className="fixed inset-y-0 left-0 z-50 w-[280px] bg-zinc-950 lg:hidden">
          {sidebar}
        </aside>
      )}
      <div className={`transition-all ${collapsed ? "lg:pl-[76px]" : "lg:pl-[248px]"}`}>
        <header className="sticky top-0 z-40 flex h-[72px] items-center justify-between border-b border-zinc-200 bg-white/95 px-4 backdrop-blur lg:px-7">
          <div className="flex items-center gap-3">
            <button className="grid h-10 w-10 place-items-center text-zinc-800 hover:bg-zinc-100 lg:hidden" onClick={() => setOpen(true)} aria-label="Open menu">
              <Menu size={20} />
            </button>
            <div className="relative hidden sm:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={15} />
              <input
                className="w-64 rounded-lg border border-zinc-200 bg-zinc-50 py-2 pl-9 pr-3 text-xs text-zinc-900 outline-none placeholder:text-zinc-500 focus:border-zinc-400"
                placeholder="Search CMS navigation…"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && e.currentTarget.value) router.push(`/admin/products?search=${encodeURIComponent(e.currentTarget.value)}`);
                }}
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-xs font-bold text-zinc-900">{user.name}</p>
              <p className="text-[.62rem] font-semibold text-zinc-600">{user.role.replace("_", " ")}</p>
            </div>
            <span className="grid h-9 w-9 place-items-center rounded-full bg-zinc-900 text-xs font-bold text-white">{user.name[0]?.toUpperCase()}</span>
            <button onClick={logout} title="Logout" className="grid h-9 w-9 place-items-center rounded-lg text-zinc-600 hover:bg-zinc-100 hover:text-red-600">
              <LogOut size={17} />
            </button>
          </div>
        </header>
        <main className="p-4 lg:p-7">{children}</main>
      </div>
    </div>
  );
}
