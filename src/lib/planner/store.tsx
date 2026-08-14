import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { PlannerState, Project, Section, Task } from "./types";

const STORAGE_KEY = "planner-inteligente-v1";

const EMPTY: PlannerState = {
  settings: { plannerName: "Mi Planner", ownerName: "", onboarded: false },
  sections: [],
  projects: [],
  tasks: [],
};

interface Ctx {
  state: PlannerState;
  hydrated: boolean;
  visibleSections: Section[];
  setSettings: (patch: Partial<PlannerState["settings"]>) => void;
  resetAll: () => void;
  replaceState: (s: PlannerState) => void;
  // sections
  addSection: (s: Omit<Section, "id" | "order">) => void;
  updateSection: (id: string, patch: Partial<Section>) => void;
  removeSection: (id: string) => void;
  moveSection: (id: string, dir: -1 | 1) => void;
  // projects
  addProject: (p: Omit<Project, "id" | "createdAt" | "archived">) => void;
  updateProject: (id: string, patch: Partial<Project>) => void;
  removeProject: (id: string) => void;
  // tasks
  addTask: (t: Partial<Task> & { title: string }) => void;
  updateTask: (id: string, patch: Partial<Task>) => void;
  toggleTask: (id: string) => void;
  removeTask: (id: string) => void;
}

const PlannerContext = createContext<Ctx | null>(null);

export function PlannerProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<PlannerState>(EMPTY);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as PlannerState;
        setState({ ...EMPTY, ...parsed });
      }
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* ignore */
    }
  }, [state, hydrated]);

  const api = useMemo<Ctx>(() => {
    const patchState = (fn: (s: PlannerState) => PlannerState) => setState(fn);
    return {
      state,
      hydrated,
      visibleSections: [...state.sections]
        .filter((s) => !s.hidden)
        .sort((a, b) => a.order - b.order),
      setSettings: (patch) =>
        patchState((s) => ({ ...s, settings: { ...s.settings, ...patch } })),
      resetAll: () => setState({ ...EMPTY }),
      replaceState: (next) => setState(next),
      addSection: (sec) =>
        patchState((s) => ({
          ...s,
          sections: [
            ...s.sections,
            { ...sec, id: crypto.randomUUID(), order: s.sections.length },
          ],
        })),
      updateSection: (id, patch) =>
        patchState((s) => ({
          ...s,
          sections: s.sections.map((x) => (x.id === id ? { ...x, ...patch } : x)),
        })),
      removeSection: (id) =>
        patchState((s) => ({
          ...s,
          sections: s.sections.filter((x) => x.id !== id),
          tasks: s.tasks.map((t) => (t.sectionId === id ? { ...t, sectionId: null } : t)),
          projects: s.projects.map((p) =>
            p.sectionId === id ? { ...p, sectionId: null } : p,
          ),
        })),
      moveSection: (id, dir) =>
        patchState((s) => {
          const ordered = [...s.sections].sort((a, b) => a.order - b.order);
          const i = ordered.findIndex((x) => x.id === id);
          const j = i + dir;
          if (i < 0 || j < 0 || j >= ordered.length) return s;
          const a = ordered[i]!;
          const b = ordered[j]!;
          ordered[i] = b;
          ordered[j] = a;
          return {
            ...s,
            sections: ordered.map((x, idx) => ({ ...x, order: idx })),
          };
        }),
      addProject: (p) =>
        patchState((s) => ({
          ...s,
          projects: [
            ...s.projects,
            {
              ...p,
              id: crypto.randomUUID(),
              archived: false,
              createdAt: new Date().toISOString(),
            },
          ],
        })),
      updateProject: (id, patch) =>
        patchState((s) => ({
          ...s,
          projects: s.projects.map((x) => (x.id === id ? { ...x, ...patch } : x)),
        })),
      removeProject: (id) =>
        patchState((s) => ({
          ...s,
          projects: s.projects.filter((x) => x.id !== id),
          tasks: s.tasks.map((t) => (t.projectId === id ? { ...t, projectId: null } : t)),
        })),
      addTask: (t) =>
        patchState((s) => ({
          ...s,
          tasks: [
            {
              id: crypto.randomUUID(),
              title: t.title,
              notes: t.notes ?? "",
              date: t.date ?? null,
              done: false,
              priority: t.priority ?? "media",
              sectionId: t.sectionId ?? null,
              projectId: t.projectId ?? null,
              createdAt: new Date().toISOString(),
            },
            ...s.tasks,
          ],
        })),
      updateTask: (id, patch) =>
        patchState((s) => ({
          ...s,
          tasks: s.tasks.map((x) => (x.id === id ? { ...x, ...patch } : x)),
        })),
      toggleTask: (id) =>
        patchState((s) => ({
          ...s,
          tasks: s.tasks.map((x) => (x.id === id ? { ...x, done: !x.done } : x)),
        })),
      removeTask: (id) =>
        patchState((s) => ({ ...s, tasks: s.tasks.filter((x) => x.id !== id) })),
    };
  }, [state, hydrated]);

  return <PlannerContext.Provider value={api}>{children}</PlannerContext.Provider>;
}

export function usePlanner() {
  const ctx = useContext(PlannerContext);
  if (!ctx) throw new Error("usePlanner debe usarse dentro de PlannerProvider");
  return ctx;
}

export function useSectionMap() {
  const { state } = usePlanner();
  return useMemo(
    () => Object.fromEntries(state.sections.map((s) => [s.id, s])),
    [state.sections],
  );
}
