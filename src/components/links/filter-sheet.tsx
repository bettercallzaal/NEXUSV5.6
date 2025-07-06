"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TagBadge } from "@/components/links/tag-badge";
import { Filter } from "lucide-react";

interface CategoryWithCount {
  name: string;
  count: number;
  subcategories: {
    name: string;
    count: number;
  }[];
}

interface TagWithCount {
  name: string;
  count: number;
}

interface FilterSheetProps {
  categoryCounts: Record<string, CategoryWithCount>;
  allTags: TagWithCount[];
  selectedCategory: string | null;
  selectedSubcategory: string | null;
  selectedTags: string[];
  onCategorySelect: (category: string) => void;
  onSubcategorySelect: (subcategory: string) => void;
  onTagSelect: (tag: string) => void;
  onSortChange: (sort: string) => void;
  onNewOnlyChange: (checked: boolean) => void;
  onOfficialOnlyChange: (checked: boolean) => void;
  onClearFilters: () => void;
  sortBy: string;
  newOnly: boolean;
  officialOnly: boolean;
}

export function FilterSheet({
  categoryCounts,
  allTags,
  selectedCategory,
  selectedSubcategory,
  selectedTags,
  onCategorySelect,
  onSubcategorySelect,
  onTagSelect,
  onSortChange,
  onNewOnlyChange,
  onOfficialOnlyChange,
  onClearFilters,
  sortBy = "newest",
  newOnly = false,
  officialOnly = false
}: FilterSheetProps) {
  const [open, setOpen] = useState(false);
  
  // Calculate active filters count
  const activeFiltersCount = 
    (selectedCategory ? 1 : 0) + 
    (selectedSubcategory ? 1 : 0) + 
    selectedTags.length +
    (newOnly ? 1 : 0) + 
    (officialOnly ? 1 : 0);
  
  // Get top tags (most frequent)
  const topTags = [...allTags]
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
  
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="flex gap-2 items-center">
          <Filter size={16} />
          <span>Filters</span>
          {activeFiltersCount > 0 && (
            <Badge variant="secondary" className="ml-1">{activeFiltersCount}</Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="h-[80vh] rounded-t-xl">
        <SheetHeader>
          <SheetTitle>Filter Links</SheetTitle>
          <SheetDescription>Refine your search results</SheetDescription>
        </SheetHeader>
        
        <Tabs defaultValue="categories" className="mt-4">
          <TabsList className="grid grid-cols-3">
            <TabsTrigger value="categories">Categories</TabsTrigger>
            <TabsTrigger value="tags">Tags</TabsTrigger>
            <TabsTrigger value="other">Other</TabsTrigger>
          </TabsList>
          
          <TabsContent value="categories" className="mt-4">
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium mb-2">Categories</h3>
                <ScrollArea className="h-[200px]">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="all-categories" 
                        checked={!selectedCategory}
                        onCheckedChange={() => onCategorySelect('')}
                      />
                      <label 
                        htmlFor="all-categories" 
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        All Categories
                      </label>
                    </div>
                    
                    {Object.entries(categoryCounts).map(([category, data]) => (
                      <div key={category} className="flex items-center space-x-2">
                        <Checkbox 
                          id={`category-${category}`} 
                          checked={selectedCategory === category}
                          onCheckedChange={() => onCategorySelect(category)}
                        />
                        <label 
                          htmlFor={`category-${category}`} 
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center"
                        >
                          {category}
                          <Badge variant="secondary" className="ml-2">
                            {data.count}
                          </Badge>
                        </label>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
              
              {selectedCategory && categoryCounts[selectedCategory]?.subcategories?.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium mb-2">Subcategories</h3>
                  <ScrollArea className="h-[200px]">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="all-subcategories" 
                          checked={!selectedSubcategory}
                          onCheckedChange={() => onSubcategorySelect('')}
                        />
                        <label 
                          htmlFor="all-subcategories" 
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          All {selectedCategory} Subcategories
                        </label>
                      </div>
                      
                      {categoryCounts[selectedCategory].subcategories.map((sub) => (
                        <div key={sub.name} className="flex items-center space-x-2">
                          <Checkbox 
                            id={`subcategory-${sub.name}`} 
                            checked={selectedSubcategory === sub.name}
                            onCheckedChange={() => onSubcategorySelect(sub.name)}
                          />
                          <label 
                            htmlFor={`subcategory-${sub.name}`} 
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center"
                          >
                            {sub.name}
                            <Badge variant="secondary" className="ml-2">
                              {sub.count}
                            </Badge>
                          </label>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="tags" className="mt-4">
            <h3 className="text-sm font-medium mb-2">Popular Tags</h3>
            <div className="flex flex-wrap gap-2 mb-4">
              {topTags.map((tag) => (
                <TagBadge
                  key={tag.name}
                  tag={tag.name}
                  count={tag.count}
                  active={selectedTags.includes(tag.name)}
                  onClick={() => onTagSelect(tag.name)}
                />
              ))}
            </div>
            
            {allTags.length > topTags.length && (
              <>
                <h3 className="text-sm font-medium mb-2">All Tags</h3>
                <ScrollArea className="h-[200px]">
                  <div className="flex flex-wrap gap-2">
                    {allTags.map((tag) => (
                      <TagBadge
                        key={tag.name}
                        tag={tag.name}
                        count={tag.count}
                        active={selectedTags.includes(tag.name)}
                        onClick={() => onTagSelect(tag.name)}
                      />
                    ))}
                  </div>
                </ScrollArea>
              </>
            )}
          </TabsContent>
          
          <TabsContent value="other" className="mt-4">
            <div className="space-y-4 py-4">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="new-only" 
                  checked={newOnly}
                  onCheckedChange={(checked) => onNewOnlyChange(!!checked)}
                />
                <label 
                  htmlFor="new-only"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  New links only
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="official-only" 
                  checked={officialOnly}
                  onCheckedChange={(checked) => onOfficialOnlyChange(!!checked)}
                />
                <label 
                  htmlFor="official-only"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Official resources only
                </label>
              </div>
              <div className="space-y-2">
                <Label htmlFor="sort-by">Sort by</Label>
                <Select value={sortBy} onValueChange={onSortChange}>
                  <SelectTrigger id="sort-by">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Newest first</SelectItem>
                    <SelectItem value="oldest">Oldest first</SelectItem>
                    <SelectItem value="popular">Most popular</SelectItem>
                    <SelectItem value="az">A-Z</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </TabsContent>
        </Tabs>
        
        <SheetFooter className="flex-row justify-between border-t pt-4 mt-4">
          <Button variant="outline" onClick={onClearFilters}>Clear all</Button>
          <Button onClick={() => setOpen(false)}>Apply filters</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
