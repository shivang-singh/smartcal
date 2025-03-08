import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { CalendarEvent, CalendarCredentials, TokenResponse } from './types';

export class GoogleCalendarService {
  private oauth2Client: OAuth2Client;
  private calendar: any;

  constructor(credentials: CalendarCredentials) {
    this.oauth2Client = new google.auth.OAuth2(
      credentials.clientId,
      credentials.clientSecret
    );

    this.calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });
  }

  setCredentials(tokens: TokenResponse) {
    this.oauth2Client.setCredentials(tokens);
  }

  async getAuthUrl(): Promise<string> {
    const scopes = [
      'https://www.googleapis.com/auth/calendar',
      'https://www.googleapis.com/auth/calendar.events',
      'https://www.googleapis.com/auth/calendar.readonly',
    ];

    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      prompt: 'consent',
    });
  }

  async getTokens(code: string): Promise<TokenResponse> {
    const { tokens } = await this.oauth2Client.getToken(code);
    this.oauth2Client.setCredentials(tokens);
    return tokens as TokenResponse;
  }

  async refreshTokens(): Promise<TokenResponse | null> {
    try {
      const { credentials } = await this.oauth2Client.refreshAccessToken();
      return credentials as TokenResponse;
    } catch (error) {
      console.error('Error refreshing tokens:', error);
      return null;
    }
  }

  private async ensureValidToken(): Promise<boolean> {
    const credentials = this.oauth2Client.credentials;
    if (!credentials.access_token) {
      console.log('No access token found in credentials');
      return false;
    }

    // For tokens without expiry_date (like those from client-side Google sign-in)
    // We'll simply assume they're valid since they're fresh from Google
    if (!credentials.expiry_date) {
      console.log('Token has no expiry date, assuming it\'s fresh and valid');
      return true;
    }

    // Check if token is expired or about to expire (within 5 minutes)
    const expiryDate = credentials.expiry_date;
    const isExpired = expiryDate <= Date.now() + 5 * 60 * 1000;
    
    if (isExpired && credentials.refresh_token) {
      console.log('Token is expired, attempting to refresh');
      const newTokens = await this.refreshTokens();
      if (newTokens) {
        this.setCredentials(newTokens);
        return true;
      }
      console.log('Token refresh failed');
      return false;
    }

    return !isExpired;
  }

  async listEvents(timeMin?: Date, timeMax?: Date) {
    try {
      const hasValidToken = await this.ensureValidToken();
      if (!hasValidToken) {
        throw new Error('Invalid or expired token');
      }

      const response = await this.calendar.events.list({
        calendarId: 'primary',
        timeMin: timeMin?.toISOString() || new Date().toISOString(),
        timeMax: timeMax?.toISOString(),
        maxResults: 100,
        singleEvents: true,
        orderBy: 'startTime',
      });

      return response.data.items;
    } catch (error) {
      console.error('Error listing events:', error);
      throw error;
    }
  }

  async createEvent(event: CalendarEvent) {
    try {
      const hasValidToken = await this.ensureValidToken();
      if (!hasValidToken) {
        throw new Error('Invalid or expired token');
      }

      const response = await this.calendar.events.insert({
        calendarId: 'primary',
        requestBody: event,
      });

      return response.data;
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

      const response = await this.calendar.events.update({
        calendarId: 'primary',
        eventId: eventId,
        requestBody: event,
      });

      return response.data;
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

      await this.calendar.events.delete({
        calendarId: 'primary',
        eventId: eventId,
      });
    } catch (error) {
      console.error('Error deleting event:', error);
      throw error;
    }
  }
} 