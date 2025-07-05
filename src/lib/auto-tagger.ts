import { Link } from "@/types/links";

/**
 * Auto-tagger service that uses AI to generate tags for links
 * This implementation uses OpenAI's API, but could be replaced with any AI service
 */
export async function generateTagsForLink(link: Partial<Link>): Promise<string[]> {
  try {
    // Skip if no title or description is provided
    if (!link.title && !link.description && !link.url) {
      return [];
    }

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
      return [];
    }

    const data = await response.json();
    return data.tags;
  } catch (error) {
    console.error("Error generating tags:", error);
    return [];
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
