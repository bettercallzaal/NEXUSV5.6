import React, { useState, useEffect } from 'react';
import { AdvancedFilters } from '@/components/filters/advanced-filters';
import { Button } from '@/components/ui/button';
import { Filter, SlidersHorizontal, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useMediaQuery } from '@/hooks/use-media-query';

interface LinkFilterSidebarProps {
  onFilterChange: (filters: any) => void;
  initialFilters?: any;
  className?: string;
}

export function LinkFilterSidebar({ 
  onFilterChange, 
  initialFilters, 
  className 
}: LinkFilterSidebarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const isMobile = useMediaQuery("(max-width: 768px)");
  
  // Close sidebar when switching to mobile view
  useEffect(() => {
    if (isMobile) {
      setIsOpen(false);
    }
  }, [isMobile]);

  // Handle filter changes
  const handleFilterChange = (filters: any) => {
    onFilterChange(filters);
  };

  return (
    <>
      {/* Filter toggle button - always visible */}
      <Button
        variant="outline"
        size="sm"
        className="flex items-center gap-1 md:hidden"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? (
          <>
            <X className="h-4 w-4" />
            <span>Close Filters</span>
          </>
        ) : (
          <>
            <Filter className="h-4 w-4" />
            <span>Filters</span>
          </>
        )}
      </Button>

      {/* Desktop sidebar - always visible on larger screens */}
      <div 
        className={cn(
          "hidden md:block w-72 shrink-0 border-r p-4 h-full overflow-y-auto",
          className
        )}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium">Filters</h3>
          <SlidersHorizontal className="h-4 w-4" />
        </div>
        <AdvancedFilters 
          onFilterChange={handleFilterChange}
          initialFilters={initialFilters}
        />
      </div>

      {/* Mobile sidebar - slides in when toggled */}
      {isMobile && (
        <div
          className={cn(
            "fixed inset-y-0 left-0 z-50 w-72 bg-background border-r shadow-lg transform transition-transform duration-300 ease-in-out overflow-y-auto",
            isOpen ? "translate-x-0" : "-translate-x-full",
            className
          )}
        >
          <div className="sticky top-0 z-10 flex items-center justify-between p-4 bg-background border-b">
            <h3 className="text-lg font-medium">Filters</h3>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
          <div className="p-4">
            <AdvancedFilters 
              onFilterChange={handleFilterChange}
              initialFilters={initialFilters}
            />
          </div>
        </div>
      )}

      {/* Backdrop for mobile */}
      {isMobile && isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
