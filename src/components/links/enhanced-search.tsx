"use client";

import { useState, useEffect, useRef } from "react";
import { Search as SearchIcon, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface SearchResult {
  id?: string;
  title: string;
  description: string;
  url: string;
  category?: string;
  subcategory?: string;
}

interface EnhancedSearchProps {
  onSearch: (query: string) => void;
  searchResults: SearchResult[];
  placeholder?: string;
  className?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onResultClick?: (result: SearchResult) => void;
}

const MAX_RECENT_SEARCHES = 5;
const RECENT_SEARCHES_KEY = "zao-nexus-recent-searches";

export function EnhancedSearch({
  onSearch,
  searchResults,
  placeholder = "Search...",
  className,
  value = "",
  onChange,
  onResultClick
}: EnhancedSearchProps) {
  const [query, setQuery] = useState(value);
  const [focused, setFocused] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  
  // Load recent searches from localStorage
  useEffect(() => {
    const savedSearches = localStorage.getItem(RECENT_SEARCHES_KEY);
    if (savedSearches) {
      try {
        setRecentSearches(JSON.parse(savedSearches));
      } catch (e) {
        console.error("Failed to parse recent searches", e);
      }
    }
  }, []);
  
  // Save recent searches to localStorage
  const saveSearch = (query: string) => {
    if (!query.trim()) return;
    
    const updatedSearches = [
      query,
      ...recentSearches.filter(s => s !== query)
    ].slice(0, MAX_RECENT_SEARCHES);
    
    setRecentSearches(updatedSearches);
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updatedSearches));
  };
  
  // Handle input change with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query !== value) {
        onSearch(query);
      }
    }, 300);
    
    return () => clearTimeout(timer);
  }, [query, onSearch, value]);
  
  // Update internal state when external value changes
  useEffect(() => {
    setQuery(value);
  }, [value]);
  
  // Handle click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        resultsRef.current && 
        !resultsRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setFocused(false);
      }
    };
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setQuery(newValue);
    if (onChange) {
      onChange(e);
    }
  };
  
  const handleResultClick = (result: SearchResult) => {
    saveSearch(result.title);
    setFocused(false);
    if (onResultClick) {
      onResultClick(result);
    }
  };
  
  const handleRecentSearchClick = (search: string) => {
    setQuery(search);
    onSearch(search);
  };
  
  const handleClearSearch = () => {
    setQuery("");
    onSearch("");
    inputRef.current?.focus();
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveSearch(query);
    onSearch(query);
    inputRef.current?.blur();
  };
  
  return (
    <div className="relative w-full">
      <form onSubmit={handleSubmit} className="relative">
        <SearchIcon 
          className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" 
        />
        <Input
          ref={inputRef}
          type="search"
          placeholder={placeholder}
          value={query}
          onChange={handleInputChange}
          onFocus={() => setFocused(true)}
          className={cn(
            "pl-9 pr-10 h-10 bg-background",
            className
          )}
        />
        {query && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
            onClick={handleClearSearch}
          >
            <X className="h-4 w-4 text-muted-foreground" />
            <span className="sr-only">Clear</span>
          </Button>
        )}
      </form>
      
      {focused && (
        <div 
          ref={resultsRef}
          className="absolute top-full left-0 right-0 bg-background border rounded-md shadow-lg mt-1 z-50"
        >
          {query ? (
            searchResults.length > 0 ? (
              <>
                <div className="p-2 text-sm text-muted-foreground border-b">
                  {searchResults.length} results
                </div>
                <div className="max-h-[50vh] overflow-y-auto">
                  {searchResults.slice(0, 8).map((result, index) => (
                    <button
                      key={result.id || index}
                      className="w-full text-left px-3 py-2 hover:bg-accent flex flex-col gap-1"
                      onClick={() => handleResultClick(result)}
                    >
                      <span className="font-medium truncate">{result.title}</span>
                      <div className="flex items-center text-xs text-muted-foreground gap-1">
                        {result.category && (
                          <>
                            <span className="bg-secondary/50 px-1.5 py-0.5 rounded-sm">
                              {result.category}
                            </span>
                            <span>•</span>
                          </>
                        )}
                        <span className="truncate">{result.description}</span>
                      </div>
                    </button>
                  ))}
                  {searchResults.length > 8 && (
                    <div className="p-2 text-center text-sm text-muted-foreground border-t">
                      Press Enter to see all {searchResults.length} results
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="p-4 text-center text-sm text-muted-foreground">
                No results found for "{query}"
              </div>
            )
          ) : recentSearches.length > 0 ? (
            <>
              <div className="p-2 text-sm font-medium border-b">
                Recent Searches
              </div>
              {recentSearches.map((search, index) => (
                <button
                  key={index}
                  className="w-full text-left px-3 py-2 hover:bg-accent flex items-center justify-between"
                  onClick={() => handleRecentSearchClick(search)}
                >
                  <span>{search}</span>
                  <SearchIcon className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              ))}
            </>
          ) : null}
        </div>
      )}
    </div>
  );
}
