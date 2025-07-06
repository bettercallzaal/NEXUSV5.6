import { NextResponse } from 'next/server';
import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    // Check if OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    // Parse the request body
    const { messages } = await request.json();

    // Validate messages
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: 'Please provide a valid messages array' },
        { status: 400 }
      );
    }

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages,
      temperature: 0.7,
      max_tokens: 150,
    });

    // Extract the response
    const responseMessage = completion.choices[0].message?.content || 'No response from AI';

    // Return the response
    return NextResponse.json({ message: responseMessage });
  } catch (error: any) {
    console.error('Error in chat API:', error);
    
    // Handle API errors
    if (error.response) {
      console.error(error.response.status, error.response.data);
      return NextResponse.json(
        { error: error.response.data },
        { status: error.response.status }
      );
    } else {
      return NextResponse.json(
        { error: 'An error occurred during your request.' },
        { status: 500 }
      );
    }
  }
}
