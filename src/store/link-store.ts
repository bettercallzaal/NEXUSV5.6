import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Define the link interface
export interface Link {
  id: string;
  title: string;
  url: string;
  description: string;
  category?: string;
  subcategory?: string;
  tags?: string[];
  isNew?: boolean;
  isOfficial?: boolean;
  createdAt?: string;
  updatedAt?: string;
  popularity?: number;
  read?: boolean;
  hasAttachments?: boolean;
}

// Define the store interface
interface LinkState {
  links: Link[];
  recentlyViewed: string[]; // Array of link IDs
  addLink: (link: Link) => void;
  updateLink: (id: string, link: Partial<Link>) => void;
  removeLink: (id: string) => void;
  markAsRead: (id: string) => void;
  addToRecentlyViewed: (id: string) => void;
  clearRecentlyViewed: () => void;
}

// Create the store
export const linkStore = create<LinkState>()(
  persist(
    (set) => ({
      links: [
        // Sample links for development
        {
          id: '1',
          title: 'ZAO Official Website',
          url: 'https://zao.io',
          description: 'The official website for ZAO ecosystem',
          category: 'Official',
          subcategory: 'Websites',
          tags: ['official', 'website', 'ecosystem'],
          isOfficial: true,
          createdAt: new Date().toISOString(),
          popularity: 100,
          read: false,
          hasAttachments: false,
        },
        {
          id: '2',
          title: 'ZAO Documentation',
          url: 'https://docs.zao.io',
          description: 'Technical documentation and guides',
          category: 'Resources',
          subcategory: 'Documentation',
          tags: ['docs', 'guides', 'technical'],
          isOfficial: true,
          createdAt: new Date().toISOString(),
          popularity: 85,
          read: false,
          hasAttachments: true,
        },
        {
          id: '3',
          title: 'ZAO Community Forum',
          url: 'https://forum.zao.io',
          description: 'Community discussions and support',
          category: 'Community',
          subcategory: 'Forums',
          tags: ['community', 'forum', 'support'],
          isNew: true,
          createdAt: new Date().toISOString(),
          popularity: 75,
          read: false,
          hasAttachments: false,
        },
      ],
      recentlyViewed: [],
      
      addLink: (link) =>
        set((state) => ({
          links: [...state.links, { ...link, id: link.id || crypto.randomUUID() }],
        })),
        
      updateLink: (id, updatedLink) =>
        set((state) => ({
          links: state.links.map((link) =>
            link.id === id ? { ...link, ...updatedLink } : link
          ),
        })),
        
      removeLink: (id) =>
        set((state) => ({
          links: state.links.filter((link) => link.id !== id),
        })),
        
      markAsRead: (id) =>
        set((state) => ({
          links: state.links.map((link) =>
            link.id === id ? { ...link, read: true } : link
          ),
        })),
        
      addToRecentlyViewed: (id) =>
        set((state) => {
          const newRecentlyViewed = [
            id,
            ...state.recentlyViewed.filter((viewedId) => viewedId !== id),
          ].slice(0, 10); // Keep only the 10 most recent
          
          return {
            recentlyViewed: newRecentlyViewed,
          };
        }),
        
      clearRecentlyViewed: () =>
        set({
          recentlyViewed: [],
        }),
    }),
    {
      name: 'zao-nexus-links', // localStorage key
    }
  )
);
