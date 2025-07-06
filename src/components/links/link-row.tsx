"use client";

import React from "react";
import { ExternalLink, Copy, ChevronRight } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface LinkRowProps {
  title: string;
  description: string;
  url: string;
  category?: string;
  subcategory?: string;
  tags?: string[];
  isNew?: boolean;
  expanded?: boolean;
  isExpanded?: boolean;
  onToggle?: () => void;
  onToggleExpand?: () => void;
  className?: string;
  children?: React.ReactNode;
}

export function LinkRow({ 
  title,
  description,
  url,
  category,
  subcategory,
  tags,
  isNew,
  expanded = false, 
  isExpanded = false, 
  onToggle, 
  onToggleExpand,
  className,
  children
}: LinkRowProps) {
  // Use props or link properties
  const finalExpanded = expanded || isExpanded;
  const finalOnToggle = onToggle || onToggleExpand;
  const [copied, setCopied] = React.useState(false);

  const copyToClipboard = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <TooltipProvider>
      <div className={cn("border-b border-zinc-800/40 last:border-0", className)}>
        <div 
          className="flex cursor-pointer items-center justify-between py-3 px-4 transition-colors hover:bg-zinc-800/30"
          onClick={finalOnToggle}
        >
          <div className="flex items-center gap-3">
            <ChevronRight 
              className={cn(
                "h-4 w-4 text-muted-foreground transition-transform duration-200",
                finalExpanded && "rotate-90"
              )} 
            />
            <span className="font-medium">{title}</span>
            {isNew && (
              <span className="rounded-full bg-accent/20 px-2 py-0.5 text-xs text-accent">
                New
              </span>
            )}
          </div>
          
          <div className="flex items-center space-x-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={copyToClipboard}
                  className="rounded p-1 text-muted-foreground transition-colors hover:bg-accent/10 hover:text-accent"
                  aria-label="Copy link URL"
                >
                  <Copy className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="left">
                {copied ? "Copied!" : "Copy URL"}
              </TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded p-1 text-muted-foreground transition-colors hover:bg-accent/10 hover:text-accent"
                  aria-label="Open link in new tab"
                  onClick={(e) => e.stopPropagation()}
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              </TooltipTrigger>
              <TooltipContent side="left">Open in new tab</TooltipContent>
            </Tooltip>
          </div>
        </div>
        
        {finalExpanded && (
          <div className="animate-slide-in px-11 pb-3">
            <p className="text-sm text-zinc-400">
              {description}
            </p>
            
            {tags && tags.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded bg-accent/20 px-2 py-0.5 text-xs text-accent"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
            
            {children}
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}
