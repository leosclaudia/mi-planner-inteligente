import { useEffect, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Bold,
  CaseSensitive,
  Copy,
  Eraser,
  Highlighter,
  ImagePlus,
  Italic,
  MoreHorizontal,
  Palette,
  Pencil,
  Redo2,
  Scissors,
  Search,
  SmilePlus,
  Trash2,
  Underline,
  Undo2,
} from "lucide-react";
import { AppGate } from "@/components/planner/AppGate";
import { PageShell } from "@/components/planner/PageShell";

export const Route = createFileRoute("/notas")({
  component: () => <AppGate><NotasPage /></AppGate>,
});

type BoxId = "hoy" | "prioridades" | "recordatorios" | "libre";
type Panel = "stickers" | "colors" | "fonts" | "pen" | "more" | null;
type StickerGroup = "Favoritos" | "Agenda" | "Deco" | "Comida" | "Viajes" | "Caritas";

const BOXES: { id: BoxId; title: string; tone: string; placeholder: string }[] = [
  { id: "hoy", title: "HOY", tone: "bg-[#F7E5DF]", placeholder: "Tocá acá y escribí..." },
  { id: "prioridades", title: "PRIORIDADES", tone: "bg-[#F5E7D8]", placeholder: "Ideas, prioridades, listas..." },
  { id: "recordatorios", title: "RECORDATORIOS", tone: "bg-[#ECE6F3]", placeholder: "Cosas para no olvidar..." },
  { id: "libre", title: "LIENZO LIBRE", tone: "bg-[#F3E8E5]", placeholder: "Texto, imágenes, stickers..." },
];

const STICKERS: Record<StickerGroup, string[]> = {
  Favoritos: ["⭐","❤️","✨","🌸","🦋","🌈","☀️","📌","💡","✅","🎯","📝"],
  Agenda: ["📅","⏰","⏳","📌","📎","✏️","🖊️","📝","📚","💻","📞","💬","✅","❗","💡","🎯","💰","🛒"],
  Deco: ["🎀","🌸","🌷","🌼","🌻","🌹","🍀","🌿","🍃","🦋","🐝","🌙","⭐","✨","💫","☁️","🌈","🕯️"],
  Comida: ["☕","🫖","🍰","🎂","🍓","🍒","🍋","🍉","🥐","🍞","🥗","🍕","🍝","🍫","🍪","🥤","🍷","🧁"],
  Viajes: ["✈️","🚗","🚲","🧳","🗺️","📍","🏖️","🏕️","🏨","🌊","⛰️","🌴","🎒","📷","🚆","🛳️","🌎","🧭"],
  Caritas: ["😊","🥰","😍","🤩","😌","😂","😉","😎","🤗","🥳","😴","🤔","🙌","👏","💪","🙏","💖","💕"],
};

const TEXT_COLORS = ["#111111","#5B2C2C","#A84F4F","#D26A4C","#C48A2F","#6F5B3E","#66508D","#4F6E98","#B34F83","#A06C5B","#D47786","#4E7C72","#2F6F5F","#3D7C40","#31708E","#6B6B6B"];
const HIGHLIGHT_COLORS = ["#FFF59D","#FFE0B2","#F8BBD0","#E1BEE7","#C5CAE9","#B3E5FC","#B2DFDB","#C8E6C9","#DCEDC8","#FFCCBC","#F5F5F5"];
const FALLBACK_FONTS = ["Arial","Verdana","Tahoma","Trebuchet MS","Georgia","Times New Roman","Courier New","Comic Sans MS","Segoe UI","Calibri","Garamond"];
const FONT_SIZES = [12,14,16,18,20,24,28,32,36,42,48];
const storageKey = (id: BoxId) => `planner-lienzo-${id}-v2`;
const drawKey = (id: BoxId) => `planner-dibujo-${id}-v1`;

