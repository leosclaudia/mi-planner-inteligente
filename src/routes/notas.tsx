import { useEffect, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Bold, Copy, ImagePlus, Italic, MoreHorizontal, Palette, Scissors, SmilePlus, Trash2, Underline } from "lucide-react";
import { AppGate } from "@/components/planner/AppGate";
import { PageShell } from "@/components/planner/PageShell";

export const Route = createFileRoute("/notas")({ component: () => <AppGate><NotasPage /></AppGate> });

type BoxId = "hoy" | "prioridades" | "recordatorios" | "libre";
const BOXES: { id: BoxId; title: string; tone: string; placeholder: string }[] = [
  { id: "hoy", title: "HOY", tone: "bg-[#F7E5DF]", placeholder: "Tocá acá y escribí..." },
  { id: "prioridades", title: "PRIORIDADES", tone: "bg-[#F5E7D8]", placeholder: "Ideas, prioridades, listas..." },
  { id: "recordatorios", title: "RECORDATORIOS", tone: "bg-[#ECE6F3]", placeholder: "Cosas para no olvidar..." },
  { id: "libre", title: "LIENZO LIBRE", tone: "bg-[#F3E8E5]", placeholder: "Texto, imágenes, stickers..." },
];
const STICKERS = ["⭐","❤️","✨","🌸","🌼","🌷","🦋","🌈","☀️","🌙","☁️","🍓","🍒","🍋","☕","🎂","🎁","🎀","📌","💡","✅","🎯","📝","📚","💻","📷","🎵","🏠","💰","🛒","✈️","🐾","😊","🥰","💪","🧘"];
const COLORS = ["#2F2B29","#A85F5F","#C47D62","#B58A55","#7E6A9A","#5F7892","#B45D85","#8A6F63"];

function storageKey(id: BoxId) { return `planner-lienzo-${id}-v2`; }

