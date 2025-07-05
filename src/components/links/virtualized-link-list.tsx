"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { FixedSizeList as List } from "react-window";
import AutoSizer from "react-virtualized-auto-sizer";
import Fuse from "fuse.js";
import { Search } from "@/components/ui/search";
import { ExternalLink, Grid2X2, List as ListIcon, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LinkCard } from "@/components/links/link-card";
import { LinkRow } from "@/components/links/link-row";
import { TagBadge } from "@/components/links/tag-badge";
import { cn } from "@/lib/utils";
import { TooltipProvider } from "@/components/ui/tooltip";

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

interface VirtualizedLinkListProps {
  data: Data;
  filterTags?: string[];
}

type ViewMode = "grid" | "list";

interface FlattenedLink extends Link {
  category: string;
  subcategory: string;
  id?: string;
  tags?: string[];
  isNew?: boolean;
}

export function VirtualizedLinkList({ data, filterTags = [] }: VirtualizedLinkListProps) {
  // Main state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>(filterTags || []);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  
  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [overscanCount, setOverscanCount] = useState(5);
  const [itemsPerRow, setItemsPerRow] = useState(4);
  
  // Simulate loading state for better UX
  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer);
  }, [searchQuery, selectedCategory, selectedSubcategory, selectedTags, viewMode]);
  
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
    
    data.categories.forEach((category, catIndex) => {
      category.subcategories.forEach((subcategory, subIndex) => {
        subcategory.links.forEach((link, linkIndex) => {
          const possibleTags = ['Official', 'Community', 'Tutorial', 'Documentation', 'Tool', 'Article', 'Video'];
          const randomTags = Array.from({ length: Math.floor(Math.random() * 3) }, () => 
            possibleTags[Math.floor(Math.random() * possibleTags.length)]
          );
          
          links.push({
            ...link,
            category: category.name,
            subcategory: subcategory.name,
            id: `${catIndex}-${subIndex}-${linkIndex}`,
            tags: link.tags || randomTags,
            isNew: Math.random() > 0.9, // 10% chance of being marked as new
          });
        });
      });
    });
    
    return links;
  }, [data]);
  
  // Extract all unique tags from links
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    allLinks.forEach(link => {
      if (link.tags) {
        link.tags.forEach(tag => tagSet.add(tag));
      }
    });
    return Array.from(tagSet).sort();
  }, [allLinks]);
  
  // Count links per category and subcategory
  const categoryCounts = useMemo(() => {
    const counts: Record<string, CategoryWithCount> = {};
    
    // Count links in each category and subcategory
    allLinks.forEach(link => {
      if (!counts[link.category]) {
        counts[link.category] = {
          name: link.category,
          count: 0,
          subcategories: []
        };
      }
      
      counts[link.category].count++;
      
      // Find or create subcategory
      let subcat = counts[link.category].subcategories.find(
        sub => sub.name === link.subcategory
      );
      
      if (!subcat) {
        subcat = { name: link.subcategory, count: 0 };
        counts[link.category].subcategories.push(subcat);
      }
      
      subcat.count++;
    });
    
    return counts;
  }, [allLinks, data.categories]);
  
  // Count links per tag
  const tagCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    allLinks.forEach(link => {
      if (link.tags) {
        link.tags.forEach(tag => {
          counts[tag] = (counts[tag] || 0) + 1;
        });
      }
    });
    return counts;
  }, [allLinks]);
  
  // Filter links based on current selections
  const filteredLinks = useMemo(() => {
    let filtered = [...allLinks];
    
    // Filter by category
    if (selectedCategory) {
      filtered = filtered.filter(link => link.category === selectedCategory);
    }
    
    // Filter by subcategory
    if (selectedSubcategory) {
      filtered = filtered.filter(link => link.subcategory === selectedSubcategory);
    }
    
    // Filter by tags (both internal selected tags and external filter tags)
    const tagsToFilter = [...selectedTags, ...filterTags];
    if (tagsToFilter.length > 0) {
      filtered = filtered.filter(link => {
        if (!link.tags || link.tags.length === 0) return false;
        return tagsToFilter.some(tag => link.tags?.includes(tag));
      });
    }
    
    // Search by query
    if (searchQuery.trim()) {
      const fuse = new Fuse(filtered, {
        keys: ['title', 'description', 'url', 'category', 'subcategory'],
        threshold: 0.4,
        includeMatches: true,
      });
      
      const results = fuse.search(searchQuery);
      filtered = results.map(result => result.item);
    }
    
    return filtered;
  }, [allLinks, selectedCategory, selectedSubcategory, selectedTags, filterTags, searchQuery]);
  
  // Handle category selection
  const handleCategorySelect = useCallback((category: string) => {
    if (selectedCategory === category) {
      setSelectedCategory(null);
      setSelectedSubcategory(null);
    } else {
      setSelectedCategory(category);
      setSelectedSubcategory(null);
    }
  }, [selectedCategory]);
  
  // Handle subcategory selection
  const handleSubcategorySelect = useCallback((subcategory: string) => {
    if (selectedSubcategory === subcategory) {
      setSelectedSubcategory(null);
    } else {
      setSelectedSubcategory(subcategory);
    }
  }, [selectedSubcategory]);
  
  // Handle tag selection
  const handleTagSelect = useCallback((tag: string) => {
    setSelectedTags(prev => {
      if (prev.includes(tag)) {
        return prev.filter(t => t !== tag);
      } else {
        return [...prev, tag];
      }
    });
  }, []);
  
  // Clear all filters
  const clearFilters = useCallback(() => {
    setSearchQuery("");
    setSelectedCategory(null);
    setSelectedSubcategory(null);
    setSelectedTags([]);
  }, []);
  
  // State for expanded items (if needed in the future)
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  
  // Toggle item expansion
  const toggleItemExpansion = useCallback((id: string) => {
    setExpandedItems(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);
  



  // Render functions for list items
  const LinkGridItem = useCallback(({ index, style }: { index: number; style: React.CSSProperties }) => {
    const link = filteredLinks[index];
    return (
      <div style={style} className="p-2">
        <LinkCard 
          link={link} 
          tags={link.tags}
          isNew={link.isNew}
          onClick={() => link.tags?.forEach(tag => handleTagSelect(tag))}
        />
      </div>
    );
  }, [filteredLinks, handleTagSelect]);

  const LinkListItem = useCallback(({ index, style }: { index: number; style: React.CSSProperties }) => {
    const link = filteredLinks[index];
    const isExpanded = link.id ? expandedItems.has(link.id) : false;
    
    return (
      <div style={style} className="p-2">
        <LinkRow 
          link={link} 
          isExpanded={isExpanded}
          onToggleExpand={() => link.id ? toggleItemExpansion(link.id) : undefined}
          tags={link.tags || []}
          isNew={link.isNew || false}
        />
      </div>
    );
  }, [filteredLinks, expandedItems, toggleItemExpansion]);

  // Render selected tags
  const renderSelectedTags = () => {
    if (selectedTags.length === 0) return null;
    
    return (
      <div className="flex flex-wrap gap-2 mb-4">
        {selectedTags.map(tag => (
          <TagBadge 
            key={tag} 
            tag={tag} 
            onClick={() => handleTagSelect(tag)} 
            active={true} 
          />
        ))}
        {selectedTags.length > 0 && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={clearFilters} 
            className="h-6 text-xs"
          >
            Clear filters
          </Button>
        )}
      </div>
    );
  };

  return (
    <TooltipProvider>
      <div className="w-full">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
          <Search 
            onSearch={setSearchQuery} 
            placeholder="Search links..." 
            className="w-full md:w-[300px]"
          />
          
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center space-x-2">
              <Button
                variant={viewMode === "grid" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("grid")}
                className="h-8 w-8 p-0"
              >
                <Grid2X2 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("list")}
                className="h-8 w-8 p-0"
              >
                <ListIcon className="h-4 w-4" />
              </Button>
            </div>
            
            <Button
              variant={selectedCategory ? "default" : "outline"}
              size="sm"
              onClick={() => selectedCategory ? handleCategorySelect('') : null}
              className="h-8"
            >
              {selectedCategory || "All Categories"}
              {selectedCategory && " ×"}
            </Button>
            
            {selectedCategory && categoryCounts[selectedCategory]?.subcategories?.length > 0 && (
              <Button
                variant={selectedSubcategory ? "default" : "outline"}
                size="sm"
                onClick={() => selectedSubcategory ? handleSubcategorySelect('') : null}
                className="h-8"
              >
                {selectedSubcategory || "All Subcategories"}
                {selectedSubcategory && " ×"}
              </Button>
            )}
          </div>
        </div>
        
        {renderSelectedTags()}
        
        <div className="text-sm text-muted-foreground mb-4">
          {filteredLinks.length} {filteredLinks.length === 1 ? 'result' : 'results'} found
        </div>
        
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
                  height={height}
                  width={width}
                  itemCount={filteredLinks.length}
                  itemSize={viewMode === "grid" ? (width < 640 ? 220 : 180) : (width < 640 ? 100 : 80)}
                  overscanCount={overscanCount}
                  className="scrollbar-thin scrollbar-thumb-primary/20 scrollbar-track-transparent"
                >
                  {viewMode === "grid" ? LinkGridItem : LinkListItem}
                </List>
              )}
            </AutoSizer>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}
