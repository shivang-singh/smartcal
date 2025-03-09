import { CalendarEvent, CalendarCredentials, TokenResponse } from './types';
import { parseISO, format } from 'date-fns';

export class GoogleCalendarService {
  private accessToken: string | null;

  constructor(credentials: CalendarCredentials) {
    this.accessToken = null;
  }

  setCredentials(tokens: TokenResponse) {
    this.accessToken = tokens.access_token;
  }

  async getAuthUrl(): Promise<string> {
    const scopes = [
      'https://www.googleapis.com/auth/calendar',
      'https://www.googleapis.com/auth/calendar.events',
      'https://www.googleapis.com/auth/calendar.readonly',
      'https://www.googleapis.com/auth/calendar.events.readonly',
      'https://www.googleapis.com/auth/contacts.readonly'
    ];

    const params = new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback/google`,
      access_type: 'offline',
      response_type: 'code',
      prompt: 'consent',
      scope: scopes.join(' ')
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  private async ensureValidToken(): Promise<boolean> {
    if (!this.accessToken) {
      console.log('No access token found');
      return false;
    }
    return true;
  }

  async listEvents(timeMin?: Date, timeMax?: Date) {
    try {
      if (!await this.ensureValidToken()) {
        return [];
      }

      const now = timeMin || new Date();
      const oneMonthFromNow = timeMax || new Date();
      oneMonthFromNow.setMonth(now.getMonth() + 1);

      // First, get the list of calendars the user has access to
      const calendarListResponse = await fetch(
        'https://www.googleapis.com/calendar/v3/users/me/calendarList',
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
          },
        }
      );

      if (!calendarListResponse.ok) {
        throw new Error('Failed to fetch calendar list');
      }

      const calendarList = await calendarListResponse.json();
      
      // Filter for primary calendar and holiday calendars
      const calendarsToFetch = calendarList.items.filter((calendar: any) => {
        // Always include primary calendar
        if (calendar.primary) return true;
        
        // Include holiday calendars
        if (calendar.accessRole && 
            (calendar.summary?.toLowerCase().includes('holiday') || 
             calendar.description?.toLowerCase().includes('holiday'))) {
          return true;
        }
        
        return false;
      });

      // Fetch events from each calendar
      const allEvents: any[] = [];
      
      for (const calendar of calendarsToFetch) {
        const calendarId = encodeURIComponent(calendar.id);
        const response = await fetch(
          `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events?` +
          `timeMin=${now.toISOString()}&` +
          `timeMax=${oneMonthFromNow.toISOString()}&` +
          `orderBy=startTime&` +
          `singleEvents=true`,
          {
            headers: {
              Authorization: `Bearer ${this.accessToken}`,
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          // Add calendar information to each event
          const eventsWithSource = data.items.map((event: any) => ({
            ...event,
            source: calendar.id,
            calendarColor: calendar.backgroundColor || '#4285F4',
            calendarSummary: calendar.summary || 'Calendar'
          }));
          allEvents.push(...eventsWithSource);
        } else {
          console.error(`Failed to fetch events for calendar ${calendar.id}`);
        }
      }

      // Sort all events by start time
      allEvents.sort((a: any, b: any) => {
        const aStart = a.start?.dateTime || a.start?.date || '';
        const bStart = b.start?.dateTime || b.start?.date || '';
        return aStart.localeCompare(bStart);
      });

      return allEvents.map((event: any) => this.formatEvent(event));
    } catch (error) {
      console.error('Error listing events:', error);
      return [];
    }
  }

  private formatEvent(event: any) {
    // Basic validation
    if (!event?.start || (!event.start.date && !event.start.dateTime)) {
      console.error('Invalid event data:', event);
      throw new Error('Invalid event data: missing start date/time');
    }

    const isAllDay = Boolean(event.start.date);
    
    // Get the event's timezone or default to calendar timezone
    const timeZone = event.start.timeZone || event.end?.timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone;

    if (isAllDay) {
      // For all-day events, preserve the original date strings
      return {
        id: event.id,
        title: event.summary || 'Untitled Event',
        description: event.description || '',
        location: event.location || '',
        start: event.start.date,
        end: event.end?.date,
        isAllDay: true,
        allDay: true,
        timeZone,
        // Store original date strings
        startStr: event.start.date,
        endStr: event.end?.date,
        eventType: this.determineEventType(event),
        source: event.source || 'primary',
        calendarColor: '#4285F4',
        calendarSummary: 'Primary Calendar'
      };
    }

    // For timed events, preserve the original datetime strings with timezone
    if (!event.start.dateTime || !event.end?.dateTime) {
      throw new Error('Invalid timed event: missing dateTime');
    }

    return {
      id: event.id,
      title: event.summary || 'Untitled Event',
      description: event.description || '',
      location: event.location || '',
      start: event.start.dateTime,
      end: event.end.dateTime,
      isAllDay: false,
      allDay: false,
      timeZone,
      // Store original datetime strings
      startStr: event.start.dateTime,
      endStr: event.end.dateTime,
      eventType: this.determineEventType(event),
      source: event.source || 'primary',
      calendarColor: '#4285F4',
      calendarSummary: 'Primary Calendar'
    };
  }

  // Match the example's determineEventType function exactly
  private determineEventType(event: any) {
    const title = (event.summary || '').toLowerCase();
    
    // Check if the event is from a holiday calendar
    if (event.calendarSummary?.toLowerCase().includes('holiday') ||
        title.includes('holiday')) {
      return 'Holiday';
    }
    
    if (title.includes('meeting') || title.includes('sync') || title.includes('standup')) {
      return 'Meeting';
    } else if (title.includes('birthday') || title.includes('bday') || 
               title.includes('born') || title.includes('birthday:')) {
      return 'Birthday';
    } else if (title.includes('interview') || title.includes('screening')) {
      return 'Interview';
    } else if (title.includes('party') || title.includes('dinner') || title.includes('lunch')) {
      return 'Social';
    }
    
    return 'Default';
  }

  async createEvent(event: CalendarEvent) {
    try {
      const hasValidToken = await this.ensureValidToken();
      if (!hasValidToken) {
        throw new Error('Invalid or expired token');
      }

      const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(event)
      });

      if (!response.ok) {
        throw new Error('Failed to create event');
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating event:', error);
      throw error;
    }
  }

  async updateEvent(eventId: string, event: CalendarEvent) {
    try {
      const hasValidToken = await this.ensureValidToken();
      if (!hasValidToken) {
        throw new Error('Invalid or expired token');
      }

      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(event)
        }
      );

      if (!response.ok) {
        throw new Error('Failed to update event');
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating event:', error);
      throw error;
    }
  }

  async deleteEvent(eventId: string) {
    try {
      const hasValidToken = await this.ensureValidToken();
      if (!hasValidToken) {
        throw new Error('Invalid or expired token');
      }

      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${this.accessToken}`
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to delete event');
      }
    } catch (error) {
      console.error('Error deleting event:', error);
      throw error;
    }
  }
} 