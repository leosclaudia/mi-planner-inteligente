import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

/**
 * Sincronización entre dispositivos.
 *
 * Estrategia: la app sigue siendo local-first (todo vive en localStorage y
 * funciona sin conexión). Esta capa toma una "foto" de todas las claves del
 * planner (planner state, notas/lienzo HTML y dibujos manuscritos) y la sube a
 * la tabla `planner_sync` del usuario. Al abrir la app en otro dispositivo se
 * baja la foto más reciente. Conflictos simples: gana el último cambio.
 */

const SYNC_PREFIXES = ["planner-inteligente-", "planner-lienzo-", "planner-dibujo-"];
const META_KEY = "planner-sync-meta-v1";
const POLL_MS = 2000;
const PUSH_DEBOUNCE_MS = 1200;
const PULL_INTERVAL_MS = 30000;

export type SyncStatus = "offline" | "local" | "syncing" | "saved" | "error";

type Snapshot = Record<string, string>;
interface Meta {
  hash: string;
  remoteUpdatedAt: string | null;
  localChangedAt: number;
  userId: string | null;
}

function readSnapshot(): Snapshot {
  const out: Snapshot = {};
  if (typeof localStorage === "undefined") return out;
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key || !SYNC_PREFIXES.some((p) => key.startsWith(p))) continue;
    const value = localStorage.getItem(key);
    if (value != null) out[key] = value;
  }
  return out;
}

function applySnapshot(snap: Snapshot) {
  const current = readSnapshot();
  for (const key of Object.keys(current)) {
    if (!(key in snap)) localStorage.removeItem(key);
  }
  for (const [key, value] of Object.entries(snap)) localStorage.setItem(key, value);
}

function hashOf(snap: Snapshot): string {
  const text = JSON.stringify(Object.keys(snap).sort().map((k) => [k, snap[k]]));
  let h = 5381;
  for (let i = 0; i < text.length; i++) h = ((h << 5) + h + text.charCodeAt(i)) | 0;
  return `${h}:${text.length}`;
}

function readMeta(): Meta {
  try {
    const raw = localStorage.getItem(META_KEY);
    if (raw) return { ...emptyMeta(), ...(JSON.parse(raw) as Meta) };
  } catch {
    /* ignore */
  }
  return emptyMeta();
}

function emptyMeta(): Meta {
  return { hash: "", remoteUpdatedAt: null, localChangedAt: 0, userId: null };
}

function writeMeta(meta: Meta) {
  try {
    localStorage.setItem(META_KEY, JSON.stringify(meta));
  } catch {
    /* ignore */
  }
}

interface Ctx {
  session: Session | null;
  status: SyncStatus;
  lastSyncedAt: number | null;
  authReady: boolean;
  syncNow: () => Promise<void>;
  signOut: () => Promise<void>;
}

const SyncContext = createContext<Ctx | null>(null);

