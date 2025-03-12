import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

interface PerplexityEvent {
  name: string;
  description?: string;
  location: string;
  date?: string;
  time?: string;
  link?: string;
  source: string;
}

// Initialize OpenAI client with OpenRouter endpoint
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
  baseURL: 'https://openrouter.ai/api/v1',
  defaultHeaders: {
    'HTTP-Referer': 'https://smartcal.vercel.app',
    'X-Title': 'SmartCal'
  }
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { eventType, location = 'San Francisco' } = body;

    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OpenRouter API key not configured');
    }

    // Construct a natural language query
    const systemMessage = `You are a helpful assistant that finds local events and formats them as JSON. Always respond with valid JSON in the exact format specified. If no events are found, return an empty array.`;
    
    const query = `Search for upcoming ${eventType} events or celebrations in or near ${location}. Return the results as a JSON object with an 'events' array. Each event should have these fields:
- name (required): The event name
- description: A brief description of the event
- location: The venue or address
- date: The event date in YYYY-MM-DD format
- time: The event time in HH:MM format
- link: Website URL for more information

Example format:
{
  "events": [
    {
      "name": "Example Event",
      "description": "Brief description here",
      "location": "123 Main St, City, State",
      "date": "2024-03-20",
      "time": "18:00",
      "link": "https://example.com"
    }
  ]
}`;

    const completion = await openai.chat.completions.create({
      model: "perplexity/sonar",
      messages: [
        { 
          role: "system", 
          content: systemMessage
        },
        { 
          role: "user", 
          content: query
        }
      ],
      temperature: 0.5,
      response_format: { type: "json_object" }
    });

    if (!completion.choices[0]?.message?.content) {
      throw new Error('No response from OpenRouter');
    }

    let events: PerplexityEvent[] = [];

    try {
      // Parse the response and extract events
      const content = completion.choices[0].message.content;
      console.log('Raw response:', content);
      
      // Clean up the response by removing markdown code blocks
      const cleanContent = content
        .replace(/```json\n/, '') // Remove opening ```json
        .replace(/```(\n)?$/, '') // Remove closing ```
        .replace(/\/\/ .*$/gm, '') // Remove any comments
        .trim();
      
      console.log('Cleaned content:', cleanContent);
      
      const parsedContent = JSON.parse(cleanContent);
      
      if (Array.isArray(parsedContent.events)) {
        events = parsedContent.events.map((event: any) => ({
          name: event.name || 'Untitled Event',
          description: event.description,
          location: event.location || 'Location TBA',
          date: event.date?.replace(/X/g, '1'), // Replace X with 1 for approximate dates
          time: event.time,
          link: event.link,
          source: 'Perplexity Sonar'
        }));
      }
    } catch (error) {
      console.error('Error parsing response:', error);
      console.error('Response content:', completion.choices[0]?.message?.content);
    }

    return NextResponse.json({ events });
  } catch (error) {
    console.error('Error in events API:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch events' },
      { status: 500 }
    );
  }
} 