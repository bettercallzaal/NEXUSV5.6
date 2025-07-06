"use client";

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { FixedSizeList as List } from "react-window";
import AutoSizer from "react-virtualized-auto-sizer";
import Fuse from "fuse.js";
import { ExternalLink, Grid2X2, List as ListIcon, Loader2, Share, Copy, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LinkCard } from "@/components/links/link-card";
import { LinkRow } from "@/components/links/link-row";

import { cn } from "@/lib/utils";
import { TooltipProvider } from "@/components/ui/tooltip";
import { FilterSheet } from "@/components/links/filter-sheet";
import { CategoryScroll } from "@/components/links/category-scroll";
import { EnhancedSearch } from "@/components/links/enhanced-search";
import { toast } from "sonner";

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

interface SubcategoryWithCount {
  name: string;
  count: number;
}

interface CategoryWithCount {
  name: string;
  count: number;
  subcategories: SubcategoryWithCount[];
}

interface Data {
  categories: Category[];
}

interface MobileOptimizedLinkListProps {
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
  popularity?: number; // For sorting by popularity
}

// Telemetry logging hook
const useLogEvent = () => {
  return useCallback((eventName: string, metadata: Record<string, any> = {}) => {
    // In a real implementation, this would send data to your telemetry endpoint
    console.log(`[TELEMETRY] ${eventName}`, metadata);
    
    // Example implementation that would send to a real endpoint:
    /*
    fetch('/api/telemetry', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event: eventName,
        timestamp: new Date().toISOString(),
        metadata
      })
    }).catch(err => console.error('Telemetry error:', err));
    */
  }, []);
};

