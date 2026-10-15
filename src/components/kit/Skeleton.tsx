import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

/** Placeholder de carregamento — preserva a estrutura enquanto os dados chegam. */
export function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "h-2.5 w-full animate-pulse rounded-sm bg-gradient-to-r from-secondary via-secondary/50 to-secondary",
        className,
      )}
      aria-hidden="true"
      {...props}
    />
  );
}
