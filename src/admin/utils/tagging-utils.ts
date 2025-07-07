/**
 * Tagging Utilities
 * 
 * Helper functions for generating and managing tags for links.
 */

import { Link } from '../../types/links';
import { TaggingRequest, TaggingResponse } from '../../types/tagging';

/**
 * Generate tags for a link using the AI tagging API
 */
export async function generateTagsForLink(link: Link): Promise<TaggingResponse> {
  try {
    // In Node.js environment, use local tag generation
    if (typeof window === 'undefined') {
      return {
        suggestedTags: generateLocalTags(link)
      };
    }
    
    // In browser environment, use the API
    const request: TaggingRequest = {
      title: link.title,
      description: link.description || '',
      url: link.url,
      existingTags: link.tags || []
    };
    
    const response = await fetch('/api/generate-tags', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(request)
    });
    
    if (!response.ok) {
      throw new Error(`Failed to generate tags: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error generating tags:', error);
    
    // Fallback to local tag generation
    return {
      suggestedTags: generateLocalTags(link)
    };
  }
}

/**
 * Generate tags locally based on link content
 * This is a fallback method when the AI tagging API is unavailable
 */
export function generateLocalTags(link: Link): string[] {
  const tags: string[] = [];
  const content = `${link.title} ${link.description || ''}`.toLowerCase();
  
  // Extract domain-based tags
  try {
    const domain = new URL(link.url).hostname;
    const domainParts = domain.split('.');
    
    if (domainParts.length > 1) {
      // Add the main domain name as a tag
      const mainDomain = domainParts[domainParts.length - 2];
      if (mainDomain && !['com', 'org', 'net', 'io', 'co'].includes(mainDomain)) {
        tags.push(mainDomain);
      }
    }
  } catch (error) {
    // Ignore URL parsing errors
  }
  
  // Common keywords to check for
  const keywordMap: Record<string, string[]> = {
    'development': ['code', 'programming', 'developer', 'software', 'github', 'git'],
    'finance': ['money', 'invest', 'stock', 'crypto', 'financial', 'bank', 'trading'],
    'health': ['fitness', 'exercise', 'diet', 'workout', 'health', 'medical'],
    'technology': ['tech', 'technology', 'ai', 'artificial intelligence', 'machine learning'],
    'education': ['learn', 'course', 'tutorial', 'education', 'training', 'university'],
    'news': ['news', 'article', 'blog', 'post', 'update'],
    'social': ['social', 'community', 'network', 'forum', 'discussion'],
    'entertainment': ['game', 'movie', 'music', 'video', 'stream', 'entertainment'],
    'business': ['business', 'company', 'startup', 'enterprise', 'corporate'],
    'design': ['design', 'ui', 'ux', 'interface', 'graphic', 'art']
  };
  
  // Check for keywords in content
  Object.entries(keywordMap).forEach(([tag, keywords]) => {
    if (keywords.some(keyword => content.includes(keyword))) {
      tags.push(tag);
    }
  });
  
  // Return unique tags
  return Array.from(new Set(tags));
}

/**
 * Suggest categories based on tags
 */
export function suggestCategoryFromTags(tags: string[]): { category: string; subcategory: string } {
  // Default category
  let category = 'Uncategorized';
  let subcategory = 'General';
  
  // Map of tags to categories
  const tagCategoryMap: Record<string, { category: string; subcategory?: string }> = {
    'development': { category: 'Development', subcategory: 'Programming' },
    'programming': { category: 'Development', subcategory: 'Programming' },
    'code': { category: 'Development', subcategory: 'Programming' },
    'github': { category: 'Development', subcategory: 'Tools' },
    
    'finance': { category: 'Finance', subcategory: 'General' },
    'crypto': { category: 'Finance', subcategory: 'Cryptocurrency' },
    'investing': { category: 'Finance', subcategory: 'Investing' },
    
    'health': { category: 'Health & Fitness', subcategory: 'General' },
    'fitness': { category: 'Health & Fitness', subcategory: 'Fitness' },
    'nutrition': { category: 'Health & Fitness', subcategory: 'Nutrition' },
    
    'technology': { category: 'Technology', subcategory: 'General' },
    'ai': { category: 'Technology', subcategory: 'AI & ML' },
    'machine learning': { category: 'Technology', subcategory: 'AI & ML' },
    
    'education': { category: 'Education', subcategory: 'General' },
    'course': { category: 'Education', subcategory: 'Courses' },
    'tutorial': { category: 'Education', subcategory: 'Tutorials' },
    
    'news': { category: 'News & Media', subcategory: 'General' },
    'article': { category: 'News & Media', subcategory: 'Articles' },
    'blog': { category: 'News & Media', subcategory: 'Blogs' },
    
    'social': { category: 'Social', subcategory: 'General' },
    'community': { category: 'Social', subcategory: 'Communities' },
    'forum': { category: 'Social', subcategory: 'Forums' },
    
    'entertainment': { category: 'Entertainment', subcategory: 'General' },
    'game': { category: 'Entertainment', subcategory: 'Games' },
    'movie': { category: 'Entertainment', subcategory: 'Movies' },
    'music': { category: 'Entertainment', subcategory: 'Music' },
    
    'business': { category: 'Business', subcategory: 'General' },
    'startup': { category: 'Business', subcategory: 'Startups' },
    'marketing': { category: 'Business', subcategory: 'Marketing' },
    
    'design': { category: 'Design', subcategory: 'General' },
    'ui': { category: 'Design', subcategory: 'UI/UX' },
    'ux': { category: 'Design', subcategory: 'UI/UX' }
  };
  
  // Check for matching tags
  for (const tag of tags) {
    const lowerTag = tag.toLowerCase();
    if (tagCategoryMap[lowerTag]) {
      category = tagCategoryMap[lowerTag].category;
      subcategory = tagCategoryMap[lowerTag].subcategory || 'General';
      break; // Use the first matching tag's category
    }
  }
  
  return { category, subcategory };
}
