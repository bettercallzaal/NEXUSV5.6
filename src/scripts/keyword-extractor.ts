/**
 * Keyword extraction utility for the AI tag generator
 * This module extracts important keywords from text content
 */

// Common English stopwords that should be excluded from keywords
const STOPWORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'but', 'if', 'because', 'as', 'what', 'which', 'this', 'that', 'these', 'those',
  'then', 'just', 'so', 'than', 'such', 'when', 'who', 'how', 'where', 'why', 'is', 'are', 'was', 'were', 'be',
  'been', 'being', 'have', 'has', 'had', 'having', 'do', 'does', 'did', 'doing', 'would', 'should', 'could',
  'ought', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'their', 'his', 'her', 'its', 'our', 'your', 'my',
  'mine', 'yours', 'him', 'them', 'for', 'to', 'with', 'about', 'against', 'between', 'into', 'through',
  'during', 'before', 'after', 'above', 'below', 'from', 'up', 'down', 'in', 'out', 'on', 'off', 'over',
  'under', 'again', 'further', 'then', 'once', 'here', 'there', 'all', 'any', 'both', 'each', 'few', 'more',
  'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'too', 'very', 'can', 'will',
  'of', 'at', 'by'
]);

/**
 * Extracts keywords from text content
 * 
 * @param content The main content text
 * @param title Optional title text (weighted more heavily)
 * @param description Optional description text (weighted more heavily)
 * @returns Array of extracted keywords
 */
export async function extractKeywords(
  content: string,
  title: string = '',
  description: string = ''
): Promise<string[]> {
  // Combine all text, giving more weight to title and description
  const titleWords = title.split(/\s+/).map(w => w.toLowerCase());
  const descriptionWords = description.split(/\s+/).map(w => w.toLowerCase());
  const contentWords = content.split(/\s+/).map(w => w.toLowerCase());
  
  // Create a weighted word frequency map
  const wordFrequency: Record<string, number> = {};
  
  // Process title words (3x weight)
  titleWords.forEach(word => {
    const cleanedWord = cleanWord(word);
    if (isValidKeyword(cleanedWord)) {
      wordFrequency[cleanedWord] = (wordFrequency[cleanedWord] || 0) + 3;
    }
  });
  
  // Process description words (2x weight)
  descriptionWords.forEach(word => {
    const cleanedWord = cleanWord(word);
    if (isValidKeyword(cleanedWord)) {
      wordFrequency[cleanedWord] = (wordFrequency[cleanedWord] || 0) + 2;
    }
  });
  
  // Process content words (1x weight)
  contentWords.forEach(word => {
    const cleanedWord = cleanWord(word);
    if (isValidKeyword(cleanedWord)) {
      wordFrequency[cleanedWord] = (wordFrequency[cleanedWord] || 0) + 1;
    }
  });
  
  // Extract phrases (bigrams and trigrams)
  const phrases = extractPhrases(titleWords.concat(descriptionWords, contentWords));
  
  // Add phrases to the frequency map with higher weight
  phrases.forEach(phrase => {
    if (!wordFrequency[phrase]) {
      wordFrequency[phrase] = 4; // Higher weight for meaningful phrases
    } else {
      wordFrequency[phrase] += 2;
    }
  });
  
  // Sort keywords by frequency
  const sortedKeywords = Object.entries(wordFrequency)
    .sort((a, b) => b[1] - a[1])
    .map(entry => entry[0]);
  
  // Return top keywords (up to 15)
  return sortedKeywords.slice(0, 15);
}

/**
 * Cleans a word by removing punctuation and converting to lowercase
 */
function cleanWord(word: string): string {
  return word.toLowerCase().replace(/[^\w\s]/g, '');
}

/**
 * Checks if a word is a valid keyword (not a stopword, not too short, etc.)
 */
function isValidKeyword(word: string): boolean {
  return (
    word.length > 2 && // At least 3 characters
    !STOPWORDS.has(word) && // Not a stopword
    !/^\d+$/.test(word) && // Not just a number
    !/^[_\W]+$/.test(word) // Not just symbols
  );
}

/**
 * Extracts meaningful phrases (bigrams and trigrams) from text
 */
function extractPhrases(words: string[]): string[] {
  const phrases: string[] = [];
  const cleanWords = words.map(cleanWord).filter(isValidKeyword);
  
  // Extract bigrams (two-word phrases)
  for (let i = 0; i < cleanWords.length - 1; i++) {
    const bigram = `${cleanWords[i]} ${cleanWords[i + 1]}`;
    if (bigram.length > 5) { // Only meaningful bigrams
      phrases.push(bigram);
    }
  }
  
  // Extract trigrams (three-word phrases)
  for (let i = 0; i < cleanWords.length - 2; i++) {
    const trigram = `${cleanWords[i]} ${cleanWords[i + 1]} ${cleanWords[i + 2]}`;
    if (trigram.length > 8) { // Only meaningful trigrams
      phrases.push(trigram);
    }
  }
  
  return phrases;
}

/**
 * Analyzes text to determine its primary language
 * Simple implementation - for more accurate results, use a language detection library
 */
export function detectLanguage(text: string): string {
  // This is a very simplified language detection
  // In a real app, use a proper language detection library
  
  const englishPatterns = /\b(the|and|is|in|to|of|that|this|for|with)\b/gi;
  const spanishPatterns = /\b(el|la|los|las|es|en|de|que|para|con)\b/gi;
  const frenchPatterns = /\b(le|la|les|est|en|de|que|pour|avec|dans)\b/gi;
  const germanPatterns = /\b(der|die|das|ist|in|zu|von|für|mit|und)\b/gi;
  
  const englishMatches = (text.match(englishPatterns) || []).length;
  const spanishMatches = (text.match(spanishPatterns) || []).length;
  const frenchMatches = (text.match(frenchPatterns) || []).length;
  const germanMatches = (text.match(germanPatterns) || []).length;
  
  const scores = [
    { lang: 'en', score: englishMatches },
    { lang: 'es', score: spanishMatches },
    { lang: 'fr', score: frenchMatches },
    { lang: 'de', score: germanMatches }
  ];
  
  // Sort by score (highest first)
  scores.sort((a, b) => b.score - a.score);
  
  // Return the language with the highest score, default to English if no clear match
  return scores[0].score > 3 ? scores[0].lang : 'en';
}
