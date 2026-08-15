import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Cloud, LogOut, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { PageShell } from "@/components/planner/PageShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useSync } from "@/lib/planner/sync";

export const Route = createFileRoute("/cuenta")({
  head: () => ({
    meta: [
      { title: "Mi cuenta y sincronización | Planner Inteligente" },
      {
        name: "description",
        content:
          "Creá tu cuenta para sincronizar tareas, notas, agenda y secciones entre celular, tablet y computadora.",
      },
      { property: "og:title", content: "Mi cuenta y sincronización" },
      {
        property: "og:description",
        content: "Sincronizá tu planner entre todos tus dispositivos con una cuenta gratuita.",
      },
    ],
  }),
  component: CuentaPage,
});

function CuentaPage() {
  const { session, status, signOut, syncNow, authReady } = useSync();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        toast.success("Cuenta creada. Ya podés usar el planner sincronizado.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (error) throw error;
        toast.success("Sesión iniciada. Sincronizando tus datos…");
      }
      setPassword("");
    } catch (error) {
      const message = error instanceof Error ? error.message : "No se pudo completar";
      toast.error(
        message.includes("Invalid login")
          ? "Email o contraseña incorrectos"
          : message.includes("already registered")
            ? "Ese email ya tiene cuenta. Iniciá sesión."
            : message,
      );
    } finally {
      setLoading(false);
    }
  };

  if (!authReady) {
    return (
      <PageShell title="Mi cuenta" subtitle="Sincronización">
        <div className="grid place-items-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-primary" />
        </div>
      </PageShell>
    );
  }

  if (session) {
    return (
      <PageShell title="Mi cuenta" subtitle="Sincronización activa">
        <section className="card-soft p-4">
          <div className="flex items-start gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-olive-soft text-olive">
              <Cloud className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <p className="truncate font-semibold">{session.user.email}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Estado:{" "}
                {status === "syncing"
                  ? "Sincronizando…"
                  : status === "offline"
                    ? "Sin conexión (se guarda en este equipo)"
                    : status === "error"
                      ? "Reintentando"
                      : "Guardado en la nube"}
              </p>
            </div>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            Se sincronizan tareas, proyectos, agenda, secciones, onboarding y las notas del
            lienzo (texto con formato, dibujos manuscritos, stickers e imágenes).
          </p>
          <Button variant="outline" className="mt-4 h-12 w-full" onClick={() => void syncNow()}>
            <RefreshCw className="h-4 w-4" /> Sincronizar ahora
          </Button>
          <Button
            variant="outline"
            className="mt-2 h-12 w-full text-destructive"
            onClick={() => void signOut()}
          >
            <LogOut className="h-4 w-4" /> Cerrar sesión
          </Button>
        </section>
      </PageShell>
    );
  }

  return (
    <PageShell title="Mi cuenta" subtitle="Sincronizá entre dispositivos">
      <form onSubmit={submit} className="card-soft space-y-4 p-4">
        <p className="text-sm text-muted-foreground">
          Con tu cuenta vas a ver el mismo planner en el celular, la tablet y la compu. Lo que
          ya tenés guardado en este navegador se sube automáticamente la primera vez.
        </p>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            required
            className="h-12"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tu@email.com"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Contraseña</Label>
          <Input
            id="password"
            type="password"
            required
            minLength={6}
            className="h-12"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Mínimo 6 caracteres"
          />
        </div>
        <Button type="submit" className="h-12 w-full" disabled={loading}>
          {loading ? "Un momento…" : mode === "login" ? "Iniciar sesión" : "Crear cuenta"}
        </Button>
        <button
          type="button"
          className="w-full text-sm font-semibold text-primary"
          onClick={() => setMode(mode === "login" ? "signup" : "login")}
        >
          {mode === "login" ? "No tengo cuenta, quiero crear una" : "Ya tengo cuenta"}
        </button>
      </form>
    </PageShell>
  );
}
