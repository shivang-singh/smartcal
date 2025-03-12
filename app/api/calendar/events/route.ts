import { NextRequest, NextResponse } from 'next/server';
import { GoogleCalendarService } from '@/lib/google-calendar/calendar-service';

// Initialize the calendar service with the required credentials
const calendarService = new GoogleCalendarService({
  clientId: process.env.GOOGLE_CLIENT_ID!,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
});

export async function GET(request: NextRequest) {
  try {
    // Get time range parameters
    const searchParams = request.nextUrl.searchParams;
    const defaultTimeMin = new Date();
    defaultTimeMin.setMonth(defaultTimeMin.getMonth() - 6); // 6 months ago
    const timeMin = searchParams.get('timeMin') || defaultTimeMin.toISOString();
    const timeMax = searchParams.get('timeMax') || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    // Get calendar tokens from cookie
    const calendarTokens = request.cookies.get('calendar_tokens');
    if (!calendarTokens?.value) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Parse tokens
    const tokens = JSON.parse(calendarTokens.value);
    
    // Set credentials
    calendarService.setCredentials(tokens);
    
    // Fetch events
    const events = await calendarService.listEvents(
      new Date(timeMin),
      new Date(timeMax)
    );
    
    return NextResponse.json({ events });
  } catch (error) {
    console.error('Error fetching calendar events:', error);
    return NextResponse.json(
      { error: 'Failed to fetch calendar events', details: error instanceof Error ? error.message : 'Unknown error' }, 
      { status: 500 }
    );
  }
} 