import { analyzeAndTagUrl } from './ai-tag-generator';
import { Tag } from '@/components/tags/tag-manager';

export interface Link {
  id: string;
  url: string;
  title: string;
  description: string;
  dateAdded: string;
  tags: Tag[];
  category?: string;
  favicon?: string;
  isRead: boolean;
  clickCount: number;
  lastClickedAt?: string;
  notes?: string;
}

interface NewLinkOptions {
  category?: string;
  tags?: Tag[];
  notes?: string;
  markAsRead?: boolean;
}

/**
 * Process a new link: fetch metadata, generate tags, and create link object
 */
export async function processNewLink(url: string, options: NewLinkOptions = {}): Promise<Link> {
  try {
    // Validate URL
    if (!isValidUrl(url)) {
      throw new Error('Invalid URL format');
    }
    
    // Analyze URL content and generate tags
    const { content, tags: aiTags } = await analyzeAndTagUrl(url);
    
    // Combine AI-generated tags with any user-provided tags
    const combinedTags = [...(options.tags || [])];
    
    // Only add AI tags that don't duplicate user tags
    const userTagNames = new Set(combinedTags.map(tag => tag.name.toLowerCase()));
    for (const aiTag of aiTags) {
      if (!userTagNames.has(aiTag.name.toLowerCase())) {
        combinedTags.push(aiTag);
      }
    }
    
    // Generate favicon URL
    const favicon = getFaviconUrl(url);
    
    // Create the link object
    const newLink: Link = {
      id: generateId(),
      url,
      title: content.title || extractTitleFromUrl(url),
      description: content.description || '',
      dateAdded: new Date().toISOString(),
      tags: combinedTags,
      category: options.category || determineCategory(combinedTags, url),
      favicon,
      isRead: options.markAsRead || false,
      clickCount: 0,
      notes: options.notes || '',
    };
    
    return newLink;
  } catch (error) {
    console.error('Error processing new link:', error);
    
    // Return a basic link object with minimal information if processing fails
    return {
      id: generateId(),
      url,
      title: extractTitleFromUrl(url),
      description: '',
      dateAdded: new Date().toISOString(),
      tags: options.tags || [],
      category: options.category || 'Uncategorized',
      isRead: options.markAsRead || false,
      clickCount: 0,
      notes: options.notes || '',
    };
  }
}

/**
 * Validate URL format
 */
function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Generate a unique ID for the link
 */
function generateId(): string {
  return `link_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Extract a title from the URL if no title is available
 */
function extractTitleFromUrl(url: string): string {
  try {
    const { hostname, pathname } = new URL(url);
    
    // Try to get a meaningful name from the pathname
    if (pathname && pathname !== '/') {
      const segments = pathname.split('/').filter(Boolean);
      if (segments.length > 0) {
        const lastSegment = segments[segments.length - 1]
          .replace(/[-_]/g, ' ')
          .replace(/\.\w+$/, ''); // Remove file extension
        
        if (lastSegment.length > 0) {
          return lastSegment.charAt(0).toUpperCase() + lastSegment.slice(1);
        }
      }
    }
    
    // Fall back to hostname without www and domain suffix
    return hostname.replace(/^www\./, '').split('.')[0];
  } catch (e) {
    // If URL parsing fails, return the URL itself
    return url;
  }
}

/**
 * Get favicon URL for a website
 */
function getFaviconUrl(url: string): string {
  try {
    const { protocol, hostname } = new URL(url);
    
    // Try Google's favicon service first
    return `https://www.google.com/s2/favicons?domain=${hostname}&sz=64`;
    
    // Alternative: return `${protocol}//${hostname}/favicon.ico`;
  } catch (e) {
    return '';
  }
}

/**
 * Determine a category based on tags and URL
 */
function determineCategory(tags: Tag[], url: string): string {
  // Check tags first for category hints
  const tagNames = tags.map(tag => tag.name.toLowerCase());
  
  if (tagNames.some(tag => ['tutorial', 'guide', 'learn', 'course', 'education'].includes(tag))) {
    return 'Learning';
  }
  
  if (tagNames.some(tag => ['tool', 'utility', 'app', 'software'].includes(tag))) {
    return 'Tools';
  }
  
  if (tagNames.some(tag => ['article', 'blog', 'news', 'post'].includes(tag))) {
    return 'Articles';
  }
  
  if (tagNames.some(tag => ['video', 'youtube', 'vimeo', 'stream'].includes(tag))) {
    return 'Videos';
  }
  
  if (tagNames.some(tag => ['reference', 'documentation', 'api', 'docs'].includes(tag))) {
    return 'Reference';
  }
  
  // Check URL patterns
  try {
    const { hostname } = new URL(url);
    
    if (hostname.includes('github.com')) {
      return 'Development';
    }
    
    if (hostname.includes('youtube.com') || hostname.includes('vimeo.com')) {
      return 'Videos';
    }
    
    if (hostname.includes('docs.') || hostname.endsWith('.dev') || hostname.includes('developer.')) {
      return 'Documentation';
    }
    
    if (hostname.includes('medium.com') || hostname.includes('blog.')) {
      return 'Articles';
    }
  } catch (e) {
    // URL parsing failed
  }
  
  // Default category
  return 'Uncategorized';
}

/**
 * Batch process multiple links
 */
export async function batchProcessLinks(urls: string[], options: NewLinkOptions = {}): Promise<Link[]> {
  const results: Link[] = [];
  
  // Process links sequentially to avoid overloading the network
  for (const url of urls) {
    try {
      const link = await processNewLink(url, options);
      results.push(link);
    } catch (error) {
      console.error(`Error processing link ${url}:`, error);
    }
  }
  
  return results;
}
