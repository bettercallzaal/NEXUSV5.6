import React, { useState, useEffect } from 'react';
import { Slider } from '@/components/ui/slider';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

interface AdvancedFiltersProps {
  onFilterChange: (filters: AdvancedFilters) => void;
  initialFilters?: AdvancedFilters;
}

export interface AdvancedFilters {
  dateRange: {
    from: Date | undefined;
    to: Date | undefined;
  };
  popularityRange: [number, number]; // [min, max] popularity score
  hasAttachments: boolean;
  readStatus: 'all' | 'read' | 'unread';
  selectedTags: string[];
  domainFilters: string[];
}

export function AdvancedFilters({ onFilterChange, initialFilters }: AdvancedFiltersProps) {
  const [filters, setFilters] = useState<AdvancedFilters>({
    dateRange: { from: undefined, to: undefined },
    popularityRange: [0, 100],
    hasAttachments: false,
    readStatus: 'all',
    selectedTags: [],
    domainFilters: [],
    ...initialFilters,
  });

  // Common tags for quick selection
  const commonTags = [
    'research', 'article', 'video', 'tutorial', 'reference',
    'tool', 'inspiration', 'documentation', 'blog', 'news'
  ];

  // Update parent component when filters change
  useEffect(() => {
    onFilterChange(filters);
  }, [filters, onFilterChange]);

  const handleTagToggle = (tag: string) => {
    setFilters(prev => {
      const selectedTags = prev.selectedTags.includes(tag)
        ? prev.selectedTags.filter(t => t !== tag)
        : [...prev.selectedTags, tag];
      
      return { ...prev, selectedTags };
    });
  };

  const handleDomainAdd = (domain: string) => {
    if (domain && !filters.domainFilters.includes(domain)) {
      setFilters(prev => ({
        ...prev,
        domainFilters: [...prev.domainFilters, domain]
      }));
    }
  };

  const handleDomainRemove = (domain: string) => {
    setFilters(prev => ({
      ...prev,
      domainFilters: prev.domainFilters.filter(d => d !== domain)
    }));
  };

  return (
    <div className="space-y-2 p-2 bg-card rounded-lg border">
      <h3 className="text-sm font-medium">Advanced Filters</h3>
      
      {/* Date Range Filter */}
      <div className="space-y-1">
        <h4 className="text-xs font-medium">Date Added</h4>
        <div className="flex flex-wrap gap-1">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "justify-start text-left font-normal",
                  !filters.dateRange.from && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {filters.dateRange.from ? (
                  filters.dateRange.to ? (
                    <>
                      {format(filters.dateRange.from, "LLL dd, y")} -{" "}
                      {format(filters.dateRange.to, "LLL dd, y")}
                    </>
                  ) : (
                    format(filters.dateRange.from, "LLL dd, y")
                  )
                ) : (
                  <span>Pick a date range</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={filters.dateRange.from}
                selected={{
                  from: filters.dateRange.from,
                  to: filters.dateRange.to,
                }}
                onSelect={(range) => {
                  setFilters(prev => ({
                    ...prev,
                    dateRange: {
                      from: range?.from,
                      to: range?.to
                    }
                  }));
                }}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>
          
          {/* Quick date filters */}
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => {
              const today = new Date();
              setFilters(prev => ({
                ...prev,
                dateRange: {
                  from: today,
                  to: today
                }
              }));
            }}
          >
            Today
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => {
              const today = new Date();
              const weekAgo = new Date();
              weekAgo.setDate(today.getDate() - 7);
              setFilters(prev => ({
                ...prev,
                dateRange: {
                  from: weekAgo,
                  to: today
                }
              }));
            }}
          >
            Last 7 days
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => {
              const today = new Date();
              const monthAgo = new Date();
              monthAgo.setMonth(today.getMonth() - 1);
              setFilters(prev => ({
                ...prev,
                dateRange: {
                  from: monthAgo,
                  to: today
                }
              }));
            }}
          >
            Last 30 days
          </Button>
        </div>
      </div>
      
      {/* Popularity Filter */}
      <div className="space-y-1">
        <div className="flex justify-between">
          <h4 className="text-xs font-medium">Popularity Score</h4>
          <span className="text-sm text-muted-foreground">
            {filters.popularityRange[0]} - {filters.popularityRange[1]}
          </span>
        </div>
        <Slider
          defaultValue={filters.popularityRange}
          min={0}
          max={100}
          step={1}
          onValueChange={(value) => {
            setFilters(prev => ({
              ...prev,
              popularityRange: value as [number, number]
            }));
          }}
        />
      </div>
      
      {/* Read Status Filter */}
      <div className="space-y-1">
        <h4 className="text-xs font-medium">Read Status</h4>
        <div className="flex space-x-1">
          <Button 
            variant={filters.readStatus === 'all' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => setFilters(prev => ({ ...prev, readStatus: 'all' }))}
          >
            All
          </Button>
          <Button 
            variant={filters.readStatus === 'read' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => setFilters(prev => ({ ...prev, readStatus: 'read' }))}
          >
            Read
          </Button>
          <Button 
            variant={filters.readStatus === 'unread' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => setFilters(prev => ({ ...prev, readStatus: 'unread' }))}
          >
            Unread
          </Button>
        </div>
      </div>
      
      {/* Attachments Filter */}
      <div className="flex items-center space-x-2">
        <Switch 
          id="has-attachments" 
          checked={filters.hasAttachments}
          onCheckedChange={(checked) => {
            setFilters(prev => ({
              ...prev,
              hasAttachments: checked
            }));
          }}
        />
        <Label htmlFor="has-attachments">Has attachments</Label>
      </div>
      
      {/* Tags Filter */}
      <div className="space-y-1">
        <h4 className="text-xs font-medium">Tags</h4>
        <div className="flex flex-wrap gap-1">
          {commonTags.map(tag => (
            <Badge 
              key={tag}
              variant={filters.selectedTags.includes(tag) ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => handleTagToggle(tag)}
            >
              {tag}
            </Badge>
          ))}
        </div>
      </div>
      
      {/* Domain Filters */}
      <div className="space-y-1">
        <h4 className="text-xs font-medium">Domain Filters</h4>
        <div className="flex">
          <input 
            type="text" 
            placeholder="example.com"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                const input = e.currentTarget;
                handleDomainAdd(input.value);
                input.value = '';
              }
            }}
          />
          <Button 
            variant="outline" 
            className="ml-2"
            onClick={() => {
              const input = document.querySelector('input[placeholder="example.com"]') as HTMLInputElement;
              if (input) {
                handleDomainAdd(input.value);
                input.value = '';
              }
            }}
          >
            Add
          </Button>
        </div>
        <div className="flex flex-wrap gap-2 mt-2">
          {filters.domainFilters.map(domain => (
            <Badge 
              key={domain}
              variant="secondary"
              className="cursor-pointer"
            >
              {domain}
              <button 
                className="ml-1 text-muted-foreground hover:text-foreground"
                onClick={() => handleDomainRemove(domain)}
              >
                ×
              </button>
            </Badge>
          ))}
        </div>
      </div>
      
      {/* Reset Filters */}
      <Button 
        variant="outline" 
        size="sm"
        className="w-full mt-1"
        onClick={() => {
          setFilters({
            dateRange: { from: undefined, to: undefined },
            popularityRange: [0, 100],
            hasAttachments: false,
            readStatus: 'all',
            selectedTags: [],
            domainFilters: []
          });
        }}
      >
        Reset Filters
      </Button>
    </div>
  );
}
