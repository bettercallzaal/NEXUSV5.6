import React, { useState, useEffect } from 'react';
import { MobileOptimizedLinkList } from '@/components/links/mobile-optimized-link-list';
import { LinkFilterSidebar } from '@/components/links/link-filter-sidebar';
import { processNewLink } from '@/scripts/new-link-processor';
import { AddLinkDialog } from '@/components/links/add-link-dialog';
import { Button } from '@/components/ui/button';
import { useMediaQuery } from '@/hooks/use-media-query';
import { cn } from '@/lib/utils';
import { Data, Link } from '@/types/links';

// Create a mock data structure that matches the Data interface
const mockData: Data = {
  categories: [
    {
      name: 'Official',
      subcategories: [
        {
          name: 'Websites',
          links: [
            {
              id: '1',
              title: 'ZAO Official Website',
              url: 'https://zao.io',
              description: 'The official website for ZAO ecosystem',
              category: 'Official',
              subcategory: 'Websites',
              tags: ['official', 'website'],
            }
          ]
        }
      ]
    },
    {
      name: 'Community',
      subcategories: [
        {
          name: 'Forums',
          links: [
            {
              id: '2',
              title: 'ZAO Community Forum',
              url: 'https://forum.zao.io',
              description: 'Community discussions and support',
              category: 'Community',
              subcategory: 'Forums',
              tags: ['community', 'forum'],
            }
          ]
        }
      ]
    }
  ]
};

interface EnhancedLinkBrowserProps {
  initialLinks?: any[];
  className?: string;
}

export function EnhancedLinkBrowser({ initialLinks = [], className }: EnhancedLinkBrowserProps) {
  // State for links and filters
  const [links, setLinks] = useState(initialLinks);
  const [filteredLinks, setFilteredLinks] = useState(initialLinks);
  const [activeFilters, setActiveFilters] = useState<any>({});
  const [isLoading, setIsLoading] = useState(false);
  
  // Responsive layout
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  
  // Apply filters whenever links or activeFilters change
  useEffect(() => {
    applyFilters();
  }, [links, activeFilters]);
  
  // Handle filter changes from sidebar
  const handleFilterChange = (filters: any) => {
    setActiveFilters(filters);
  };
  
  // Apply all active filters to links
  const applyFilters = () => {
    setIsLoading(true);
    
    let result = [...links];
    
    // Date range filter
    if (activeFilters.dateRange?.from && activeFilters.dateRange?.to) {
      const fromDate = new Date(activeFilters.dateRange.from);
      const toDate = new Date(activeFilters.dateRange.to);
      
      result = result.filter(link => {
        const linkDate = new Date(link.dateAdded || link.createdAt);
        return linkDate >= fromDate && linkDate <= toDate;
      });
    }
    
    // Popularity filter
    if (activeFilters.popularity?.min !== undefined && activeFilters.popularity?.max !== undefined) {
      result = result.filter(link => {
        const score = link.clickCount || 0;
        return score >= activeFilters.popularity.min && score <= activeFilters.popularity.max;
      });
    }
    
    // Read status filter
    if (activeFilters.readStatus) {
      if (activeFilters.readStatus === 'read') {
        result = result.filter(link => link.isRead);
      } else if (activeFilters.readStatus === 'unread') {
        result = result.filter(link => !link.isRead);
      }
    }
    
    // Has attachments filter
    if (activeFilters.hasAttachments) {
      result = result.filter(link => link.attachments && link.attachments.length > 0);
    }
    
    // Tags filter
    if (activeFilters.tags && activeFilters.tags.length > 0) {
      result = result.filter(link => {
        if (!link.tags || !Array.isArray(link.tags)) return false;
        
        // Check if link has at least one of the selected tags
        const linkTagNames = link.tags.map((tag: any) => 
          typeof tag === 'string' ? tag.toLowerCase() : tag.name.toLowerCase()
        );
        
        return activeFilters.tags.some((tag: any) => 
          linkTagNames.includes(typeof tag === 'string' ? tag.toLowerCase() : tag.name.toLowerCase())
        );
      });
    }
    
    // Domain filter
    if (activeFilters.domains && activeFilters.domains.length > 0) {
      result = result.filter(link => {
        try {
          const url = new URL(link.url);
          return activeFilters.domains.some((domain: string) => 
            url.hostname.includes(domain)
          );
        } catch (e) {
          return false;
        }
      });
    }
    
    setFilteredLinks(result);
    setIsLoading(false);
  };
  
  // Handle adding a new link
  const handleAddLink = async (linkData: any) => {
    setIsLoading(true);
    
    try {
      // Process the new link with AI tagging
      const processedLink = await processNewLink(linkData.url, {
        category: linkData.category,
        tags: linkData.tags,
        notes: linkData.description,
      });
      
      // Add the processed link to the list
      const newLink = {
        ...processedLink,
        title: linkData.title || processedLink.title,
        description: linkData.description || processedLink.description,
      };
      
      setLinks(prevLinks => [newLink, ...prevLinks]);
    } catch (error) {
      console.error('Error adding link:', error);
      // Add basic link without AI processing
      setLinks(prevLinks => [linkData, ...prevLinks]);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Mock data for the link form
  const mockData = {
    categories: [
      { name: 'Development', subcategories: [
        { name: 'Frontend' }, { name: 'Backend' }, { name: 'DevOps' }
      ]},
      { name: 'Design', subcategories: [
        { name: 'UI' }, { name: 'UX' }, { name: 'Graphics' }
      ]},
      { name: 'Business', subcategories: [
        { name: 'Marketing' }, { name: 'Sales' }, { name: 'Finance' }
      ]},
      { name: 'Personal', subcategories: [
        { name: 'Health' }, { name: 'Finance' }, { name: 'Hobbies' }
      ]},
    ]
  };
  
  return (
    <div className={cn("flex h-full w-full", className)}>
      {/* Sidebar with filters - only shown on desktop by default */}
      {isDesktop && (
        <LinkFilterSidebar 
          onFilterChange={handleFilterChange}
          initialFilters={activeFilters}
          className="border-r"
        />
      )}
      
      {/* Main content area */}
      <div className="flex-1 flex flex-col h-full">
        {/* Toolbar with actions */}
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-xl font-semibold">My Links</h2>
          <div className="flex items-center gap-2">
            {!isDesktop && (
              <LinkFilterSidebar 
                onFilterChange={handleFilterChange}
                initialFilters={activeFilters}
              />
            )}
            <AddLinkDialog data={mockData} onAddLink={handleAddLink} />
          </div>
        </div>
        
        {/* Link list with applied filters */}
        <div className="flex-1 overflow-hidden">
          <MobileOptimizedLinkList 
            data={{
              categories: [
                {
                  name: 'All Links',
                  subcategories: [
                    {
                      name: 'All',
                      links: filteredLinks
                    }
                  ]
                }
              ]
            }}
            filterTags={activeFilters.tags || []}
          />
        </div>
      </div>
    </div>
  );
}