function NotasPage() {
  const refs = useRef<Record<BoxId, HTMLDivElement | null>>({ hoy:null, prioridades:null, recordatorios:null, libre:null });
  const fileRef = useRef<HTMLInputElement>(null);
  const [active, setActive] = useState<BoxId>("hoy");
  const [copiedHtml, setCopiedHtml] = useState("");
  const [panel, setPanel] = useState<"stickers"|"colors"|"more"|null>(null);

  useEffect(() => { BOXES.forEach(({id}) => { const el=refs.current[id]; if(el) el.innerHTML=localStorage.getItem(storageKey(id)) ?? ""; }); }, []);
  const saveBox=(id:BoxId)=>{ const el=refs.current[id]; if(el) localStorage.setItem(storageKey(id),el.innerHTML); };
  const focus=()=>refs.current[active]?.focus();
  const command=(cmd:string,value?:string)=>{ focus(); document.execCommand(cmd,false,value); saveBox(active); };
  const insertSticker=(s:string)=>{ focus(); document.execCommand("insertText",false,s); saveBox(active); };
  const addImage=(file?:File)=>{ if(!file)return; const r=new FileReader(); r.onload=()=>{ focus(); document.execCommand("insertHTML",false,`<img src="${r.result}" alt="Imagen" draggable="true" style="display:block;max-width:90%;height:auto;margin:12px auto;border-radius:14px;box-shadow:0 4px 14px rgba(47,43,41,.10);" />`); saveBox(active); }; r.readAsDataURL(file); };
  const copyBox=()=>setCopiedHtml(refs.current[active]?.innerHTML ?? "");
  const cutBox=()=>{ const el=refs.current[active]; if(!el)return; setCopiedHtml(el.innerHTML); el.innerHTML=""; saveBox(active); };
  const pasteBox=()=>{ const el=refs.current[active]; if(!el||!copiedHtml)return; el.insertAdjacentHTML("beforeend",copiedHtml); saveBox(active); };
  const clearBox=()=>{ const el=refs.current[active]; if(!el)return; el.innerHTML=""; saveBox(active); };

  return <PageShell title="Notas" subtitle="Tocá una hoja y empezá. Las herramientas aparecen cuando las necesitás.">
    <div className="sticky top-0 z-30 -mx-4 mb-4 border-y border-border bg-background/95 px-4 py-2 backdrop-blur">
      <div className="flex items-center justify-between gap-2">
        <div className="flex gap-1.5">
          <IconTool title="Negrita" onClick={()=>command("bold")}><Bold /></IconTool>
          <IconTool title="Cursiva" onClick={()=>command("italic")}><Italic /></IconTool>
          <IconTool title="Subrayar" onClick={()=>command("underline")}><Underline /></IconTool>
        </div>
        <div className="flex gap-1.5">
          <IconTool title="Imagen" onClick={()=>fileRef.current?.click()}><ImagePlus /></IconTool>
          <IconTool title="Stickers" active={panel==="stickers"} onClick={()=>setPanel(panel==="stickers"?null:"stickers")}><SmilePlus /></IconTool>
          <IconTool title="Color" active={panel==="colors"} onClick={()=>setPanel(panel==="colors"?null:"colors")}><Palette /></IconTool>
          <IconTool title="Más" active={panel==="more"} onClick={()=>setPanel(panel==="more"?null:"more")}><MoreHorizontal /></IconTool>
        </div>
      </div>
      {panel==="stickers" && <div className="mt-2 rounded-2xl border bg-card p-3 shadow-sm"><div className="grid grid-cols-8 gap-2 sm:grid-cols-12">{STICKERS.map(s=><button key={s} className="grid h-10 w-10 place-items-center rounded-xl hover:bg-muted text-xl" onClick={()=>insertSticker(s)}>{s}</button>)}</div></div>}
      {panel==="colors" && <div className="mt-2 flex flex-wrap gap-3 rounded-2xl border bg-card p-3 shadow-sm">{COLORS.map(c=><button key={c} title={c} aria-label={`Color ${c}`} className="h-9 w-9 rounded-full border-2 border-white shadow ring-1 ring-border" style={{backgroundColor:c}} onMouseDown={e=>e.preventDefault()} onClick={()=>{ command("foreColor",c); setPanel(null); }} />)}<button className="h-9 rounded-xl border px-3 text-sm" onMouseDown={e=>e.preventDefault()} onClick={()=>{command("removeFormat");setPanel(null);}}>Sin color</button></div>}
      {panel==="more" && <div className="mt-2 flex flex-wrap gap-2 rounded-2xl border bg-card p-2 shadow-sm"><TextTool onClick={cutBox}><Scissors/>Cortar caja</TextTool><TextTool onClick={copyBox}><Copy/>Copiar caja</TextTool><TextTool onClick={pasteBox}>Pegar</TextTool><TextTool danger onClick={clearBox}><Trash2/>Vaciar</TextTool></div>}
      <div className="mt-1 text-xs text-muted-foreground">Editando: <b>{BOXES.find(b=>b.id===active)?.title}</b></div>
    </div>
    <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e=>addImage(e.target.files?.[0])}/>
    <div className="space-y-4">{BOXES.map(box=><section key={box.id} onPointerDown={()=>setActive(box.id)} className={`overflow-hidden rounded-[1.4rem] border bg-card shadow-sm ${active===box.id?"ring-2 ring-[#D9A596]/35 border-[#D9A596]":"border-border"}`}><div className={`${box.tone} border-b border-border px-4 py-2 text-xs font-extrabold tracking-wide text-foreground`}>{box.title}</div><div ref={el=>{refs.current[box.id]=el;}} contentEditable suppressContentEditableWarning onFocus={()=>setActive(box.id)} onInput={()=>saveBox(box.id)} className="min-h-36 px-4 py-4 text-base leading-7 outline-none empty:before:text-muted-foreground empty:before:content-[attr(data-placeholder)]" data-placeholder={box.placeholder}/></section>)}</div>
  </PageShell>;
}

function IconTool({children,title,onClick,active=false}:{children:React.ReactNode;title:string;onClick:()=>void;active?:boolean}) { return <button type="button" title={title} aria-label={title} onMouseDown={e=>e.preventDefault()} onClick={onClick} className={`grid h-11 w-11 place-items-center rounded-xl border shadow-sm [&_svg]:h-5 [&_svg]:w-5 ${active?"bg-[#F3DDD6] border-[#D9A596]":"bg-card border-border"}`}>{children}</button>; }
function TextTool({children,onClick,danger=false}:{children:React.ReactNode;onClick:()=>void;danger?:boolean}) { return <button type="button" onClick={onClick} className={`flex h-10 items-center gap-1.5 rounded-xl border bg-card px-3 text-sm [&_svg]:h-4 [&_svg]:w-4 ${danger?"text-destructive":""}`}>{children}</button>; }
