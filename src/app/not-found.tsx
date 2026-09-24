import Link from "next/link";
import { ArrowLeft,Search } from "lucide-react";
import { Logo } from "@/components/site/logo";
export default function NotFound(){return <main className="dark-grid grid min-h-screen place-items-center bg-zinc-950 p-6 text-white"><section className="max-w-2xl text-center"><Logo light/><p className="mt-16 text-5xl font-bold tracking-tighter text-red-600">404</p><h1 className="heading-md mt-5">Page Not Found</h1><p className="mt-4 text-zinc-400">The page may have moved or no longer exists.</p><div className="mt-8 flex flex-wrap justify-center gap-3"><Link href="/" className="btn-primary"><ArrowLeft size={16}/>Return Home</Link><Link href="/search" className="btn-light"><Search size={16}/>Search Website</Link></div></section></main>}
