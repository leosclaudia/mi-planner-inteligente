import { useEffect, useMemo, useRef, useState } from "react";
import { AlignCenter, AlignLeft, AlignRight, Bold, BookOpen, CalendarDays, ChevronLeft, Eraser, FilePlus2, Grid3X3, Highlighter, ImagePlus, Italic, List, MoreHorizontal, PanelRightClose, PanelRightOpen, Pencil, Rows3, Redo2, Trash2, Type, Underline, Undo2, X } from "lucide-react";

type PaperType = "liso" | "rayado" | "cuadricula" | "punteado";

type Sheet = {
  id: string;
  title: string;
  date: string;
  paper: PaperType;
  html: string;
  ink: string;
  updatedAt: number;
};

const KEY = "planner-cuaderno-hojas-v1";

const today = () => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

const formatDate = (value: string) => {
  if (!value) return "";
  const [y, m, d] = value.split("-");
  return `${d}/${m}/${y}`;
};

const paperStyle = (paper: PaperType): React.CSSProperties => {
  if (paper === "rayado") {
    return {
      backgroundColor: "#fffdf9",
      backgroundImage: "repeating-linear-gradient(to bottom, transparent 0, transparent 31px, rgba(124,145,166,.22) 32px)",
      backgroundSize: "100% 32px",
    };
  }
  if (paper === "cuadricula") {
    return {
      backgroundColor: "#fffdf9",
      backgroundImage:
        "linear-gradient(rgba(124,145,166,.16) 1px, transparent 1px), linear-gradient(90deg, rgba(124,145,166,.16) 1px, transparent 1px)",
      backgroundSize: "24px 24px",
    };
  }
  if (paper === "punteado") {
    return {
      backgroundColor: "#fffdf9",
      backgroundImage: "radial-gradient(circle, rgba(105,117,128,.34) 1.1px, transparent 1.2px)",
      backgroundSize: "22px 22px",
    };
  }
  return { backgroundColor: "#fffdf9" };
};

