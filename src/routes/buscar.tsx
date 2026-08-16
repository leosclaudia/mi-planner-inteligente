import { useMemo,useState } from "react";
import { createFileRoute,Link } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { AppGate } from "@/components/planner/AppGate";
import { PageShell } from "@/components/planner/PageShell";
import { usePlanner } from "@/lib/planner/store";
import { useLanguage } from "@/lib/language";

export const Route=createFileRoute("/buscar")({component:()=> <AppGate><GlobalSearch/></AppGate>});

const strip=(html:string)=>html.replace(/<[^>]+>/g," ").replace(/&nbsp;/g," ").replace(/\s+/g," ").trim();

function GlobalSearch(){
 const{state}=usePlanner();const{lang}=useLanguage();const[q,setQ]=useState("");
 const results=useMemo(()=>{
   const s=q.trim().toLowerCase();if(!s)return[];
   const base=[
     ...state.tasks.map(x=>({kind:lang==="en"?"Task":"Tarea",title:x.title,text:x.notes,to:"/tareas" as const})),
     ...state.projects.map(x=>({kind:lang==="en"?"Project":"Proyecto",title:x.name,text:x.description,to:"/proyectos" as const})),
     ...state.sections.map(x=>({kind:lang==="en"?"Section":"Sección",title:x.name,text:"",to:"/" as const})),
   ];
   const flex=(()=>{try{return JSON.parse(localStorage.getItem("planner-flex-notes-v1")||"[]").map((x:any)=>({kind:lang==="en"?"Dated note":"Nota con fecha",title:x.title||"",text:strip(x.html||""),to:"/notas-fecha" as const}))}catch{return[]}})();
   const fixed=[
     ["hoy",lang==="en"?"TODAY":"HOY"],
     ["prioridades",lang==="en"?"PRIORITIES":"PRIORIDADES"],
     ["recordatorios",lang==="en"?"REMINDERS":"RECORDATORIOS"],
     ["libre",lang==="en"?"FREE CANVAS":"LIENZO LIBRE"],
   ].map(([id,title])=>({kind:lang==="en"?"Note":"Nota",title,text:strip(localStorage.getItem(`planner-lienzo-${id}-v2`)||""),to:"/notas" as const}));
   return [...base,...flex,...fixed]
     .filter(x=>(x.title+" "+x.text).toLowerCase().includes(s))
     .slice(0,60);
 },[q,state,lang]);
 return <PageShell title={lang==="en"?"Search":"Buscar"} subtitle={lang==="en"?"Find things across your planner":"Encontrá cosas en todo tu planner"}>
   <div className="card-soft flex items-center gap-2 p-3"><Search className="h-5 w-5 text-muted-foreground"/><input autoFocus value={q} onChange={e=>setQ(e.target.value)} placeholder={lang==="en"?"Search tasks, projects, sections and notes…":"Buscar tareas, proyectos, secciones y notas…"} className="w-full bg-transparent outline-none"/></div>
   {q&&<p className="mt-3 text-xs text-muted-foreground">{results.length} {lang==="en"?"results":"resultados"}</p>}
   <div className="mt-3 grid gap-2">{results.map((r:any,i)=><Link key={`${r.kind}-${r.title}-${i}`} to={r.to} className="card-soft p-4"><span className="text-xs font-bold text-terra">{r.kind}</span><h2 className="font-bold">{r.title}</h2>{r.text&&<p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{r.text}</p>}</Link>)}{q&&results.length===0&&<p className="p-4 text-center text-sm text-muted-foreground">{lang==="en"?"No results":"No encontré resultados"}</p>}</div>
 </PageShell>
}
