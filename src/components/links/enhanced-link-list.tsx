"use client";

import { useState, useEffect } from "react";
import { Data, Link } from "@/types/links";
import { VirtualizedLinkList } from "@/components/links/virtualized-link-list";
import { AddLinkDialog } from "@/components/links/add-link-dialog";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EnhancedLinkListProps {
  data: Data;
}

export function EnhancedLinkList({ data: initialData }: EnhancedLinkListProps) {
  const [data, setData] = useState<Data>(initialData);
  const [activeTags, setActiveTags] = useState<string[]>([]);
  const [allTags, setAllTags] = useState<string[]>([]);

  // Extract all unique tags from the data
  useEffect(() => {
    const tags = new Set<string>();
    
    data.categories.forEach((category) => {
      category.subcategories.forEach((subcategory) => {
        subcategory.links.forEach((link) => {
          if (link.tags) {
            link.tags.forEach((tag) => tags.add(tag));
          }
        });
      });
    });
    
    setAllTags(Array.from(tags).sort());
  }, [data]);

  // Handle adding a new link
  const handleAddLink = (newLink: Partial<Link>) => {
    if (!newLink.category || !newLink.subcategory) return;
    
    // Create a deep copy of the data
    const updatedData = JSON.parse(JSON.stringify(data)) as Data;
    
    // Find the category and subcategory
    const categoryIndex = updatedData.categories.findIndex(
      (cat) => cat.name === newLink.category
    );
    
    if (categoryIndex === -1) return;
    
    const subcategoryIndex = updatedData.categories[categoryIndex].subcategories.findIndex(
      (subcat) => subcat.name === newLink.subcategory
    );
    
    if (subcategoryIndex === -1) return;
    
    // Add the new link to the subcategory
    updatedData.categories[categoryIndex].subcategories[subcategoryIndex].links.push({
      id: newLink.id || `link-${Date.now()}`, // Ensure id is always defined
      title: newLink.title || "",
      url: newLink.url || "",
      description: newLink.description || "",
      category: newLink.category,
      subcategory: newLink.subcategory,
      tags: newLink.tags || [],
      isNew: true,
      createdAt: newLink.createdAt || new Date().toISOString(),
      updatedAt: newLink.updatedAt || new Date().toISOString(),
    });
    
    // Update the data state
    setData(updatedData);
  };

  // Toggle a tag filter
  const toggleTag = (tag: string) => {
    setActiveTags((prev) => 
      prev.includes(tag) 
        ? prev.filter((t) => t !== tag) 
        : [...prev, tag]
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-[#8a2be2] to-[#00f5ff] bg-clip-text text-transparent">Links</h2>
        <AddLinkDialog data={data} onAddLink={handleAddLink} />
      </div>
      
      {allTags.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-[#00f5ff]">Filter by tags:</span>
            {activeTags.length > 0 && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setActiveTags([])}
                className="h-6 px-2 text-xs border-[#8a2be2] text-[#00f5ff] hover:bg-[#8a2be2]/10 hover:text-[#00f5ff]"
              >
                Clear filters
              </Button>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {allTags.map((tag) => (
              <Badge 
                key={tag}
                variant={activeTags.includes(tag) ? "zao-accent" : "zao-subtle"}
                className="cursor-pointer hover:shadow-md transition-all duration-200"
                onClick={() => toggleTag(tag)}
              >
                {tag}
                {activeTags.includes(tag) && (
                  <X className="ml-1 h-3 w-3" />
                )}
              </Badge>
            ))}
          </div>
        </div>
      )}
      
      <VirtualizedLinkList 
        data={data} 
        filterTags={activeTags}
      />
    </div>
  );
}