export function MobileOptimizedLinkList({ data, filterTags = [] }: MobileOptimizedLinkListProps) {
  // Main state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>(filterTags || []);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [sortBy, setSortBy] = useState<SortMode>("newest");
  const [newOnly, setNewOnly] = useState(false);
  const [officialOnly, setOfficialOnly] = useState(false);
  
  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [overscanCount, setOverscanCount] = useState(5);
  const [itemsPerRow, setItemsPerRow] = useState(4);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  
  // Refs
  const listRef = useRef<List>(null);
  
  // Telemetry logging
  const logEvent = useLogEvent();
  
  // Simulate loading state for better UX
  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer);
  }, [searchQuery, selectedCategory, selectedSubcategory, selectedTags, viewMode, sortBy, newOnly, officialOnly]);
  
  // Update items per row based on screen width
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width < 640) {
        setItemsPerRow(1);
      } else if (width < 768) {
        setItemsPerRow(2);
      } else if (width < 1024) {
        setItemsPerRow(3);
      } else {
        setItemsPerRow(4);
      }
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Increase overscan when scrolling for smoother experience
  useEffect(() => {
    const handleScroll = () => {
      setOverscanCount(10);
      const scrollTimer = setTimeout(() => setOverscanCount(5), 500);
      return () => clearTimeout(scrollTimer);
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Create a flattened array of all links for searching and virtualization
  const allLinks = useMemo(() => {
    const links: FlattenedLink[] = [];
    
    data.categories.forEach((category) => {
      category.subcategories.forEach((subcategory) => {
        subcategory.links.forEach((link) => {
          links.push({
            ...link,
            category: category.name,
            subcategory: subcategory.name,
            // Generate random popularity for demo purposes
            popularity: Math.floor(Math.random() * 100)
          });
        });
      });
    });
    
    return links;
  }, [data]);

  // Extract all unique tags from links
  const allTags = useMemo(() => {
    const tagCounts: Record<string, number> = {};
    
    allLinks.forEach((link) => {
      if (link.tags) {
        link.tags.forEach((tag) => {
          tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        });
      }
    });
    
    return Object.entries(tagCounts).map(([name, count]) => ({ name, count }));
  }, [allLinks]);

  // Create category counts for filtering UI
  const categoryCounts = useMemo(() => {
    const counts: Record<string, CategoryWithCount> = {};
    
    allLinks.forEach((link) => {
      // Initialize category if it doesn't exist
      if (!counts[link.category]) {
        counts[link.category] = {
          name: link.category,
          count: 0,
          subcategories: []
        };
      }
      
      // Increment category count
      counts[link.category].count++;
      
      // Find subcategory
      const subIndex = counts[link.category].subcategories.findIndex(
        (sub) => sub.name === link.subcategory
      );
      
      if (subIndex === -1) {
        // Add new subcategory
        counts[link.category].subcategories.push({
          name: link.subcategory,
          count: 1
        });
      } else {
        // Increment subcategory count
        counts[link.category].subcategories[subIndex].count++;
      }
    });
    
    return counts;
  }, [allLinks]);

  // Filter links based on search query, category, subcategory, and tags
  const filteredLinks = useMemo(() => {
    let filtered = [...allLinks];
    
    // Filter by category
    if (selectedCategory) {
      filtered = filtered.filter((link) => link.category === selectedCategory);
    }
    
    // Filter by subcategory
    if (selectedSubcategory) {
      filtered = filtered.filter((link) => link.subcategory === selectedSubcategory);
    }
    
    // Filter by tags
    if (selectedTags.length > 0) {
      filtered = filtered.filter((link) => {
        return selectedTags.every((tag) => link.tags?.includes(tag));
      });
    }
    
    // Filter by new only
    if (newOnly) {
      filtered = filtered.filter((link) => link.isNew);
    }
    
    // Filter by official only
    if (officialOnly) {
      filtered = filtered.filter((link) => link.tags?.includes('Official'));
    }
    
    // Search by query
    if (searchQuery) {
      const fuse = new Fuse(filtered, {
        keys: ['title', 'description', 'category', 'subcategory', 'tags'],
        threshold: 0.4,
        ignoreLocation: true
      });
      
      const results = fuse.search(searchQuery);
      filtered = results.map((result) => result.item);
    }
    
    // Sort links
    switch (sortBy) {
      case 'newest':
        filtered.sort((a, b) => {
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return dateB - dateA;
        });
        break;
      case 'oldest':
        filtered.sort((a, b) => {
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return dateA - dateB;
        });
        break;
      case 'popular':
        filtered.sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
        break;
      case 'az':
        filtered.sort((a, b) => a.title.localeCompare(b.title));
        break;
    }
    
    return filtered;
  }, [allLinks, searchQuery, selectedCategory, selectedSubcategory, selectedTags, sortBy, newOnly, officialOnly]);

  // Handle category selection
  const handleCategorySelect = useCallback((category: string) => {
    setSelectedCategory(category || null);
    setSelectedSubcategory(null);
    logEvent('category_select', { category });
  }, [logEvent]);

  // Handle subcategory selection
  const handleSubcategorySelect = useCallback((subcategory: string) => {
    setSelectedSubcategory(subcategory || null);
    logEvent('subcategory_select', { subcategory });
  }, [logEvent]);

  // Handle tag selection
  const handleTagSelect = useCallback((tag: string) => {
    setSelectedTags((prev) => {
      const isSelected = prev.includes(tag);
      const newTags = isSelected
        ? prev.filter((t) => t !== tag)
        : [...prev, tag];
      
      logEvent('tag_select', { tag, selected: !isSelected });
      return newTags;
    });
  }, [logEvent]);

  // Handle sort change
  const handleSortChange = useCallback((sort: string) => {
    setSortBy(sort as SortMode);
    logEvent('sort_change', { sort });
  }, [logEvent]);

  // Handle new only change
  const handleNewOnlyChange = useCallback((checked: boolean) => {
    setNewOnly(checked);
    logEvent('filter_change', { filter: 'new_only', value: checked });
  }, [logEvent]);

  // Handle official only change
  const handleOfficialOnlyChange = useCallback((checked: boolean) => {
    setOfficialOnly(checked);
    logEvent('filter_change', { filter: 'official_only', value: checked });
  }, [logEvent]);

  // Clear all filters
  const clearFilters = useCallback(() => {
    setSearchQuery("");
    setSelectedCategory(null);
    setSelectedSubcategory(null);
    setSelectedTags([]);
    setNewOnly(false);
    setOfficialOnly(false);
    setSortBy("newest");
    logEvent('clear_filters');
  }, [logEvent]);

  // Handle search
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    if (query) {
      logEvent('search', { query });
    }
  }, [logEvent]);

  // Handle link click
  const handleLinkClick = useCallback((link: FlattenedLink | { id?: string; title: string; url: string; category?: string; subcategory?: string }) => {
    logEvent('link_click', { 
      linkId: link.id, 
      title: link.title,
      category: link.category,
      subcategory: link.subcategory
    });
    window.open(link.url, '_blank', 'noopener,noreferrer');
  }, [logEvent]);

  // Handle share link
  const handleShareLink = useCallback((e: React.MouseEvent, link: FlattenedLink) => {
    e.stopPropagation();
    logEvent('share_click', { linkId: link.id, title: link.title });
    
    if (navigator.share) {
      navigator.share({
        title: link.title,
        text: link.description,
        url: link.url
      }).catch(err => console.error('Error sharing:', err));
    } else {
      // Fallback to copy
      handleCopyLink(e, link);
    }
  }, [logEvent]);

  // Handle copy link
  const handleCopyLink = useCallback((e: React.MouseEvent, link: FlattenedLink) => {
    e.stopPropagation();
    logEvent('copy_link', { linkId: link.id, title: link.title });
    
    navigator.clipboard.writeText(link.url).then(() => {
      toast("Link copied to clipboard");
    }).catch(err => console.error('Error copying:', err));
  }, [logEvent]);

  // Handle toggle expand
  const handleToggleExpand = useCallback((id: string) => {
    setExpandedItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
        logEvent('collapse_link', { linkId: id });
      } else {
        newSet.add(id);
        logEvent('expand_link', { linkId: id });
      }
      return newSet;
    });
  }, [logEvent]);

  // Render selected tags
  const renderSelectedTags = useCallback(() => {
    if (selectedTags.length === 0) return null;
    
    return (
      <div className="flex flex-wrap gap-2 mb-4 items-center">
        <span className="text-sm font-medium">Selected tags:</span>
        {selectedTags.map((tag) => (
          <Button
            key={tag}
            variant="secondary"
            size="sm"
            className="h-7 px-2 py-0 text-xs flex items-center gap-1"
            onClick={() => handleTagSelect(tag)}
          >
            {tag}
            <span className="ml-1">×</span>
          </Button>
        ))}
        {selectedTags.length > 0 && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setSelectedTags([])} 
            className="h-6 text-xs"
          >
            Clear tags
          </Button>
        )}
      </div>
    );
  }, [selectedTags, handleTagSelect]);

  // Render grid item for virtualized list
  const renderGridItem = useCallback(({ index, style }: { index: number; style: React.CSSProperties }) => {
    const link = filteredLinks[index];
    return (
      <div style={style} className="p-2">
        <LinkCard
          title={link.title}
          description={link.description}
          url={link.url}
          category={link.category}
          subcategory={link.subcategory}
          tags={link.tags || []}
          isNew={link.isNew}
          onClick={() => handleLinkClick(link)}
          onToggleExpand={() => link.id && handleToggleExpand(link.id)}
          isExpanded={link.id ? expandedItems.has(link.id) : false}
        >
          {link.id && expandedItems.has(link.id) && (
            <div className="mt-3 animate-fade-in">
              <Button
                variant="outline"
                size="sm"
                className="mr-2"
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
          )}
        </LinkCard>
      </div>
    );
  }, [filteredLinks, expandedItems, handleLinkClick, handleToggleExpand, handleShareLink, handleCopyLink]);

  // Render list item for virtualized list
  const renderListItem = useCallback(({ index, style }: { index: number; style: React.CSSProperties }) => {
    const link = filteredLinks[index];
    return (
      <div style={style} className="px-2">
        <LinkRow
          title={link.title}
          description={link.description}
          url={link.url}
          category={link.category}
          subcategory={link.subcategory}
          tags={link.tags || []}
          isNew={link.isNew}
          isExpanded={link.id ? expandedItems.has(link.id) : false}
          onToggleExpand={() => link.id && handleToggleExpand(link.id)}
        >
          {link.id && expandedItems.has(link.id) && (
            <div className="mt-3 animate-fade-in flex gap-2">
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
          )}
        </LinkRow>
      </div>
    );
  }, [filteredLinks, expandedItems, handleToggleExpand, handleShareLink, handleCopyLink]);

  // Render compact item
  const renderCompactItem = useCallback((link: FlattenedLink) => {
    return (
      <div 
        key={link.id || link.url} 
        className="flex items-center justify-between py-1 px-2 hover:bg-accent/50 rounded-sm cursor-pointer border-b border-border/30 last:border-b-0"
        onClick={() => handleLinkClick(link)}
      >
        <div className="flex-1 min-w-0 mr-2">
          <div className="flex items-center gap-1">
            <span className="text-sm font-medium truncate">{link.title}</span>
            {link.isNew && (
              <span className="bg-primary/10 text-primary text-[10px] px-1 py-0.5 rounded-sm flex-shrink-0">NEW</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={(e) => {
              e.stopPropagation();
              handleCopyLink(e, link);
            }}
          >
            <Copy className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={(e) => {
              e.stopPropagation();
              handleShareLink(e, link);
            }}
          >
            <Share className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={(e) => {
              e.stopPropagation();
              window.open(link.url, "_blank", "noopener,noreferrer");
            }}
          >
            <ExternalLink className="h-3 w-3" />
          </Button>
        </div>
      </div>
    );
  }, [handleLinkClick, handleCopyLink, handleShareLink]);

  // Render recently viewed links
  const renderRecentlyViewed = useCallback(() => {
    // In a real implementation, this would come from localStorage or a backend
    const recentlyViewed = allLinks.slice(0, 5);
    
    if (recentlyViewed.length === 0) return null;
    
    return (
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium flex items-center gap-1">
            <Clock className="h-4 w-4" />
            Recently Viewed
          </h3>
          <Button variant="ghost" size="sm" className="h-7 text-xs">
            View all
          </Button>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-primary/20 scrollbar-track-transparent">
          {recentlyViewed.map((link, index) => (
            <div 
              key={link.id || index} 
              className="flex-shrink-0 w-[200px] border rounded-md p-3 bg-card hover:bg-accent cursor-pointer"
              onClick={() => handleLinkClick(link)}
            >
              <h4 className="font-medium text-sm truncate mb-1">{link.title}</h4>
              <p className="text-xs text-muted-foreground truncate">{link.description}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }, [allLinks, handleLinkClick]);

  return (
    <TooltipProvider>
      <div className="w-full">
        {/* Sticky search and filter bar */}
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm py-2 border-b">
          <div className="flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <EnhancedSearch 
                onSearch={handleSearch}
                searchResults={filteredLinks.map(link => ({
                  id: link.id,
                  title: link.title,
                  description: link.description,
                  url: link.url,
                  category: link.category,
                  subcategory: link.subcategory
                }))}
                placeholder="Search links..." 
                className="w-full sm:w-[300px]"
                value={searchQuery}
                onResultClick={handleLinkClick}
              />
              
              <div className="flex flex-wrap items-center gap-2">
                <FilterSheet
                  categoryCounts={categoryCounts}
                  allTags={allTags}
                  selectedCategory={selectedCategory}
                  selectedSubcategory={selectedSubcategory}
                  selectedTags={selectedTags}
                  onCategorySelect={handleCategorySelect}
                  onSubcategorySelect={handleSubcategorySelect}
                  onTagSelect={handleTagSelect}
                  onSortChange={handleSortChange}
                  onNewOnlyChange={handleNewOnlyChange}
                  onOfficialOnlyChange={handleOfficialOnlyChange}
                  onClearFilters={clearFilters}
                  sortBy={sortBy}
                  newOnly={newOnly}
                  officialOnly={officialOnly}
                />
                
                <div className="flex items-center space-x-2">
                  <Button
                    variant={viewMode === "grid" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setViewMode("grid")}
                    className="h-8 w-8 p-0"
                    title="Grid View"
                  >
                    <Grid2X2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === "list" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setViewMode("list")}
                    className="h-8 w-8 p-0"
                    title="List View"
                  >
                    <ListIcon className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === "compact" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setViewMode("compact")}
                    className="h-8 w-8 p-0"
                    title="Compact View"
                  >
                    <ListIcon className="h-4 w-4 scale-75" />
                  </Button>
                </div>
              </div>
            </div>
            
            {/* Horizontal category navigation */}
            <CategoryScroll
              categoryCounts={categoryCounts}
              selectedCategory={selectedCategory}
              selectedSubcategory={selectedSubcategory}
              onCategorySelect={handleCategorySelect}
              onSubcategorySelect={handleSubcategorySelect}
            />
          </div>
        </div>
        
        {/* Selected tags */}
        {renderSelectedTags()}
        
        {/* Recently viewed links */}
        {!searchQuery && !selectedCategory && !selectedTags.length && renderRecentlyViewed()}
        
        {/* Results count */}
        <div className="text-sm text-muted-foreground mb-4">
          {filteredLinks.length} {filteredLinks.length === 1 ? 'result' : 'results'} found
        </div>
        
        {/* Results */}
        {isLoading ? (
          <div className="flex h-[400px] w-full items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredLinks.length === 0 ? (
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
        ) : (
          <div className="w-full rounded-lg border bg-card" style={{ height: 'min(70vh, 600px)' }}>
            <AutoSizer>
              {({ height, width }) => (
                <List
                  ref={listRef}
                  height={height}
                  width={width}
                  itemCount={filteredLinks.length}
                  itemSize={
                    viewMode === "grid" 
                      ? (width < 640 ? 220 : 180) 
                      : viewMode === "list" 
                        ? (width < 640 ? 100 : 80)
                        : 38 // compact view height - slightly smaller for better density
                  }
                  overscanCount={overscanCount}
                  className="scrollbar-thin scrollbar-thumb-primary/20 scrollbar-track-transparent"
                >
                  {({ index, style }) => {
                    const link = filteredLinks[index];
                    return (
                      <div style={style} className={viewMode === "compact" ? "px-1" : ""}>
                        {viewMode === "grid" 
                          ? renderGridItem({ index, style })
                          : viewMode === "list"
                            ? renderListItem({ index, style })
                            : renderCompactItem(link)
                        }
                      </div>
                    );
                  }}
                </List>
              )}
            </AutoSizer>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}
