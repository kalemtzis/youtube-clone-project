import {
  FlameIcon,
  HistoryIcon,
  HomeIcon,
  ListVideoIcon,
  PlaySquareIcon,
  ThumbsUpIcon,
} from "lucide-react";
import { ItemType } from "./types";

export const mainItems: ItemType[] = [
  {
    title: "Home",
    href: "/",
    icon: HomeIcon,
  },
  {
    title: "Subscriptions",
    href: "/feed/subscriptions",
    icon: PlaySquareIcon,
    auth: true,
  },
  {
    title: "Trending",
    href: "/feed/trending",
    icon: FlameIcon,
  },
];

export const personalItems: ItemType[] = [
  {
    title: "History",
    href: "/playlists/history",
    icon: HistoryIcon,
    auth: true,
  },
  {
    title: "Liked Videos",
    href: "/playlists/liked",
    icon: ThumbsUpIcon,
    auth: true,
  },
  {
    title: "All Playlists",
    href: "/playlists",
    icon: ListVideoIcon,
    auth: true
  },
];