export function Cuaderno() {
  const [sheets, setSheets] = useState<Sheet[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);
  const [tool, setTool] = useState<"texto" | "lapiz" | "goma">("texto");
  const [inkColor, setInkColor] = useState("#65475F");
  const [inkWidth, setInkWidth] = useState(4);
  const [toolPanelOpen, setToolPanelOpen] = useState(false);
  const [toolOptions, setToolOptions] = useState<null | "text" | "paper" | "pencil" | "eraser">(null);
  const [textMenu, setTextMenu] = useState<null | "font" | "size" | "align" | "color" | "highlight" | "more">(null);
  const [textFont, setTextFont] = useState("Arial");
  const [textPx, setTextPx] = useState("8px");
  const [textAlign, setTextAlign] = useState<"left" | "center" | "right" | "justify">("left");
  const [inkRecognizing, setInkRecognizing] = useState(false);
  const editorRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawing = useRef(false);
  const last = useRef<{ x: number; y: number } | null>(null);
  const savedRange = useRef<Range | null>(null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const imageActionRef = useRef<{
    wrap: HTMLElement; mode: "move"|"resize"; corner?: "nw"|"ne"|"sw"|"se";
    x:number; y:number; left:number; top:number; width:number; height:number;
  }|null>(null);
  const undoHtmlRef = useRef<string[]>([]);
  const redoHtmlRef = useRef<string[]>([]);
  const DEFAULT_FONT = "Arial";
  const DEFAULT_SIZE = "8px";

  const pushHtmlHistory = () => {
    const root=editorRef.current;
    if(!root) return;
    const html=root.innerHTML;
    if(undoHtmlRef.current[undoHtmlRef.current.length-1]!==html){
      undoHtmlRef.current.push(html);
      if(undoHtmlRef.current.length>80) undoHtmlRef.current.shift();
    }
    redoHtmlRef.current=[];
  };

  const undoHtml = () => {
    const root=editorRef.current;
    if(!root || undoHtmlRef.current.length===0) return;
    const now=root.innerHTML;
    const prev=undoHtmlRef.current.pop()!;
    redoHtmlRef.current.push(now);
    root.innerHTML=prev;
    patch({html:prev});
    setTextMenu(null);setToolOptions(null);
  };

  const redoHtml = () => {
    const root=editorRef.current;
    if(!root || redoHtmlRef.current.length===0) return;
    const now=root.innerHTML;
    const next=redoHtmlRef.current.pop()!;
    undoHtmlRef.current.push(now);
    root.innerHTML=next;
    patch({html:next});
    setTextMenu(null);setToolOptions(null);
  };

  const syncFormatFromSelection = () => {
    const sel=window.getSelection();
    if(!sel || !sel.rangeCount || sel.isCollapsed || !editorRef.current){
      setTextFont(DEFAULT_FONT);setTextPx(DEFAULT_SIZE);return;
    }
    const r=sel.getRangeAt(0);
    if(!editorRef.current.contains(r.commonAncestorContainer)){
      setTextFont(DEFAULT_FONT);setTextPx(DEFAULT_SIZE);return;
    }
    const node=r.startContainer.nodeType===Node.ELEMENT_NODE ? r.startContainer as HTMLElement : r.startContainer.parentElement;
    if(!node)return;
    const cs=getComputedStyle(node);
    setTextFont(cs.fontFamily.split(",")[0].replace(/["']/g,"").trim()||DEFAULT_FONT);
    setTextPx(`${Math.round(parseFloat(cs.fontSize)||8)}px`);
  };

  const rememberSelection = () => {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0 || !editorRef.current) return;
    const range = sel.getRangeAt(0);
    if (editorRef.current.contains(range.commonAncestorContainer)) {
      savedRange.current = range.cloneRange();
    }
  };

  const restoreSelection = () => {
    const sel = window.getSelection();
    if (!sel || !savedRange.current) return;
    sel.removeAllRanges();
    sel.addRange(savedRange.current);
  };

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      if (Array.isArray(parsed)) setSheets(parsed);
    } catch {
      setSheets([]);
    }
  }, []);

  const persist = (next: Sheet[]) => {
    setSheets(next);
    localStorage.setItem(KEY, JSON.stringify(next));
  };

  const current = useMemo(() => sheets.find(s => s.id === openId) ?? null, [sheets, openId]);

  const createSheet = () => {
    const sheet: Sheet = {
      id: `hoja-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      title: "Nueva hoja",
      date: today(),
      paper: "liso",
      html: "",
      ink: "",
      updatedAt: Date.now(),
    };
    persist([sheet, ...sheets]);
    setOpenId(sheet.id);
    setTool("texto"); setToolOptions(null);
  };

  const patch = (changes: Partial<Sheet>) => {
    if (!openId) return;
    const next = sheets.map(s => s.id === openId ? { ...s, ...changes, updatedAt: Date.now() } : s);
    persist(next);
  };

  const removeSheet = (id: string) => {
    if (!confirm("¿Eliminar esta hoja del Cuaderno?")) return;
    persist(sheets.filter(s => s.id !== id));
    if (openId === id) setOpenId(null);
  };

  const resizeCanvas = () => {
    const canvas = canvasRef.current;
    const host = canvas?.parentElement;
    if (!canvas || !host) return;
    const ratio = Math.max(1, window.devicePixelRatio || 1);
    const w = Math.max(1, host.clientWidth);
    const h = Math.max(700, host.clientHeight);
    const old = document.createElement("canvas");
    old.width = canvas.width;
    old.height = canvas.height;
    old.getContext("2d")?.drawImage(canvas, 0, 0);
    canvas.width = Math.floor(w * ratio);
    canvas.height = Math.floor(h * ratio);
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    if (old.width && old.height) ctx.drawImage(old, 0, 0, old.width, old.height, 0, 0, w, h);
  };

  useEffect(() => {
    if (!current) return;
    const t = setTimeout(() => {
      if (editorRef.current) editorRef.current.innerHTML = current.html || "";
      resizeCanvas();
      const canvas = canvasRef.current;
      if (canvas && current.ink) {
        const img = new Image();
        img.onload = () => {
          const ctx = canvas.getContext("2d");
          if (!ctx) return;
          const ratio = Math.max(1, window.devicePixelRatio || 1);
          ctx.save();
          ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
          ctx.drawImage(img, 0, 0, canvas.clientWidth, canvas.clientHeight);
          ctx.restore();
        };
        img.src = current.ink;
      }
    }, 0);
    window.addEventListener("resize", resizeCanvas);
    return () => {
      clearTimeout(t);
      window.removeEventListener("resize", resizeCanvas);
    };
  }, [openId]);

  const saveInk = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    patch({ ink: canvas.toDataURL("image/png") });
  };

  const point = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  const startInk = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (tool === "texto") return;
    drawing.current = true;
    last.current = point(e);
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };

  const moveInk = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current || tool === "texto" || !last.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const p = point(e);
    const ratio = Math.max(1, window.devicePixelRatio || 1);
    ctx.save();
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = tool === "goma" ? Math.max(18, inkWidth * 4) : inkWidth;
    ctx.strokeStyle = inkColor;
    ctx.globalCompositeOperation = tool === "goma" ? "destination-out" : "source-over";
    ctx.beginPath();
    ctx.moveTo(last.current.x, last.current.y);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    ctx.restore();
    last.current = p;
  };

  const endInk = () => {
    if (!drawing.current) return;
    drawing.current = false;
    last.current = null;
    saveInk();
  };

  const prepareInkOcr = (source: HTMLCanvasElement) => {
    const ctx = source.getContext("2d");
    if (!ctx) return null;
    const im = ctx.getImageData(0, 0, source.width, source.height);
    let minX=source.width,minY=source.height,maxX=-1,maxY=-1;
    for(let y=0;y<source.height;y++) for(let x=0;x<source.width;x++){
      if(im.data[(y*source.width+x)*4+3]>20){
        minX=Math.min(minX,x); maxX=Math.max(maxX,x);
        minY=Math.min(minY,y); maxY=Math.max(maxY,y);
      }
    }
    if(maxX<0) return null;
    const m=30;
    minX=Math.max(0,minX-m); minY=Math.max(0,minY-m);
    maxX=Math.min(source.width-1,maxX+m); maxY=Math.min(source.height-1,maxY+m);
    const w=maxX-minX+1,h=maxY-minY+1;
    const out=document.createElement("canvas");
    out.width=w; out.height=h;
    const ox=out.getContext("2d")!;
    ox.fillStyle="#fff"; ox.fillRect(0,0,w,h);
    ox.drawImage(source,minX,minY,w,h,0,0,w,h);
    return out;
  };

  const convertInkToText = async () => {
    const canvas=canvasRef.current;
    const editor=editorRef.current;
    if(!canvas || !editor) return;
    const prepared=prepareInkOcr(canvas);
    if(!prepared){ alert("Primero escribí algo con el lápiz."); return; }
    setInkRecognizing(true);
    try{
      const mod=await import(/* @vite-ignore */ "https://cdn.jsdelivr.net/npm/tesseract.js@6/+esm");
      const worker=await mod.createWorker("spa");
      const res=await worker.recognize(prepared.toDataURL("image/png"));
      await worker.terminate();
      const txt=String(res?.data?.text||"").replace(/\s+/g," ").trim();
      if(!txt){ alert("No pude reconocer la escritura. Probá con letras un poco más separadas."); return; }
      editor.focus({preventScroll:true});
      const spacer=editor.innerText.trim() ? " " : "";
      editor.append(document.createTextNode(spacer+txt));
      patch({html:editor.innerHTML, ink:""});
      const ctx=canvas.getContext("2d");
      ctx?.clearRect(0,0,canvas.width,canvas.height);
      setTool("texto");
      setToolOptions("text");
    }catch(err){
      console.warn(err);
      alert("No se pudo convertir ahora. Revisá la conexión e intentá nuevamente.");
    }finally{
      setInkRecognizing(false);
    }
  };

  const saveText = () => {
    if (editorRef.current) patch({ html: editorRef.current.innerHTML });
  };

  const formatText = (command: string, value?: string) => {
    pushHtmlHistory();
    setTool("texto");
    editorRef.current?.focus();
    restoreSelection();
    document.execCommand(command, false, value);
    rememberSelection();
    saveText();
  };

  const setTextSize = (px: string) => {
    pushHtmlHistory();
    setTool("texto");
    editorRef.current?.focus();
    restoreSelection();
    document.execCommand("fontSize", false, "7");
    editorRef.current?.querySelectorAll('font[size="7"]').forEach(node => {
      const el = node as HTMLElement;
      el.removeAttribute("size");
      el.style.fontSize = px;
    });
    rememberSelection();
    saveText();
  };

  const imageHandle=()=>`<span data-img-handle="se" style="position:absolute;width:18px;height:18px;border:2px solid #fff;background:#e8a58d;border-radius:50%;z-index:6;right:-9px;bottom:-9px;box-shadow:0 1px 4px rgba(0,0,0,.18)"></span>`;
  const freeImageHtml=(src:string)=>`<span class="cuaderno-free-image" contenteditable="false" data-selected="true" style="position:absolute;left:24px;top:70px;width:240px;max-width:calc(100% - 48px);display:block;z-index:4;touch-action:none;user-select:none;border:1.5px solid #e8a58d;border-radius:13px;"><img src="${src}" alt="" draggable="false" style="display:block;width:100%;height:auto;border-radius:12px;pointer-events:none;"/><button type="button" data-img-delete="true" style="position:absolute;top:-12px;right:-12px;width:24px;height:24px;border-radius:999px;border:1px solid #ead7d1;background:#fff;color:#d66f62;display:flex;align-items:center;justify-content:center;z-index:8;box-shadow:0 2px 8px rgba(0,0,0,.16);cursor:pointer">🗑</button>${imageHandle()}</span>`;

  const deselectImages=(except?:HTMLElement)=>{
    editorRef.current?.querySelectorAll<HTMLElement>(".cuaderno-free-image").forEach(w=>{
      const on=w===except;
      w.dataset.selected=on?"true":"false";
      const del=w.querySelector<HTMLElement>("[data-img-delete]"); if(del) del.style.display=on?"flex":"none";
      w.querySelectorAll<HTMLElement>("[data-img-handle]").forEach(h=>h.style.display=on?"block":"none");
    });
  };

  const insertImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file=e.target.files?.[0]; e.target.value="";
    if(!file) return;
    const reader=new FileReader();
    reader.onload=()=>{
      const root=editorRef.current; if(!root) return;
      pushHtmlHistory();
      root.insertAdjacentHTML("beforeend",freeImageHtml(String(reader.result||"")));
      const all=root.querySelectorAll<HTMLElement>(".cuaderno-free-image");
      const wrap=all[all.length-1]; if(wrap)deselectImages(wrap);
      saveText(); setTextMenu(null); setToolOptions(null);
    };
    reader.readAsDataURL(file);
  };

  const onEditorPointerDown=(e:React.PointerEvent<HTMLDivElement>)=>{
    const target=e.target as HTMLElement;
    const wrap=target.closest<HTMLElement>(".cuaderno-free-image");
    if(!wrap){deselectImages();return;}
    e.preventDefault();e.stopPropagation();deselectImages(wrap);
    pushHtmlHistory();
    if(target.closest("[data-img-delete]")){wrap.remove();saveText();return;}
    const handle=target.closest<HTMLElement>("[data-img-handle]");
    const rr=e.currentTarget.getBoundingClientRect(), wr=wrap.getBoundingClientRect();
    imageActionRef.current={wrap,mode:handle?"resize":"move",corner:handle?.dataset.imgHandle as any,x:e.clientX,y:e.clientY,left:wr.left-rr.left,top:wr.top-rr.top,width:wr.width,height:wr.height};
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };
  const onEditorPointerMove=(e:React.PointerEvent<HTMLDivElement>)=>{
    const a=imageActionRef.current;if(!a||!editorRef.current)return;
    e.preventDefault();
    const dx=e.clientX-a.x,dy=e.clientY-a.y,rootW=editorRef.current.clientWidth;
    if(a.mode==="move"){
      a.wrap.style.left=`${Math.max(0,Math.min(a.left+dx,rootW-a.width))}px`;
      a.wrap.style.top=`${Math.max(0,a.top+dy)}px`;
    }else{
      const east=a.corner?.includes("e"), min=70;
      const width=Math.max(min,Math.min(a.width+(east?dx:-dx),rootW-8));
      a.wrap.style.width=`${width}px`;
      if(!east)a.wrap.style.left=`${Math.max(0,a.left+a.width-width)}px`;
    }
  };
  const onEditorPointerUp=()=>{if(imageActionRef.current){imageActionRef.current=null;saveText();}};

  const wrapSelection = (style:string) => {
    pushHtmlHistory();
    setTool("texto"); editorRef.current?.focus(); restoreSelection();
    const sel=window.getSelection(); if(!sel||!sel.rangeCount) return;
    const r=sel.getRangeAt(0); if(!editorRef.current?.contains(r.commonAncestorContainer)) return;
    const span=document.createElement("span"); span.setAttribute("style",style);
    try { r.surroundContents(span); } catch { const f=r.extractContents(); span.appendChild(f); r.insertNode(span); }
    saveText(); rememberSelection();
  };

  const insertSticker=(sticker:string)=>{
    pushHtmlHistory();
    setTool("texto"); editorRef.current?.focus(); restoreSelection();
    document.execCommand("insertHTML",false,`<span style="font-size:28px">${sticker}</span>`);
    saveText(); setTextMenu(null); setToolOptions(null);
  };

  const STICKERS=["⭐","❤️","✨","🌸","🌷","🌼","🌻","🌿","🍃","🦋","🐝","🌈","☀️","🌙","☁️","📌","📎","✏️","🖊️","📝","📚","💡","✅","❗","🎯","⏰","📅","💻","📞","💬","😊","🥰","😍","😂","😉","😎","🤗","🥳","👏","🙌","💪","🙏","💕","🎀","☕","🍓","🍒","🍋","🍉","🥐","🍰","🍫","🍪","🧁","✈️","🚗","🚲","🧳","🗺️","📍"];

  return (
    <section className="rounded-[1.4rem] border border-border bg-card/70 p-3 shadow-sm">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-2 text-lg font-bold"><BookOpen className="h-5 w-5"/>Cuaderno</div>
          <p className="text-xs text-muted-foreground">Hojas completas para apuntes, dibujos e ideas. Podés crear varias el mismo día.</p>
        </div>
        <button type="button" onClick={createSheet} className="inline-flex items-center gap-2 rounded-full border bg-[#F7E5DF] px-4 py-2 text-sm font-semibold shadow-sm">
          <FilePlus2 className="h-4 w-4"/>Nueva hoja libre
        </button>
      </div>

      {sheets.length === 0 ? (
        <button type="button" onClick={createSheet} className="grid min-h-[150px] w-full place-items-center rounded-2xl border border-dashed bg-background/70 p-6 text-center">
          <span><FilePlus2 className="mx-auto mb-2 h-7 w-7"/><b>Crear mi primera hoja</b><br/><small className="text-muted-foreground">Se guardará automáticamente en Cuaderno.</small></span>
        </button>
      ) : (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
          {sheets.map(sheet => (
            <article key={sheet.id} className="overflow-hidden rounded-2xl border bg-background shadow-sm">
              <button type="button" onClick={() => setOpenId(sheet.id)} className="block w-full text-left">
                <div className="relative h-28 overflow-hidden border-b p-3" style={paperStyle(sheet.paper)}>
                  <div className="pointer-events-none line-clamp-3 text-sm" dangerouslySetInnerHTML={{ __html: sheet.html || "<span style='color:#999'>Hoja en blanco</span>" }}/>
                  {sheet.ink && <img src={sheet.ink} alt="" className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-70"/>}
                </div>
                <div className="p-3">
                  <div className="truncate text-sm font-bold">{sheet.title || "Sin título"}</div>
                  <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground"><CalendarDays className="h-3.5 w-3.5"/>{formatDate(sheet.date)}</div>
                </div>
              </button>
              <div className="flex justify-end border-t px-2 py-1">
                <button type="button" onClick={() => removeSheet(sheet.id)} className="rounded-full p-2 text-destructive" title="Eliminar hoja"><Trash2 className="h-4 w-4"/></button>
              </div>
            </article>
          ))}
        </div>
      )}

      {current && (
        <div className="fixed inset-0 z-[120] flex flex-col bg-[#f5f0ea]">
          <header className="border-b bg-background/95 px-2 py-2 shadow-sm sm:px-3">
            <div className="mx-auto flex max-w-[1180px] flex-wrap items-center gap-2">
              <button type="button" onClick={() => { saveInk(); setOpenId(null); }} className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-border bg-card shadow-sm transition hover:bg-accent" title="Volver al Cuaderno"><ChevronLeft className="h-5 w-5"/></button>

              <label className="min-w-[180px] flex-1">
                <span className="sr-only">Título de la hoja</span>
                <input
                  value={current.title}
                  onChange={e => patch({ title: e.target.value })}
                  className="h-10 w-full rounded-full border border-border bg-card px-4 text-sm font-semibold shadow-sm outline-none transition focus:border-[#d9b7a8] focus:ring-2 focus:ring-[#f2ddd4]"
                  aria-label="Título de la hoja"
                  placeholder="Título de la hoja"
                />
              </label>

              <label className="relative shrink-0">
                <span className="sr-only">Fecha</span>
                <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"/>
                <input
                  type="date"
                  value={current.date}
                  onChange={e => patch({ date: e.target.value })}
                  className="h-10 rounded-full border border-border bg-card pl-9 pr-3 text-sm shadow-sm outline-none transition focus:border-[#d9b7a8] focus:ring-2 focus:ring-[#f2ddd4]"
                />
              </label>

              <button type="button" onClick={() => setOpenId(null)} className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-border bg-card shadow-sm transition hover:bg-accent" title="Cerrar"><X className="h-5 w-5"/></button>
            </div>

          </header>

          <div className="border-b bg-background/95 px-3 py-1 text-right">
            <span className="text-[10px] text-muted-foreground">Guardado automático</span>
          </div>

          <main className="flex-1 overflow-auto p-2 sm:p-4">
            <div className="relative mx-auto min-h-[calc(100vh-112px)] w-full max-w-[1050px] overflow-hidden rounded-xl border shadow-sm" style={paperStyle(current.paper)}>
              <div className="absolute right-0 top-3 z-40 flex items-start">
                {toolPanelOpen && (
                  <div className="mr-1 w-[230px] max-w-[72vw] rounded-l-[1.4rem] rounded-r-md border border-border bg-card/95 p-2 shadow-xl backdrop-blur-md">
                    <div className="mb-1 flex items-center justify-between px-1">
                      <span className="text-xs font-bold">Herramientas</span>
                      <button type="button" onClick={() => { setToolPanelOpen(false); setToolOptions(null); }} className="grid h-7 w-7 place-items-center rounded-full hover:bg-accent">
                        <PanelRightClose className="h-4 w-4"/>
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5">
                      <button type="button" onClick={() => { setTool("texto"); setToolOptions(toolOptions==="text"?null:"text"); }}
                        className={`inline-flex items-center gap-1.5 rounded-xl border px-2.5 py-2 text-xs font-semibold ${tool==="texto"?"bg-[#f3e4f2]":"bg-background"}`}><Type className="h-4 w-4"/>Texto</button>
                      <button type="button" onClick={() => setToolOptions(toolOptions==="paper"?null:"paper")}
                        className="inline-flex items-center gap-1.5 rounded-xl border bg-background px-2.5 py-2 text-xs font-semibold"><BookOpen className="h-4 w-4"/>Hoja</button>
                      <button type="button" onClick={() => { setTool("lapiz"); setToolOptions(toolOptions==="pencil"?null:"pencil"); }}
                        className={`inline-flex items-center gap-1.5 rounded-xl border px-2.5 py-2 text-xs font-semibold ${tool==="lapiz"?"bg-[#f7e5df]":"bg-background"}`}><Pencil className="h-4 w-4"/>Lápiz</button>
                      <button type="button" onClick={() => { setTool("goma"); setToolOptions(null); }}
                        className={`inline-flex items-center gap-1.5 rounded-xl border px-2.5 py-2 text-xs font-semibold ${tool==="goma"?"bg-[#f7e5df]":"bg-background"}`}><Eraser className="h-4 w-4"/>Goma</button>
                    </div>
                    {toolOptions === "text" && (
                      <div className="mt-2 space-y-2 rounded-xl border bg-background/90 p-2">
                        <div className="grid grid-cols-2 gap-1.5">
                          <div className="relative">
                            <button type="button" onMouseDown={e=>{e.preventDefault();rememberSelection();}} onClick={()=>setTextMenu(textMenu==="font"?null:"font")} className="flex h-8 w-full items-center justify-between rounded-full border bg-card px-2.5 text-[11px] shadow-sm">
                              <span className="truncate" style={{fontFamily:textFont}}>{textFont}</span><span>⌄</span>
                            </button>
                            {textMenu==="font" && <div className="absolute right-0 top-9 z-[70] max-h-52 w-44 overflow-y-auto rounded-2xl border bg-card p-1.5 shadow-xl">
                              {["Arial","Verdana","Tahoma","Trebuchet MS","Georgia","Times New Roman","Courier New","Comic Sans MS","Segoe UI","Calibri","Garamond","Helvetica","Palatino","Lora","Century Gothic","Lucida Sans","Lucida Console","Book Antiqua","Impact","Consolas","Franklin Gothic Medium","Rockwell","Baskerville","Cambria","Candara"].map(font => <button key={font} type="button" onMouseDown={e=>{e.preventDefault();rememberSelection();}} onClick={()=>{setTextFont(font);formatText("fontName",font);setTextMenu(null);setToolOptions(null);}} style={{fontFamily:font}} className="block w-full rounded-xl px-3 py-2 text-left text-xs hover:bg-[#f7ece7]">{font}</button>)}
                            </div>}
                          </div>
                          <div className="relative">
                            <button type="button" onMouseDown={e=>{e.preventDefault();rememberSelection();}} onClick={()=>setTextMenu(textMenu==="size"?null:"size")} className="flex h-8 w-full items-center justify-between rounded-full border bg-card px-2.5 text-[11px] shadow-sm">
                              <span>{textPx.replace("px","")}</span><span>⌄</span>
                            </button>
                            {textMenu==="size" && <div className="absolute right-0 top-9 z-[70] max-h-52 w-24 overflow-y-auto rounded-2xl border bg-card p-1.5 shadow-xl">
                              {[8,10,12,14,16,18,20,22,24,28,30,32,34,36,38,40,42,44,46,48].map(size => <button key={size} type="button" onMouseDown={e=>{e.preventDefault();rememberSelection();}} onClick={(e)=>{const px=`${size}px`;setTextPx(px);setTextSize(px);setTextMenu(null);setToolOptions(null);e.currentTarget.blur();}} className="block w-full rounded-xl px-3 py-2 text-left text-xs hover:bg-[#f7ece7]">{size}</button>)}
                            </div>}
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          <button type="button" onMouseDown={e=>{e.preventDefault();rememberSelection();}} onClick={()=>{formatText("bold");setToolOptions(null);}} className="grid h-8 w-8 place-items-center rounded-full border bg-card" title="Negrita"><Bold className="h-4 w-4"/></button>
                          <button type="button" onMouseDown={e=>{e.preventDefault();rememberSelection();}} onClick={()=>{formatText("italic");setToolOptions(null);}} className="grid h-8 w-8 place-items-center rounded-full border bg-card" title="Cursiva"><Italic className="h-4 w-4"/></button>
                          <button type="button" onMouseDown={e=>{e.preventDefault();rememberSelection();}} onClick={()=>{formatText("underline");setToolOptions(null);}} className="grid h-8 w-8 place-items-center rounded-full border bg-card" title="Subrayado"><Underline className="h-4 w-4"/></button>
                          <div className="relative">
                            <button type="button" onMouseDown={e=>{e.preventDefault();rememberSelection();}} onClick={()=>setTextMenu(textMenu==="align"?null:"align")} className="grid h-8 w-8 place-items-center rounded-full border bg-card" title="Alineación">
                              {textAlign==="left"?<AlignLeft className="h-4 w-4"/>:textAlign==="center"?<AlignCenter className="h-4 w-4"/>:textAlign==="right"?<AlignRight className="h-4 w-4"/>:<span className="text-xs">☰</span>}
                            </button>
                            {textMenu==="align" && <div className="absolute right-0 top-9 z-[70] flex gap-1 rounded-2xl border bg-card p-1.5 shadow-xl">
                              <button type="button" onMouseDown={e=>{e.preventDefault();rememberSelection();}} onClick={()=>{setTextAlign("left");formatText("justifyLeft");setTextMenu(null);setToolOptions(null);}} className="grid h-8 w-8 place-items-center rounded-full hover:bg-[#f7ece7]"><AlignLeft className="h-4 w-4"/></button>
                              <button type="button" onMouseDown={e=>{e.preventDefault();rememberSelection();}} onClick={()=>{setTextAlign("center");formatText("justifyCenter");setTextMenu(null);setToolOptions(null);}} className="grid h-8 w-8 place-items-center rounded-full hover:bg-[#f7ece7]"><AlignCenter className="h-4 w-4"/></button>
                              <button type="button" onMouseDown={e=>{e.preventDefault();rememberSelection();}} onClick={()=>{setTextAlign("right");formatText("justifyRight");setTextMenu(null);setToolOptions(null);}} className="grid h-8 w-8 place-items-center rounded-full hover:bg-[#f7ece7]"><AlignRight className="h-4 w-4"/></button>
                              <button type="button" onMouseDown={e=>{e.preventDefault();rememberSelection();}} onClick={()=>{setTextAlign("justify");formatText("justifyFull");setTextMenu(null);setToolOptions(null);}} className="grid h-8 w-8 place-items-center rounded-full hover:bg-[#f7ece7]" title="Justificado"><span className="text-xs">☰</span></button>
                            </div>}
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="relative">
                            <button type="button" onMouseDown={e=>{e.preventDefault();rememberSelection();}} onClick={()=>setTextMenu(textMenu==="color"?null:"color")}
                              className="grid h-8 w-8 place-items-center rounded-full border bg-card shadow-sm" title="Color de texto">
                              <span className="text-xs font-bold underline decoration-2 underline-offset-2">A</span>
                            </button>
                            {textMenu==="color" && <div className="absolute bottom-10 left-0 z-[70] flex w-44 flex-wrap gap-2 rounded-2xl border bg-card p-2 shadow-xl">
                              {["#2F2926","#9B5C68","#C97962","#D59B54","#6F668F","#5F8294","#7B9B86","#A9789C"].map(c=>
                                <button key={c} type="button" onMouseDown={e=>{e.preventDefault();rememberSelection();}} onClick={()=>{formatText("foreColor",c);setTextMenu(null);setToolOptions(null);}}
                                  className="h-7 w-7 rounded-full border shadow-sm" style={{backgroundColor:c}} aria-label={`Color ${c}`}/>)}
                              <label className="relative h-7 w-7 cursor-pointer rounded-full border shadow-sm" title="Color personalizado" style={{background:"conic-gradient(#f00,#ff0,#0f0,#0ff,#00f,#f0f,#f00)"}}>
                                <input type="color" className="absolute inset-0 h-full w-full cursor-pointer opacity-0" onMouseDown={()=>rememberSelection()} onChange={e=>{formatText("foreColor",e.target.value);setTextMenu(null);}}/>
                              </label>
                            </div>}
                          </div>
                          <div className="relative">
                            <button type="button" onMouseDown={e=>{e.preventDefault();rememberSelection();}} onClick={()=>setTextMenu(textMenu==="highlight"?null:"highlight")}
                              className="grid h-8 w-8 place-items-center rounded-full border bg-card shadow-sm" title="Resaltador">
                              <Highlighter className="h-4 w-4"/>
                            </button>
                            {textMenu==="highlight" && <div className="absolute bottom-10 left-0 z-[70] flex w-48 flex-wrap items-center gap-2 rounded-2xl border bg-card p-2 shadow-xl">
                              <button type="button" onMouseDown={e=>{e.preventDefault();rememberSelection();}} onClick={()=>{formatText("hiliteColor","transparent");setTextMenu(null);setToolOptions(null);}}
                                className="grid h-7 w-7 place-items-center rounded-full border bg-white text-[11px]" title="Sin resaltado">⊘</button>
                              {["#FFF3A3","#FFD9A0","#FFB3C1","#C9F2C7","#B8E3FF","#E3D1FF"].map(c=>
                                <button key={c} type="button" onMouseDown={e=>{e.preventDefault();rememberSelection();}} onClick={()=>{formatText("hiliteColor",c);setTextMenu(null);setToolOptions(null);}}
                                  className="h-7 w-7 rounded-full border shadow-sm" style={{backgroundColor:c}} aria-label={`Resaltado ${c}`}/>)}
                              <label className="relative h-7 w-7 cursor-pointer rounded-full border shadow-sm" title="Resaltado personalizado" style={{background:"conic-gradient(#f00,#ff0,#0f0,#0ff,#00f,#f0f,#f00)"}}>
                                <input type="color" className="absolute inset-0 h-full w-full cursor-pointer opacity-0" onMouseDown={()=>rememberSelection()} onChange={e=>{formatText("hiliteColor",e.target.value);setTextMenu(null);}}/>
                              </label>
                            </div>}
                          </div>
                          <button type="button" onMouseDown={e=>e.preventDefault()} onClick={undoHtml} className="grid h-8 w-8 place-items-center rounded-full border bg-card shadow-sm" title="Deshacer"><Undo2 className="h-4 w-4"/></button>
                          <button type="button" onMouseDown={e=>e.preventDefault()} onClick={redoHtml} className="grid h-8 w-8 place-items-center rounded-full border bg-card shadow-sm" title="Rehacer"><Redo2 className="h-4 w-4"/></button>
                          <button type="button" onMouseDown={e=>{e.preventDefault();rememberSelection();}} onClick={()=>imageInputRef.current?.click()} className="grid h-8 w-8 place-items-center rounded-full border bg-card shadow-sm" title="Insertar imagen"><ImagePlus className="h-4 w-4"/></button>
                          <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={insertImage}/>
                          <div className="relative">
                            <button type="button" onMouseDown={e=>{e.preventDefault();rememberSelection();}} onClick={()=>setTextMenu(textMenu==="more"?null:"more")} className="grid h-8 w-8 place-items-center rounded-full border bg-card shadow-sm" title="Más formato"><MoreHorizontal className="h-4 w-4"/></button>
                            {textMenu==="more" && <div className="absolute right-full top-0 z-[70] mr-2 w-60 max-w-[calc(100vw-7rem)] rounded-2xl border bg-card p-2 shadow-xl">
                              <div className="grid grid-cols-3 gap-1">
                                <button type="button" onMouseDown={e=>{e.preventDefault();rememberSelection();}} onClick={()=>{wrapSelection("text-shadow:1px 1px 2px rgba(80,65,58,.28)");setTextMenu(null);setToolOptions(null);}} className="rounded-full border px-2 py-1 text-[10px]">Sombra</button>
                                <button type="button" onMouseDown={e=>{e.preventDefault();rememberSelection();}} onClick={()=>{wrapSelection("-webkit-text-stroke:1px #D9C6BC;paint-order:stroke fill");setTextMenu(null);setToolOptions(null);}} className="rounded-full border px-2 py-1 text-[10px]">Borde</button>
                                <label className="relative cursor-pointer rounded-full border px-2 py-1 text-center text-[10px]">Color borde<input type="color" className="absolute inset-0 h-full w-full opacity-0" onMouseDown={()=>rememberSelection()} onChange={e=>{wrapSelection(`-webkit-text-stroke:1px ${e.target.value};paint-order:stroke fill`);setTextMenu(null);}}/></label>
                              </div>
                              <div className="mt-2 grid max-h-52 grid-cols-6 gap-1 overflow-y-auto overflow-x-hidden border-t pt-2">
                                {STICKERS.map(x=><button key={x} type="button" onMouseDown={e=>{e.preventDefault();rememberSelection();}} onClick={()=>insertSticker(x)} className="grid h-8 w-8 place-items-center rounded-full border bg-background text-lg">{x}</button>)}
                              </div>
                            </div>}
                          </div>
                        </div>
                      </div>
                    )}

                    {toolOptions === "paper" && (
                      <div className="mt-2 grid gap-1 rounded-xl border bg-background/80 p-1.5">
                        {([["liso","Liso",List],["rayado","Rayado",Rows3],["cuadricula","Cuadrícula",Grid3X3],["punteado","Punteado",BookOpen]] as const).map(([value,label,Icon]) => (
                          <button key={value} type="button" onClick={() => { patch({paper:value}); setToolOptions(null); setToolPanelOpen(false); }}
                            className={`flex items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs ${current.paper===value?"bg-[#f7e5df] font-bold":"hover:bg-accent"}`}><Icon className="h-3.5 w-3.5"/>{label}</button>
                        ))}
                      </div>
                    )}
                    {toolOptions === "pencil" && (
                      <div className="mt-2 rounded-xl border bg-background/80 p-2">
                        <div className="mb-2 flex items-center gap-2"><span className="text-[11px] font-semibold">Color</span>
                          <label className="relative grid h-8 w-8 cursor-pointer place-items-center rounded-full border bg-card">
                            <span className="h-5 w-5 rounded-full border" style={{backgroundColor:inkColor}}/>
                            <input type="color" value={inkColor} onChange={e=>setInkColor(e.target.value)} className="absolute inset-0 opacity-0"/>
                          </label>
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5"><span className="mr-1 text-[11px] font-semibold">Grosor</span>
                          {[2,4,6,8,10,12].map(v => <button key={v} type="button" onClick={() => {setInkWidth(v);setToolOptions(null);setToolPanelOpen(false);}}
                            className={`grid h-7 w-7 place-items-center rounded-full border ${inkWidth===v?"bg-[#f7e5df]":"bg-card"}`}>
                            <span className="rounded-full bg-foreground" style={{width:Math.max(3,Math.min(10,v)),height:Math.max(3,Math.min(10,v))}}/></button>)}
                        </div>
                        <button type="button" onClick={convertInkToText} disabled={inkRecognizing}
                          className="mt-2 w-full rounded-full border bg-card px-3 py-1.5 text-[11px] font-semibold hover:bg-accent disabled:opacity-60">
                          {inkRecognizing ? "Reconociendo…" : "Convertir a texto"}
                        </button>
                      </div>
                    )}
                    
                  </div>
                )}
                <button type="button" onClick={() => {setToolPanelOpen(v=>!v); if(toolPanelOpen)setToolOptions(null);}}
                  className="grid h-12 w-9 place-items-center rounded-l-2xl border border-r-0 border-border bg-card/95 shadow-lg backdrop-blur-md"
                  title={toolPanelOpen?"Ocultar herramientas":"Mostrar herramientas"}>
                  {toolPanelOpen?<PanelRightClose className="h-4 w-4"/>:<PanelRightOpen className="h-4 w-4"/>}
                </button>
              </div>
              <div
                ref={editorRef}
                contentEditable={tool === "texto"}
                suppressContentEditableWarning
                onBeforeInput={pushHtmlHistory}
                onInput={e => patch({ html: e.currentTarget.innerHTML })}
                onMouseUp={()=>{rememberSelection();syncFormatFromSelection();}}
                onKeyUp={()=>{rememberSelection();syncFormatFromSelection();}}
                onBlur={()=>{setTextFont(DEFAULT_FONT);setTextPx(DEFAULT_SIZE);}}
                onPointerDown={onEditorPointerDown}
                onPointerMove={onEditorPointerMove}
                onPointerUp={onEditorPointerUp}
                onPointerCancel={onEditorPointerUp}
                className="relative z-10 min-h-[calc(100vh-112px)] p-6 text-lg leading-8 outline-none"
                data-placeholder="Tocá y escribí..."
              />
              <canvas
                ref={canvasRef}
                className="absolute inset-0 z-20 touch-none"
                style={{ pointerEvents: tool === "texto" ? "none" : "auto", cursor: "crosshair" }}
                onPointerDown={startInk}
                onPointerMove={moveInk}
                onPointerUp={endInk}
                onPointerCancel={endInk}
              />
            </div>
          </main>
        </div>
      )}
    </section>
  );
}
