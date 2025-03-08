import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Define paths that don't require authentication
const publicPaths = ['/', '/api/auth']

export function middleware(request: NextRequest) {
  // Check if the path is a public path
  const path = request.nextUrl.pathname
  if (path === '/' || path.startsWith('/api/auth')) {
    return NextResponse.next()
  }
  
  // For all other paths, check for authentication
  const calendarTokens = request.cookies.get('calendar_tokens')
  
  // If no token is found, redirect to home page
  if (!calendarTokens?.value) {
    // Return JSON error for API requests
    if (request.headers.get('accept')?.includes('application/json')) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }
    
    // Redirect browser requests to the landing page
    return NextResponse.redirect(new URL('/', request.url))
  }
  
  // User is authenticated, allow access
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
} 