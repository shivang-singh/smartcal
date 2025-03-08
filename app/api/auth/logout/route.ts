import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json({ success: true });
  
  // Clear the auth cookie
  response.cookies.set('calendar_tokens', '', {
    expires: new Date(0),
    path: '/',
  });
  
  return response;
} 