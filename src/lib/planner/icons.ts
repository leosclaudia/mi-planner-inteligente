import {
  Briefcase,
  GraduationCap,
  Store,
  Sprout,
  HeartPulse,
  Camera,
  ShoppingBag,
  Sparkles,
  Home,
  BookOpen,
  Coffee,
  Dumbbell,
  Music,
  PawPrint,
  Plane,
  Wallet,
  Users,
  Palette,
  Wrench,
  Star,
  type LucideIcon,
} from "lucide-react";

export const ICONS: Record<string, LucideIcon> = {
  briefcase: Briefcase,
  graduation: GraduationCap,
  store: Store,
  sprout: Sprout,
  heart: HeartPulse,
  camera: Camera,
  bag: ShoppingBag,
  sparkles: Sparkles,
  home: Home,
  book: BookOpen,
  coffee: Coffee,
  dumbbell: Dumbbell,
  music: Music,
  paw: PawPrint,
  plane: Plane,
  wallet: Wallet,
  users: Users,
  palette: Palette,
  wrench: Wrench,
  star: Star,
};

export const ICON_KEYS = Object.keys(ICONS);

export function getIcon(key: string): LucideIcon {
  return ICONS[key] ?? Star;
}

export const SECTION_COLORS = ["terra", "olive", "sun", "plum", "sky", "rose"] as const;

export const COLOR_CLASSES: Record<string, { bg: string; text: string; dot: string }> = {
  terra: { bg: "bg-terra-soft", text: "text-terra", dot: "bg-terra" },
  olive: { bg: "bg-olive-soft", text: "text-olive", dot: "bg-olive" },
  sun: { bg: "bg-sun-soft", text: "text-sun", dot: "bg-sun" },
  plum: { bg: "bg-plum-soft", text: "text-plum", dot: "bg-plum" },
  sky: { bg: "bg-sky-soft", text: "text-sky", dot: "bg-sky" },
  rose: { bg: "bg-rose-soft", text: "text-rose", dot: "bg-rose" },
};

export function colorClasses(color: string) {
  return COLOR_CLASSES[color] ?? COLOR_CLASSES.terra;
}