function NotasPage() {
  const refs = useRef<Record<BoxId, HTMLDivElement | null>>({ hoy:null, prioridades:null, recordatorios:null, libre:null });
  const canvasRefs = useRef<Record<BoxId, HTMLCanvasElement | null>>({ hoy:null, prioridades:null, recordatorios:null, libre:null });
  const fileRef = useRef<HTMLInputElement>(null);
  const selectionRef = useRef<Range | null>(null);
  const drawHistory = useRef<Record<BoxId, string[]>>({ hoy:[], prioridades:[], recordatorios:[], libre:[] });
  const drawFuture = useRef<Record<BoxId, string[]>>({ hoy:[], prioridades:[], recordatorios:[], libre:[] });

  const [active, setActive] = useState<BoxId>("hoy");
  const [copiedHtml, setCopiedHtml] = useState("");
  const [panel, setPanel] = useState<Panel>(null);
  const [stickerGroup, setStickerGroup] = useState<StickerGroup>("Favoritos");
  const [stickerSearch, setStickerSearch] = useState("");
  const [fonts, setFonts] = useState(FALLBACK_FONTS);
  const [fontStatus, setFontStatus] = useState("");
  const [fontSize, setFontSize] = useState(16);
  const [penColor, setPenColor] = useState("#2F2B29");
  const [penWidth, setPenWidth] = useState(3);
  const [eraser, setEraser] = useState(false);
  const [customTextColor, setCustomTextColor] = useState("#A84F4F");
  const [customHighlightColor, setCustomHighlightColor] = useState("#FFF59D");
  const [recognizing, setRecognizing] = useState(false);
  const [ocrStatus, setOcrStatus] = useState("");

  useEffect(() => {
    BOXES.forEach(({ id }) => {
      const el = refs.current[id];
      if (el) el.innerHTML = localStorage.getItem(storageKey(id)) ?? "";
      const saved = localStorage.getItem(drawKey(id));
      const canvas = canvasRefs.current[id];
      const ctx = canvas?.getContext("2d");
      if (saved && canvas && ctx) {
        const img = new Image();
        img.onload = () => ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        img.src = saved;
      }
    });
  }, []);

  useEffect(() => {
    const canvas = canvasRefs.current[active];
    if (!canvas || panel !== "pen") return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let drawing = false;
    const point = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      return { x: (e.clientX-r.left)/r.width*canvas.width, y: (e.clientY-r.top)/r.height*canvas.height };
    };
    const saveSnapshot = () => {
      const data = canvas.toDataURL("image/png");
      drawHistory.current[active].push(data);
      if (drawHistory.current[active].length > 25) drawHistory.current[active].shift();
      drawFuture.current[active] = [];
      localStorage.setItem(drawKey(active), data);
    };
    const down = (e: PointerEvent) => {
      drawing = true;
      canvas.setPointerCapture(e.pointerId);
      const p = point(e);
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
    };
    const move = (e: PointerEvent) => {
      if (!drawing) return;
      const p = point(e);
      ctx.lineWidth = eraser ? 18 : penWidth;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.globalCompositeOperation = eraser ? "destination-out" : "source-over";
      ctx.strokeStyle = penColor;
      ctx.lineTo(p.x, p.y);
      ctx.stroke();
    };
    const up = () => {
      if (!drawing) return;
      drawing = false;
      ctx.globalCompositeOperation = "source-over";
      saveSnapshot();
    };
    canvas.addEventListener("pointerdown", down);
    canvas.addEventListener("pointermove", move);
    canvas.addEventListener("pointerup", up);
    canvas.addEventListener("pointercancel", up);
    return () => {
      canvas.removeEventListener("pointerdown", down);
      canvas.removeEventListener("pointermove", move);
      canvas.removeEventListener("pointerup", up);
      canvas.removeEventListener("pointercancel", up);
    };
  }, [active, panel, penColor, penWidth, eraser]);

  const saveBox = (id: BoxId) => {
    const el = refs.current[id];
    if (el) localStorage.setItem(storageKey(id), el.innerHTML);
  };
  const rememberSelection = () => {
    const s = window.getSelection();
    if (s && s.rangeCount && refs.current[active]?.contains(s.anchorNode)) selectionRef.current = s.getRangeAt(0).cloneRange();
  };
  const restoreSelection = () => {
    const r = selectionRef.current;
    if (!r) return;
    const s = window.getSelection();
    s?.removeAllRanges();
    s?.addRange(r);
  };
  const focus = () => { refs.current[active]?.focus(); restoreSelection(); };
  const command = (cmd: string, value?: string) => { focus(); document.execCommand(cmd, false, value); rememberSelection(); saveBox(active); };
  const insertSticker = (s: string) => { focus(); document.execCommand("insertText", false, s); rememberSelection(); saveBox(active); };
  const applyFont = (family: string) => command("fontName", family);
  const applySize = (px: number) => {
    focus();
    document.execCommand("fontSize", false, "7");
    refs.current[active]?.querySelectorAll('font[size="7"]').forEach(node => {
      const el = node as HTMLElement;
      el.removeAttribute("size");
      el.style.fontSize = `${px}px`;
    });
    setFontSize(px);
    rememberSelection();
    saveBox(active);
  };

  const loadDeviceFonts = async () => {
    setFontStatus("");
    const w = window as Window & { queryLocalFonts?: () => Promise<Array<{family:string}>> };
    if (!w.queryLocalFonts) {
      setFontStatus("Este navegador no permite listar las fuentes instaladas. Podés usar las fuentes compatibles de abajo.");
      return;
    }
    try {
      const local = await w.queryLocalFonts();
      const names = [...new Set(local.map(f => f.family).filter(Boolean))].sort((a,b) => a.localeCompare(b));
      if (names.length) { setFonts(names); setFontStatus(`${names.length} fuentes del dispositivo disponibles.`); }
    } catch {
      setFontStatus("No se dio permiso para leer las fuentes del dispositivo.");
    }
  };

  const addImage = (file?: File) => {
    if (!file) return;
    const r = new FileReader();
    r.onload = () => {
      focus();
      document.execCommand("insertHTML", false, `<img src="${r.result}" alt="Imagen" draggable="true" style="display:block;max-width:90%;height:auto;margin:12px auto;border-radius:14px;box-shadow:0 4px 14px rgba(47,43,41,.10);" />`);
      rememberSelection();
      saveBox(active);
    };
    r.readAsDataURL(file);
  };

  const copyBox = () => setCopiedHtml(refs.current[active]?.innerHTML ?? "");
  const cutBox = () => { const el=refs.current[active]; if(!el)return; setCopiedHtml(el.innerHTML); el.innerHTML=""; saveBox(active); };
  const pasteBox = () => { const el=refs.current[active]; if(!el||!copiedHtml)return; el.insertAdjacentHTML("beforeend", copiedHtml); saveBox(active); };
  const clearBox = () => { const el=refs.current[active]; if(!el)return; el.innerHTML=""; saveBox(active); };
  const restoreDrawing = (data?: string) => {
    const canvas=canvasRefs.current[active], ctx=canvas?.getContext("2d");
    if(!canvas||!ctx)return;
    ctx.clearRect(0,0,canvas.width,canvas.height);
    if(!data){ localStorage.removeItem(drawKey(active)); return; }
    const img=new Image();
    img.onload=()=>ctx.drawImage(img,0,0,canvas.width,canvas.height);
    img.src=data;
    localStorage.setItem(drawKey(active),data);
  };
  const undoDraw = () => { const h=drawHistory.current[active]; if(!h.length)return; const current=h.pop(); if(current)drawFuture.current[active].push(current); restoreDrawing(h[h.length-1]); };
  const redoDraw = () => { const f=drawFuture.current[active], next=f.pop(); if(!next)return; drawHistory.current[active].push(next); restoreDrawing(next); };
  const clearDrawing = () => {
    const canvas=canvasRefs.current[active], ctx=canvas?.getContext("2d");
    if(canvas&&ctx){
      ctx.clearRect(0,0,canvas.width,canvas.height);
      localStorage.removeItem(drawKey(active));
      drawHistory.current[active]=[];
      drawFuture.current[active]=[];
    }
  };

  const prepareDrawingForOcr = (source: HTMLCanvasElement) => {
    const sourceCtx = source.getContext("2d");
    if (!sourceCtx) return null;
    const pixels = sourceCtx.getImageData(0, 0, source.width, source.height);
    let minX=source.width, minY=source.height, maxX=-1, maxY=-1;
    for (let y=0; y<source.height; y++) {
      for (let x=0; x<source.width; x++) {
        const a = pixels.data[(y*source.width+x)*4+3];
        if (a > 20) { minX=Math.min(minX,x); maxX=Math.max(maxX,x); minY=Math.min(minY,y); maxY=Math.max(maxY,y); }
      }
    }
    if (maxX < minX || maxY < minY) return null;
    const margin = 35;
    minX=Math.max(0,minX-margin); minY=Math.max(0,minY-margin);
    maxX=Math.min(source.width-1,maxX+margin); maxY=Math.min(source.height-1,maxY+margin);
    const w=maxX-minX+1, h=maxY-minY+1;
    const crop=document.createElement("canvas");
    crop.width=w; crop.height=h;
    const cctx=crop.getContext("2d");
    if(!cctx)return null;
    cctx.fillStyle="#ffffff"; cctx.fillRect(0,0,w,h);
    cctx.drawImage(source,minX,minY,w,h,0,0,w,h);
    const img=cctx.getImageData(0,0,w,h);
    for(let i=0;i<img.data.length;i+=4){
      const brightness=(img.data[i]+img.data[i+1]+img.data[i+2])/3;
      const ink=brightness<245;
      img.data[i]=ink?0:255; img.data[i+1]=ink?0:255; img.data[i+2]=ink?0:255; img.data[i+3]=255;
    }
    cctx.putImageData(img,0,0);
    const scale=3;
    const out=document.createElement("canvas");
    out.width=w*scale; out.height=h*scale;
    const octx=out.getContext("2d");
    if(!octx)return null;
    octx.fillStyle="#ffffff"; octx.fillRect(0,0,out.width,out.height);
    octx.imageSmoothingEnabled=false;
    octx.drawImage(crop,0,0,out.width,out.height);
    return out;
  };

  const handwritingToText = async () => {
    const canvas = canvasRefs.current[active];
    if (!canvas) return;
    const prepared = prepareDrawingForOcr(canvas);
    if (!prepared) {
      setOcrStatus("Primero escribí algo a mano dentro de la caja.");
      return;
    }
    setRecognizing(true);
    setOcrStatus("Reconociendo tu escritura… La primera vez puede tardar unos segundos.");
    try {
      const { createWorker, PSM } = await import("tesseract.js");
      const worker = await createWorker("spa");
      await worker.setParameters({ tessedit_pageseg_mode: PSM.SINGLE_BLOCK });
      const result = await worker.recognize(prepared.toDataURL("image/png"));
      await worker.terminate();
      const text = result.data.text.replace(/\s+/g," ").trim();
      if (!text) {
        setOcrStatus("No pude reconocer esa escritura. Probá con letras un poco más separadas y claras.");
        return;
      }
      const el = refs.current[active];
      if (el) {
        const before = el.innerText.trim();
        el.append(document.createTextNode(`${before ? " " : ""}${text}`));
        saveBox(active);
      }
      clearDrawing();
      setPanel(null);
      setEraser(false);
      setOcrStatus(`Convertido a texto: “${text}”`);
    } catch (error) {
      console.error(error);
      setOcrStatus("No se pudo convertir ahora. Revisá la conexión y volvé a intentar.");
    } finally {
      setRecognizing(false);
    }
  };

  const visibleStickers = stickerSearch.trim()
    ? Object.values(STICKERS).flat().filter((s,i,a)=>a.indexOf(s)===i)
    : STICKERS[stickerGroup];

  return <PageShell title="Notas" subtitle="Tocá una hoja y empezá. Las herramientas aparecen cuando las necesitás.">
    <div className="sticky top-0 z-30 -mx-4 mb-4 border-y border-border bg-background/95 px-4 py-2 backdrop-blur">
      <div className="flex items-center justify-between gap-2">
        <div className="flex gap-1.5">
          <IconTool title="Negrita" onClick={()=>command("bold")}><Bold/></IconTool>
          <IconTool title="Cursiva" onClick={()=>command("italic")}><Italic/></IconTool>
          <IconTool title="Subrayar" onClick={()=>command("underline")}><Underline/></IconTool>
        </div>
        <div className="flex gap-1.5">
          <IconTool title="Fuente y tamaño" active={panel==="fonts"} onClick={()=>setPanel(panel==="fonts"?null:"fonts")}><CaseSensitive/></IconTool>
          <IconTool title="Imagen" onClick={()=>fileRef.current?.click()}><ImagePlus/></IconTool>
          <IconTool title="Stickers" active={panel==="stickers"} onClick={()=>setPanel(panel==="stickers"?null:"stickers")}><SmilePlus/></IconTool>
          <IconTool title="Color y resaltador" active={panel==="colors"} onClick={()=>setPanel(panel==="colors"?null:"colors")}><Palette/></IconTool>
          <IconTool title="Escribir a mano" active={panel==="pen"} onClick={()=>setPanel(panel==="pen"?null:"pen")}><Pencil/></IconTool>
          <IconTool title="Más" active={panel==="more"} onClick={()=>setPanel(panel==="more"?null:"more")}><MoreHorizontal/></IconTool>
        </div>
      </div>

      {panel==="fonts" && <div className="mt-2 rounded-2xl border bg-card p-3 shadow-sm">
        <div className="mb-3 flex items-center gap-2">
          <select className="h-11 min-w-0 flex-1 rounded-xl border bg-background px-3 text-base" onMouseDown={rememberSelection} onChange={e=>applyFont(e.target.value)} defaultValue=""><option value="" disabled>Elegir fuente</option>{fonts.map(f=><option key={f} value={f} style={{fontFamily:f}}>{f}</option>)}</select>
          <select className="h-11 w-24 rounded-xl border bg-background px-2 text-base" value={fontSize} onMouseDown={rememberSelection} onChange={e=>applySize(Number(e.target.value))}>{FONT_SIZES.map(s=><option key={s} value={s}>{s} px</option>)}</select>
        </div>
        <button type="button" className="w-full rounded-xl border px-3 py-2 text-sm font-semibold" onMouseDown={e=>{e.preventDefault();rememberSelection();}} onClick={loadDeviceFonts}>Ver fuentes instaladas en este dispositivo</button>
        {fontStatus && <p className="mt-2 text-xs text-muted-foreground">{fontStatus}</p>}
      </div>}

      {panel==="stickers" && <div className="mt-2 rounded-2xl border bg-card p-3 shadow-sm">
        <div className="mb-2 flex gap-2 overflow-x-auto pb-1">{(Object.keys(STICKERS) as StickerGroup[]).map(g=><button key={g} className={`shrink-0 rounded-full border px-3 py-1.5 text-sm font-semibold ${stickerGroup===g?"bg-[#F3DDD6] border-[#D9A596]":"bg-background"}`} onClick={()=>{setStickerGroup(g);setStickerSearch("");}}>{g}</button>)}</div>
        <label className="mb-2 flex h-10 items-center gap-2 rounded-xl border bg-background px-3"><Search className="h-4 w-4 text-muted-foreground"/><input className="min-w-0 flex-1 bg-transparent text-sm outline-none" placeholder="Buscar stickers" value={stickerSearch} onChange={e=>setStickerSearch(e.target.value)}/></label>
        <div className="max-h-48 overflow-y-auto"><div className="grid grid-cols-8 gap-2 sm:grid-cols-12">{visibleStickers.map((s,i)=><button key={`${s}-${i}`} className="grid h-10 w-10 place-items-center rounded-xl text-xl hover:bg-muted" onMouseDown={e=>{e.preventDefault();rememberSelection();}} onClick={()=>insertSticker(s)}>{s}</button>)}</div></div>
      </div>}

      {panel==="colors" && <div className="mt-2 rounded-2xl border bg-card p-3 shadow-sm">
        <div className="mb-3 flex items-center gap-2"><Palette className="h-4 w-4"/><span className="text-sm font-bold">Color del texto</span></div>
        <div className="flex flex-wrap gap-2">{TEXT_COLORS.map(c=><button key={c} title={c} className="h-9 w-9 rounded-full border-2 border-white shadow ring-1 ring-border" style={{backgroundColor:c}} onMouseDown={e=>{e.preventDefault();rememberSelection();}} onClick={()=>command("foreColor",c)}/>)}
          <label className="relative flex h-10 min-w-36 cursor-pointer items-center gap-2 rounded-xl border bg-background px-2 pr-3 text-xs font-semibold shadow-sm"><span className="h-7 w-7 shrink-0 rounded-lg border border-white shadow ring-1 ring-border" style={{background:"conic-gradient(#ef4444,#f59e0b,#eab308,#22c55e,#06b6d4,#3b82f6,#8b5cf6,#ec4899,#ef4444)"}}/><span>Todos los colores</span><input type="color" value={customTextColor} onMouseDown={rememberSelection} onChange={e=>{setCustomTextColor(e.target.value);command("foreColor",e.target.value);}} className="absolute inset-0 h-full w-full cursor-pointer opacity-0"/></label>
        </div>
        <div className="my-3 border-t"/>
        <div className="mb-3 flex items-center gap-2"><Highlighter className="h-4 w-4"/><span className="text-sm font-bold">Resaltador</span></div>
        <div className="flex flex-wrap gap-2">{HIGHLIGHT_COLORS.map(c=><button key={c} className="h-9 w-9 rounded-xl border shadow-sm" style={{backgroundColor:c}} onMouseDown={e=>{e.preventDefault();rememberSelection();}} onClick={()=>command("backColor",c)}/>)}
          <label className="relative flex h-10 min-w-36 cursor-pointer items-center gap-2 rounded-xl border bg-background px-2 pr-3 text-xs font-semibold shadow-sm"><span className="h-7 w-7 shrink-0 rounded-lg border border-white shadow ring-1 ring-border" style={{background:"linear-gradient(135deg,#fff59d,#f8bbd0,#e1bee7,#b3e5fc,#b2dfdb,#c8e6c9)"}}/><span>Otro resaltado</span><input type="color" value={customHighlightColor} onMouseDown={rememberSelection} onChange={e=>{setCustomHighlightColor(e.target.value);command("backColor",e.target.value);}} className="absolute inset-0 h-full w-full cursor-pointer opacity-0"/></label>
        </div>
        <div className="mt-3 flex flex-wrap gap-2"><button className="h-9 rounded-xl border px-3 text-sm" onMouseDown={e=>{e.preventDefault();rememberSelection();}} onClick={()=>command("foreColor","#2F2B29")}>Texto normal</button><button className="h-9 rounded-xl border px-3 text-sm" onMouseDown={e=>{e.preventDefault();rememberSelection();}} onClick={()=>command("backColor","transparent")}>Quitar resaltado</button><button className="h-9 rounded-xl border px-3 text-sm" onMouseDown={e=>{e.preventDefault();rememberSelection();}} onClick={()=>command("removeFormat")}>Quitar formato</button></div>
      </div>}

      {panel==="pen" && <div className="mt-2 rounded-2xl border bg-card p-3 shadow-sm">
        <div className="flex flex-wrap gap-2">
          <TextTool onClick={()=>setEraser(false)}><Pencil/>Manuscrito</TextTool>
          <TextTool onClick={()=>setEraser(true)}><Eraser/>Goma</TextTool>
          <TextTool onClick={undoDraw}><Undo2/></TextTool>
          <TextTool onClick={redoDraw}><Redo2/></TextTool>
          <select className="h-10 rounded-xl border bg-background px-3 text-sm" value={penWidth} onChange={e=>setPenWidth(Number(e.target.value))}><option value={2}>Fino</option><option value={3}>Medio</option><option value={5}>Grueso</option><option value={8}>Muy grueso</option></select>
          <input type="color" value={penColor} onChange={e=>setPenColor(e.target.value)} className="h-10 w-12 rounded-xl border bg-card p-1" aria-label="Color del lápiz"/>
          <TextTool onClick={clearDrawing}>Borrar dibujo</TextTool>
        </div>
        <button type="button" disabled={recognizing} onClick={handwritingToText} className="mt-2 h-11 w-full rounded-xl border border-[#D9A596] bg-[#F9E8E2] text-sm font-semibold disabled:opacity-60">{recognizing ? "Reconociendo escritura…" : "Convertir lo escrito a texto"}</button>
        <p className="mt-2 text-xs text-muted-foreground">Ahora este botón analiza el dibujo de la caja y lo transforma en texto editable. La primera conversión descarga el reconocedor gratuito de español.</p>
      </div>}

      {panel==="more" && <div className="mt-2 flex flex-wrap gap-2 rounded-2xl border bg-card p-2 shadow-sm"><TextTool onClick={cutBox}><Scissors/>Cortar caja</TextTool><TextTool onClick={copyBox}><Copy/>Copiar caja</TextTool><TextTool onClick={pasteBox}>Pegar</TextTool><TextTool danger onClick={clearBox}><Trash2/>Vaciar</TextTool></div>}
      <div className="mt-1 text-xs text-muted-foreground">Editando: <b>{BOXES.find(b=>b.id===active)?.title}</b></div>
      {ocrStatus && <div className="mt-2 rounded-xl bg-[#F8EDE8] px-3 py-2 text-xs text-foreground">{ocrStatus}</div>}
    </div>

    <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e=>addImage(e.target.files?.[0])}/>
    <div className="space-y-4">{BOXES.map(box=><section key={box.id} onPointerDown={()=>setActive(box.id)} className={`overflow-hidden rounded-[1.4rem] border bg-card shadow-sm ${active===box.id?"ring-2 ring-[#D9A596]/35 border-[#D9A596]":"border-border"}`}><div className={`${box.tone} border-b border-border px-4 py-2 text-xs font-extrabold tracking-wide text-foreground`}>{box.title}</div><div className="relative min-h-36"><div ref={el=>{refs.current[box.id]=el;}} contentEditable={panel!=="pen" || active!==box.id} suppressContentEditableWarning onFocus={()=>setActive(box.id)} onInput={()=>{rememberSelection();saveBox(box.id);}} onKeyUp={rememberSelection} onMouseUp={rememberSelection} className="relative z-10 min-h-36 px-4 py-4 text-base leading-7 outline-none empty:before:text-muted-foreground empty:before:content-[attr(data-placeholder)]" data-placeholder={box.placeholder}/><canvas ref={el=>{canvasRefs.current[box.id]=el;}} width={1200} height={500} className={`absolute inset-0 h-full w-full touch-none ${panel==="pen"&&active===box.id?"z-20 cursor-crosshair":"pointer-events-none z-0"}`}/></div></section>)}</div>
  </PageShell>;
}

function IconTool({children,title,onClick,active=false}:{children:React.ReactNode;title:string;onClick:()=>void;active?:boolean}) {
  return <button type="button" title={title} aria-label={title} onMouseDown={e=>e.preventDefault()} onClick={onClick} className={`grid h-11 w-11 place-items-center rounded-xl border shadow-sm [&_svg]:h-5 [&_svg]:w-5 ${active?"bg-[#F3DDD6] border-[#D9A596]":"bg-card border-border"}`}>{children}</button>;
}
function TextTool({children,onClick,danger=false}:{children:React.ReactNode;onClick:()=>void;danger?:boolean}) {
  return <button type="button" onClick={onClick} className={`flex h-10 items-center gap-1.5 rounded-xl border bg-card px-3 text-sm [&_svg]:h-4 [&_svg]:w-4 ${danger?"text-destructive":""}`}>{children}</button>;
}
