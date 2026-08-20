import { useEffect,useMemo,useRef,useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { addMonths,isSameDay,isSameMonth,isToday,subMonths } from "date-fns";
import { AlignCenter,AlignJustify,AlignLeft,AlignRight,Bold,ChevronLeft,ChevronRight,Highlighter,ImagePlus,Italic,Palette,Plus,Trash2,Underline } from "lucide-react";
import { AppGate } from "@/components/planner/AppGate";
import { PageShell } from "@/components/planner/PageShell";
import { TaskItem } from "@/components/planner/TaskItem";
import { TaskDialog } from "@/components/planner/TaskDialog";
import { Button } from "@/components/ui/button";
import { Tabs,TabsList,TabsTrigger } from "@/components/ui/tabs";
import { usePlanner } from "@/lib/planner/store";
import { KEY,addDays,monthGrid,weekDays } from "@/lib/planner/date";
import type { Task } from "@/lib/planner/types";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/language";
import { CardBackgroundPicker, useCardBackground } from "@/components/planner/CardBackgroundPicker";

export const Route=createFileRoute("/calendario")({head:()=>({meta:[{title:"Calendario | Planner Inteligente"}]}),component:()=> <AppGate><CalendarioPage/></AppGate>});
type View="dia"|"semana"|"mes";
const priorityRank=(p:Task["priority"])=>p==="alta"?0:p==="media"?1:2;
const sortTasks=(items:Task[])=>[...items].sort((a,b)=>Number(a.done)-Number(b.done)||((a.order??Number.MAX_SAFE_INTEGER)-(b.order??Number.MAX_SAFE_INTEGER))||priorityRank(a.priority)-priorityRank(b.priority)||a.createdAt.localeCompare(b.createdAt));

function CalendarioPage(){
 const{state}=usePlanner();const{t,lang}=useLanguage();const[view,setView]=useState<View>("dia"),[cursor,setCursor]=useState(()=>new Date()),[open,setOpen]=useState(false),[editing,setEditing]=useState<Task|null>(null);
 const locale=lang==="en"?"en-US":"es-AR",todayKey=KEY(new Date());
 const dateFmt=(date:Date,options:Intl.DateTimeFormatOptions)=>new Intl.DateTimeFormat(locale,options).format(date);
 const byDay=useMemo(()=>{const map:Record<string,Task[]>={};for(const task of state.tasks){if(!task.date)continue;(map[task.date]??=[]).push(task)}Object.keys(map).forEach(k=>map[k]=sortTasks(map[k]!));return map},[state.tasks]);
 const datedPending=state.tasks.filter(x=>x.date&&!x.done),overdue=datedPending.filter(x=>x.date!<todayKey).length,today=datedPending.filter(x=>x.date===todayKey).length,upcoming=datedPending.filter(x=>x.date!>todayKey).length;
 const step=(dir:-1|1)=>{if(view==="dia")setCursor(d=>addDays(d,dir));else if(view==="semana")setCursor(d=>addDays(d,7*dir));else setCursor(d=>dir===1?addMonths(d,1):subMonths(d,1))};
 const week=weekDays(cursor);
 const label=view==="mes"?dateFmt(cursor,{month:"long",year:"numeric"}):view==="semana"?`${dateFmt(week[0]!,{day:"numeric",month:"short"})} – ${dateFmt(week[6]!,{day:"numeric",month:"short",year:"numeric"})}`:dateFmt(cursor,{weekday:"long",day:"numeric",month:"long"});
 const onEdit=(task:Task)=>{setEditing(task);setOpen(true)};
 const openNewTask=(date:Date)=>{setCursor(date);setEditing(null);setOpen(true)};
 const tx=(es:string,en:string)=>lang==="en"?en:es;
 return <PageShell title={t("Calendario")} subtitle={state.settings.plannerName} action={<Button className="h-11" onClick={()=>openNewTask(cursor)}><Plus className="h-4 w-4"/>{t("Tarea")}</Button>}>
   <div className="mb-4 grid grid-cols-3 gap-2"><Summary value={overdue} label={tx("Vencidas","Overdue")} tone={overdue>0?"text-destructive":"text-muted-foreground"}/><Summary value={today} label={tx("Hoy","Today")} tone="text-primary"/><Summary value={upcoming} label={tx("Próximas","Upcoming")} tone="text-olive"/></div>
   <Tabs value={view} onValueChange={v=>setView(v as View)}><TabsList className="grid w-full grid-cols-3"><TabsTrigger value="dia">{t("Día")}</TabsTrigger><TabsTrigger value="semana">{t("Semana")}</TabsTrigger><TabsTrigger value="mes">{t("Mes")}</TabsTrigger></TabsList></Tabs>
   <div className="mt-3 flex items-center justify-between gap-2"><Button size="icon" variant="outline" aria-label={t("Anterior")} onClick={()=>step(-1)}><ChevronLeft className="h-5 w-5"/></Button><p className="min-w-0 flex-1 truncate text-center font-semibold capitalize">{label}</p><Button size="icon" variant="outline" aria-label={t("Siguiente")} onClick={()=>step(1)}><ChevronRight className="h-5 w-5"/></Button></div>
   <div className="mt-2 text-center"><button className="text-sm font-semibold text-primary" onClick={()=>{setCursor(new Date());setView("dia")}}>{t("Ir a hoy")}</button></div>
   {view==="dia"?<><DayCanvas dateKey={KEY(cursor)} tx={tx}/><DayList tasks={byDay[KEY(cursor)]??[]} onEdit={onEdit} emptyText={t("Sin tareas para este día.")}/></>:view==="semana"?<div className="mt-4"><div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">{week.map(d=>{const list=byDay[KEY(d)]??[];return <CalendarWeekCard key={KEY(d)} d={d} list={list} dateFmt={dateFmt} tx={tx} setCursor={setCursor} setView={setView} openNewTask={openNewTask}/>})}</div><div className="mt-5"><h2 className="mb-2 font-display text-lg font-bold">{tx("Detalle de la semana","Week details")}</h2><div className="space-y-4">{week.map(d=><div key={KEY(d)}><button type="button" onClick={()=>{setCursor(d);setView("dia")}} className="flex w-full items-center gap-2 text-left"><h3 className={cn("text-sm font-bold capitalize",isToday(d)&&"text-primary")}>{dateFmt(d,{weekday:"long",day:"numeric"})}</h3><span className="text-xs text-muted-foreground">{(byDay[KEY(d)]??[]).length} {tx("tareas","tasks")}</span></button>{(byDay[KEY(d)]??[]).length>0?<DayList tasks={byDay[KEY(d)]??[]} onEdit={onEdit} compact emptyText=""/>:null}</div>)}</div></div></div>:<div className="mt-4"><div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-muted-foreground">{(lang==="en"?["M","T","W","T","F","S","S"]:["L","M","M","J","V","S","D"]).map((d,i)=><span key={i}>{d}</span>)}</div><div className="mt-1 grid grid-cols-7 gap-1">{monthGrid(cursor).map(d=>{const list=byDay[KEY(d)]??[],selected=isSameDay(d,cursor);return <CalendarMonthCard key={KEY(d)} d={d} list={list} selected={selected} cursor={cursor} setCursor={setCursor} setView={setView}/>})}</div></div>}
   <TaskDialog open={open} onOpenChange={setOpen} task={editing} defaultDate={editing?undefined:KEY(cursor)}/>
 </PageShell>
}

type DayImage={id:string;src:string;x:number;y:number;w:number};
const DAY_FONTS=["Arial","Verdana","Tahoma","Trebuchet MS","Georgia","Times New Roman","Courier New","Comic Sans MS","Segoe UI","Calibri","Garamond","Helvetica","Palatino","Century Gothic","Cambria","Candara"];
const DAY_SIZES=[10,13,16,18,24,32,48];
const DAY_COLORS=["#111111","#A84F4F","#D26A4C","#C48A2F","#66508D","#4F6E98","#B34F83","#4E7C72","#2F6F5F","#31708E"];
const DAY_HILITES=["#FFF3A3","#FFD9A0","#FFB3C1","#C9F2C7","#B8E3FF","#E3D1FF"];

function readDayImages(dateKey:string):DayImage[]{
 try{return JSON.parse(localStorage.getItem(`planner-calendar-images:${dateKey}`)||"[]")}catch{return[]}
}
function useDayPreview(dateKey:string){
 const [src,setSrc]=useState("");
 useEffect(()=>{
  const load=()=>setSrc(readDayImages(dateKey)[0]?.src||"");
  load();
  const on=(e:Event)=>{const d=(e as CustomEvent<{dateKey:string}>).detail;if(!d||d.dateKey===dateKey)load()};
  window.addEventListener("planner:calendar-images-changed",on as EventListener);
  window.addEventListener("storage",load);
  return()=>{window.removeEventListener("planner:calendar-images-changed",on as EventListener);window.removeEventListener("storage",load)};
 },[dateKey]);
 return src;
}

function DayCanvas({dateKey,tx}:{dateKey:string;tx:(es:string,en:string)=>string}){
 const fileRef=useRef<HTMLInputElement>(null),areaRef=useRef<HTMLDivElement>(null),editorRef=useRef<HTMLDivElement>(null),selectionRef=useRef<Range|null>(null);
 const [images,setImages]=useState<DayImage[]>([]),[selected,setSelected]=useState<string|null>(null),[font,setFont]=useState("Arial"),[size,setSize]=useState(16),[panel,setPanel]=useState<"color"|"highlight"|"stroke"|null>(null),[shadow,setShadow]=useState("0"),[strokeWidth,setStrokeWidth]=useState("0"),[strokeColor,setStrokeColor]=useState("#111111");
 const dragRef=useRef<{id:string;mode:"move"|"resize";sx:number;sy:number;x:number;y:number;w:number}|null>(null);
 const imageKey=`planner-calendar-images:${dateKey}`,textKey=`planner-calendar-richtext:${dateKey}`;

 const broadcast=()=>window.dispatchEvent(new CustomEvent("planner:calendar-images-changed",{detail:{dateKey}}));
 useEffect(()=>{
  setImages(readDayImages(dateKey));setSelected(null);setPanel(null);dragRef.current=null;
  setTimeout(()=>{if(editorRef.current)editorRef.current.innerHTML=localStorage.getItem(textKey)||""},0);
 },[dateKey,textKey]);
 useEffect(()=>{
  const stop=()=>{if(dragRef.current){setImages(prev=>{localStorage.setItem(imageKey,JSON.stringify(prev));broadcast();return prev});dragRef.current=null}};
  window.addEventListener("pointerup",stop);window.addEventListener("pointercancel",stop);
  return()=>{window.removeEventListener("pointerup",stop);window.removeEventListener("pointercancel",stop)};
 },[imageKey,dateKey]);

 const saveText=()=>{if(editorRef.current)localStorage.setItem(textKey,editorRef.current.innerHTML)};
 const deselectImage=()=>{setSelected(null);dragRef.current=null};
 const remember=()=>{deselectImage();const s=window.getSelection();if(s&&s.rangeCount&&editorRef.current?.contains(s.getRangeAt(0).startContainer)&&editorRef.current.contains(s.getRangeAt(0).endContainer))selectionRef.current=s.getRangeAt(0).cloneRange()};
 const focusSelection=()=>{deselectImage();editorRef.current?.focus({preventScroll:true});const s=window.getSelection(),r=selectionRef.current;if(s&&r){s.removeAllRanges();s.addRange(r)}};
 const applyInline=(styles:Record<string,string>)=>{focusSelection();const r=selectionRef.current;if(!r||r.collapsed)return;const span=document.createElement("span");Object.assign(span.style,styles);try{const frag=r.extractContents();span.appendChild(frag);r.insertNode(span);const nr=document.createRange();nr.selectNodeContents(span);const s=window.getSelection();s?.removeAllRanges();s?.addRange(nr);selectionRef.current=nr.cloneRange();saveText()}catch{}};
 const cmd=(c:string,v?:string)=>{focusSelection();document.execCommand(c,false,v);remember();saveText()};
 const setFontCmd=(v:string)=>{setFont(v);cmd("fontName",v)};
 const setSizeCmd=(n:number)=>{setSize(n);focusSelection();document.execCommand("fontSize",false,"7");editorRef.current?.querySelectorAll('font[size="7"]').forEach(el=>{(el as HTMLElement).removeAttribute("size");(el as HTMLElement).style.fontSize=`${n}px`});remember();saveText()};
 const setShadowCmd=(v:string)=>{setShadow(v);const n=Number(v);applyInline({textShadow:n?`0 ${n}px ${Math.max(1,n*2)}px rgba(0,0,0,.45)`:"none"})};
 const setStrokeWidthCmd=(v:string)=>{setStrokeWidth(v);const n=Number(v);applyInline({WebkitTextStroke:n?`${n}px ${strokeColor}`:"0 transparent",paintOrder:"stroke fill"})};
 const setStrokeColorCmd=(v:string)=>{setStrokeColor(v);const n=Number(strokeWidth);applyInline({WebkitTextStroke:n?`${n}px ${v}`:"0 transparent",paintOrder:"stroke fill"})};
 const reset=()=>{focusSelection();document.execCommand("removeFormat");document.execCommand("justifyLeft");setFont("Arial");setSize(16);setShadow("0");setStrokeWidth("0");setStrokeColor("#111111");remember();saveText()};

 const persist=(next:DayImage[])=>{setImages(next);localStorage.setItem(imageKey,JSON.stringify(next));broadcast()};
 const addImage=(file?:File)=>{if(!file)return;const r=new FileReader();r.onload=()=>{const next=[...images,{id:crypto.randomUUID(),src:String(r.result),x:20,y:20,w:180}];persist(next);setSelected(next.at(-1)!.id)};r.readAsDataURL(file)};
 const start=(e:React.PointerEvent,id:string,mode:"move"|"resize")=>{e.preventDefault();e.stopPropagation();const i=images.find(x=>x.id===id);if(!i)return;setSelected(id);dragRef.current={id,mode,sx:e.clientX,sy:e.clientY,x:i.x,y:i.y,w:i.w};(e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId)};
 const move=(e:React.PointerEvent)=>{const d=dragRef.current;if(!d)return;e.preventDefault();const dx=e.clientX-d.sx,dy=e.clientY-d.sy,a=areaRef.current?.getBoundingClientRect();setImages(prev=>prev.map(i=>{if(i.id!==d.id)return i;if(d.mode==="resize")return {...i,w:Math.max(80,Math.min((a?.width??600)-16,d.w+dx))};const maxX=Math.max(0,(a?.width??600)-i.w-8),maxY=Math.max(0,(a?.height??320)-80);return {...i,x:Math.max(0,Math.min(maxX,d.x+dx)),y:Math.max(0,Math.min(maxY,d.y+dy))}}))};
 const end=()=>{if(dragRef.current){persist(images);dragRef.current=null}};
 const remove=(id:string)=>{persist(images.filter(i=>i.id!==id));setSelected(null)};
 const tool="grid h-10 w-10 shrink-0 place-items-center rounded-xl border bg-card shadow-sm";

 return <div className="mt-4 rounded-2xl border border-border bg-card p-3 shadow-sm">
  <div className="mb-2"><div className="text-sm font-bold">{tx("Espacio del día","Day space")}</div><div className="text-[11px] text-muted-foreground">{tx("Texto con formato e imágenes libres.","Formatted text and free images.")}</div></div>
  <div className="flex flex-wrap items-center gap-1.5 rounded-2xl border bg-background/70 p-2" onMouseDown={e=>{if((e.target as HTMLElement).closest("button,label,select"))remember()}}>
   <select value={font} onChange={e=>setFontCmd(e.target.value)} className="h-10 max-w-[125px] rounded-xl border bg-card px-2 text-sm">{DAY_FONTS.map(f=><option key={f}>{f}</option>)}</select>
   <select value={size} onChange={e=>setSizeCmd(Number(e.target.value))} className="h-10 w-[70px] rounded-xl border bg-card px-2 text-sm">{DAY_SIZES.map(n=><option key={n} value={n}>{n}</option>)}</select>
   <button type="button" className={tool} title="Negrita" onClick={()=>cmd("bold")}><Bold className="h-4 w-4"/></button>
   <button type="button" className={tool} title="Cursiva" onClick={()=>cmd("italic")}><Italic className="h-4 w-4"/></button>
   <button type="button" className={tool} title="Subrayado" onClick={()=>cmd("underline")}><Underline className="h-4 w-4"/></button>
   <button type="button" className={tool} title="Izquierda" onClick={()=>cmd("justifyLeft")}><AlignLeft className="h-4 w-4"/></button>
   <button type="button" className={tool} title="Centrar" onClick={()=>cmd("justifyCenter")}><AlignCenter className="h-4 w-4"/></button>
   <button type="button" className={tool} title="Derecha" onClick={()=>cmd("justifyRight")}><AlignRight className="h-4 w-4"/></button>
   <button type="button" className={tool} title="Justificar" onClick={()=>cmd("justifyFull")}><AlignJustify className="h-4 w-4"/></button>
   <select value={shadow} onChange={e=>setShadowCmd(e.target.value)} className="h-10 rounded-xl border bg-card px-2 text-xs"><option value="0">Sombra 0</option>{[1,2,3,4,5].map(n=><option key={n} value={n}>Sombra {n}</option>)}</select>
   <select value={strokeWidth} onChange={e=>setStrokeWidthCmd(e.target.value)} className="h-10 rounded-xl border bg-card px-2 text-xs"><option value="0">Borde 0</option>{[1,2,3,4,5].map(n=><option key={n} value={n}>Borde {n}</option>)}</select>
   <button type="button" className="inline-flex h-10 items-center gap-1.5 rounded-xl border bg-card px-3 text-xs shadow-sm" onClick={()=>setPanel(panel==="stroke"?null:"stroke")}>Borde 🎨</button>
   <button type="button" className={tool} title="Color" onClick={()=>setPanel(panel==="color"?null:"color")}><Palette className="h-4 w-4"/></button>
   <button type="button" className={tool} title="Resaltador" onClick={()=>setPanel(panel==="highlight"?null:"highlight")}><Highlighter className="h-4 w-4"/></button>
   <button type="button" className="inline-flex h-10 items-center gap-1.5 rounded-xl border bg-card px-3 text-xs shadow-sm" onClick={()=>fileRef.current?.click()}><ImagePlus className="h-4 w-4"/>{tx("Imagen","Image")}</button>
   <button type="button" className="h-10 rounded-xl border bg-card px-3 text-xs shadow-sm" onClick={reset}>{tx("Restablecer","Reset")}</button>
   <button type="button" className={tool} title="Deshacer" onClick={()=>cmd("undo")}>↶</button>
   <button type="button" className={tool} title="Rehacer" onClick={()=>cmd("redo")}>↷</button>
  </div>

  {panel==="color"&&<div className="mt-2 flex flex-wrap items-center gap-2 rounded-xl border bg-card p-2">{DAY_COLORS.map(c=><button key={c} type="button" className="h-8 w-8 rounded-full border" style={{backgroundColor:c}} onMouseDown={e=>e.preventDefault()} onClick={()=>cmd("foreColor",c)}/>)}<label className="relative h-8 w-8 cursor-pointer overflow-hidden rounded-full border" style={{background:"conic-gradient(red,yellow,lime,cyan,blue,magenta,red)"}}><input type="color" className="absolute inset-0 h-full w-full cursor-pointer opacity-0" onChange={e=>cmd("foreColor",e.target.value)}/></label></div>}
  {panel==="highlight"&&<div className="mt-2 flex flex-wrap items-center gap-2 rounded-xl border bg-card p-2"><button type="button" className="rounded-full border px-3 py-1.5 text-xs" onMouseDown={e=>e.preventDefault()} onClick={()=>cmd("hiliteColor","transparent")}>🚫 {tx("Sin resaltado","No highlight")}</button>{DAY_HILITES.map(c=><button key={c} type="button" className="h-8 w-8 rounded-full border" style={{backgroundColor:c}} onMouseDown={e=>e.preventDefault()} onClick={()=>cmd("hiliteColor",c)}/>)}<label className="relative h-8 w-8 cursor-pointer overflow-hidden rounded-full border" style={{background:"conic-gradient(red,yellow,lime,cyan,blue,magenta,red)"}}><input type="color" className="absolute inset-0 h-full w-full cursor-pointer opacity-0" onChange={e=>cmd("hiliteColor",e.target.value)}/></label></div>}
  {panel==="stroke"&&<div className="mt-2 flex flex-wrap items-center gap-2 rounded-xl border bg-card p-2"><span className="text-xs font-semibold">{tx("Color del borde","Border color")}</span>{DAY_COLORS.map(c=><button key={c} type="button" className={`h-8 w-8 rounded-full border ${strokeColor.toUpperCase()===c.toUpperCase()?"ring-2 ring-primary ring-offset-1":""}`} style={{backgroundColor:c}} onMouseDown={e=>e.preventDefault()} onClick={()=>setStrokeColorCmd(c)}/>)}<label className="relative h-8 w-8 cursor-pointer overflow-hidden rounded-full border" style={{background:strokeColor}}><input type="color" className="absolute inset-0 h-full w-full cursor-pointer opacity-0" value={strokeColor} onChange={e=>setStrokeColorCmd(e.target.value)}/></label></div>}

  <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e=>{addImage(e.target.files?.[0]);e.currentTarget.value=""}}/>
  <div className="relative mt-3 min-h-[320px] overflow-hidden rounded-xl border border-dashed border-border bg-background/60">
   <div ref={editorRef} contentEditable suppressContentEditableWarning onInput={()=>{remember();saveText()}} onKeyUp={remember} onMouseUp={remember} onTouchEnd={remember} onFocus={remember} onPointerDown={()=>deselectImage()} data-placeholder={tx("Tocá acá y escribí...","Tap here and write...")} className="relative z-[5] min-h-[320px] whitespace-pre-wrap break-words p-4 outline-none empty:before:pointer-events-none empty:before:text-muted-foreground empty:before:content-[attr(data-placeholder)]"/>
   <div ref={areaRef} onPointerMove={move} onPointerUp={end} onPointerCancel={end} className="pointer-events-none absolute inset-0 z-10">
    {images.map(img=><div key={img.id} onPointerDown={e=>start(e,img.id,"move")} className={`pointer-events-auto absolute touch-none select-none ${selected===img.id?"z-20":"z-10"}`} style={{left:img.x,top:img.y,width:img.w}}>
     <img src={img.src} alt="" draggable={false} className={`block w-full rounded-xl object-contain shadow-sm ${selected===img.id?"outline outline-2 outline-primary outline-offset-2":""}`}/>
     {selected===img.id&&<><button type="button" onPointerDown={e=>{e.preventDefault();e.stopPropagation();remove(img.id)}} className="absolute -right-3 -top-3 grid h-7 w-7 place-items-center rounded-full border bg-background shadow"><Trash2 className="h-3.5 w-3.5 text-destructive"/></button><span onPointerDown={e=>start(e,img.id,"resize")} className="absolute -bottom-2 -right-2 h-5 w-5 cursor-nwse-resize rounded-full border-2 border-white bg-primary shadow"/></>}
    </div>)}
   </div>
  </div>
 </div>;
}