export function SyncProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [status, setStatus] = useState<SyncStatus>("local");
  const [lastSyncedAt, setLastSyncedAt] = useState<number | null>(null);
  const metaRef = useRef<Meta>(emptyMeta());
  const pushTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const busy = useRef(false);

  useEffect(() => {
    metaRef.current = readMeta();
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setAuthReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      setAuthReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const push = useCallback(async (userId: string) => {
    if (busy.current) return;
    busy.current = true;
    setStatus("syncing");
    try {
      const snap = readSnapshot();
      const { data, error } = await supabase
        .from("planner_sync")
        .upsert({ user_id: userId, data: snap as never }, { onConflict: "user_id" })
        .select("updated_at")
        .single();
      if (error) throw error;
      metaRef.current = {
        hash: hashOf(snap),
        remoteUpdatedAt: data?.updated_at ?? new Date().toISOString(),
        localChangedAt: 0,
        userId,
      };
      writeMeta(metaRef.current);
      setLastSyncedAt(Date.now());
      setStatus(navigator.onLine ? "saved" : "offline");
    } catch {
      setStatus(navigator.onLine ? "error" : "offline");
    } finally {
      busy.current = false;
    }
  }, []);

  const pull = useCallback(
    async (userId: string) => {
      if (busy.current || !navigator.onLine) return;
      busy.current = true;
      setStatus("syncing");
      try {
        const { data, error } = await supabase
          .from("planner_sync")
          .select("data, updated_at")
          .eq("user_id", userId)
          .maybeSingle();
        if (error) throw error;

        const local = readSnapshot();
        const localHash = hashOf(local);
        const meta = metaRef.current;
        const sameUser = meta.userId === userId;
        const pendingLocal = !sameUser || meta.hash !== localHash;

        // Primera vez en la nube: subimos lo que ya había en este navegador.
        if (!data) {
          busy.current = false;
          await push(userId);
          return;
        }

        const remote = (data.data ?? {}) as Snapshot;
        const remoteAt = new Date(data.updated_at).getTime();
        const localAt = pendingLocal ? meta.localChangedAt || Date.now() : 0;

        if (remoteAt >= localAt) {
          if (hashOf(remote) !== localHash) {
            applySnapshot(remote);
            metaRef.current = {
              hash: hashOf(remote),
              remoteUpdatedAt: data.updated_at,
              localChangedAt: 0,
              userId,
            };
            writeMeta(metaRef.current);
            window.location.reload();
            return;
          }
          metaRef.current = {
            hash: localHash,
            remoteUpdatedAt: data.updated_at,
            localChangedAt: 0,
            userId,
          };
          writeMeta(metaRef.current);
          setLastSyncedAt(Date.now());
          setStatus("saved");
        } else {
          busy.current = false;
          await push(userId);
          return;
        }
      } catch {
        setStatus(navigator.onLine ? "error" : "offline");
      } finally {
        busy.current = false;
      }
    },
    [push],
  );

  // Login / cambio de usuario -> traer o migrar datos.
  const userId = session?.user.id ?? null;
  useEffect(() => {
    if (!userId) {
      setStatus("local");
      return;
    }
    void pull(userId);
  }, [userId, pull]);

  // Detectar cambios locales y empujarlos.
  useEffect(() => {
    if (!userId) return;
    const tick = () => {
      const snap = readSnapshot();
      const h = hashOf(snap);
      if (h === metaRef.current.hash) return;
      metaRef.current = { ...metaRef.current, localChangedAt: Date.now(), userId };
      writeMeta(metaRef.current);
      if (!navigator.onLine) {
        setStatus("offline");
        return;
      }
      setStatus("syncing");
      if (pushTimer.current) clearTimeout(pushTimer.current);
      pushTimer.current = setTimeout(() => void push(userId), PUSH_DEBOUNCE_MS);
    };
    const id = setInterval(tick, POLL_MS);
    return () => {
      clearInterval(id);
      if (pushTimer.current) clearTimeout(pushTimer.current);
    };
  }, [userId, push]);

  // Reconexión, foco y refresco periódico.
  useEffect(() => {
    if (!userId) return;
    const onOnline = () => void pull(userId);
    const onFocus = () => {
      if (document.visibilityState === "visible") void pull(userId);
    };
    const onOffline = () => setStatus("offline");
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    document.addEventListener("visibilitychange", onFocus);
    const id = setInterval(() => void pull(userId), PULL_INTERVAL_MS);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
      document.removeEventListener("visibilitychange", onFocus);
      clearInterval(id);
    };
  }, [userId, pull]);

  const value: Ctx = {
    session,
    status,
    lastSyncedAt,
    authReady,
    syncNow: async () => {
      if (userId) await pull(userId);
    },
    signOut: async () => {
      if (userId && navigator.onLine) await push(userId);
      await supabase.auth.signOut();
      metaRef.current = emptyMeta();
      writeMeta(metaRef.current);
      setStatus("local");
    },
  };

  return <SyncContext.Provider value={value}>{children}</SyncContext.Provider>;
}

export function useSync() {
  const ctx = useContext(SyncContext);
  if (!ctx) throw new Error("useSync debe usarse dentro de SyncProvider");
  return ctx;
}
