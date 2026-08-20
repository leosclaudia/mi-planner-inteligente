import { useEffect, useState } from "react";
import { Palette } from "lucide-react";

const COLORS=["#FFFFFF","#FFF8E7","#FFF1E6","#FDECEF","#F7E8F3","#EDE9FE","#E8F1FF","#E7F5EF","#EEF7E8","#FFF6CC","#F3F4F6","#E5E7EB"];
export function useCardBackground(key:string, fallback="#FFFFFF"){
 const [color,setColorState]=useState(fallback);
 useEffect(()=>{setColorState(localStorage.getItem(`planner-card-bg:${key}`)||fallback)},[key,fallback]);
 const setColor=(value:string)=>{setColorState(value);localStorage.setItem(`planner-card-bg:${key}`,value)};
 return [color,setColor] as const;
}
export function CardBackgroundPicker({storageKey,label="Fondo",className=""}:{storageKey:string;label?:string;className?:string}){
 const [open,setOpen]=useState(false); const [color,setColor]=useCardBackground(storageKey);
 return <div className={`relative print:hidden ${className}`} onClick={e=>e.stopPropagation()}>
  <button type="button" title={label} aria-label={label} onClick={e=>{e.preventDefault();e.stopPropagation();setOpen(v=>!v)}} className="grid h-9 w-9 place-items-center rounded-lg border border-border bg-white/70 shadow-sm"><Palette className="h-4 w-4"/></button>
  {open&&<div className="absolute right-0 top-full z-50 mt-2 w-56 rounded-xl border border-border bg-card p-3 shadow-xl"><div className="mb-2 text-xs font-semibold">{label}</div><div className="flex flex-wrap gap-2">{COLORS.map(c=><button key={c} type="button" className="h-8 w-8 rounded-full border border-border" style={{backgroundColor:c}} onClick={()=>{setColor(c);setOpen(false)}}/>)}</div><label className="mt-3 flex cursor-pointer items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm">Más colores <input type="color" value={color} onChange={e=>setColor(e.target.value)} /></label></div>}
 </div>
}
