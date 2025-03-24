import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

const SYSTEM_PROMPT = `You are an AI assistant helping users prepare for their events. You have access to the event details and should use this context to provide relevant, specific answers.

When responding:
1. Be concise and direct
2. Use the event details to provide context-specific answers
3. If asked about topics not in the event details, make reasonable assumptions based on the event type
4. If you're making assumptions, clearly state them
5. Focus on actionable advice and practical suggestions
6. If asked about sensitive topics, maintain professionalism and suggest consulting appropriate professionals

Remember to:
- Keep responses focused on event preparation
- Provide specific examples when possible
- Suggest follow-up questions when appropriate
- Acknowledge when certain information isn't available in the event details`;

interface EventContext {
  title: string;
  description: string;
  date: string;
  time: string;
  attendees: string[];
  location?: string;
}

interface Message {
  role: 'assistant' | 'user';
  content: string;
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies();
    
    // Initialize Supabase client with cookie store
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    // Get the user's session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    const { message, eventContext, history } = body as {
      message: string;
      eventContext: EventContext;
      history: Message[];
    };

    // Validate required fields
    if (!message || !eventContext) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Construct the prompt with event context
    const prompt = `Event Context:
Title: ${eventContext.title}
Description: ${eventContext.description}
Date: ${eventContext.date}
Time: ${eventContext.time}
Attendees: ${eventContext.attendees.join(', ')}
${eventContext.location ? `Location: ${eventContext.location}` : ''}

Previous messages:
${history.map(m => `${m.role === 'assistant' ? 'Assistant' : 'User'}: ${m.content}`).join('\n')}

User: ${message}`;

    // Call OpenRouter API
    const completion = await fetch(OPENROUTER_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        'X-Title': 'SmartCal',
        'OpenAI-Organization': 'smartcal-prod'
      },
      body: JSON.stringify({
        model: "anthropic/claude-3-opus-20240229",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 500,
      })
    });

    if (!completion.ok) {
      const errorData = await completion.json().catch(() => ({}));
      console.error('OpenRouter API error:', {
        status: completion.status,
        statusText: completion.statusText,
        error: errorData
      });
      throw new Error(`OpenRouter API error: ${completion.status} ${completion.statusText}`);
    }

    const data = await completion.json();
    const response = data.choices[0]?.message?.content || 'Sorry, I could not generate a response.';

    return NextResponse.json({ response });
  } catch (error) {
    console.error('Error in chat endpoint:', error);
    return NextResponse.json(
      { error: 'Failed to process chat request' },
      { status: 500 }
    );
  }
} 