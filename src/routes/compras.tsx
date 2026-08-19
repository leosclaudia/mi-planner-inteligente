import { useEffect, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { GripVertical, Plus, Trash2 } from "lucide-react";
import { AppGate } from "@/components/planner/AppGate";
import { PageShell } from "@/components/planner/PageShell";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/lib/language";

export const Route = createFileRoute("/compras")({ head: () => ({ meta: [{ title: "Compras | Planner Inteligente" }] }), component: () => <AppGate><ComprasPage /></AppGate> });

type Item = { id: string; text: string; done: boolean };
const KEY = "planner-compras-v1";
const read = (): Item[] => { try { return JSON.parse(localStorage.getItem(KEY) || "[]") } catch { return [] } };

function ComprasPage() {
  const { lang } = useLanguage();
  const [items, setItems] = useState<Item[]>([]);
  const [text, setText] = useState("");
  const dragId = useRef<string | null>(null);
  useEffect(() => setItems(read()), []);
  const persist = (next: Item[]) => { setItems(next); localStorage.setItem(KEY, JSON.stringify(next)) };
  const add = () => { if (!text.trim()) return; persist([...items, { id: crypto.randomUUID(), text: text.trim(), done: false }]); setText("") };
  const toggle = (id: string) => persist(items.map(i => i.id === id ? { ...i, done: !i.done } : i));
  const setItemText = (id: string, v: string) => persist(items.map(i => i.id === id ? { ...i, text: v } : i));
  const remove = (id: string) => persist(items.filter(i => i.id !== id));
  const clearDone = () => persist(items.filter(i => !i.done));
  const doneCount = items.filter(i => i.done).length;
  const tx = (es: string, en: string) => lang === "en" ? en : es;

  const startDrag = (id: string, e: React.PointerEvent) => { dragId.current = id; (e.target as HTMLElement).setPointerCapture?.(e.pointerId) };
  const overDrag = (e: React.PointerEvent) => {
    if (!dragId.current) return;
    const el = document.elementFromPoint(e.clientX, e.clientY)?.closest<HTMLElement>("[data-item-id]");
    const overId = el?.dataset.itemId;
    if (!overId || overId === dragId.current) return;
    setItems(prev => { const a = [...prev]; const from = a.findIndex(i => i.id === dragId.current), to = a.findIndex(i => i.id === overId); if (from < 0 || to < 0) return prev; const [it] = a.splice(from, 1); a.splice(to, 0, it!); return a });
  };
  const endDrag = () => { if (!dragId.current) return; dragId.current = null; localStorage.setItem(KEY, JSON.stringify(items)) };

  return <PageShell title={tx("Compras", "Shopping")} subtitle={tx(`${items.length - doneCount} pendientes`, `${items.length - doneCount} pending`)}>
    <div className="card-soft flex items-center gap-2 p-3">
      <input value={text} onChange={e => setText(e.target.value)} onKeyDown={e => { if (e.key === "Enter") add() }} placeholder={tx("Agregar a la lista…", "Add to list…")} className="w-full bg-transparent outline-none" />
      <Button size="icon" onClick={add} aria-label={tx("Agregar", "Add")}><Plus className="h-4 w-4" /></Button>
    </div>
    {items.length === 0 ? <p className="card-soft mt-4 p-4 text-sm text-muted-foreground">{tx("Tu lista está vacía.", "Your list is empty.")}</p> : <ul className="mt-4 space-y-2" onPointerMove={overDrag} onPointerUp={endDrag} onPointerCancel={endDrag}>
      {items.map(item => <li key={item.id} data-item-id={item.id} className="card-soft flex items-center gap-2 p-3">
        <span onPointerDown={e => startDrag(item.id, e)} className="shrink-0 cursor-grab touch-none text-muted-foreground" aria-label={tx("Arrastrar para reordenar", "Drag to reorder")}><GripVertical className="h-5 w-5" /></span>
        <button type="button" onClick={() => toggle(item.id)} aria-label={tx("Tildar", "Check")} className={`grid h-7 w-7 shrink-0 place-items-center rounded-full border-2 ${item.done ? "border-primary bg-primary text-primary-foreground" : "border-border"}`}>{item.done ? "✓" : ""}</button>
        <input value={item.text} onChange={e => setItemText(item.id, e.target.value)} placeholder={tx("Ej: Leche", "E.g. Milk")} className={`min-w-0 flex-1 bg-transparent outline-none ${item.done ? "text-muted-foreground line-through" : ""}`} />
        <Button size="icon" variant="ghost" aria-label={tx("Eliminar", "Delete")} onClick={() => remove(item.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
      </li>)}
    </ul>}
    {doneCount > 0 && <Button variant="outline" className="mt-4 h-12 w-full" onClick={clearDone}><Trash2 className="h-4 w-4" /> {tx(`Borrar los ${doneCount} tildados`, `Clear ${doneCount} checked`)}</Button>}
  </PageShell>;
}
