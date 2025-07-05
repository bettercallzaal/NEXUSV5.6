"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface TagBadgeProps {
  tag: string;
  count?: number;
  active?: boolean;
  onClick?: () => void;
  className?: string;
}

export function TagBadge({ tag, count, active = false, onClick, className }: TagBadgeProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-all",
        active 
          ? "bg-accent text-black" 
          : "bg-accent/20 text-accent hover:bg-accent/30",
        onClick && "cursor-pointer",
        className
      )}
      onClick={onClick}
      disabled={!onClick}
    >
      {tag}
      {count !== undefined && (
        <span className={cn(
          "ml-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px]",
          active ? "bg-black/30 text-accent" : "bg-accent/30 text-accent"
        )}>
          {count}
        </span>
      )}
    </button>
  );
}
