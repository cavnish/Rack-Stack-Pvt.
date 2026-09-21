"use client";
import Link from "next/link";
import { useState } from "react";
import { Download, Maximize2, X } from "lucide-react";
import { SmartImage } from "./smart-image";

type GalleryImage = { id: number; imageUrl: string; altText: string; caption: string | null };
type Specification = { id: number; specificationName: string; specificationValue: string };

export function ProductGallery({ images }: { images: GalleryImage[] }) {
  const [active, setActive] = useState(0);
  const [zoom, setZoom] = useState(false);
  if (!images.length) return null;
  const image = images[Math.min(active, images.length - 1)];
  return <div>
    <button type="button" onClick={()=>setZoom(true)} className="group relative block h-[55vw] max-h-[650px] min-h-[340px] w-full overflow-hidden bg-zinc-200 text-left">
      <SmartImage src={image.imageUrl} alt={image.altText} fill className="object-cover transition duration-700 group-hover:scale-[1.02]" sizes="(max-width: 1024px) 100vw, 70vw"/>
      <span className="absolute right-4 top-4 grid h-10 w-10 place-items-center bg-white/90 text-zinc-950"><Maximize2 size={17}/></span>
      {image.caption&&<span className="absolute inset-x-0 bottom-0 bg-black/65 p-4 text-xs text-white">{image.caption}</span>}
    </button>
    {images.length>1&&<div className="mt-3 flex gap-3 overflow-x-auto pb-2 no-scrollbar">{images.map((item,index)=><button type="button" key={item.id} onClick={()=>setActive(index)} className={`relative h-20 w-28 shrink-0 overflow-hidden border-2 ${active===index?"border-red-600":"border-transparent"}`} aria-label={`View image ${index+1}`}><SmartImage src={item.imageUrl} alt="" fill className="object-cover" sizes="112px"/></button>)}</div>}
    {zoom&&<div className="fixed inset-0 z-[100] grid place-items-center bg-black/95 p-4" role="dialog" aria-modal="true" aria-label={`${image.altText} fullscreen`} onClick={()=>setZoom(false)}><button type="button" onClick={()=>setZoom(false)} className="absolute right-5 top-5 grid h-11 w-11 place-items-center text-white" aria-label="Close fullscreen image"><X size={28}/></button><div className="relative h-[86vh] w-full max-w-7xl" onClick={(event)=>event.stopPropagation()}><SmartImage src={image.imageUrl} alt={image.altText} fill className="object-contain" sizes="100vw"/></div></div>}
  </div>;
}

export function SpecificationPanel({ specifications }: { specifications: Specification[] }) {
  return <>
    <div className="hidden border-t border-zinc-950 sm:block">{specifications.map((spec)=><div key={spec.id} className="grid grid-cols-2 gap-4 border-b border-zinc-200 py-4 text-sm"><span className="font-semibold">{spec.specificationName}</span><span className="text-zinc-600">{spec.specificationValue}</span></div>)}</div>
    <div className="divide-y divide-zinc-200 border-y border-zinc-300 sm:hidden">{specifications.map((spec)=><details key={spec.id} className="group py-4"><summary className="cursor-pointer list-none text-sm font-semibold after:float-right after:content-['+'] group-open:after:content-['−']">{spec.specificationName}</summary><p className="pt-3 text-sm leading-6 text-zinc-600">{spec.specificationValue}</p></details>)}</div>
  </>;
}

export function MobileProductActions({ slug }: { slug: string }) {
  return <div className="fixed inset-x-0 bottom-0 z-40 border-t border-zinc-200 bg-white/95 p-2 pr-28 shadow-[0_-8px_30px_rgba(0,0,0,.1)] backdrop-blur md:hidden"><div className="flex gap-2"><Link href={`/request-a-quote?product=${slug}`} className="btn-primary min-h-11 grow px-3 text-[.7rem]">Request Quote</Link><Link href="/catalog" aria-label="Download catalog" className="grid h-11 w-11 shrink-0 place-items-center border border-zinc-300"><Download size={16}/></Link></div></div>;
}
