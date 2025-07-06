import { Link } from "@/types/links";
import { Tag } from "@/components/tags/tag-manager";
import { analyzeAndTagUrl, LinkContent } from "@/scripts/ai-tag-generator";

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

/**
 * Auto-tagger service that uses AI to generate tags for links
 * Enhanced with advanced AI capabilities and fallback mechanisms
 */
export async function generateTagsForLink(link: Partial<Link>): Promise<string[]> {
  try {
    // Skip if no title or description is provided
    if (!link.title && !link.description && !link.url) {
      return [];
    }
    
    // If we have a URL, use our advanced AI tag generator
    if (link.url) {
      try {
        const { tags } = await analyzeAndTagUrl(link.url);
        return tags.map(tag => tag.name);
      } catch (aiError) {
        console.error("Advanced AI tagging failed, falling back to API:", aiError);
      }
    }

    // Fallback to the API endpoint
    const response = await fetch("/api/auto-tag", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: link.title || "",
        description: link.description || "",
        url: link.url || "",
        category: link.category || "",
        subcategory: link.subcategory || "",
      }),
    });

    if (!response.ok) {
      console.error("Error generating tags:", await response.text());
      return extractKeywordsFromText(link.title + " " + link.description);
    }

    const data = await response.json();
    return data.tags;
  } catch (error) {
    console.error("Error generating tags:", error);
    return extractKeywordsFromText(link.title + " " + link.description);
  }
}

/**
 * Extracts keywords from text using basic NLP techniques
 * This is a fallback method when the AI service is unavailable
 */
export function extractKeywordsFromText(text: string): string[] {
  if (!text) return [];
  
  // Convert to lowercase and remove special characters
  const cleanText = text.toLowerCase().replace(/[^\w\s]/g, ' ');
  
  // Split into words
  const words = cleanText.split(/\s+/).filter(word => word.length > 3);
  
  // Remove common stop words
  const stopWords = new Set([
    'about', 'above', 'after', 'again', 'against', 'all', 'and', 'any', 'are', 'because',
    'been', 'before', 'being', 'below', 'between', 'both', 'but', 'cannot', 'could', 'did',
    'does', 'doing', 'down', 'during', 'each', 'few', 'for', 'from', 'further', 'had',
    'has', 'have', 'having', 'here', 'how', 'into', 'itself', 'just', 'more', 'most',
    'not', 'now', 'off', 'once', 'only', 'other', 'our', 'ours', 'ourselves', 'out',
    'over', 'own', 'same', 'should', 'some', 'such', 'than', 'that', 'the', 'their',
    'them', 'then', 'there', 'these', 'they', 'this', 'those', 'through', 'under', 'until',
    'very', 'was', 'were', 'what', 'when', 'where', 'which', 'while', 'who', 'whom',
    'why', 'will', 'with', 'you', 'your', 'yours', 'yourself', 'yourselves'
  ]);
  
  const filteredWords = words.filter(word => !stopWords.has(word));
  
  // Count word frequency
  const wordFrequency: Record<string, number> = {};
  filteredWords.forEach(word => {
    wordFrequency[word] = (wordFrequency[word] || 0) + 1;
  });
  
  // Sort by frequency and take top 5
  return Object.entries(wordFrequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([word]) => word);
}
