import axios from 'axios';
import { load } from 'cheerio';
import { extractKeywords } from './keyword-extractor';
import { Tag } from '@/components/tags/tag-manager';

// Define a color palette for auto-generated tags
const TAG_COLORS = [
  '#3B82F6', // blue
  '#10B981', // green
  '#F59E0B', // yellow
  '#EF4444', // red
  '#8B5CF6', // purple
  '#EC4899', // pink
  '#06B6D4', // cyan
  '#F97316', // orange
  '#6366F1', // indigo
  '#14B8A6', // teal
];

// Tag categories with common tags in each
const TAG_CATEGORIES = {
  contentType: ['article', 'blog', 'video', 'podcast', 'tutorial', 'documentation', 'tool', 'research'],
  topics: ['technology', 'programming', 'design', 'business', 'marketing', 'science', 'health', 'finance'],
  purpose: ['reference', 'learning', 'inspiration', 'entertainment', 'productivity', 'analysis'],
  techStack: ['javascript', 'react', 'node', 'python', 'aws', 'database', 'frontend', 'backend', 'mobile'],
};

export interface LinkContent {
  url: string;
  title: string;
  description: string;
  content: string;
  imageUrl?: string;
}

/**
 * Fetches and parses content from a URL
 */
export async function fetchLinkContent(url: string): Promise<LinkContent> {
  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; NexusBot/1.0; +http://nexus.app)'
      }
    });
    
    const html = response.data;
    const $ = load(html);
    
    // Extract basic metadata
    const title = $('title').text().trim() || '';
    const description = $('meta[name="description"]').attr('content') || 
                       $('meta[property="og:description"]').attr('content') || '';
    const imageUrl = $('meta[property="og:image"]').attr('content') || '';
    
    // Extract main content (simplified approach)
    const articleContent = $('article').text() || '';
    const mainContent = $('main').text() || '';
    const bodyContent = $('body').text() || '';
    
    // Use the most specific content available, falling back to more general content
    const content = articleContent || mainContent || bodyContent.substring(0, 5000);
    
    return {
      url,
      title,
      description,
      content: content.trim(),
      imageUrl
    };
  } catch (error) {
    console.error(`Error fetching content from ${url}:`, error);
    return {
      url,
      title: '',
      description: '',
      content: '',
    };
  }
}

/**
 * Generate tags based on link content using AI
 */
export async function generateTagsWithAI(linkContent: LinkContent): Promise<Tag[]> {
  try {
    // Extract keywords from content
    const keywords = await extractKeywords(linkContent.content, linkContent.title, linkContent.description);
    
    // If you have an OpenAI API key configured, use it for more accurate tagging
    if (process.env.OPENAI_API_KEY) {
      return await generateTagsWithOpenAI(linkContent, keywords);
    }
    
    // Fallback to rule-based tagging if no API key is available
    return generateTagsWithRules(linkContent, keywords);
  } catch (error) {
    console.error('Error generating tags:', error);
    return generateFallbackTags(linkContent.url);
  }
}

/**
 * Generate tags using OpenAI API
 */
async function generateTagsWithOpenAI(linkContent: LinkContent, keywords: string[]): Promise<Tag[]> {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    
    // Prepare content for the API (limit length to avoid token limits)
    const title = linkContent.title.substring(0, 100);
    const description = linkContent.description.substring(0, 200);
    const content = linkContent.content.substring(0, 1000);
    const url = linkContent.url;
    
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: `You are a tag generation assistant. Analyze the provided content and suggest 3-7 relevant tags that categorize this content. 
                     Focus on content type, topic, purpose, and technology if relevant. Return only a JSON array of tag names.`
          },
          {
            role: "user",
            content: `URL: ${url}\nTitle: ${title}\nDescription: ${description}\nContent excerpt: ${content}\nExtracted keywords: ${keywords.join(', ')}`
          }
        ],
        temperature: 0.3,
        max_tokens: 150
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        }
      }
    );
    
    // Parse the response to get tag names
    const tagContent = response.data.choices[0].message.content;
    let tagNames: string[] = [];
    
    try {
      // Try to parse as JSON
      tagNames = JSON.parse(tagContent);
    } catch (e) {
      // If not valid JSON, try to extract tags from text
      tagNames = tagContent
        .replace(/[\[\]"']/g, '')
        .split(',')
        .map((tag: string) => tag.trim())
        .filter((tag: string) => tag.length > 0);
    }
    
    // Convert tag names to Tag objects with colors
    return tagNames.slice(0, 7).map((name, index) => ({
      id: `ai-${Date.now()}-${index}`,
      name: name.toLowerCase(),
      color: TAG_COLORS[index % TAG_COLORS.length]
    }));
  } catch (error) {
    console.error('Error using OpenAI for tag generation:', error);
    // Fall back to rule-based tagging
    return generateTagsWithRules(linkContent, keywords);
  }
}

