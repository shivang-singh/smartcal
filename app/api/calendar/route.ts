import { NextRequest, NextResponse } from 'next/server';
import { GoogleCalendarService } from '@/lib/google-calendar/calendar-service';
import { CalendarEvent } from '@/lib/google-calendar/types';

// Initialize the calendar service
const calendarService = new GoogleCalendarService({
  clientId: process.env.GOOGLE_CLIENT_ID!,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
});

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const action = searchParams.get('action');
    const timeMin = searchParams.get('timeMin');
    const timeMax = searchParams.get('timeMax');

    switch (action) {
      case 'events':
        const events = await calendarService.listEvents(
          timeMin ? new Date(timeMin) : undefined,
          timeMax ? new Date(timeMax) : undefined
        );
        return NextResponse.json(events);

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Calendar API Error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const bodyText = await request.text();
    let body;
    
    try {
      body = JSON.parse(bodyText);
    } catch (err) {
      console.error('Failed to parse request body:', bodyText.substring(0, 100) + '...');
      return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 });
    }
    
    const { action, event, eventId, access_token } = body;

    switch (action) {
      case 'callback':
        if (!access_token) {
          console.log('No access token provided in request');
          return NextResponse.json({ error: 'No access token provided' }, { status: 400 });
        }

        try {
          console.log('Received access token for validation');
          
          // Set the access token
          calendarService.setCredentials({ access_token });
          
          console.log('Attempting to verify token with a test API call');
          
          try {
            // Verify the token by making a test API call
            await calendarService.listEvents(
              new Date(),
              new Date(Date.now() + 24 * 60 * 60 * 1000) // Next 24 hours
            );
            
            console.log('Token validation successful');
            
            // If we get here, the token is valid
            const response = NextResponse.json({ success: true, message: 'Token validated and stored' });
            
            // Store the token in a cookie
            response.cookies.set('calendar_tokens', JSON.stringify({ access_token }), {
              httpOnly: true,
              secure: process.env.NODE_ENV === 'production',
              sameSite: 'lax',
              maxAge: 60 * 60 * 24 * 7, // 1 week
            });
            
            console.log('Cookie set, returning success response');
            return response;
          } catch (listError) {
            console.error('Token validation failed during API call:', listError);
            return NextResponse.json(
              { 
                error: 'Token validation failed', 
                details: listError instanceof Error ? listError.message : 'Unknown error',
                type: 'api_validation_error'
              }, 
              { status: 401 }
            );
          }
        } catch (error) {
          console.error('Token exchange error:', error);
          return NextResponse.json(
            { 
              error: 'Token validation failed', 
              details: error instanceof Error ? error.message : 'Unknown error',
              type: 'general_validation_error'
            }, 
            { status: 401 }
          );
        }

      case 'create':
        const newEvent = await calendarService.createEvent(event as CalendarEvent);
        return NextResponse.json(newEvent);

      case 'update':
        const updatedEvent = await calendarService.updateEvent(
          eventId,
          event as CalendarEvent
        );
        return NextResponse.json(updatedEvent);

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Calendar API Error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const eventId = searchParams.get('eventId');

    if (!eventId) {
      return NextResponse.json(
        { error: 'Event ID is required' },
        { status: 400 }
      );
    }

    await calendarService.deleteEvent(eventId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Calendar API Error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

