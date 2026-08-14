import { useEffect, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ImagePlus, Pencil, Save, SmilePlus, Trash2 } from "lucide-react";
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

const HTML_KEY = "planner-notas-html-v1";
const DRAW_KEY = "planner-notas-dibujo-v1";

function NotasPage() {
  const editorRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [drawing, setDrawing] = useState(false);
  const [saved, setSaved] = useState(true);

  useEffect(() => {
    const editor = editorRef.current;
    if (editor) editor.innerHTML = localStorage.getItem(HTML_KEY) ?? "";

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const image = localStorage.getItem(DRAW_KEY);
    if (ctx && image) {
      const img = new Image();
      img.onload = () => ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      img.src = image;
    }
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !drawing) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#26352E";
    let active = false;

    const point = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      return {
        x: ((event.clientX - rect.left) / rect.width) * canvas.width,
        y: ((event.clientY - rect.top) / rect.height) * canvas.height,
      };
    };
    const down = (event: PointerEvent) => {
      active = true;
      const p = point(event);
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      canvas.setPointerCapture(event.pointerId);
    };
    const move = (event: PointerEvent) => {
      if (!active) return;
      const p = point(event);
      ctx.lineTo(p.x, p.y);
      ctx.stroke();
      setSaved(false);
    };
    const up = () => {
      active = false;
    };

    canvas.addEventListener("pointerdown", down);
    canvas.addEventListener("pointermove", move);
    canvas.addEventListener("pointerup", up);
    canvas.addEventListener("pointercancel", up);
    return () => {
      canvas.removeEventListener("pointerdown", down);
      canvas.removeEventListener("pointermove", move);
      canvas.removeEventListener("pointerup", up);
      canvas.removeEventListener("pointercancel", up);
    };
  }, [drawing]);

  const save = () => {
    localStorage.setItem(HTML_KEY, editorRef.current?.innerHTML ?? "");
    const canvas = canvasRef.current;
    if (canvas) localStorage.setItem(DRAW_KEY, canvas.toDataURL("image/png"));
    setSaved(true);
  };

  const insertSticker = (sticker: string) => {
    const editor = editorRef.current;
    if (!editor) return;
    editor.focus();
    document.execCommand("insertText", false, sticker);
    setSaved(false);
  };

  const addImage = (file?: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const editor = editorRef.current;
      if (!editor) return;
      editor.focus();
      document.execCommand("insertHTML", false, `<img src="${reader.result}" alt="Imagen de nota" style="max-width:100%;border-radius:16px;margin:12px 0;" />`);
      setSaved(false);
    };
    reader.readAsDataURL(file);
  };

  const clearAll = () => {
    if (editorRef.current) editorRef.current.innerHTML = "";
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (canvas && ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    localStorage.removeItem(HTML_KEY);
    localStorage.removeItem(DRAW_KEY);
    setSaved(true);
  };

  return (
    <PageShell title="Notas" subtitle="Tocá el lienzo y trabajá directamente ahí">
      <div className="mb-3 flex flex-wrap gap-2">
        <Button variant={drawing ? "default" : "outline"} className="h-11" onClick={() => setDrawing((v) => !v)}>
          <Pencil className="h-4 w-4" /> {drawing ? "Dibujando" : "Dibujar"}
        </Button>
        <Button variant="outline" className="h-11" onClick={() => fileRef.current?.click()}>
          <ImagePlus className="h-4 w-4" /> Imagen
        </Button>
        <Button variant="outline" className="h-11" onClick={() => insertSticker("🌿")}>
          <SmilePlus className="h-4 w-4" /> Sticker
        </Button>
        <Button className="h-11" onClick={save}>
          <Save className="h-4 w-4" /> {saved ? "Guardado" : "Guardar"}
        </Button>
        <Button variant="ghost" className="h-11 text-destructive" onClick={clearAll}>
          <Trash2 className="h-4 w-4" /> Limpiar
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => addImage(e.target.files?.[0])}
        />
      </div>

      <p className="mb-3 text-sm text-muted-foreground">
        Podés escribir, seleccionar texto, cortar, copiar y pegar como en una nota normal. También podés insertar imágenes y stickers o activar el modo dibujo.
      </p>

      <div className="relative min-h-[68vh] overflow-hidden rounded-[1.6rem] border border-border bg-card shadow-[0_12px_30px_rgba(38,53,46,0.08)]">
        <div
          ref={editorRef}
          contentEditable={!drawing}
          suppressContentEditableWarning
          onInput={() => setSaved(false)}
          className="relative z-10 min-h-[68vh] px-5 py-5 text-base leading-7 outline-none empty:before:text-muted-foreground empty:before:content-['Tocá_acá_y_empezá_a_escribir...']"
        />
        <canvas
          ref={canvasRef}
          width={900}
          height={1200}
          className={`absolute inset-0 h-full w-full touch-none ${drawing ? "z-20 cursor-crosshair" : "pointer-events-none z-0"}`}
        />
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {["🌱", "⭐", "❤️", "✅", "📌", "💡", "🌸", "☀️"].map((s) => (
          <button
            key={s}
            onClick={() => insertSticker(s)}
            className="grid h-11 w-11 place-items-center rounded-xl border border-border bg-card text-xl"
            aria-label={`Insertar ${s}`}
          >
            {s}
          </button>
        ))}
      </div>
    </PageShell>
  );
}
