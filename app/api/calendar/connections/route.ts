import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET() {
  try {
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

    // Fetch calendar connections for the user
    const { data: connections, error: fetchError } = await supabase
      .from('calendar_connections')
      .select('provider, created_at')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false });

    if (fetchError) {
      console.error('Error fetching calendar connections:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch calendar connections' },
        { status: 500 }
      );
    }

    return NextResponse.json({ connections });
  } catch (error) {
    console.error('Error in calendar connections route:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
} 