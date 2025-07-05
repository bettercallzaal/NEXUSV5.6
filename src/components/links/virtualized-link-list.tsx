"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { FixedSizeList as List } from "react-window";
import AutoSizer from "react-virtualized-auto-sizer";
import Fuse from "fuse.js";
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from "@/components/ui/accordion";
import { Search } from "@/components/ui/search";
import { ExternalLink, Grid2X2, List as ListIcon, Loader2, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LinkCard } from "@/components/links/link-card";
import { LinkRow } from "@/components/links/link-row";
import { TagBadge } from "@/components/links/tag-badge";
import { SidebarLayout } from "@/components/layout/sidebar-layout";
import { cn } from "@/lib/utils";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/contexts/auth-context";
import { WalletConnectButton } from "@/components/wallet/connect-button";

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
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  
  // UI state
  const [expandedLinks, setExpandedLinks] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [overscanCount, setOverscanCount] = useState(5);
  
  // Auth state
  const { isAuthenticated } = useAuth();
  
  // Simulate loading state for better UX
  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer);
  }, [searchQuery, selectedCategory, selectedSubcategory, selectedTags, viewMode]);
  
  // Increase overscan when scrolling for smoother experience
  useEffect(() => {
    const handleScroll = () => {
      setOverscanCount(10);
      clearTimeout(scrollTimer);
      scrollTimer = setTimeout(() => setOverscanCount(5), 500);
    };
    
    let scrollTimer: NodeJS.Timeout;
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(scrollTimer);
    };
  }, []);
  
  // Toggle link expansion in list view
  const toggleLinkExpansion = useCallback((linkId: string) => {
    setExpandedLinks(prev => {
      const newSet = new Set(prev);
      if (newSet.has(linkId)) {
        newSet.delete(linkId);
      } else {
        newSet.add(linkId);
      }
      return newSet;
    });
  }, []);

  // Create a flattened array of all links for searching and virtualization
  const allLinks = useMemo(() => {
    const links: FlattenedLink[] = [];
    
    data.categories.forEach((category, catIndex) => {
      // Skip the "ZAO Community Members" category if not authenticated
      if (category.name === "ZAO Community Members" && !isAuthenticated) {
        return;
      }
      
      category.subcategories.forEach((subcategory, subIndex) => {
        subcategory.links.forEach((link, linkIndex) => {
          // Generate random tags for demo purposes
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
  }, [data, isAuthenticated]);
  
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
    
    // Add the locked category if not authenticated
    if (!isAuthenticated) {
      const communityMembersCategory = data.categories.find(cat => cat.name === "ZAO Community Members");
      if (communityMembersCategory) {
        counts["ZAO Community Members"] = {
          name: "ZAO Community Members",
          count: 0,
          subcategories: communityMembersCategory.subcategories.map(sub => ({
            name: sub.name,
            count: 0
          }))
        };
      }
    }
    
    return counts;
  }, [allLinks, data.categories, isAuthenticated]);
  
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
  
  // Handle accordion state
  const handleAccordionChange = useCallback((value: string[]) => {
    setExpandedCategories(value);
  }, []);
  
  // Render link item in grid view
  const LinkGridItem = useCallback(({ index, style }: { index: number; style: React.CSSProperties }) => {
    const link = filteredLinks[index];
    return (
      <div style={style} className="p-2">
        <LinkCard 
          link={link}
        />
      </div>
    );
  }, [filteredLinks]);
  
  // Render link item in list view
  const LinkListItem = useCallback(({ index, style }: { index: number; style: React.CSSProperties }) => {
    const link = filteredLinks[index];
    const isExpanded = link.id ? expandedLinks.has(link.id) : false;
    
    return (
      <div style={style} className="px-2">
        <LinkRow
          link={link}
          isExpanded={isExpanded}
          onToggleExpand={() => link.id ? toggleLinkExpansion(link.id) : undefined}
          tags={link.tags || []}
          isNew={link.isNew || false}
        />
      </div>
    );
  }, [filteredLinks, expandedLinks, toggleLinkExpansion]);
  
  // Sidebar component
  const Sidebar = useCallback(() => {
    return (
      <div className="space-y-6 py-4">
        <div className="px-3 py-2">
          <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
            Categories
          </h2>
          <div className="space-y-1">
            <Accordion
              type="multiple"
              value={expandedCategories}
              onValueChange={handleAccordionChange}
              className="w-full"
            >
              {Object.values(categoryCounts).map((category) => (
                <AccordionItem
                  value={category.name}
                  key={category.name}
                  className="border-b-0"
                >
                  <AccordionTrigger
                    className={cn(
                      "px-4 py-2 hover:bg-zinc-800/50 transition-all",
                      selectedCategory === category.name && "bg-zinc-800/50 font-medium",
                      category.name === "ZAO Community Members" && !isAuthenticated && "text-muted-foreground"
                    )}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (category.name === "ZAO Community Members" && !isAuthenticated) {
                        return;
                      }
                      handleCategorySelect(category.name);
                    }}
                  >
                    <span className="text-left flex items-center gap-2">
                      {category.name === "ZAO Community Members" && !isAuthenticated && (
                        <Lock className="h-3 w-3" />
                      )}
                      {category.name}
                    </span>
                    <span className="ml-auto text-xs text-muted-foreground">
                      {category.count}
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="pt-1 pb-2">
                    {category.name === "ZAO Community Members" && !isAuthenticated ? (
                      <div className="p-4 space-y-3">
                        <p className="text-sm text-muted-foreground">
                          Connect your wallet to access exclusive ZAO Community Members links
                        </p>
                        <WalletConnectButton />
                      </div>
                    ) : (
                      <div className="space-y-1 pl-6">
                        {category.subcategories.map((subcategory) => (
                          <Button
                            key={subcategory.name}
                            variant="ghost"
                            size="sm"
                            className={cn(
                              "w-full justify-start font-normal",
                              selectedSubcategory === subcategory.name && "bg-zinc-800/50 font-medium"
                            )}
                            onClick={() => handleSubcategorySelect(subcategory.name)}
                          >
                            <span className="truncate">{subcategory.name}</span>
                            <span className="ml-auto text-xs text-muted-foreground">
                              {subcategory.count}
                            </span>
                          </Button>
                        ))}
                      </div>
                    )}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
        
        <div className="px-3 py-2">
          <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
            Tags
          </h2>
          <div className="px-4 flex flex-wrap gap-2">
            {allTags.map(tag => (
              <TagBadge
                key={tag}
                tag={tag}
                count={tagCounts[tag]}
                active={selectedTags.includes(tag)}
                onClick={() => handleTagSelect(tag)}
              />
            ))}
          </div>
        </div>
        
        {(selectedCategory || selectedSubcategory || selectedTags.length > 0 || searchQuery) && (
          <div className="px-7 py-2">
            <Button
              onClick={clearFilters}
              variant="outline"
              className="w-full"
            >
              Clear All Filters
            </Button>
          </div>
        )}
      </div>
    );
  }, [allLinks, allTags, categoryCounts, clearFilters, handleCategorySelect, handleSubcategorySelect, handleTagSelect, selectedCategory, selectedSubcategory, selectedTags, searchQuery, tagCounts, expandedCategories, handleAccordionChange, isAuthenticated]);

  return (
    <TooltipProvider>
      <div className="flex justify-end mb-4">
        <WalletConnectButton />
      </div>
      <SidebarLayout 
        sidebar={<Sidebar />}
        className="container px-0 py-0 max-w-7xl"
      >
        <div className="space-y-6">
          <div className="flex flex-col gap-4">
            <Search 
              onSearch={setSearchQuery} 
              placeholder="Search for links, categories, or descriptions..." 
              className="w-full max-w-2xl mx-auto"
            />
            
            <div className="flex items-center justify-between">
              <h1 className="font-heading text-2xl font-bold">
                {filteredLinks.length} Links
                {selectedCategory && ` in ${selectedCategory}`}
                {selectedSubcategory && ` > ${selectedSubcategory}`}
                {selectedTags.length > 0 && ` with tags: ${selectedTags.join(', ')}`}
              </h1>
              
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setViewMode("grid")}
                  className={cn(
                    "h-8 w-8",
                    viewMode === "grid" && "bg-accent/20 text-accent border-accent/50"
                  )}
                  aria-label="Grid view"
                >
                  <Grid2X2 className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setViewMode("list")}
                  className={cn(
                    "h-8 w-8",
                    viewMode === "list" && "bg-accent/20 text-accent border-accent/50"
                  )}
                  aria-label="List view"
                >
                  <ListIcon className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
          
          {isLoading ? (
            <div className="flex h-[400px] w-full items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-accent" />
            </div>
          ) : filteredLinks.length === 0 ? (
            <div className="flex h-[400px] w-full flex-col items-center justify-center space-y-4 rounded-lg border border-dashed border-zinc-800 p-8 text-center">
              <div className="rounded-full bg-zinc-900/80 p-3">
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
            <div className="h-[700px] w-full rounded-lg border border-zinc-800 bg-zinc-900/50">
              <AutoSizer>
                {({ height, width }) => (
                  <List
                    height={height}
                    width={width}
                    itemCount={filteredLinks.length}
                    itemSize={viewMode === "grid" ? 180 : 80}
                    overscanCount={overscanCount}
                    className="scrollbar-thin scrollbar-thumb-accent/20 scrollbar-track-transparent"
                  >
                    {viewMode === "grid" ? LinkGridItem : LinkListItem}
                  </List>
                )}
              </AutoSizer>
            </div>
          )}
        </div>
      </SidebarLayout>
    </TooltipProvider>
  );
}
