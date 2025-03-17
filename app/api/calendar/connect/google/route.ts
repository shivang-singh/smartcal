import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

const GOOGLE_OAUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_CALENDAR_SCOPES = [
  'https://www.googleapis.com/auth/calendar.readonly',
  'https://www.googleapis.com/auth/calendar.events.readonly',
  'openid',
  'profile',
  'email'
];

export async function GET(request: Request) {
  try {
    // Initialize Supabase client with default cookie handling
    const supabase = createRouteHandlerClient({ cookies });
    
    // Get the user's session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('Session error:', sessionError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get and validate client ID from environment
    const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
    if (!clientId || !clientId.endsWith('.apps.googleusercontent.com')) {
      console.error('Invalid GOOGLE_CLIENT_ID environment variable:', clientId);
      return NextResponse.json({ 
        error: 'Invalid OAuth configuration',
        details: 'Client ID must be a valid Google OAuth 2.0 client ID ending with .apps.googleusercontent.com'
      }, { status: 500 });
    }

    // Get request URL for base URL determination
    const requestUrl = new URL(request.url);
    const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https';
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || `${protocol}://${requestUrl.host}`;
    const redirectUri = `${baseUrl}/api/calendar/connect/google/callback`;

    // Log configuration for debugging
    console.log('OAuth Configuration:', {
      NODE_ENV: process.env.NODE_ENV,
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
      requestHost: requestUrl.host,
      protocol,
      baseUrl,
      redirectUri,
      clientIdLength: clientId.length,
      clientIdStart: clientId.substring(0, 8) + '...',
      clientIdEnd: '...' + clientId.substring(clientId.length - 30),
      scopes: GOOGLE_CALENDAR_SCOPES
    });

    // Generate state parameter to prevent CSRF
    const state = Math.random().toString(36).substring(7);
    
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: GOOGLE_CALENDAR_SCOPES.join(' '),
      access_type: 'offline',
      state,
      prompt: 'consent',
      include_granted_scopes: 'true',
    });

    const url = `${GOOGLE_OAUTH_URL}?${params.toString()}`;

    // Create response with OAuth URL
    const response = NextResponse.json({ url });

    // Set state in a cookie with secure settings
    response.cookies.set('oauth_state', state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 10, // 10 minutes
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Error initiating Google Calendar connection:', error);
    return NextResponse.json(
      { error: 'Failed to initiate Google Calendar connection' },
      { status: 500 }
    );
  }
} 