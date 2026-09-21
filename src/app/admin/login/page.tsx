import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/admin/login-form";
import { Logo } from "@/components/site/logo";
import { getCurrentUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Admin Login", robots: { index: false, follow: false } };

export default async function AdminLoginPage() {
  if (await getCurrentUser()) redirect("/admin");
  return (
    <main className="dark-grid grid min-h-screen lg:grid-cols-2">
      <section className="flex flex-col bg-zinc-950 p-6 text-white sm:p-12">
        <Logo light />
        <div className="my-auto max-w-xl py-16">
          <p className="eyebrow text-red-400">Secure content management</p>
          <h1 className="heading-lg mt-6">Operate the website from one protected workspace.</h1>
          <p className="mt-6 max-w-lg leading-8 text-zinc-300">
            Products, content, media, enquiries and SEO changes are connected directly to the public website.
          </p>
        </div>
        <p className="text-xs text-zinc-400">Rack &amp; Stack Storage Systems Pvt. Ltd.</p>
      </section>
      <section className="flex items-center justify-center bg-[#f4f4f1] p-6 sm:p-12">
        <div className="w-full max-w-md bg-zinc-950 p-8 text-white shadow-2xl sm:p-10">
          <p className="text-[.65rem] font-bold uppercase tracking-widest text-red-400">Administrator access</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight">Welcome back.</h2>
          <p className="mt-2 text-sm text-zinc-300">Use your authorized CMS account.</p>
          <LoginForm />
          <Link href="/" className="mt-6 block text-center text-xs text-zinc-400 hover:text-white">
            Return to website
          </Link>
        </div>
      </section>
    </main>
  );
}
