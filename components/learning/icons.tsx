import {
  BookOpen, Compass, GraduationCap, HandHeart, Layers, Library, Lightbulb, MessageCircleQuestionMark, MonitorPlay,
  MousePointerClick, Puzzle, Rocket, ShieldCheck, Sparkles, Target, Users, type LucideIcon,
} from "lucide-react";

export const MODULE_ICONS: Record<string, { icon: LucideIcon; label: string }> = {
  compass: { icon: Compass, label: "Boussole" },
  "mouse-pointer-click": { icon: MousePointerClick, label: "Prise en main" },
  "hand-heart": { icon: HandHeart, label: "Accompagnement" },
  library: { icon: Library, label: "Bibliothèque" },
  sparkles: { icon: Sparkles, label: "Nouveauté" },
  "graduation-cap": { icon: GraduationCap, label: "Diplôme" },
  "book-open": { icon: BookOpen, label: "Livre" },
  lightbulb: { icon: Lightbulb, label: "Idée" },
  users: { icon: Users, label: "Équipe" },
  question: { icon: MessageCircleQuestionMark, label: "Questions" },
  "monitor-play": { icon: MonitorPlay, label: "Démonstration" },
  puzzle: { icon: Puzzle, label: "Méthode" },
  rocket: { icon: Rocket, label: "Lancement" },
  target: { icon: Target, label: "Objectif" },
  "shield-check": { icon: ShieldCheck, label: "Sécurité" },
  layers: { icon: Layers, label: "Ressources" },
};

export function ModuleIcon({ name, className }: { name: string; className?: string }) {
  const Icon = MODULE_ICONS[name]?.icon ?? Sparkles;
  return <Icon className={className} aria-hidden />;
}

/** Palettes de couverture des modules, dérivées des couleurs Yoovi. */
export const MODULE_COLORS: Record<string, { label: string; from: string; to: string; accent: string; soft: string; text: string }> = {
  violet: { label: "Violet Yoovi", from: "#5046E5", to: "#8059E3", accent: "#FF64F5", soft: "#F2EBFF", text: "#3329A6" },
  bleu: { label: "Bleu logo", from: "#0125C5", to: "#4C6BFF", accent: "#7FE3FF", soft: "#E1E7FF", text: "#001C99" },
  rose: { label: "Rose logo", from: "#C238C9", to: "#FF64F5", accent: "#FFD95A", soft: "#FFE5FD", text: "#9E1FA3" },
  jaune: { label: "Jaune", from: "#F5A524", to: "#FFD95A", accent: "#5046E5", soft: "#FFF6D6", text: "#7A5A00" },
  menthe: { label: "Menthe", from: "#0E8A63", to: "#3DD39B", accent: "#FFD95A", soft: "#DDF7EC", text: "#11704C" },
  encre: { label: "Encre", from: "#18134F", to: "#3329A6", accent: "#FF64F5", soft: "#E9E1FB", text: "#18134F" },
};

export const colorOf = (key: string) => MODULE_COLORS[key] ?? MODULE_COLORS.violet;
