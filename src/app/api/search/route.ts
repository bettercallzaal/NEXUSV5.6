import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { linkStore } from '@/store/link-store';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    // Parse the request body
    const { query } = await request.json();

    // Validate query
    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { error: 'Please provide a valid search query' },
        { status: 400 }
      );
    }

    // Get links from store (in a real app, this would be from a database)
    // This is a simplified example - you would replace this with your actual data source
    const links = linkStore.getState().links;
    
    // Basic search implementation - filter links that match the query
    const filteredLinks = links.filter(link => {
      const searchableText = `${link.title} ${link.description} ${link.url} ${link.tags?.join(' ')}`.toLowerCase();
      return searchableText.includes(query.toLowerCase());
    });

    // If we have OpenAI API key, enhance the search results with AI
    if (process.env.OPENAI_API_KEY) {
      try {
        // Use OpenAI to rank and explain the search results
        const completion = await openai.chat.completions.create({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: 'You are a helpful assistant that helps users find relevant links based on their search query. Your task is to analyze the search results and provide a brief explanation of why each result is relevant to the query.'
            },
            {
              role: 'user',
              content: `Search query: "${query}"\n\nSearch results:\n${JSON.stringify(filteredLinks.slice(0, 5))}`
            }
          ],
          temperature: 0.5,
          max_tokens: 200,
        });

        const aiResponse = completion.choices[0].message?.content || '';

        // Return the filtered links and AI explanation
        return NextResponse.json({
          results: filteredLinks.slice(0, 10),
          explanation: aiResponse
        });
      } catch (aiError) {
        console.error('Error using OpenAI for search enhancement:', aiError);
        // Fall back to basic search if AI enhancement fails
        return NextResponse.json({
          results: filteredLinks.slice(0, 10),
          explanation: null
        });
      }
    } else {
      // Return just the filtered links if no OpenAI API key
      return NextResponse.json({
        results: filteredLinks.slice(0, 10),
        explanation: null
      });
    }
  } catch (error: any) {
    console.error('Error in search API:', error);
    
    return NextResponse.json(
      { error: 'An error occurred during your search request.' },
      { status: 500 }
    );
  }
}
