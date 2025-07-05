"use client";

import { useState, useEffect } from "react";
import { Search as SearchIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface SearchProps {
  onSearch: (query: string) => void;
  className?: string;
  placeholder?: string;
}

export function Search({ 
  onSearch, 
  className, 
  placeholder = "Search links..." 
}: SearchProps) {
  const [query, setQuery] = useState("");
  
  // Debounce search input to avoid excessive searches
  useEffect(() => {
    const timer = setTimeout(() => {
      onSearch(query);
    }, 300);
    
    return () => clearTimeout(timer);
  }, [query, onSearch]);
  
  return (
    <div className={cn(
      "relative flex items-center w-full max-w-md",
      className
    )}>
      <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <input
        type="search"
        placeholder={placeholder}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="h-10 w-full rounded-md border border-input bg-background py-2 pl-10 pr-4 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      />
    </div>
  );
}
