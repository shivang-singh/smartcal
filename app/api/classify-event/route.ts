import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// Initialize OpenAI client with OpenRouter endpoint and key
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
  baseURL: 'https://openrouter.ai/api/v1',
  defaultHeaders: {
    'HTTP-Referer': 'https://smartcal.vercel.app',
    'X-Title': 'SmartCal'
  }
});

// Validate environment variables
if (!process.env.OPENAI_API_KEY) {
  throw new Error('OPENAI_API_KEY is not set in environment variables');
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

    const prompt = `Given an event with the following details:
Title: ${title}
Description: ${description || 'No description provided'}

Analyze the event and provide:
1. The most appropriate event type from this list: meeting, presentation, interview, workshop, conference, client, team, 1on1, social, holiday, learning, business, health, wellness
2. The most likely role of the person creating/adding this event from this list: host, presenter, participant, manager, team_member, client, interviewer, interviewee

Consider these guidelines:
- For holiday events (like Christmas, Diwali, Holi), use "holiday" type
- For medical/doctor appointments, use "health" type
- For fitness/yoga/meditation events, use "wellness" type
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
- Below 0.5 if highly uncertain`;

    try {
      console.log('Sending classification request for:', title);
      
      const completion = await openai.chat.completions.create({
        messages: [{ 
          role: "user", 
          content: `${prompt}\n\nIMPORTANT: Respond ONLY with valid JSON. No additional text or explanations.`
        }],
        model: "mistralai/mistral-7b-instruct",
        temperature: 0,
        response_format: { type: "json_object" }
      });

      if (!completion.choices[0]?.message?.content) {
        console.error('Empty response from OpenRouter');
        throw new Error('Failed to get classification response');
      }

      let content = completion.choices[0].message.content;
      
      // Try to clean up the response if it's not valid JSON
      try {
        // Remove any leading/trailing non-JSON content
        content = content.substring(
          content.indexOf('{'),
          content.lastIndexOf('}') + 1
        );
        
        console.log('Parsing response:', content);
        const result = JSON.parse(content) as ClassifyEventResponse;
        
        // Validate the response format
        if (!result.eventType || !result.userRole || typeof result.confidence !== 'number') {
          console.error('Invalid response format:', result);
          throw new Error('Invalid response format from classification model');
        }

        // Normalize the values to match our expected formats
        result.eventType = result.eventType.toLowerCase();
        result.userRole = result.userRole.toLowerCase();
        
        // Replace any close matches (e.g., "meetings" -> "meeting")
        if (result.eventType.endsWith('s')) {
          const singular = result.eventType.slice(0, -1);
          if (EVENT_TYPES.includes(singular)) {
            result.eventType = singular;
          }
        }

        // Ensure the values match our allowed types/roles
        if (!EVENT_TYPES.includes(result.eventType)) {
          console.warn('Invalid event type received:', result.eventType);
          result.eventType = 'meeting';
          result.confidence = Math.min(result.confidence, 0.5);
        }
        if (!USER_ROLES.includes(result.userRole)) {
          console.warn('Invalid user role received:', result.userRole);
          result.userRole = 'host';
          result.confidence = Math.min(result.confidence, 0.5);
        }

        console.log('Classification successful:', result);
        return NextResponse.json(result);
      } catch (parseError) {
        console.error('Failed to parse model response:', content);
        console.error('Parse error:', parseError);
        
        // Attempt to extract meaningful information from the response
        const typeMatch = content.match(/"eventType":\s*"([^"]+)"/);
        const roleMatch = content.match(/"userRole":\s*"([^"]+)"/);
        
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
      console.error('OpenRouter API error:', error);
      return NextResponse.json(
        { error: 'Failed to classify event', details: error instanceof Error ? error.message : 'Unknown error' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Request processing error:', error);
    return NextResponse.json(
      { error: 'Invalid request format' },
      { status: 400 }
    );
  }
}

// Valid event types and roles (copied from frontend for validation)
const EVENT_TYPES = [
  "meeting", "presentation", "interview", "workshop", "conference",
  "client", "team", "1on1", "social", "holiday", "learning",
  "business", "health", "wellness"
];

const USER_ROLES = [
  "host", "presenter", "participant", "manager", "team_member",
  "client", "interviewer", "interviewee"
]; 