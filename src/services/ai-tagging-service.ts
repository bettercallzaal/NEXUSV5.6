/**
 * AI Tagging Service
 * 
 * This service provides AI-powered tagging functionality for links.
 * It analyzes link content and suggests relevant tags based on the title, description, and URL.
 * Uses a server-side API endpoint to generate tags securely.
 */

// Define the response structure from the AI tagging service
export interface TaggingResponse {
  suggestedTags: string[];
  confidence: number;
  categories?: string[];
}

// Define the input structure for the AI tagging service
export interface TaggingRequest {
  title: string;
  description?: string;
  url?: string;
  existingTags?: string[];
}

export class AITaggingService {
  /**
   * Generate tags for a link based on its content
   * Uses a server-side API endpoint to generate tags securely
   */
  public async generateTags(request: TaggingRequest): Promise<TaggingResponse> {
    try {
      // Call the server-side API endpoint to generate tags
      const response = await fetch('/api/generate-tags', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`Failed to generate tags: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error generating tags:', error);
      
      // Fallback to local tag generation if API fails
      return this.generateTagsLocally(request);
    }
  }

  /**
   * Generate tags locally without using the OpenAI API
   * This is a fallback method when the API is not available or fails
   */
  private generateTagsLocally(request: TaggingRequest): TaggingResponse {
    const { title, description } = request;
    const combinedText = `${title} ${description || ''}`.toLowerCase();
    
    // Define some common keywords and their associated tags
    const keywordToTags: Record<string, string[]> = {
      'discord': ['social', 'community', 'chat'],
      'twitter': ['social', 'news', 'updates'],
      'x.com': ['social', 'news', 'updates'],
      'chart': ['data', 'analytics', 'visualization'],
      'calendar': ['events', 'schedule', 'planning'],
      'website': ['official', 'information'],
      'dao': ['governance', 'community', 'blockchain'],
      'zao': ['official', 'zao'],
      'music': ['entertainment', 'audio'],
      'event': ['schedule', 'community'],
      'org': ['organization', 'structure'],
      'google': ['tools', 'productivity'],
    };
    
    // Extract tags based on keywords in the title and description
    const suggestedTags = new Set<string>();
    
    Object.entries(keywordToTags).forEach(([keyword, tags]) => {
      if (combinedText.includes(keyword)) {
        tags.forEach(tag => suggestedTags.add(tag));
      }
    });
    
    return {
      suggestedTags: Array.from(suggestedTags),
      confidence: 0.6,
      categories: []
    };
  }
}

// Create a singleton instance
export const aiTaggingService = new AITaggingService();
