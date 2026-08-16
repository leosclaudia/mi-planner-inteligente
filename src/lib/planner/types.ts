export type SectionId = string;

export interface Section {
  id: SectionId;
  name: string;
  icon: string; // lucide icon key from ICONS
  color: string; // token name: terra | olive | sun | plum | sky | rose
  hidden: boolean;
  order: number;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  sectionId: SectionId | null;
  color: string;
  archived: boolean;
  createdAt: string;
}

export type Priority = "baja" | "media" | "alta";

export interface Task {
  id: string;
  title: string;
  notes: string;
  date: string | null; // yyyy-MM-dd
  done: boolean;
  priority: Priority;
  sectionId: SectionId | null;
  projectId: string | null;
  createdAt: string;
  order?: number; // optional for backward compatibility with existing saved planners
}

export interface PlannerSettings {
  plannerName: string;
  ownerName: string;
  onboarded: boolean;
}

export interface PlannerState {
  settings: PlannerSettings;
  sections: Section[];
  projects: Project[];
  tasks: Task[];
}
