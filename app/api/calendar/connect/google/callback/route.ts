import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  try {
    // Initialize Supabase client with default cookie handling
    const supabase = createRouteHandlerClient({ cookies });
    
    // Get the user's session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      console.error('Session error:', sessionError);
      return new Response(
        `
        <html>
          <body>
            <script>
              window.opener.postMessage({ type: 'oauth_error', error: 'auth_required' }, '*');
              window.close();
            </script>
          </body>
        </html>
        `,
        {
          headers: { 'Content-Type': 'text/html' },
        }
      );
    }

    // Get stored state from cookie using headers
    const storedState = request.headers.get('cookie')?.match(/oauth_state=([^;]+)/)?.[1];
    
    // Get URL parameters
    const url = new URL(request.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    const error = url.searchParams.get('error');
    const errorDescription = url.searchParams.get('error_description');

    // Log OAuth callback parameters for debugging
    console.log('OAuth Callback:', {
      hasCode: !!code,
      state,
      storedState,
      error,
      errorDescription,
      cookies: request.headers.get('cookie'),
    });

    // Validate state to prevent CSRF
    if (!state || !storedState || state !== storedState) {
      console.error('Invalid state parameter:', {
        receivedState: state,
        storedState,
        cookies: request.headers.get('cookie'),
      });
      return new Response(
        `
        <html>
          <body>
            <script>
              window.opener.postMessage({ type: 'oauth_error', error: 'invalid_state' }, '*');
              window.close();
            </script>
          </body>
        </html>
        `,
        {
          headers: { 'Content-Type': 'text/html' },
        }
      );
    }

    if (error) {
      console.error('OAuth error:', error, errorDescription);
      return new Response(
        `
        <html>
          <body>
            <script>
              window.opener.postMessage({ 
                type: 'oauth_error', 
                error: 'oauth_failed',
                description: '${errorDescription || error}'
              }, '*');
              window.close();
            </script>
          </body>
        </html>
        `,
        {
          headers: { 'Content-Type': 'text/html' },
        }
      );
    }

    if (!code) {
      console.error('No authorization code received');
      return new Response(
        `
        <html>
          <body>
            <script>
              window.opener.postMessage({ type: 'oauth_error', error: 'no_code' }, '*');
              window.close();
            </script>
          </body>
        </html>
        `,
        {
          headers: { 'Content-Type': 'text/html' },
        }
      );
    }

    // Get the redirect URI
    const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https';
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || `${protocol}://${url.host}`;
    const redirectUri = `${baseUrl}/api/calendar/connect/google/callback`;

    // Log token exchange parameters for debugging
    console.log('Token Exchange Parameters:', {
      code: code.substring(0, 10) + '...',
      redirectUri,
      clientId: process.env.GOOGLE_CLIENT_ID?.substring(0, 10) + '...',
      hasClientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
      baseUrl,
      host: url.host,
      NODE_ENV: process.env.NODE_ENV,
    });

    // Exchange code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
      },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID || '',
        client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }).toString(),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json().catch(() => null);
      console.error('Token exchange failed:', {
        status: tokenResponse.status,
        statusText: tokenResponse.statusText,
        error: errorData,
        clientIdPresent: !!process.env.GOOGLE_CLIENT_ID,
        clientSecretPresent: !!process.env.GOOGLE_CLIENT_SECRET,
        redirectUri,
        baseUrl,
        host: url.host,
      });
      return new Response(
        `
        <html>
          <body>
            <script>
              window.opener.postMessage({ 
                type: 'oauth_error', 
                error: 'token_exchange_failed',
                description: 'Failed to exchange authorization code. Please check server logs.'
              }, '*');
              window.close();
            </script>
          </body>
        </html>
        `,
        {
          headers: { 'Content-Type': 'text/html' },
        }
      );
    }

    const tokens = await tokenResponse.json();

    // Get user info from Google
    const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
      },
    });

    if (!userInfoResponse.ok) {
      console.error('Failed to fetch user info:', await userInfoResponse.text());
      return new Response(
        `
        <html>
          <body>
            <script>
              window.opener.postMessage({ type: 'oauth_error', error: 'user_info_failed' }, '*');
              window.close();
            </script>
          </body>
        </html>
        `,
        {
          headers: { 'Content-Type': 'text/html' },
        }
      );
    }

    const userInfo = await userInfoResponse.json();

    // Store tokens in Supabase
    const { error: updateError } = await supabase
      .from('calendar_connections')
      .upsert({
        user_id: session.user.id,
        provider: 'google',
        provider_email: userInfo.email,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

    if (updateError) {
      console.error('Failed to store tokens:', updateError);
      return new Response(
        `
        <html>
          <body>
            <script>
              window.opener.postMessage({ type: 'oauth_error', error: 'token_storage_failed' }, '*');
              window.close();
            </script>
          </body>
        </html>
        `,
        {
          headers: { 'Content-Type': 'text/html' },
        }
      );
    }

    // Clear the oauth_state cookie and return success
    const response = new Response(
      `
      <html>
        <body>
          <script>
            window.opener.postMessage({ type: 'oauth_success' }, '*');
            window.close();
          </script>
        </body>
      </html>
      `,
      {
        headers: { 
          'Content-Type': 'text/html',
          'Set-Cookie': 'oauth_state=; Max-Age=0; Path=/',
        },
      }
    );

    return response;
  } catch (error) {
    console.error('Error in OAuth callback:', error);
    return new Response(
      `
      <html>
        <body>
          <script>
            window.opener.postMessage({ type: 'oauth_error', error: 'unknown' }, '*');
            window.close();
          </script>
        </body>
      </html>
      `,
      {
        headers: { 'Content-Type': 'text/html' },
      }
    );
  }
} 