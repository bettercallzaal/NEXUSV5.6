import { NextResponse } from 'next/server';
import { OpenAI } from 'openai';
import { TaggingRequest, TaggingResponse } from '@/services/ai-tagging-service';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Create a prompt for the AI to generate tags
 */
function createTaggingPrompt(request: TaggingRequest): string {
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
function generateTagsLocally(request: TaggingRequest): TaggingResponse {
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

export async function POST(request: Request) {
  try {
    // Parse the request body
    const requestData: TaggingRequest = await request.json();
    
    if (!requestData.title) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      );
    }
    
    // Check if OpenAI API key is available
    if (!process.env.OPENAI_API_KEY) {
      console.warn('OpenAI API key not found, using local tag generation');
      const localResponse = generateTagsLocally(requestData);
      return NextResponse.json(localResponse);
    }
    
    try {
      // Create a prompt for the AI to generate tags
      const prompt = createTaggingPrompt(requestData);
      
      // Call OpenAI API to generate tags
      const response = await openai.chat.completions.create({
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
      
      const taggingResponse: TaggingResponse = {
        suggestedTags: parsedResponse.tags || [],
        confidence: parsedResponse.confidence || 0.7,
        categories: parsedResponse.categories || []
      };
      
      return NextResponse.json(taggingResponse);
    } catch (error) {
      console.error('Error calling OpenAI API:', error);
      // Fallback to local tag generation if API fails
      const localResponse = generateTagsLocally(requestData);
      return NextResponse.json(localResponse);
    }
  } catch (error) {
    console.error('Error processing tag generation request:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}