function Summary({value,label,tone}:{value:number;label:string;tone:string}){return <div className="card-soft p-3 text-center"><strong className={`block text-xl ${tone}`}>{value}</strong><span className="text-[11px] font-semibold text-muted-foreground">{label}</span></div>}
function DayList({tasks,onEdit,compact,emptyText}:{tasks:Task[];onEdit:(t:Task)=>void;compact?:boolean;emptyText:string}){if(tasks.length===0)return emptyText?<p className={cn("card-soft p-4 text-sm text-muted-foreground",compact?"mt-2":"mt-4")}>{emptyText}</p>:null;return <ul className={cn("space-y-2",compact?"mt-2":"mt-4")}>{tasks.map(task=><TaskItem key={task.id} task={task} onEdit={onEdit}/>)}</ul>}

function CalendarWeekCard({d,list,dateFmt,tx,setCursor,setView,openNewTask}:any){
 const key=KEY(d);const[bg]=useCardBackground(`calendar-week:${key}`,isToday(d)?"#FFF1E6":"#FFFFFF");const preview=useDayPreview(key);
 return <div style={{backgroundColor:bg}} className={cn("relative min-h-28 rounded-xl border p-3 transition-colors",isToday(d)?"border-primary":"border-border")}>
   <div className="flex items-start justify-between gap-2">
    <button type="button" onClick={()=>{setCursor(d);setView("dia")}} className="min-w-0 flex-1 text-left">
     <div className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{dateFmt(d,{weekday:"short"})}</div>
     <div className="mt-1 text-lg font-bold">{d.getDate()}</div>
    </button>
    <div className="flex shrink-0 items-center gap-1">
     <span className="rounded-full bg-muted px-2 py-1 text-[10px] font-bold">{list.length}</span>
     <CardBackgroundPicker storageKey={`calendar-week:${key}`}/>
    </div>
   </div>
   <button type="button" onClick={()=>{setCursor(d);setView("dia")}} className="mt-2 block w-full text-left">
    <div className="space-y-1">{list.slice(0,2).map((task:any)=><div key={task.id} className={cn("truncate text-xs",task.done&&"line-through text-muted-foreground")}>{task.title}</div>)}{list.length>2?<div className="text-[10px] text-muted-foreground">+{list.length-2} {tx("más","more")}</div>:null}{list.length===0?<div className="text-[10px] text-muted-foreground">{tx("Sin tareas","No tasks")}</div>:null}</div>
   </button>
   {preview?<button type="button" onClick={()=>{setCursor(d);setView("dia")}} className="mt-2 block"><img src={preview} alt="" className="h-12 w-12 rounded-lg border object-cover shadow-sm"/></button>:null}
   <button type="button" onClick={()=>openNewTask(d)} className="mt-2 inline-flex items-center gap-1 rounded-full border bg-white/70 px-2 py-1 text-[10px] font-semibold shadow-sm"><Plus className="h-3 w-3"/>{tx("Agregar","Add")}</button>
  </div>
}
function CalendarMonthCard({d,list,selected,cursor,setCursor,setView}:any){
 const key=KEY(d);const[bg]=useCardBackground(`calendar-day:${key}`,selected?"#FFF1E6":"#FFFFFF");const preview=useDayPreview(key);
 return <div style={{backgroundColor:bg}} className={cn("relative aspect-square rounded-lg border",isToday(d)?"border-primary":"border-transparent",isSameMonth(d,cursor)?"text-foreground":"text-muted-foreground/50")}>
   <button onClick={()=>{setCursor(d);setView("dia")}} className="flex h-full w-full flex-col items-center justify-center text-sm">{preview?<img src={preview} alt="" className="mb-0.5 h-5 w-5 rounded object-cover"/>:null}{d.getDate()}{list.length>0?<span className="mt-0.5 rounded-full bg-primary px-1.5 text-[9px] font-bold leading-4 text-primary-foreground">{list.length}</span>:null}</button>
   <CardBackgroundPicker storageKey={`calendar-day:${key}`} className="absolute right-0 top-0 origin-top-right scale-75"/>
  </div>
}
