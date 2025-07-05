"use client";

import { useState, useMemo } from "react";
import Fuse from "fuse.js";
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from "@/components/ui/accordion";
import { Search } from "@/components/ui/search";
import { Category, Link, LinksData } from "@/types/links";
import { ExternalLink } from "lucide-react";

interface LinkAccordionProps {
  data: LinksData;
}

export function LinkAccordion({ data }: LinkAccordionProps) {
  const [searchQuery, setSearchQuery] = useState("");
  
  // Create a flattened array of all links for searching
  const allLinks = useMemo(() => {
    const links: Array<Link & { category: string; subcategory: string }> = [];
    
    data.categories.forEach((category) => {
      category.subcategories.forEach((subcategory) => {
        subcategory.links.forEach((link) => {
          links.push({
            ...link,
            category: category.name,
            subcategory: subcategory.name,
          });
        });
      });
    });
    
    return links;
  }, [data]);
  
  // Set up Fuse.js for fuzzy searching
  const fuse = useMemo(() => {
    return new Fuse(allLinks, {
      keys: ["title", "description", "category", "subcategory"],
      threshold: 0.3,
      includeMatches: true,
    });
  }, [allLinks]);
  
  // Filter categories based on search query
  const filteredCategories = useMemo(() => {
    if (!searchQuery) {
      return data.categories;
    }
    
    const searchResults = fuse.search(searchQuery);
    
    // Create a map to track which categories and subcategories have matches
    const categoryMap = new Map<string, Map<string, Set<string>>>();
    
    searchResults.forEach(({ item }) => {
      if (!categoryMap.has(item.category)) {
        categoryMap.set(item.category, new Map<string, Set<string>>());
      }
      
      const subcategoryMap = categoryMap.get(item.category)!;
      if (!subcategoryMap.has(item.subcategory)) {
        subcategoryMap.set(item.subcategory, new Set<string>());
      }
      
      subcategoryMap.get(item.subcategory)!.add(item.title);
    });
    
    // Build filtered categories based on search results
    return data.categories
      .map((category) => {
        const subcategoryMap = categoryMap.get(category.name);
        if (!subcategoryMap) return null;
        
        const filteredSubcategories = category.subcategories
          .map((subcategory) => {
            const linkTitles = subcategoryMap.get(subcategory.name);
            if (!linkTitles) return null;
            
            return {
              ...subcategory,
              links: subcategory.links.filter((link) => linkTitles.has(link.title)),
            };
          })
          .filter(Boolean) as typeof category.subcategories;
        
        if (filteredSubcategories.length === 0) return null;
        
        return {
          ...category,
          subcategories: filteredSubcategories,
        };
      })
      .filter(Boolean) as Category[];
  }, [data.categories, fuse, searchQuery]);
  
  return (
    <div className="w-full space-y-6">
      <Search 
        onSearch={setSearchQuery} 
        placeholder="Search for links, categories, or descriptions..." 
        className="mx-auto"
      />
      
      {filteredCategories.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground">No links found matching your search.</p>
        </div>
      ) : (
        <Accordion type="multiple" className="w-full">
          {filteredCategories.map((category) => (
            <AccordionItem key={category.name} value={category.name}>
              <AccordionTrigger className="text-lg font-semibold">
                {category.name}
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4">
                  {category.subcategories.map((subcategory) => (
                    <div key={subcategory.name} className="space-y-2">
                      <h3 className="font-medium text-md">{subcategory.name}</h3>
                      <div className="grid gap-2">
                        {subcategory.links.map((link) => (
                          <a
                            key={link.url}
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-start p-3 rounded-md hover:bg-accent group"
                          >
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <h4 className="font-medium group-hover:underline">
                                  {link.title}
                                </h4>
                                <ExternalLink className="h-3 w-3 opacity-70" />
                              </div>
                              <p className="text-sm text-muted-foreground mt-1">
                                {link.description}
                              </p>
                            </div>
                          </a>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}
    </div>
  );
}
