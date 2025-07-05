import { NextResponse } from 'next/server';
import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const { title, description, url, category, subcategory } = await request.json();

    // Validate input
    if (!title && !description && !url) {
      return NextResponse.json(
        { error: 'At least one of title, description, or URL is required' },
        { status: 400 }
      );
    }

    // Combine all available information for context
    const context = [
      title ? `Title: ${title}` : '',
      description ? `Description: ${description}` : '',
      url ? `URL: ${url}` : '',
      category ? `Category: ${category}` : '',
      subcategory ? `Subcategory: ${subcategory}` : '',
    ].filter(Boolean).join('\n');

    // Call OpenAI API to generate tags
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant that generates relevant tags for web links. Generate 3-5 concise, single-word or short-phrase tags that accurately represent the content. Return only a JSON array of strings with no explanation."
        },
        {
          role: "user",
          content: `Generate tags for the following link:\n${context}`
        }
      ],
      temperature: 0.7,
      max_tokens: 100,
    });

    // Parse the response to extract tags
    let tags: string[] = [];
    try {
      const content = completion.choices[0]?.message?.content || '[]';
      // Handle both formats: ["tag1", "tag2"] or just tag1, tag2, tag3
      if (content.trim().startsWith('[')) {
        tags = JSON.parse(content);
      } else {
        tags = content.split(',').map((tag: string) => tag.trim());
      }
      
      // Clean up and normalize the tags
      const cleanedTags = tags
        .filter((tag: string) => tag.trim() !== '')
        .map((tag: string) => tag.toLowerCase().trim())
        .filter((tag: string, index: number, self: string[]) => self.indexOf(tag) === index);

      return NextResponse.json({ tags: cleanedTags });
    } catch (error) {
      console.error('Error parsing OpenAI response:', error);
      // Fallback to simple extraction
      const content = completion.choices[0]?.message?.content || '';
      tags = content.split(',').map((tag: string) => tag.trim()).filter(Boolean);
      return NextResponse.json({ tags });
    }
  } catch (error) {
    console.error('Auto-tagging error:', error);
    return NextResponse.json(
      { error: 'Failed to generate tags', details: (error as Error).message },
      { status: 500 }
    );
  }
}
