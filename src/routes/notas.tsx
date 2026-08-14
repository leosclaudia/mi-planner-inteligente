import { useEffect, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  AlignCenter,
  AlignLeft,
  Bold,
  Clipboard,
  Copy,
  ImagePlus,
  Italic,
  List,
  Paintbrush,
  Scissors,
  SmilePlus,
  Trash2,
  Underline,
} from "lucide-react";
import { AppGate } from "@/components/planner/AppGate";
import { PageShell } from "@/components/planner/PageShell";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/notas")({
  component: () => (
    <AppGate>
      <NotasPage />
    </AppGate>
  ),
});

type BoxId = "hoy" | "prioridades" | "recordatorios" | "libre";
const BOXES: { id: BoxId; title: string; tone: string; placeholder: string }[] = [
  { id: "hoy", title: "HOY", tone: "bg-[#DCE5DA]", placeholder: "Tocá acá y escribí..." },
  { id: "prioridades", title: "PRIORIDADES", tone: "bg-[#EFE0D5]", placeholder: "Ideas, prioridades, listas..." },
  { id: "recordatorios", title: "RECORDATORIOS", tone: "bg-[#DCE5DA]", placeholder: "Cosas para no olvidar..." },
  { id: "libre", title: "LIENZO LIBRE", tone: "bg-[#EEE8DE]", placeholder: "Texto, imágenes, stickers..." },
];

function storageKey(id: BoxId) {
  return `planner-lienzo-${id}-v2`;
}

function NotasPage() {
  const refs = useRef<Record<BoxId, HTMLDivElement | null>>({ hoy: null, prioridades: null, recordatorios: null, libre: null });
  const fileRef = useRef<HTMLInputElement>(null);
  const [active, setActive] = useState<BoxId>("hoy");
  const [copiedHtml, setCopiedHtml] = useState("");

  useEffect(() => {
    BOXES.forEach(({ id }) => {
      const el = refs.current[id];
      if (el) el.innerHTML = localStorage.getItem(storageKey(id)) ?? "";
    });
  }, []);

  const saveBox = (id: BoxId) => {
    const el = refs.current[id];
    if (el) localStorage.setItem(storageKey(id), el.innerHTML);
  };

  const command = (cmd: string, value?: string) => {
    refs.current[active]?.focus();
    document.execCommand(cmd, false, value);
    saveBox(active);
  };

  const insertSticker = (sticker: string) => {
    refs.current[active]?.focus();
    document.execCommand("insertText", false, sticker);
    saveBox(active);
  };

  const addImage = (file?: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      refs.current[active]?.focus();
      document.execCommand(
        "insertHTML",
        false,
        `<img src="${reader.result}" alt="Imagen" draggable="true" style="display:block;max-width:90%;height:auto;margin:12px auto;border-radius:14px;box-shadow:0 4px 14px rgba(38,53,46,.12);" />`,
      );
      saveBox(active);
    };
    reader.readAsDataURL(file);
  };

  const copyBox = () => {
    const html = refs.current[active]?.innerHTML ?? "";
    setCopiedHtml(html);
  };

  const cutBox = () => {
    const el = refs.current[active];
    if (!el) return;
    setCopiedHtml(el.innerHTML);
    el.innerHTML = "";
    saveBox(active);
  };

  const pasteBox = () => {
    const el = refs.current[active];
    if (!el || !copiedHtml) return;
    el.insertAdjacentHTML("beforeend", copiedHtml);
    saveBox(active);
  };

  const clearBox = () => {
    const el = refs.current[active];
    if (!el) return;
    el.innerHTML = "";
    saveBox(active);
  };

  return (
    <PageShell title="Notas" subtitle="Cada caja es tu lienzo: tocá y editá directamente">
      <div className="sticky top-0 z-30 -mx-4 mb-4 border-y border-border bg-background/95 px-4 py-3 backdrop-blur">
        <div className="flex gap-2 overflow-x-auto pb-1">
          <Tool label="Cortar" onClick={cutBox}><Scissors className="h-5 w-5" /></Tool>
          <Tool label="Copiar" onClick={copyBox}><Copy className="h-5 w-5" /></Tool>
          <Tool label="Pegar" onClick={pasteBox}><Clipboard className="h-5 w-5" /></Tool>
          <Tool label="Negrita" onClick={() => command("bold")}><Bold className="h-5 w-5" /></Tool>
          <Tool label="Cursiva" onClick={() => command("italic")}><Italic className="h-5 w-5" /></Tool>
          <Tool label="Subrayar" onClick={() => command("underline")}><Underline className="h-5 w-5" /></Tool>
          <Tool label="Izquierda" onClick={() => command("justifyLeft")}><AlignLeft className="h-5 w-5" /></Tool>
          <Tool label="Centrar" onClick={() => command("justifyCenter")}><AlignCenter className="h-5 w-5" /></Tool>
          <Tool label="Lista" onClick={() => command("insertUnorderedList")}><List className="h-5 w-5" /></Tool>
          <Tool label="Imagen" onClick={() => fileRef.current?.click()}><ImagePlus className="h-5 w-5" /></Tool>
          <Tool label="Sticker" onClick={() => insertSticker("✨")}><SmilePlus className="h-5 w-5" /></Tool>
          <Tool label="Color" onClick={() => command("foreColor", "#486150")}><Paintbrush className="h-5 w-5" /></Tool>
          <Tool label="Borrar" onClick={clearBox}><Trash2 className="h-5 w-5" /></Tool>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">Caja activa: <strong>{BOXES.find((b) => b.id === active)?.title}</strong>. Cortar/copiar/pegar permite pasar contenido entre cajas.</p>
      </div>

      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => addImage(e.target.files?.[0])} />

      <div className="space-y-4">
        {BOXES.map((box) => (
          <section
            key={box.id}
            className={`overflow-hidden rounded-[1.5rem] border bg-card shadow-[0_8px_24px_rgba(38,53,46,.08)] ${active === box.id ? "border-primary ring-2 ring-primary/15" : "border-border"}`}
            onPointerDown={() => setActive(box.id)}
          >
            <div className={`${box.tone} border-b border-border px-4 py-3 text-sm font-extrabold tracking-wide text-primary`}>{box.title}</div>
            <div
              ref={(el) => { refs.current[box.id] = el; }}
              contentEditable
              suppressContentEditableWarning
              onFocus={() => setActive(box.id)}
              onInput={() => saveBox(box.id)}
              className="min-h-32 px-4 py-4 text-base leading-7 outline-none empty:before:text-muted-foreground empty:before:content-[attr(data-placeholder)]"
              data-placeholder={box.placeholder}
            />
          </section>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {["🌿", "⭐", "❤️", "✅", "📌", "💡", "🌸", "☀️", "🎯", "📝"].map((s) => (
          <Button key={s} variant="outline" className="h-11 w-11 p-0 text-xl" onClick={() => insertSticker(s)}>{s}</Button>
        ))}
      </div>
    </PageShell>
  );
}

function Tool({ children, label, onClick }: { children: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="flex min-w-[62px] flex-col items-center justify-center gap-1 rounded-xl border border-border bg-card px-2 py-2 text-primary shadow-sm">
      {children}
      <span className="text-[11px] font-bold">{label}</span>
    </button>
  );
}
