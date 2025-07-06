"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

interface CategoryWithCount {
  name: string;
  count: number;
  subcategories: {
    name: string;
    count: number;
  }[];
}

interface CategoryScrollProps {
  categoryCounts: Record<string, CategoryWithCount>;
  selectedCategory: string | null;
  selectedSubcategory: string | null;
  onCategorySelect: (category: string) => void;
  onSubcategorySelect: (subcategory: string) => void;
}

export function CategoryScroll({
  categoryCounts,
  selectedCategory,
  selectedSubcategory,
  onCategorySelect,
  onSubcategorySelect
}: CategoryScrollProps) {
  return (
    <div className="space-y-3">
      <ScrollArea className="w-full pb-2" orientation="horizontal">
        <div className="flex space-x-2 pb-1">
          <Button
            variant={!selectedCategory ? "default" : "outline"}
            size="sm"
            onClick={() => onCategorySelect('')}
            className="h-9 flex-shrink-0"
          >
            All
          </Button>
          
          {Object.entries(categoryCounts).map(([category, data]) => (
            <Button
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              size="sm"
              onClick={() => onCategorySelect(category)}
              className="h-9 flex-shrink-0 flex items-center gap-1.5"
            >
              <span className="truncate max-w-[120px]">{category}</span>
              <Badge variant="secondary" className="ml-1">
                {data.count}
              </Badge>
            </Button>
          ))}
        </div>
      </ScrollArea>

      {selectedCategory && categoryCounts[selectedCategory]?.subcategories?.length > 0 && (
        <ScrollArea className="w-full pb-2" orientation="horizontal">
          <div className="flex space-x-2 pb-1">
            <Button
              variant={!selectedSubcategory ? "default" : "outline"}
              size="sm"
              onClick={() => onSubcategorySelect('')}
              className="h-8 flex-shrink-0"
            >
              All {selectedCategory}
            </Button>
            
            {categoryCounts[selectedCategory].subcategories.map((sub) => (
              <Button
                key={sub.name}
                variant={selectedSubcategory === sub.name ? "default" : "outline"}
                size="sm"
                onClick={() => onSubcategorySelect(sub.name)}
                className="h-8 flex-shrink-0 flex items-center gap-1.5"
              >
                <span className="truncate max-w-[120px]">{sub.name}</span>
                <Badge variant="secondary" className="ml-1">
                  {sub.count}
                </Badge>
              </Button>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}
