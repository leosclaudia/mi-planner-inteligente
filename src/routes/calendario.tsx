import { useEffect,useMemo,useRef,useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { addMonths,isSameDay,isSameMonth,isToday,subMonths } from "date-fns";
import { ChevronLeft,ChevronRight,ImagePlus,Plus,Trash2 } from "lucide-react";
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

function DayCanvas({dateKey,tx}:{dateKey:string;tx:(es:string,en:string)=>string}){
 const fileRef=useRef<HTMLInputElement>(null);
 const areaRef=useRef<HTMLDivElement>(null);
 const [images,setImages]=useState<DayImage[]>([]);
 const [selected,setSelected]=useState<string|null>(null);
 const dragRef=useRef<{id:string;mode:"move"|"resize";sx:number;sy:number;x:number;y:number;w:number}|null>(null);
 const key=`planner-calendar-images:${dateKey}`;

 useEffect(()=>{try{setImages(JSON.parse(localStorage.getItem(key)||"[]"))}catch{setImages([])}setSelected(null)},[key]);
 const persist=(next:DayImage[])=>{setImages(next);localStorage.setItem(key,JSON.stringify(next))};
 const addImage=(file?:File)=>{if(!file)return;const reader=new FileReader();reader.onload=()=>{const next=[...images,{id:crypto.randomUUID(),src:String(reader.result),x:20,y:20,w:180}];persist(next);setSelected(next[next.length-1]!.id)};reader.readAsDataURL(file)};
 const start=(e:React.PointerEvent,id:string,mode:"move"|"resize")=>{e.preventDefault();e.stopPropagation();const item=images.find(i=>i.id===id);if(!item)return;setSelected(id);dragRef.current={id,mode,sx:e.clientX,sy:e.clientY,x:item.x,y:item.y,w:item.w};(e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId)};
 const move=(e:React.PointerEvent)=>{const d=dragRef.current;if(!d)return;e.preventDefault();const dx=e.clientX-d.sx,dy=e.clientY-d.sy;const area=areaRef.current?.getBoundingClientRect();setImages(prev=>prev.map(i=>{if(i.id!==d.id)return i;if(d.mode==="resize")return {...i,w:Math.max(80,Math.min((area?.width??600)-20,d.w+dx))};const maxX=Math.max(0,(area?.width??600)-i.w-8);return {...i,x:Math.max(0,Math.min(maxX,d.x+dx)),y:Math.max(0,d.y+dy)}}))};
 const end=()=>{if(dragRef.current){setImages(prev=>{localStorage.setItem(key,JSON.stringify(prev));return prev});dragRef.current=null}};
 const remove=(id:string)=>{persist(images.filter(i=>i.id!==id));setSelected(null)};
 return <div className="mt-4 rounded-2xl border border-border bg-card p-3 shadow-sm">
   <div className="mb-2 flex items-center justify-between gap-2">
     <div><div className="text-sm font-bold">{tx("Espacio del día","Day space")}</div><div className="text-[11px] text-muted-foreground">{tx("Agregá imágenes, movelas y cambiales el tamaño.","Add images, move and resize them.")}</div></div>
     <button type="button" onClick={()=>fileRef.current?.click()} className="inline-flex h-9 items-center gap-1.5 rounded-full border bg-background px-3 text-xs font-semibold shadow-sm"><ImagePlus className="h-4 w-4"/>{tx("Imagen","Image")}</button>
   </div>
   <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e=>{addImage(e.target.files?.[0]);e.currentTarget.value=""}}/>
   <div ref={areaRef} onPointerMove={move} onPointerUp={end} onPointerCancel={end} onPointerDown={()=>setSelected(null)} className="relative min-h-[260px] overflow-hidden rounded-xl border border-dashed border-border bg-background/60">
     {images.length===0&&<div className="absolute inset-0 grid place-items-center px-4 text-center text-xs text-muted-foreground">{tx("Este espacio está libre. Tocá Imagen para agregar una foto.","This space is empty. Tap Image to add a photo.")}</div>}
     {images.map(img=><div key={img.id} onPointerDown={e=>start(e,img.id,"move")} className={`absolute touch-none select-none ${selected===img.id?"z-20":"z-10"}`} style={{left:img.x,top:img.y,width:img.w}}>
       <img src={img.src} alt="" draggable={false} className={`block w-full rounded-xl object-contain shadow-sm ${selected===img.id?"outline outline-2 outline-primary outline-offset-2":""}`}/>
       {selected===img.id&&<><button type="button" title={tx("Eliminar imagen","Delete image")} onPointerDown={e=>{e.preventDefault();e.stopPropagation();remove(img.id)}} className="absolute -right-3 -top-3 grid h-7 w-7 place-items-center rounded-full border bg-background shadow"><Trash2 className="h-3.5 w-3.5 text-destructive"/></button><span onPointerDown={e=>start(e,img.id,"resize")} className="absolute -bottom-2 -right-2 h-5 w-5 cursor-nwse-resize rounded-full border-2 border-white bg-primary shadow"/></>}
     </div>)}
   </div>
 </div>;
}

function Summary({value,label,tone}:{value:number;label:string;tone:string}){return <div className="card-soft p-3 text-center"><strong className={`block text-xl ${tone}`}>{value}</strong><span className="text-[11px] font-semibold text-muted-foreground">{label}</span></div>}
function DayList({tasks,onEdit,compact,emptyText}:{tasks:Task[];onEdit:(t:Task)=>void;compact?:boolean;emptyText:string}){if(tasks.length===0)return emptyText?<p className={cn("card-soft p-4 text-sm text-muted-foreground",compact?"mt-2":"mt-4")}>{emptyText}</p>:null;return <ul className={cn("space-y-2",compact?"mt-2":"mt-4")}>{tasks.map(task=><TaskItem key={task.id} task={task} onEdit={onEdit}/>)}</ul>}

function CalendarWeekCard({d,list,dateFmt,tx,setCursor,setView,openNewTask}:any){
 const key=KEY(d);const[bg]=useCardBackground(`calendar-week:${key}`,isToday(d)?"#FFF1E6":"#FFFFFF");
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
   <button type="button" onClick={()=>openNewTask(d)} className="mt-2 inline-flex items-center gap-1 rounded-full border bg-white/70 px-2 py-1 text-[10px] font-semibold shadow-sm"><Plus className="h-3 w-3"/>{tx("Agregar","Add")}</button>
  </div>
}
function CalendarMonthCard({d,list,selected,cursor,setCursor,setView}:any){
 const key=KEY(d);const[bg]=useCardBackground(`calendar-day:${key}`,selected?"#FFF1E6":"#FFFFFF");
 return <div style={{backgroundColor:bg}} className={cn("relative aspect-square rounded-lg border",isToday(d)?"border-primary":"border-transparent",isSameMonth(d,cursor)?"text-foreground":"text-muted-foreground/50")}>
   <button onClick={()=>{setCursor(d);setView("dia")}} className="flex h-full w-full flex-col items-center justify-center text-sm">{d.getDate()}{list.length>0?<span className="mt-0.5 rounded-full bg-primary px-1.5 text-[9px] font-bold leading-4 text-primary-foreground">{list.length}</span>:null}</button>
   <CardBackgroundPicker storageKey={`calendar-day:${key}`} className="absolute right-0 top-0 origin-top-right scale-75"/>
  </div>
}
