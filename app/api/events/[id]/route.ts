import { NextRequest, NextResponse } from 'next/server';
import { GoogleCalendarService } from '@/lib/google-calendar/calendar-service';

// Initialize the calendar service with the required credentials
const calendarService = new GoogleCalendarService({
  clientId: process.env.GOOGLE_CLIENT_ID!,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
});

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get the event ID from the URL params
    const eventId = params.id;
    
    if (!eventId) {
      return NextResponse.json(
        { error: 'Event ID is required' },
        { status: 400 }
      );
    }

    // Get calendar tokens from cookie
    const calendarTokens = request.cookies.get('calendar_tokens');
    if (!calendarTokens?.value) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Parse tokens
    const tokens = JSON.parse(calendarTokens.value);
    
    // Set credentials
    calendarService.setCredentials(tokens);
    
    // Fetch all events (we'll filter for the specific one)
    // In a real implementation, you would add a getEvent method to the service
    const allEvents = await calendarService.listEvents();
    
    // Find the specific event
    const event = allEvents.find((e: any) => e.id === eventId);
    
    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    // Transform the event data to match our application's format
    const transformedEvent = {
      id: event.id,
      title: event.title || 'Untitled Event',
      description: event.description || '',
      date: event.isAllDay 
        ? event.start 
        : new Date(event.start).toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          }),
      time: event.isAllDay 
        ? 'All day'
        : `${new Date(event.start).toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            minute: '2-digit' 
          })} - ${new Date(event.end).toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            minute: '2-digit' 
          })}`,
      location: event.location || 'No location specified',
      attendees: [], // We'll need to add this to the calendar service
      // For now, we'll use empty arrays for these fields
      resources: [],
      questions: [],
    };

    return NextResponse.json(transformedEvent);
  } catch (error) {
    console.error('Error fetching event:', error);
    return NextResponse.json(
      { error: 'Failed to fetch event' },
      { status: 500 }
    );
  }
} 