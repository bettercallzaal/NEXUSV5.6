/**
 * Tagging Types
 * 
 * Type definitions for AI tagging functionality
 */

export interface TaggingRequest {
  title: string;
  description?: string;
  url?: string;
  existingTags?: string[];
}

export interface TaggingResponse {
  suggestedTags: string[];
}
