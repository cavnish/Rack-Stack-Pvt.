"use client";
import { Plus } from "lucide-react";
import { useState } from "react";
export function FAQ({items}:{items:Array<{id:number;question:string;answer:string}>}){const [open,setOpen]=useState<number|null>(items[0]?.id??null);return <div className="divide-y divide-zinc-300 border-y border-zinc-300">{items.map(item=><div key={item.id}><button className="flex w-full items-center justify-between gap-6 py-5 text-left font-semibold" onClick={()=>setOpen(open===item.id?null:item.id)} aria-expanded={open===item.id}><span>{item.question}</span><Plus size={18} className={`shrink-0 transition-transform ${open===item.id?"rotate-45 text-red-600":""}`}/></button>{open===item.id&&<p className="max-w-3xl pb-6 text-sm leading-7 text-zinc-600">{item.answer}</p>}</div>)}</div>}
