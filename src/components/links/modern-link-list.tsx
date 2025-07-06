"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { 
  ExternalLink, Grid2X2, List as ListIcon, 
  Share, Copy, ChevronDown, ChevronRight, 
  Filter, X, AlignJustify, Search as SearchIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { LinkCard } from "@/components/links/link-card";
import { LinkRow } from "@/components/links/link-row";
import { cn } from "@/lib/utils";
import { 
  Tooltip, TooltipContent, TooltipProvider, 
  TooltipTrigger 
} from "@/components/ui/tooltip";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { 
  Sheet, SheetContent, SheetDescription, 
  SheetFooter, SheetHeader, SheetTitle, 
  SheetTrigger, SheetClose 
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import * as CollapsiblePrimitive from "@radix-ui/react-collapsible";

const Collapsible = CollapsiblePrimitive.Root;
const CollapsibleTrigger = CollapsiblePrimitive.Trigger;
const CollapsibleContent = CollapsiblePrimitive.Content;
import Fuse from "fuse.js";

// Define types for our data structure
interface Link {
  id?: string;
  title: string;
  url: string;
  description: string;
  category?: string;
  subcategory?: string;
  tags?: string[];
  isNew?: boolean;
  isOfficial?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface Subcategory {
  name: string;
  links: Link[];
}

interface Category {
  name: string;
  subcategories: Subcategory[];
}

interface Data {
  categories: Category[];
}

interface ModernLinkListProps {
  data: Data;
  filterTags?: string[];
}

type ViewMode = "grid" | "list" | "compact";
type SortMode = "newest" | "oldest" | "popular" | "az";

interface FlattenedLink extends Link {
  category: string;
  subcategory: string;
  id?: string;
  tags?: string[];
  isNew?: boolean;
  isOfficial?: boolean;
  popularity?: number;
}

// Telemetry logging hook
const useLogEvent = () => {
  return useCallback((eventName: string, metadata: Record<string, any> = {}) => {
    console.log(`[TELEMETRY] ${eventName}`, metadata);
  }, []);
};

export function ModernLinkList({ data, filterTags = [] }: ModernLinkListProps) {
  // Main state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>(filterTags || []);
  const [viewMode, setViewMode] = useState<ViewMode>("compact");
  const [sortBy, setSortBy] = useState<SortMode>("newest");
  const [newOnly, setNewOnly] = useState(false);
  const [officialOnly, setOfficialOnly] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
  
  // Refs
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  // Telemetry logging
  const logEvent = useLogEvent();

  // Flatten the data structure for easier filtering and searching
  const allLinks = useMemo(() => {
    const links: FlattenedLink[] = [];
    
    data.categories.forEach(category => {
      category.subcategories.forEach(subcategory => {
        subcategory.links.forEach(link => {
          links.push({
            ...link,
            category: category.name,
            subcategory: subcategory.name,
            // Add a random popularity score for demo purposes
            popularity: Math.floor(Math.random() * 100)
          });
        });
      });
    });
    
    return links;
  }, [data]);

  // Extract all unique tags from the data
  const allTags = useMemo(() => {
    const tags = new Set<string>();
    
    allLinks.forEach(link => {
      if (link.tags && Array.isArray(link.tags)) {
        link.tags.forEach(tag => tags.add(tag));
      }
    });
    
    return Array.from(tags).sort();
  }, [allLinks]);

  // Create category and subcategory counts for the filter UI
  const categoryCounts = useMemo(() => {
    const counts: Record<string, { count: number, subcategories: Record<string, number> }> = {};
    
    allLinks.forEach(link => {
      if (!counts[link.category]) {
        counts[link.category] = { count: 0, subcategories: {} };
      }
      
      counts[link.category].count++;
      
      if (!counts[link.category].subcategories[link.subcategory]) {
        counts[link.category].subcategories[link.subcategory] = 0;
      }
      
      counts[link.category].subcategories[link.subcategory]++;
    });
    
    return counts;
  }, [allLinks]);

  // Filter links based on all criteria
  const filteredLinks = useMemo(() => {
    let result = [...allLinks];
    
    // Filter by category
    if (selectedCategory) {
      result = result.filter(link => link.category === selectedCategory);
    }
    
    // Filter by subcategory
    if (selectedSubcategory) {
      result = result.filter(link => link.subcategory === selectedSubcategory);
    }
    
    // Filter by tags
    if (selectedTags.length > 0) {
      result = result.filter(link => 
        link.tags && Array.isArray(link.tags) && selectedTags.every(tag => link.tags!.includes(tag))
      );
    }
    
    // Filter by new only
    if (newOnly) {
      result = result.filter(link => link.isNew);
    }
    
    // Filter by official only
    if (officialOnly) {
      result = result.filter(link => link.isOfficial);
    }
    
    // Filter by search query
    if (searchQuery) {
      const fuse = new Fuse(result, {
        keys: ['title', 'description', 'url', 'category', 'subcategory', 'tags'],
        threshold: 0.4,
        includeScore: true
      });
      
      const searchResults = fuse.search(searchQuery);
      result = searchResults.map(result => result.item);
    }
    
    // Sort the results
    switch (sortBy) {
      case "newest":
        result.sort((a, b) => {
          if (!a.createdAt || !b.createdAt) return 0;
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
        break;
      case "oldest":
        result.sort((a, b) => {
          if (!a.createdAt || !b.createdAt) return 0;
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        });
        break;
      case "popular":
        result.sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
        break;
      case "az":
        result.sort((a, b) => a.title.localeCompare(b.title));
        break;
    }
    
    return result;
  }, [
    allLinks, 
    selectedCategory, 
    selectedSubcategory, 
    selectedTags, 
    newOnly, 
    officialOnly, 
    searchQuery, 
    sortBy
  ]);

  // Handle link click
  const handleLinkClick = useCallback((link: FlattenedLink) => {
    logEvent('link_click', { 
      linkId: link.id, 
      title: link.title, 
      category: link.category, 
      subcategory: link.subcategory 
    });
    
    // In a real app, you might want to track this click for analytics
    window.open(link.url, '_blank', 'noopener,noreferrer');
  }, [logEvent]);

  // Handle share link
  const handleShareLink = useCallback((e: React.MouseEvent, link: FlattenedLink) => {
    e.preventDefault();
    e.stopPropagation();
    
    logEvent('link_share', { linkId: link.id, title: link.title });
    
    if (navigator.share) {
      navigator.share({
        title: link.title,
        text: link.description,
        url: link.url
      }).catch(error => console.error('Error sharing:', error));
    } else {
      // Fallback for browsers that don't support the Web Share API
      navigator.clipboard.writeText(link.url);
      toast.success('Link copied to clipboard!');
    }
  }, [logEvent]);

  // Handle copy link
  const handleCopyLink = useCallback((e: React.MouseEvent, link: FlattenedLink) => {
    e.preventDefault();
    e.stopPropagation();
    
    logEvent('link_copy', { linkId: link.id, title: link.title });
    
    navigator.clipboard.writeText(link.url);
    toast.success('Link copied to clipboard!');
  }, [logEvent]);

  // Toggle expanded state for a link
  const handleToggleExpand = useCallback((id: string) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  }, []);

  // Clear all filters
  const clearFilters = useCallback(() => {
    setSelectedCategory(null);
    setSelectedSubcategory(null);
    setSelectedTags([]);
    setNewOnly(false);
    setOfficialOnly(false);
    setSearchQuery("");
    if (searchInputRef.current) {
      searchInputRef.current.value = "";
    }
    
    logEvent('clear_filters');
  }, [logEvent]);

  // Handle category selection
  const handleCategorySelect = useCallback((category: string | null) => {
    setSelectedCategory(category);
    setSelectedSubcategory(null);
    
    logEvent('select_category', { category });
  }, [logEvent]);

  // Handle subcategory selection
  const handleSubcategorySelect = useCallback((subcategory: string | null) => {
    setSelectedSubcategory(subcategory);
    
    logEvent('select_subcategory', { subcategory });
  }, []);

  // Handle tag selection
  const handleTagSelect = useCallback((tag: string) => {
    setSelectedTags(prev => {
      if (prev.includes(tag)) {
        return prev.filter(t => t !== tag);
      } else {
        return [...prev, tag];
      }
    });
    
    logEvent('select_tag', { tag });
  }, [logEvent]);

  // Handle sort change
  const handleSortChange = useCallback((sort: SortMode) => {
    setSortBy(sort);
    
    logEvent('change_sort', { sort });
  }, [logEvent]);

  // Handle new only change
  const handleNewOnlyChange = useCallback((checked: boolean) => {
    setNewOnly(checked);
    
    logEvent('toggle_new_only', { checked });
  }, [logEvent]);

  // Handle official only change
  const handleOfficialOnlyChange = useCallback((checked: boolean) => {
    setOfficialOnly(checked);
    
    logEvent('toggle_official_only', { checked });
  }, [logEvent]);

  // Handle search
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    
    logEvent('search', { query });
  }, [logEvent]);

  // Get active filter count
  const activeFilterCount = useMemo(() => {
    let count = 0;
    
    if (selectedCategory) count++;
    if (selectedSubcategory) count++;
    if (selectedTags.length > 0) count += selectedTags.length;
    if (newOnly) count++;
    if (officialOnly) count++;
    if (searchQuery) count++;
    
    return count;
  }, [
    selectedCategory, 
    selectedSubcategory, 
    selectedTags, 
    newOnly, 
    officialOnly, 
    searchQuery
  ]);

  // Render the filter sheet
  const renderFilterSheet = () => (
    <Sheet open={isFilterSheetOpen} onOpenChange={setIsFilterSheetOpen}>
      <SheetTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="flex items-center gap-1 relative"
          onClick={() => setIsFilterSheetOpen(true)}
        >
          <Filter className="h-4 w-4" />
          <span className="hidden sm:inline">Filters</span>
          {activeFilterCount > 0 && (
            <Badge 
              variant="secondary" 
              className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {activeFilterCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent 
        side="bottom" 
        className="max-h-[60vh] rounded-t-xl overflow-hidden flex flex-col fixed bottom-0 left-0 right-0 w-full"
      >
        <SheetHeader className="text-left pb-4 border-b">
          <div className="flex items-center justify-between">
            <SheetTitle>Filters</SheetTitle>
            <div className="flex items-center gap-2">
              {activeFilterCount > 0 && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={clearFilters}
                >
                  Clear all
                </Button>
              )}
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => setIsFilterSheetOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </SheetHeader>
        
        <Tabs defaultValue="categories" className="flex-1 overflow-hidden">
          <TabsList className="w-full grid grid-cols-3 mb-4">
            <TabsTrigger value="categories">Categories</TabsTrigger>
            <TabsTrigger value="tags">Tags</TabsTrigger>
            <TabsTrigger value="options">Options</TabsTrigger>
          </TabsList>
          
          <div className="overflow-y-auto flex-1 pb-20">
            <TabsContent value="categories" className="mt-0">
              <div className="space-y-4">
                {Object.entries(categoryCounts).map(([category, { count, subcategories }]) => (
                  <Collapsible key={category} className="border rounded-md">
                    <CollapsibleTrigger className="flex items-center justify-between w-full p-3 hover:bg-accent/10">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={selectedCategory === category}
                          onChange={() => handleCategorySelect(selectedCategory === category ? null : category)}
                          onClick={(e) => e.stopPropagation()}
                          className="h-4 w-4"
                        />
                        <span>{category}</span>
                        <Badge variant="secondary" className="ml-2">{count}</Badge>
                      </div>
                      <ChevronDown className="h-4 w-4 transition-transform ui-open:rotate-180" />
                    </CollapsibleTrigger>
                    
                    <CollapsibleContent className="p-3 pt-0 border-t">
                      <div className="space-y-2 pt-2">
                        {Object.entries(subcategories).map(([subcategory, count]) => (
                          <div key={subcategory} className="flex items-center gap-2 pl-6">
                            <input
                              type="checkbox"
                              checked={selectedSubcategory === subcategory}
                              onChange={() => handleSubcategorySelect(selectedSubcategory === subcategory ? null : subcategory)}
                              disabled={selectedCategory !== category}
                              className="h-4 w-4"
                            />
                            <span className={cn(
                              selectedCategory !== category && "text-muted-foreground"
                            )}>
                              {subcategory}
                            </span>
                            <Badge 
                              variant="outline" 
                              className={cn(
                                "ml-2",
                                selectedCategory !== category && "opacity-50"
                              )}
                            >
                              {count}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="tags" className="mt-0">
              <div className="flex flex-wrap gap-2 p-2">
                {allTags.map(tag => (
                  <Badge
                    key={tag}
                    variant={selectedTags.includes(tag) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => handleTagSelect(tag)}
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="options" className="mt-0 space-y-6 p-2">
              <div className="space-y-4">
                <h3 className="text-sm font-medium">Sort by</h3>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant={sortBy === "newest" ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleSortChange("newest")}
                    className="justify-start"
                  >
                    Newest first
                  </Button>
                  <Button
                    variant={sortBy === "oldest" ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleSortChange("oldest")}
                    className="justify-start"
                  >
                    Oldest first
                  </Button>
                  <Button
                    variant={sortBy === "popular" ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleSortChange("popular")}
                    className="justify-start"
                  >
                    Most popular
                  </Button>
                  <Button
                    variant={sortBy === "az" ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleSortChange("az")}
                    className="justify-start"
                  >
                    A-Z
                  </Button>
                </div>
              </div>
              
              <div className="space-y-4">
                <h3 className="text-sm font-medium">Show only</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="new-only"
                      checked={newOnly}
                      onChange={(e) => handleNewOnlyChange(e.target.checked)}
                      className="h-4 w-4"
                    />
                    <label htmlFor="new-only">New items</label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="official-only"
                      checked={officialOnly}
                      onChange={(e) => handleOfficialOnlyChange(e.target.checked)}
                      className="h-4 w-4"
                    />
                    <label htmlFor="official-only">Official links</label>
                  </div>
                </div>
              </div>
            </TabsContent>
          </div>
        </Tabs>
        
        <SheetFooter className="border-t pt-4 sticky bottom-0 bg-background z-10">
          <div className="flex justify-between w-full">
            <Button variant="outline" onClick={clearFilters}>
              Reset
            </Button>
            <Button onClick={() => setIsFilterSheetOpen(false)}>
              Apply filters ({filteredLinks.length} results)
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );

  // Render active filters
  const renderActiveFilters = () => {
    if (activeFilterCount === 0) return null;
    
    return (
      <div className="flex flex-wrap gap-2 mb-4">
        {selectedCategory && (
          <Badge 
            variant="secondary" 
            className="flex items-center gap-1"
          >
            {selectedCategory}
            <X 
              className="h-3 w-3 ml-1 cursor-pointer" 
              onClick={() => handleCategorySelect(null)} 
            />
          </Badge>
        )}
        
        {selectedSubcategory && (
          <Badge 
            variant="secondary" 
            className="flex items-center gap-1"
          >
            {selectedSubcategory}
            <X 
              className="h-3 w-3 ml-1 cursor-pointer" 
              onClick={() => handleSubcategorySelect(null)} 
            />
          </Badge>
        )}
        
        {selectedTags.map(tag => (
          <Badge 
            key={tag} 
            variant="secondary" 
            className="flex items-center gap-1"
          >
            {tag}
            <X 
              className="h-3 w-3 ml-1 cursor-pointer" 
              onClick={() => handleTagSelect(tag)} 
            />
          </Badge>
        ))}
        
        {newOnly && (
          <Badge 
            variant="secondary" 
            className="flex items-center gap-1"
          >
            New only
            <X 
              className="h-3 w-3 ml-1 cursor-pointer" 
              onClick={() => handleNewOnlyChange(false)} 
            />
          </Badge>
        )}
        
        {officialOnly && (
          <Badge 
            variant="secondary" 
            className="flex items-center gap-1"
          >
            Official only
            <X 
              className="h-3 w-3 ml-1 cursor-pointer" 
              onClick={() => handleOfficialOnlyChange(false)} 
            />
          </Badge>
        )}
        
        {searchQuery && (
          <Badge 
            variant="secondary" 
            className="flex items-center gap-1"
          >
            "{searchQuery}"
            <X 
              className="h-3 w-3 ml-1 cursor-pointer" 
              onClick={() => handleSearch("")} 
            />
          </Badge>
        )}
        
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-6 text-xs" 
          onClick={clearFilters}
        >
          Clear all
        </Button>
      </div>
    );
  };

  return (
    <TooltipProvider>
      <div className="w-full space-y-4">
        {/* Sticky search and filter bar */}
        <div className="sticky top-16 z-10 bg-background/95 backdrop-blur-sm py-3 border-b">
          <div className="flex flex-col gap-4">
            {/* Search and view mode controls */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div className="relative w-full sm:w-[300px]">
                <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  ref={searchInputRef}
                  type="search"
                  placeholder="Search links..."
                  className="w-full pl-9"
                  onChange={(e) => handleSearch(e.target.value)}
                />
              </div>
              
              <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-start">
                {renderFilterSheet()}
                
                <div className="bg-accent/10 rounded-md p-1 flex items-center">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant={viewMode === "grid" ? "secondary" : "ghost"}
                        size="sm"
                        onClick={() => setViewMode("grid")}
                        className="h-8 w-8 p-0"
                      >
                        <Grid2X2 className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Grid view</TooltipContent>
                  </Tooltip>
                  
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant={viewMode === "list" ? "secondary" : "ghost"}
                        size="sm"
                        onClick={() => setViewMode("list")}
                        className="h-8 w-8 p-0"
                      >
                        <ListIcon className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>List view</TooltipContent>
                  </Tooltip>
                  
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant={viewMode === "compact" ? "secondary" : "ghost"}
                        size="sm"
                        onClick={() => setViewMode("compact")}
                        className="h-8 w-8 p-0"
                      >
                        <AlignJustify className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Compact view</TooltipContent>
                  </Tooltip>
                </div>
              </div>
            </div>
            
            {/* Active filters */}
            {renderActiveFilters()}
          </div>
        </div>
        
        {/* Results count */}
        <div className="text-sm text-muted-foreground">
          {filteredLinks.length} {filteredLinks.length === 1 ? 'result' : 'results'}
        </div>
        
        {/* Links */}
        <div 
          ref={containerRef}
          className="w-full rounded-lg bg-card links-container overflow-visible" 
          id="links-container"
          role="region"
          aria-label="Links collection"
        >
          <div className="p-2 pb-20">
            {filteredLinks.map((link, index) => (
              <div 
                key={link.id || index}
                className="mb-2 bg-secondary/30 rounded-md hover:bg-secondary/50 transition-colors border border-border/20 shadow-none"
                role="listitem"
              >
                {viewMode === "grid" ? (
                  <div className="p-3">
                    <LinkCard 
                      title={link.title}
                      description={link.description}
                      url={link.url}
                      category={link.category}
                      subcategory={link.subcategory}
                      tags={link.tags}
                      isNew={link.isNew}
                      onClick={() => handleLinkClick(link)}
                      className="h-full transition-all hover:shadow-md border border-border/40 rounded-md overflow-hidden"
                    />
                  </div>
                ) : (
                  <div className="p-0">
                    <div className="flex items-center justify-between p-3 cursor-pointer" onClick={() => link.id && handleToggleExpand(link.id)}>
                      <div className="flex-1 overflow-hidden">
                        <div className="font-medium truncate">{link.title}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(link.url, '_blank', 'noopener,noreferrer');
                          }}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                        {link.id && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleExpand(link.id!);
                            }}
                          >
                            {expandedItems.has(link.id) ? (
                              <ChevronDown className="h-5 w-5 text-primary" />
                            ) : (
                              <ChevronRight className="h-5 w-5 text-primary" />
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                    
                    {link.id && expandedItems.has(link.id) && (
                      <div className="px-3 pb-3 animate-fade-in">
                        <div className="text-sm text-muted-foreground mb-2">{link.description}</div>
                        
                        <div className="flex flex-wrap gap-1 mb-3">
                          {link.tags && link.tags.map((tag) => (
                            <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
                          ))}
                        </div>
                        
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => handleShareLink(e, link)}
                          >
                            <Share className="mr-1 h-3 w-3" /> Share
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => handleCopyLink(e, link)}
                          >
                            <Copy className="mr-1 h-3 w-3" /> Copy URL
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
            
            {filteredLinks.length === 0 && (
              <div className="flex h-[400px] w-full flex-col items-center justify-center space-y-4 rounded-lg border border-dashed p-8 text-center">
                <div className="rounded-full bg-secondary p-3">
                  <ExternalLink className="h-6 w-6 text-muted-foreground" />
                </div>
                <h3 className="font-heading text-xl font-medium">No links found</h3>
                <p className="text-muted-foreground">
                  Try adjusting your search or filters to find what you're looking for.
                </p>
                <Button onClick={clearFilters} variant="outline">
                  Clear all filters
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
