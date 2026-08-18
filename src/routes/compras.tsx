import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
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
  useEffect(() => setItems(read()), []);
  const persist = (next: Item[]) => { setItems(next); localStorage.setItem(KEY, JSON.stringify(next)) };
  const add = () => { if (!text.trim()) return; persist([...items, { id: crypto.randomUUID(), text: text.trim(), done: false }]); setText("") };
  const toggle = (id: string) => persist(items.map(i => i.id === id ? { ...i, done: !i.done } : i));
  const setItemText = (id: string, v: string) => persist(items.map(i => i.id === id ? { ...i, text: v } : i));
  const remove = (id: string) => persist(items.filter(i => i.id !== id));
  const move = (id: string, d: -1 | 1) => { const i = items.findIndex(x => x.id === id), j = i + d; if (i < 0 || j < 0 || j >= items.length) return; const next = [...items]; const [it] = next.splice(i, 1); next.splice(j, 0, it!); persist(next) };
  const clearDone = () => persist(items.filter(i => !i.done));
  const doneCount = items.filter(i => i.done).length;
  const tx = (es: string, en: string) => lang === "en" ? en : es;

  return <PageShell title={tx("Compras", "Shopping")} subtitle={tx(`${items.length - doneCount} pendientes`, `${items.length - doneCount} pending`)}>
    <div className="card-soft flex items-center gap-2 p-3">
      <input value={text} onChange={e => setText(e.target.value)} onKeyDown={e => { if (e.key === "Enter") add() }} placeholder={tx("Agregar a la lista…", "Add to list…")} className="w-full bg-transparent outline-none" />
      <Button size="icon" onClick={add} aria-label={tx("Agregar", "Add")}><Plus className="h-4 w-4" /></Button>
    </div>
    {items.length === 0 ? <p className="card-soft mt-4 p-4 text-sm text-muted-foreground">{tx("Tu lista está vacía.", "Your list is empty.")}</p> : <ul className="mt-4 space-y-2">
      {items.map((item, i) => <li key={item.id} className="card-soft flex items-center gap-2 p-3">
        <button type="button" onClick={() => toggle(item.id)} aria-label={tx("Tildar", "Check")} className={`grid h-7 w-7 shrink-0 place-items-center rounded-full border-2 ${item.done ? "border-primary bg-primary text-primary-foreground" : "border-border"}`}>{item.done ? "✓" : ""}</button>
        <input value={item.text} onChange={e => setItemText(item.id, e.target.value)} placeholder={tx("Ej: Leche", "E.g. Milk")} className={`min-w-0 flex-1 bg-transparent outline-none ${item.done ? "text-muted-foreground line-through" : ""}`} />
        <div className="flex shrink-0 gap-0.5">
          <Button size="icon" variant="ghost" aria-label={tx("Subir", "Move up")} onClick={() => move(item.id, -1)} disabled={i === 0}><ArrowUp className="h-4 w-4" /></Button>
          <Button size="icon" variant="ghost" aria-label={tx("Bajar", "Move down")} onClick={() => move(item.id, 1)} disabled={i === items.length - 1}><ArrowDown className="h-4 w-4" /></Button>
          <Button size="icon" variant="ghost" aria-label={tx("Eliminar", "Delete")} onClick={() => remove(item.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
        </div>
      </li>)}
    </ul>}
    {doneCount > 0 && <Button variant="outline" className="mt-4 h-12 w-full" onClick={clearDone}><Trash2 className="h-4 w-4" /> {tx(`Borrar los ${doneCount} tildados`, `Clear ${doneCount} checked`)}</Button>}
  </PageShell>;
}
