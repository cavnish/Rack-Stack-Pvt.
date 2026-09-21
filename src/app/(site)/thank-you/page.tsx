import type { Metadata } from "next";
import Link from "next/link";
import { Check,MessageCircle,Phone } from "lucide-react";
import { getSiteSettings } from "@/lib/data";
import { phoneHref,whatsappHref } from "@/lib/utils";
import { Reveal } from "@/components/site/reveal";
export const metadata:Metadata={title:"Requirement Received",robots:{index:false,follow:false}};
export default async function ThankYouPage(){const settings=await getSiteSettings();return <main className="dark-grid grid min-h-[70vh] place-items-center bg-zinc-950 px-4 py-20 text-white"><Reveal><section className="max-w-2xl text-center"><span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-red-600"><Check size={30}/></span><p className="eyebrow mt-8 justify-center before:hidden text-red-400">Submission successful</p><h1 className="heading-lg mt-5">Thank You. Your Requirement Has Been Received.</h1><p className="mx-auto mt-6 max-w-xl leading-8 text-zinc-400">Our team will review your requirement and contact you shortly.</p><div className="mt-9 flex flex-wrap justify-center gap-3">{settings&&<><a href={whatsappHref(settings.whatsapp)} className="btn-primary" target="_blank" rel="noreferrer"><MessageCircle size={16}/> WhatsApp</a><a href={phoneHref(settings.primaryPhone)} className="btn-light"><Phone size={16}/> Call</a></>}<Link href="/" className="btn-light">Return to website</Link></div></section></Reveal></main>}
