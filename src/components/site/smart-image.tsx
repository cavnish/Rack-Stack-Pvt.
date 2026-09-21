"use client";
import Image, { type ImageProps } from "next/image";
import { useState } from "react";
export function SmartImage({ src, alt, ...props }: ImageProps) { const [failed,setFailed]=useState(false); if (failed || !src) return <div className="flex h-full w-full items-center justify-center bg-zinc-200 text-xs font-semibold uppercase tracking-widest text-zinc-500" role="img" aria-label={alt}>Image unavailable</div>; return <Image src={src} alt={alt} {...props} onError={()=>setFailed(true)}/>; }
