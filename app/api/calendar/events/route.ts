import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Get the user's session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      console.error('Session error:', sessionError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get time range parameters
    const searchParams = request.nextUrl.searchParams;
    const defaultTimeMin = new Date();
    defaultTimeMin.setMonth(defaultTimeMin.getMonth() - 1); // 1 month ago
    const timeMin = searchParams.get('timeMin') || defaultTimeMin.toISOString();
    const timeMax = searchParams.get('timeMax') || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 days ahead

    // Get calendar connection from database
    const { data: connection, error: connectionError } = await supabase
      .from('calendar_connections')
      .select('*')
      .eq('user_id', session.user.id)
      .eq('provider', 'google')
      .single();

    if (connectionError || !connection) {
      console.error('No calendar connection found:', connectionError);
      return NextResponse.json({ error: 'Calendar not connected' }, { status: 401 });
    }

    // Check if token is expired
    if (new Date(connection.expires_at) < new Date()) {
      return NextResponse.json({ error: 'Calendar token expired' }, { status: 401 });
    }

    // Fetch events from Google Calendar
    const calendarResponse = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${timeMin}&timeMax=${timeMax}&singleEvents=true&orderBy=startTime`,
      {
        headers: {
          Authorization: `Bearer ${connection.access_token}`,
          'Accept': 'application/json',
        },
      }
    );

    if (!calendarResponse.ok) {
      console.error('Failed to fetch calendar events:', await calendarResponse.text());
      return NextResponse.json({ error: 'Failed to fetch calendar events' }, { status: 500 });
    }

    const { items: events } = await calendarResponse.json();
    
    return NextResponse.json({ 
      events: events.map((event: any) => ({
        id: event.id,
        summary: event.summary,
        description: event.description,
        start: event.start.dateTime || event.start.date,
        end: event.end.dateTime || event.end.date,
        attendees: event.attendees,
        location: event.location,
        htmlLink: event.htmlLink,
      }))
    });
  } catch (error) {
    console.error('Error fetching calendar events:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 