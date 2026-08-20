import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowDown, ArrowLeft, ArrowUp, Plus, Trash2 } from "lucide-react";
import { AppGate } from "@/components/planner/AppGate";
import { PageShell } from "@/components/planner/PageShell";
import { Button } from "@/components/ui/button";
import { usePlanner } from "@/lib/planner/store";
import { useLanguage } from "@/lib/language";
import { CardBackgroundPicker, useCardBackground } from "@/components/planner/CardBackgroundPicker";

export const Route = createFileRoute("/seccion/$id")({ head: () => ({ meta: [{ title: "Sección | Planner Inteligente" }] }), component: () => <AppGate><SeccionListaPage /></AppGate> });

type Item = { id: string; text: string; done: boolean };
const keyFor = (sectionId: string) => `planner-seccion-lista-${sectionId}-v1`;
const read = (sectionId: string): Item[] => { try { return JSON.parse(localStorage.getItem(keyFor(sectionId)) || "[]") } catch { return [] } };

function SeccionListaPage() {
  const { id } = Route.useParams();
  const { state } = usePlanner();
  const { lang } = useLanguage();
  const section = state.sections.find(s => s.id === id);
  const [items, setItems] = useState<Item[]>([]);
  const [text, setText] = useState("");
  useEffect(() => { if (section) setItems(read(section.id)) }, [section?.id]);
  const tx = (es: string, en: string) => lang === "en" ? en : es;

  if (!section) return <AppGate><PageShell title={tx("Sección no encontrada", "Section not found")} subtitle="">
    <Link to="/personalizar" className="card-soft flex items-center gap-2 p-4 font-semibold"><ArrowLeft className="h-4 w-4" /> {tx("Volver a Personalizar", "Back to Customize")}</Link>
  </PageShell></AppGate>;

  if (section.contentType !== "lista") return <PageShell title={section.name} subtitle="">
    <p className="card-soft p-4 text-sm text-muted-foreground">{tx("Esta sección clasifica tareas y proyectos. Buscala desde Tareas o Proyectos con el filtro de sección.", "This section classifies tasks and projects. Find it from Tasks or Projects using the section filter.")}</p>
  </PageShell>;

  const persist = (next: Item[]) => { setItems(next); localStorage.setItem(keyFor(section.id), JSON.stringify(next)) };
  const add = () => { if (!text.trim()) return; persist([...items, { id: crypto.randomUUID(), text: text.trim(), done: false }]); setText("") };
  const toggle = (itemId: string) => persist(items.map(i => i.id === itemId ? { ...i, done: !i.done } : i));
  const setItemText = (itemId: string, v: string) => persist(items.map(i => i.id === itemId ? { ...i, text: v } : i));
  const remove = (itemId: string) => persist(items.filter(i => i.id !== itemId));
  const move = (itemId: string, d: -1 | 1) => { const i = items.findIndex(x => x.id === itemId), j = i + d; if (i < 0 || j < 0 || j >= items.length) return; const next = [...items]; const [it] = next.splice(i, 1); next.splice(j, 0, it!); persist(next) };
  const clearDone = () => persist(items.filter(i => !i.done));
  const doneCount = items.filter(i => i.done).length;

  return <PageShell title={section.name} subtitle={tx(`${items.length - doneCount} pendientes`, `${items.length - doneCount} pending`)}>
    <div className="card-soft flex items-center gap-2 p-3">
      <input value={text} onChange={e => setText(e.target.value)} onKeyDown={e => { if (e.key === "Enter") add() }} placeholder={tx("Agregar…", "Add…")} className="w-full bg-transparent outline-none" />
      <Button size="icon" onClick={add} aria-label={tx("Agregar", "Add")}><Plus className="h-4 w-4" /></Button>
    </div>
    {items.length === 0 ? <p className="card-soft mt-4 p-4 text-sm text-muted-foreground">{tx("Esta lista está vacía.", "This list is empty.")}</p> : <ul className="mt-4 space-y-2">
      {items.map((item, i) => <SectionListItem key={item.id} sectionId={section.id} item={item} i={i} itemsLength={items.length} tx={tx} toggle={toggle} setItemText={setItemText} move={move} remove={remove}/>)}
    </ul>}
    {doneCount > 0 && <Button variant="outline" className="mt-4 h-12 w-full" onClick={clearDone}><Trash2 className="h-4 w-4" /> {tx(`Borrar los ${doneCount} tildados`, `Clear ${doneCount} checked`)}</Button>}
  </PageShell>;
}

function SectionListItem({sectionId,item,i,itemsLength,tx,toggle,setItemText,move,remove}:any){
 const [bg]=useCardBackground(`section:${sectionId}:item:${item.id}`);
 return <li style={{backgroundColor:bg}} className="card-soft relative flex items-center gap-2 p-3 pr-12"><CardBackgroundPicker storageKey={`section:${sectionId}:item:${item.id}`} className="absolute right-2 top-2"/><button type="button" onClick={()=>toggle(item.id)} className={`grid h-7 w-7 shrink-0 place-items-center rounded-full border-2 ${item.done?"border-primary bg-primary text-primary-foreground":"border-border"}`}>{item.done?"✓":""}</button><input value={item.text} onChange={e=>setItemText(item.id,e.target.value)} className={`min-w-0 flex-1 bg-transparent outline-none ${item.done?"text-muted-foreground line-through":""}`}/><div className="flex shrink-0 gap-0.5"><Button size="icon" variant="ghost" onClick={()=>move(item.id,-1)} disabled={i===0}><ArrowUp className="h-4 w-4"/></Button><Button size="icon" variant="ghost" onClick={()=>move(item.id,1)} disabled={i===itemsLength-1}><ArrowDown className="h-4 w-4"/></Button><Button size="icon" variant="ghost" onClick={()=>remove(item.id)}><Trash2 className="h-4 w-4 text-destructive"/></Button></div></li>
}
