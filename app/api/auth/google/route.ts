import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  console.log('Google auth API endpoint called');
  
  try {
    // Initialize Supabase client
    const supabase = createRouteHandlerClient({ cookies });
    
    // Get the user's session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      console.error('Session error:', sessionError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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
    
    const { access_token, scope } = body;

    if (!access_token) {
      console.log('No access token provided in request');
      return NextResponse.json({ error: 'No access token provided' }, { status: 400 });
    }

    // Verify the token by making a test API call
    const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    });

    if (!userInfoResponse.ok) {
      console.error('Failed to verify access token:', await userInfoResponse.text());
      return NextResponse.json({ error: 'Invalid access token' }, { status: 401 });
    }

    const userInfo = await userInfoResponse.json();
    
    // Check if calendar scopes are present
    const hasCalendarScope = scope?.includes('https://www.googleapis.com/auth/calendar.readonly') ||
                           scope?.includes('https://www.googleapis.com/auth/calendar.events.readonly');

    if (hasCalendarScope) {
      // Store the calendar connection
      const { error: updateError } = await supabase
        .from('calendar_connections')
        .upsert({
          user_id: session.user.id,
          provider: 'google',
          provider_email: userInfo.email,
          access_token: access_token,
          expires_at: new Date(Date.now() + 3600 * 1000).toISOString(), // 1 hour from now
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

      if (updateError) {
        console.error('Failed to store calendar connection:', updateError);
        return NextResponse.json({ error: 'Failed to store calendar connection' }, { status: 500 });
      }
    }

    return NextResponse.json({ 
      success: true,
      user: userInfo,
      hasCalendarAccess: hasCalendarScope
    });
  } catch (error) {
    console.error('Error in Google auth endpoint:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 