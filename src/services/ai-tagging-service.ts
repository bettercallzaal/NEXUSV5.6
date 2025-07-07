/**
 * AI Tagging Service
 * 
 * This service provides AI-powered tagging functionality for links.
 * It analyzes link content and suggests relevant tags based on the title, description, and URL.
 */

import { OpenAI } from 'openai';

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
  private openai: OpenAI | null = null;
  private apiKey: string | null = null;

  constructor(apiKey?: string) {
    if (apiKey) {
      this.initialize(apiKey);
    }
  }

  /**
   * Initialize the OpenAI client with an API key
   */
  public initialize(apiKey: string): void {
    this.apiKey = apiKey;
    this.openai = new OpenAI({
      apiKey: this.apiKey,
    });
  }

  /**
   * Check if the service is initialized with an API key
   */
  public isInitialized(): boolean {
    return !!this.openai;
  }

  /**
   * Generate tags for a link based on its content
   */
  public async generateTags(request: TaggingRequest): Promise<TaggingResponse> {
    if (!this.openai) {
      throw new Error('AI Tagging Service is not initialized. Please provide an OpenAI API key.');
    }

    try {
      // Create a prompt for the AI to generate tags
      const prompt = this.createTaggingPrompt(request);
      
      // Call OpenAI API to generate tags
      const response = await this.openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are a helpful assistant that generates relevant tags for web links. Respond with JSON only."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.3,
        response_format: { type: "json_object" }
      });

      // Parse the response
      const content = response.choices[0].message.content;
      if (!content) {
        throw new Error('Empty response from OpenAI API');
      }

      const parsedResponse = JSON.parse(content);
      
      return {
        suggestedTags: parsedResponse.tags || [],
        confidence: parsedResponse.confidence || 0.7,
        categories: parsedResponse.categories || []
      };
    } catch (error) {
      console.error('Error generating tags:', error);
      
      // Fallback to local tag generation if API fails
      return this.generateTagsLocally(request);
    }
  }

  /**
   * Create a prompt for the AI to generate tags
   */
  private createTaggingPrompt(request: TaggingRequest): string {
    const { title, description, url, existingTags } = request;
    
    let prompt = `Generate relevant tags for the following link:\n\nTitle: ${title}\n`;
    
    if (description) {
      prompt += `Description: ${description}\n`;
    }
    
    if (url) {
      prompt += `URL: ${url}\n`;
    }
    
    if (existingTags && existingTags.length > 0) {
      prompt += `Existing tags: ${existingTags.join(', ')}\n`;
    }
    
    prompt += `\nRespond with a JSON object containing:
1. An array of suggested tags (5-10 tags)
2. A confidence score between 0 and 1
3. An array of suggested categories

Example response format:
{
  "tags": ["tag1", "tag2", "tag3"],
  "confidence": 0.85,
  "categories": ["category1", "category2"]
}`;
    
    return prompt;
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
export const aiTaggingService = new AITaggingService(process.env.OPENAI_API_KEY);
