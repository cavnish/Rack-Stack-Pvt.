"use client";
import { motion,useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";
export function Reveal({children,delay=0,className}:{children:ReactNode;delay?:number;className?:string}){const reduced=useReducedMotion();return <motion.div className={className} initial={reduced?false:{opacity:0,y:24}} whileInView={reduced?{}:{opacity:1,y:0}} viewport={{once:true,margin:"-80px"}} transition={{duration:.62,delay,ease:[.22,1,.36,1]}}>{children}</motion.div>}
