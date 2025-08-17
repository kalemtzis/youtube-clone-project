import type { LucideIcon } from "lucide-react";

export type ItemType = {
  title: string;
  href: string;
  icon: LucideIcon;
  auth?: boolean;
};
