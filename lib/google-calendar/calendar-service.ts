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
      const now = timeMin || new Date();
      const oneMonthFromNow = timeMax || new Date();
      oneMonthFromNow.setMonth(now.getMonth() + 1);

      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events?` +
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

      if (!response.ok) {
        throw new Error('Failed to fetch events');
      }

      const data = await response.json();
      return data.items.map((event: any) => this.formatEvent(event));
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