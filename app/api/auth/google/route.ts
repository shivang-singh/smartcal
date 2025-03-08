import { NextRequest, NextResponse } from 'next/server';
import { GoogleCalendarService } from '@/lib/google-calendar/calendar-service';

// Initialize the calendar service with the required credentials
const calendarService = new GoogleCalendarService({
  clientId: process.env.GOOGLE_CLIENT_ID!,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
});

export async function POST(request: NextRequest) {
  console.log('Google auth API endpoint called');
  
  try {
    // Parse the request body
    const bodyText = await request.text();
    let body;
    
    try {
      body = JSON.parse(bodyText);
      console.log('Request body parsed successfully');
    } catch (err) {
      console.error('Failed to parse request body:', bodyText.substring(0, 100) + '...');
      return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 });
    }
    
    const { access_token } = body;

    if (!access_token) {
      console.log('No access token provided in request');
      return NextResponse.json({ error: 'No access token provided' }, { status: 400 });
    }

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
      const response = NextResponse.json({ 
        success: true, 
        message: 'Authentication successful'
      });
      
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
          details: listError instanceof Error ? listError.message : 'Unknown error'
        }, 
        { status: 401 }
      );
    }
  } catch (error) {
    console.error('Auth API error:', error);
    return NextResponse.json(
      { 
        error: 'Authentication failed', 
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
} 