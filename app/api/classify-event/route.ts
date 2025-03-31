import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// Initialize OpenAI client with OpenRouter endpoint and key (fallback)
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
  baseURL: 'https://openrouter.ai/api/v1',
  defaultHeaders: {
    'HTTP-Referer': 'https://smartcal.vercel.app',
    'X-Title': 'SmartCal'
  }
});

// Validate environment variables
if (!process.env.CEREBRAS_API_KEY && !process.env.OPENAI_API_KEY) {
  throw new Error('Either CEREBRAS_API_KEY or OPENAI_API_KEY must be set in environment variables');
}

interface ClassifyEventRequest {
  title: string;
  description?: string;
}

interface ClassifyEventResponse {
  eventType: string;
  userRole: string;
  confidence: number;
}

// Valid event types and roles (copied from frontend for validation)
const EVENT_TYPES = [
  "meeting", "presentation", "interview", "workshop", "conference",
  "client", "team", "1on1", "social", "holiday", "learning",
  "business", "health", "wellness", "fitness"
];

const USER_ROLES = [
  "host", "presenter", "participant", "manager", "team_member",
  "client", "interviewer", "interviewee"
];

interface CerebrasResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

async function classifyWithCerebras(title: string, description: string): Promise<string> {
  try {
    const response = await fetch('https://api.cerebras.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.CEREBRAS_API_KEY}`,
        'User-Agent': 'SmartCal/1.0' // Required by Cerebras API
      },
      body: JSON.stringify({
        model: "llama3.1-8b", // Using Cerebras' Llama 3.1 8B model
        messages: [{
          role: "user",
          content: `Given an event with the following details:
Title: ${title}
Description: ${description || 'No description provided'}

Analyze the event and provide:
1. The most appropriate event type from this list: meeting, presentation, interview, workshop, conference, client, team, 1on1, social, holiday, learning, business, health, wellness, fitness
2. The most likely role of the person creating/adding this event from this list: host, presenter, participant, manager, team_member, client, interviewer, interviewee

Consider these guidelines:
- For holiday events (like Christmas, Diwali, Holi), use "holiday" type
- For medical/doctor appointments, use "health" type
- For fitness/yoga/meditation events, use "wellness" type
- For sports games, training sessions, and athletic activities, use "fitness" type
- For team meetings with multiple attendees, use "team" type
- For one-on-one meetings, use "1on1" type
- Default to "meeting" only if no other type clearly fits

Respond in JSON format like this:
{
  "eventType": "type_here",
  "userRole": "role_here",
  "confidence": 0.0 to 1.0
}

Set confidence based on:
- 0.9+ if very clear from title/description
- 0.7-0.9 if reasonably clear but could be ambiguous
- 0.5-0.7 if making an educated guess
- Below 0.5 if highly uncertain

IMPORTANT: Respond ONLY with valid JSON. No additional text or explanations.`
        }],
        temperature: 0,
        max_tokens: 500
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Cerebras API error response:', errorText);
      throw new Error(`Cerebras API error: ${response.statusText} - ${errorText}`);
    }

    const data = await response.json() as CerebrasResponse;
    
    if (!data.choices?.[0]?.message?.content) {
      console.error('Invalid Cerebras API response:', data);
      throw new Error('Invalid response format from Cerebras API');
    }

    return data.choices[0].message.content;
  } catch (error) {
    console.error('Cerebras API call failed:', error);
    throw error;
  }
}

async function classifyWithOpenRouter(title: string, description: string): Promise<string> {
  const completion = await openai.chat.completions.create({
    messages: [{ 
      role: "user", 
      content: `Given an event with the following details:
Title: ${title}
Description: ${description || 'No description provided'}

Analyze the event and provide:
1. The most appropriate event type from this list: meeting, presentation, interview, workshop, conference, client, team, 1on1, social, holiday, learning, business, health, wellness, fitness
2. The most likely role of the person creating/adding this event from this list: host, presenter, participant, manager, team_member, client, interviewer, interviewee

Consider these guidelines:
- For holiday events (like Christmas, Diwali, Holi), use "holiday" type
- For medical/doctor appointments, use "health" type
- For fitness/yoga/meditation events, use "wellness" type
- For sports games, training sessions, and athletic activities, use "fitness" type
- For team meetings with multiple attendees, use "team" type
- For one-on-one meetings, use "1on1" type
- Default to "meeting" only if no other type clearly fits

Respond in JSON format like this:
{
  "eventType": "type_here",
  "userRole": "role_here",
  "confidence": 0.0 to 1.0
}

Set confidence based on:
- 0.9+ if very clear from title/description
- 0.7-0.9 if reasonably clear but could be ambiguous
- 0.5-0.7 if making an educated guess
- Below 0.5 if highly uncertain

IMPORTANT: Respond ONLY with valid JSON. No additional text or explanations.`
    }],
    model: "mistralai/mistral-7b-instruct",
    temperature: 0,
    response_format: { type: "json_object" }
  });

  if (!completion.choices[0]?.message?.content) {
    throw new Error('Empty response from OpenRouter');
  }

  return completion.choices[0].message.content;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as ClassifyEventRequest;
    const { title, description = '' } = body;

    if (!title) {
      return NextResponse.json(
        { error: 'Event title is required' },
        { status: 400 }
      );
    }

    try {
      console.log('Sending classification request for:', title);
      
      // Try Cerebras first if API key is available, fall back to OpenRouter
      let result: string;
      if (process.env.CEREBRAS_API_KEY) {
        console.log('Using Cerebras API for classification');
        result = await classifyWithCerebras(title, description);
      } else {
        console.log('Using OpenRouter API for classification (fallback)');
        result = await classifyWithOpenRouter(title, description);
      }

      // Try to clean up the response if it's not valid JSON
      try {
        // Remove any leading/trailing non-JSON content
        const cleanedContent = result.substring(
          result.indexOf('{'),
          result.lastIndexOf('}') + 1
        );
        
        console.log('Parsing response:', cleanedContent);
        const parsedResult = JSON.parse(cleanedContent) as ClassifyEventResponse;
        
        // Validate the response format
        if (!parsedResult.eventType || !parsedResult.userRole || typeof parsedResult.confidence !== 'number') {
          console.error('Invalid response format:', parsedResult);
          throw new Error('Invalid response format from classification model');
        }

        // Normalize the values to match our expected formats
        parsedResult.eventType = parsedResult.eventType.toLowerCase();
        parsedResult.userRole = parsedResult.userRole.toLowerCase();
        
        // Replace any close matches (e.g., "meetings" -> "meeting")
        if (parsedResult.eventType.endsWith('s')) {
          const singular = parsedResult.eventType.slice(0, -1);
          if (EVENT_TYPES.includes(singular)) {
            parsedResult.eventType = singular;
          }
        }

        // Ensure the values match our allowed types/roles
        if (!EVENT_TYPES.includes(parsedResult.eventType)) {
          console.warn('Invalid event type received:', parsedResult.eventType);
          parsedResult.eventType = 'meeting';
          parsedResult.confidence = Math.min(parsedResult.confidence, 0.5);
        }
        if (!USER_ROLES.includes(parsedResult.userRole)) {
          console.warn('Invalid user role received:', parsedResult.userRole);
          parsedResult.userRole = 'host';
          parsedResult.confidence = Math.min(parsedResult.confidence, 0.5);
        }

        console.log('Classification successful:', parsedResult);
        return NextResponse.json(parsedResult);
      } catch (parseError) {
        console.error('Failed to parse model response:', result);
        console.error('Parse error:', parseError);
        
        // Attempt to extract meaningful information from the response
        const typeMatch = result.match(/"eventType":\s*"([^"]+)"/);
        const roleMatch = result.match(/"userRole":\s*"([^"]+)"/);
        
        // Construct a fallback response
        const fallbackResult: ClassifyEventResponse = {
          eventType: (typeMatch?.[1]?.toLowerCase() || 'meeting'),
          userRole: (roleMatch?.[1]?.toLowerCase() || 'host'),
          confidence: 0.5
        };

        // Validate and normalize the fallback values
        fallbackResult.eventType = EVENT_TYPES.includes(fallbackResult.eventType) ? fallbackResult.eventType : 'meeting';
        fallbackResult.userRole = USER_ROLES.includes(fallbackResult.userRole) ? fallbackResult.userRole : 'host';

        console.log('Using fallback classification:', fallbackResult);
        return NextResponse.json(fallbackResult);
      }
    } catch (error) {
      console.error('API error:', error);
      return NextResponse.json(
        { error: 'Failed to classify event', details: error instanceof Error ? error.message : 'Unknown error' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Request processing error:', error);
    return NextResponse.json(
      { error: 'Failed to process request', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 