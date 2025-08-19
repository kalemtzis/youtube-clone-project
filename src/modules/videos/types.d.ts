import { AppRouter } from "@/trpc/routers/_app";
import { inferRouterOutputs } from "@trpc/server";

export type VideosGetOneOutput =
  inferRouterOutputs<AppRouter>["videos"]["getOne"];
