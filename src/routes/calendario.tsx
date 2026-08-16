import { useMemo,useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { addMonths,isSameDay,isSameMonth,isToday,subMonths } from "date-fns";
import { ChevronLeft,ChevronRight,Plus } from "lucide-react";
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
 const label=view==="mes"?dateFmt(cursor,{month:"long",year:"numeric"}):view==="semana"?(lang==="en"?`Week of ${dateFmt(weekDays(cursor)[0]!,{day:"numeric",month:"short"})}`:`Semana del ${dateFmt(weekDays(cursor)[0]!,{day:"numeric",month:"short"})}`):dateFmt(cursor,{weekday:"long",day:"numeric",month:"long"});
 const onEdit=(task:Task)=>{setEditing(task);setOpen(true)};
 const tx=(es:string,en:string)=>lang==="en"?en:es;
 return <PageShell title={t("Calendario")} subtitle={state.settings.plannerName} action={<Button className="h-11" onClick={()=>{setEditing(null);setOpen(true)}}><Plus className="h-4 w-4"/>{t("Tarea")}</Button>}>
   <div className="mb-4 grid grid-cols-3 gap-2"><Summary value={overdue} label={tx("Vencidas","Overdue")} tone={overdue>0?"text-destructive":"text-muted-foreground"}/><Summary value={today} label={tx("Hoy","Today")} tone="text-primary"/><Summary value={upcoming} label={tx("Próximas","Upcoming")} tone="text-olive"/></div>
   <Tabs value={view} onValueChange={v=>setView(v as View)}><TabsList className="grid w-full grid-cols-3"><TabsTrigger value="dia">{t("Día")}</TabsTrigger><TabsTrigger value="semana">{t("Semana")}</TabsTrigger><TabsTrigger value="mes">{t("Mes")}</TabsTrigger></TabsList></Tabs>
   <div className="mt-3 flex items-center justify-between gap-2"><Button size="icon" variant="outline" aria-label={t("Anterior")} onClick={()=>step(-1)}><ChevronLeft className="h-5 w-5"/></Button><p className="min-w-0 flex-1 truncate text-center font-semibold capitalize">{label}</p><Button size="icon" variant="outline" aria-label={t("Siguiente")} onClick={()=>step(1)}><ChevronRight className="h-5 w-5"/></Button></div>
   <div className="mt-2 text-center"><button className="text-sm font-semibold text-primary" onClick={()=>{setCursor(new Date());setView("dia")}}>{t("Ir a hoy")}</button></div>
   {view==="dia"?<DayList tasks={byDay[KEY(cursor)]??[]} onEdit={onEdit} emptyText={t("Sin tareas para este día.")}/>:view==="semana"?<div className="mt-4 space-y-4">{weekDays(cursor).map(d=><div key={KEY(d)}><button type="button" onClick={()=>{setCursor(d);setView("dia")}} className="flex w-full items-center gap-2 text-left"><h2 className={cn("text-base font-bold capitalize",isToday(d)&&"text-primary")}>{dateFmt(d,{weekday:"long",day:"numeric"})}</h2><span className="text-xs text-muted-foreground">{(byDay[KEY(d)]??[]).length} {tx("tareas","tasks")}</span></button><DayList tasks={byDay[KEY(d)]??[]} onEdit={onEdit} compact emptyText={t("Sin tareas para este día.")}/></div>)}</div>:<div className="mt-4"><div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-muted-foreground">{(lang==="en"?["M","T","W","T","F","S","S"]:["L","M","M","J","V","S","D"]).map((d,i)=><span key={i}>{d}</span>)}</div><div className="mt-1 grid grid-cols-7 gap-1">{monthGrid(cursor).map(d=>{const list=byDay[KEY(d)]??[],selected=isSameDay(d,cursor);return <button key={KEY(d)} onClick={()=>{setCursor(d);setView("dia")}} className={cn("flex aspect-square flex-col items-center justify-center rounded-xl border border-transparent text-sm",isSameMonth(d,cursor)?"text-foreground":"text-muted-foreground/50",isToday(d)&&"border-primary font-bold",selected&&"bg-terra-soft")}>{d.getDate()}{list.length>0?<span className="mt-0.5 rounded-full bg-primary px-1.5 text-[9px] font-bold leading-4 text-primary-foreground">{list.length}</span>:null}</button>})}</div></div>}
   <TaskDialog open={open} onOpenChange={setOpen} task={editing} defaultDate={editing?undefined:KEY(cursor)}/>
 </PageShell>
}
function Summary({value,label,tone}:{value:number;label:string;tone:string}){return <div className="card-soft p-3 text-center"><strong className={`block text-xl ${tone}`}>{value}</strong><span className="text-[11px] font-semibold text-muted-foreground">{label}</span></div>}
function DayList({tasks,onEdit,compact,emptyText}:{tasks:Task[];onEdit:(t:Task)=>void;compact?:boolean;emptyText:string}){if(tasks.length===0)return <p className={cn("card-soft p-4 text-sm text-muted-foreground",compact?"mt-2":"mt-4")}>{emptyText}</p>;return <ul className={cn("space-y-2",compact?"mt-2":"mt-4")}>{tasks.map(task=><TaskItem key={task.id} task={task} onEdit={onEdit}/>)}</ul>}
