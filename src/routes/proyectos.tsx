import { useMemo,useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Archive,ArchiveRestore,Pencil,Plus,Search,Trash2 } from "lucide-react";
import { AppGate } from "@/components/planner/AppGate";
import { PageShell } from "@/components/planner/PageShell";
import { SectionChip } from "@/components/planner/SectionBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog,DialogContent,DialogFooter,DialogHeader,DialogTitle } from "@/components/ui/dialog";
import { Select,SelectContent,SelectItem,SelectTrigger,SelectValue } from "@/components/ui/select";
import { Tabs,TabsList,TabsTrigger } from "@/components/ui/tabs";
import { usePlanner,useSectionMap } from "@/lib/planner/store";
import type { Project } from "@/lib/planner/types";
import { useLanguage } from "@/lib/language";
import { CardBackgroundPicker, useCardBackground } from "@/components/planner/CardBackgroundPicker";

export const Route=createFileRoute("/proyectos")({head:()=>({meta:[{title:"Proyectos | Planner Inteligente"}]}),component:()=> <AppGate><ProyectosPage/></AppGate>});
const NONE="__none__";

type Filter="activos"|"archivados"|"todos";
function ProyectosPage(){
 const{state,addProject,updateProject,removeProject,visibleSections}=usePlanner();const sections=useSectionMap();const{lang}=useLanguage();
 const[open,setOpen]=useState(false),[editing,setEditing]=useState<Project|null>(null),[name,setName]=useState(""),[description,setDescription]=useState(""),[sectionId,setSectionId]=useState<string>(NONE),[q,setQ]=useState(""),[filter,setFilter]=useState<Filter>("activos");
 const tx=(es:string,en:string)=>lang==="en"?en:es;
 const openDialog=(p:Project|null)=>{setEditing(p);setName(p?.name??"");setDescription(p?.description??"");setSectionId(p?.sectionId??NONE);setOpen(true)};
 const save=()=>{if(!name.trim())return;const data={name:name.trim(),description,sectionId:sectionId===NONE?null:sectionId,color:"terra"};if(editing)updateProject(editing.id,data);else addProject(data);setOpen(false)};
 const projects=useMemo(()=>state.projects.filter(p=>filter==="todos"?true:filter==="archivados"?p.archived:!p.archived).filter(p=>(p.name+" "+p.description).toLowerCase().includes(q.trim().toLowerCase())),[state.projects,filter,q]);
 const activeCount=state.projects.filter(p=>!p.archived).length;
 return <PageShell title={tx("Proyectos","Projects")} subtitle={tx(`${activeCount} en curso`,`${activeCount} active`)} action={<Button className="h-11" onClick={()=>openDialog(null)}><Plus className="h-4 w-4"/>{tx("Nuevo","New")}</Button>}>
   <div className="card-soft flex items-center gap-2 p-3"><Search className="h-5 w-5 text-muted-foreground"/><input value={q} onChange={e=>setQ(e.target.value)} placeholder={tx("Buscar proyecto…","Search project…")} className="w-full bg-transparent outline-none"/></div>
   <Tabs value={filter} onValueChange={v=>setFilter(v as Filter)} className="mt-3"><TabsList className="grid w-full grid-cols-3"><TabsTrigger value="activos">{tx("Activos","Active")}</TabsTrigger><TabsTrigger value="archivados">{tx("Archivados","Archived")}</TabsTrigger><TabsTrigger value="todos">{tx("Todos","All")}</TabsTrigger></TabsList></Tabs>
   {projects.length===0?<p className="card-soft mt-4 p-4 text-sm text-muted-foreground">{tx("No hay proyectos para este filtro.","No projects for this filter.")}</p>:<ul className="mt-4 space-y-2">{projects.map(p=>{const tasks=state.tasks.filter(t=>t.projectId===p.id),done=tasks.filter(t=>t.done).length,section=p.sectionId?sections[p.sectionId]:undefined,progress=tasks.length?Math.round(done/tasks.length*100):0;return <ProjectCard key={p.id} project={p} tasks={tasks} done={done} section={section} progress={progress} tx={tx} openDialog={openDialog} updateProject={updateProject} removeProject={removeProject}/>})}</ul>}
   <Dialog open={open} onOpenChange={setOpen}><DialogContent className="rounded-3xl sm:max-w-md"><DialogHeader><DialogTitle>{editing?tx("Editar proyecto","Edit project"):tx("Nuevo proyecto","New project")}</DialogTitle></DialogHeader><div className="space-y-4"><div className="space-y-2"><Label htmlFor="p-name">{tx("Nombre","Name")}</Label><Input id="p-name" className="h-12" value={name} onChange={e=>setName(e.target.value)} placeholder={tx("Ej: Lanzamiento de otoño","E.g. Autumn launch")}/></div><div className="space-y-2"><Label>{tx("Sección","Section")}</Label><Select value={sectionId} onValueChange={setSectionId}><SelectTrigger className="h-12"><SelectValue placeholder={tx("Sin sección","No section")}/></SelectTrigger><SelectContent><SelectItem value={NONE}>{tx("Sin sección","No section")}</SelectItem>{visibleSections.map(s=><SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent></Select></div><div className="space-y-2"><Label htmlFor="p-desc">{tx("Descripción","Description")}</Label><Textarea id="p-desc" rows={3} value={description} onChange={e=>setDescription(e.target.value)}/></div></div><DialogFooter className="gap-2 sm:gap-2"><Button variant="outline" className="h-12" onClick={()=>setOpen(false)}>{tx("Cancelar","Cancel")}</Button><Button className="h-12" onClick={save} disabled={!name.trim()}>{tx("Guardar","Save")}</Button></DialogFooter></DialogContent></Dialog>
 </PageShell>
}

function ProjectCard({project:p,tasks,done,section,progress,tx,openDialog,updateProject,removeProject}:any){
 const [bg]=useCardBackground(`project:${p.id}`);
 return <li style={{backgroundColor:bg}} className="card-soft relative flex items-start gap-3 p-4"><CardBackgroundPicker storageKey={`project:${p.id}`} className="absolute right-2 top-2"/><div className="min-w-0 flex-1 pr-10"><p className="break-words font-semibold">{p.name}</p>{p.description&&<p className="mt-0.5 text-sm text-muted-foreground">{p.description}</p>}<div className="mt-2 flex flex-wrap items-center gap-2">{section&&<SectionChip name={section.name} color={section.color}/>}<span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">{done}/{tasks.length} {tx("tareas","tasks")}</span><span className="text-xs font-semibold text-muted-foreground">{progress}%</span></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary transition-all" style={{width:`${progress}%`}}/></div></div><div className="flex shrink-0 flex-col gap-1 pt-8"><Button size="icon" variant="ghost" onClick={()=>openDialog(p)}><Pencil className="h-4 w-4"/></Button><Button size="icon" variant="ghost" onClick={()=>updateProject(p.id,{archived:!p.archived})}>{p.archived?<ArchiveRestore className="h-4 w-4"/>:<Archive className="h-4 w-4"/>}</Button><Button size="icon" variant="ghost" onClick={()=>removeProject(p.id)}><Trash2 className="h-4 w-4 text-destructive"/></Button></div></li>
}
