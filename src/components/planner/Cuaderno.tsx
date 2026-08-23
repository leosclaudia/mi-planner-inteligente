import { useEffect, useMemo, useRef, useState } from "react";
import { BookOpen, CalendarDays, ChevronLeft, Eraser, FilePlus2, Grid3X3, List, PanelRightClose, PanelRightOpen, Pencil, Rows3, Trash2, Type, X } from "lucide-react";

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
  const [toolOptions, setToolOptions] = useState<null | "paper" | "pencil" | "eraser">(null);
  const editorRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawing = useRef(false);
  const last = useRef<{ x: number; y: number } | null>(null);

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
    setTool("texto");
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
                  <div className="mr-1 w-[210px] max-w-[65vw] rounded-l-[1.4rem] rounded-r-md border border-border bg-card/95 p-2 shadow-xl backdrop-blur-md">
                    <div className="mb-1 flex items-center justify-between px-1">
                      <span className="text-xs font-bold">Herramientas</span>
                      <button type="button" onClick={() => { setToolPanelOpen(false); setToolOptions(null); }} className="grid h-7 w-7 place-items-center rounded-full hover:bg-accent">
                        <PanelRightClose className="h-4 w-4"/>
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5">
                      <button type="button" onClick={() => { setTool("texto"); setToolOptions(null); setToolPanelOpen(false); }}
                        className={`inline-flex items-center gap-1.5 rounded-xl border px-2.5 py-2 text-xs font-semibold ${tool==="texto"?"bg-[#f3e4f2]":"bg-background"}`}><Type className="h-4 w-4"/>Texto</button>
                      <button type="button" onClick={() => setToolOptions(toolOptions==="paper"?null:"paper")}
                        className="inline-flex items-center gap-1.5 rounded-xl border bg-background px-2.5 py-2 text-xs font-semibold"><BookOpen className="h-4 w-4"/>Hoja</button>
                      <button type="button" onClick={() => { setTool("lapiz"); setToolOptions(toolOptions==="pencil"?null:"pencil"); }}
                        className={`inline-flex items-center gap-1.5 rounded-xl border px-2.5 py-2 text-xs font-semibold ${tool==="lapiz"?"bg-[#f7e5df]":"bg-background"}`}><Pencil className="h-4 w-4"/>Lápiz</button>
                      <button type="button" onClick={() => { setTool("goma"); setToolOptions(toolOptions==="eraser"?null:"eraser"); }}
                        className={`inline-flex items-center gap-1.5 rounded-xl border px-2.5 py-2 text-xs font-semibold ${tool==="goma"?"bg-[#f7e5df]":"bg-background"}`}><Eraser className="h-4 w-4"/>Goma</button>
                    </div>
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
                      </div>
                    )}
                    {toolOptions === "eraser" && <div className="mt-2 rounded-xl border bg-background/80 p-2 text-[11px] text-muted-foreground">Goma activa.</div>}
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
                onInput={e => patch({ html: e.currentTarget.innerHTML })}
                className="relative z-10 min-h-[calc(100vh-112px)] p-6 text-lg leading-8 outline-none"
                data-placeholder="Tocá y escribí..."
              />
              <canvas
                ref={canvasRef}
                className="absolute inset-0 z-20 touch-none"
                style={{ pointerEvents: tool === "texto" ? "none" : "auto", cursor: tool === "goma" ? "cell" : "crosshair" }}
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