/**
 * Generate tags using rule-based approach
 */
function generateTagsWithRules(linkContent: LinkContent, keywords: string[]): Promise<Tag[]> {
  return new Promise(resolve => {
    const tags: Tag[] = [];
    const url = linkContent.url.toLowerCase();
    const title = linkContent.title.toLowerCase();
    const description = linkContent.description.toLowerCase();
    const content = linkContent.content.toLowerCase();
    
    // Helper function to check if content contains any of the terms
    const containsAny = (text: string, terms: string[]): boolean => {
      return terms.some(term => text.includes(term.toLowerCase()));
    };
    
    // Check for content type
    if (url.includes('youtube.com') || url.includes('vimeo.com') || containsAny(title, ['video', 'watch'])) {
      tags.push({ id: `rule-${Date.now()}-1`, name: 'video', color: TAG_COLORS[0] });
    } else if (containsAny(url, ['blog', 'article', 'post'])) {
      tags.push({ id: `rule-${Date.now()}-2`, name: 'article', color: TAG_COLORS[1] });
    } else if (containsAny(url, ['docs', 'documentation'])) {
      tags.push({ id: `rule-${Date.now()}-3`, name: 'documentation', color: TAG_COLORS[2] });
    }
    
    // Check for tech stack
    if (containsAny(content + title + url, ['react', 'jsx'])) {
      tags.push({ id: `rule-${Date.now()}-4`, name: 'react', color: TAG_COLORS[3] });
    } else if (containsAny(content + title + url, ['javascript', 'js', 'typescript', 'ts'])) {
      tags.push({ id: `rule-${Date.now()}-5`, name: 'javascript', color: TAG_COLORS[4] });
    } else if (containsAny(content + title + url, ['python', 'django', 'flask'])) {
      tags.push({ id: `rule-${Date.now()}-6`, name: 'python', color: TAG_COLORS[5] });
    }
    
    // Add tags based on keywords (up to 5 more tags)
    const remainingSlots = 7 - tags.length;
    if (remainingSlots > 0 && keywords.length > 0) {
      keywords.slice(0, remainingSlots).forEach((keyword, index) => {
        tags.push({
          id: `keyword-${Date.now()}-${index}`,
          name: keyword.toLowerCase(),
          color: TAG_COLORS[(tags.length + index) % TAG_COLORS.length]
        });
      });
    }
    
    // Add a domain-based tag
    try {
      const domain = new URL(linkContent.url).hostname
        .replace('www.', '')
        .split('.')
        .slice(0, -1)
        .join('.');
      
      if (domain && !tags.some(tag => tag.name === domain)) {
        tags.push({
          id: `domain-${Date.now()}`,
          name: domain,
          color: TAG_COLORS[(tags.length) % TAG_COLORS.length]
        });
      }
    } catch (e) {
      // URL parsing failed, skip domain tag
    }
    
    resolve(tags);
  });
}

/**
 * Generate fallback tags based on URL only
 */
function generateFallbackTags(url: string): Tag[] {
  const tags: Tag[] = [];
  
  try {
    // Extract domain as a tag
    const domain = new URL(url).hostname
      .replace('www.', '')
      .split('.')
      .slice(0, -1)
      .join('.');
    
    if (domain) {
      tags.push({
        id: `domain-${Date.now()}`,
        name: domain,
        color: TAG_COLORS[0]
      });
    }
    
    // Add a generic tag based on TLD
    const tld = new URL(url).hostname.split('.').pop();
    if (tld === 'edu') {
      tags.push({ id: `tld-${Date.now()}`, name: 'education', color: TAG_COLORS[1] });
    } else if (tld === 'gov') {
      tags.push({ id: `tld-${Date.now()}`, name: 'government', color: TAG_COLORS[2] });
    } else if (tld === 'org') {
      tags.push({ id: `tld-${Date.now()}`, name: 'organization', color: TAG_COLORS[3] });
    }
    
  } catch (e) {
    // URL parsing failed
    tags.push({ id: `fallback-${Date.now()}`, name: 'uncategorized', color: '#888888' });
  }
  
  return tags;
}

/**
 * Main function to analyze a URL and generate tags
 */
export async function analyzeAndTagUrl(url: string): Promise<{
  content: LinkContent;
  tags: Tag[];
}> {
  // Fetch content from the URL
  const content = await fetchLinkContent(url);
  
  // Generate tags based on the content
  const tags = await generateTagsWithAI(content);
  
  return { content, tags };
}
