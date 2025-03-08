const GOOGLE_CLIENT_ID = '991472441824-a7m38dqfu7k425eafkatb05nc4qefrii.apps.googleusercontent.com';

export async function loadGoogleScript(): Promise<void> {
  if (typeof window === 'undefined') return;
  if (window.google) return;

  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Google script'));
    document.head.appendChild(script);
  });
}

export async function initializeGoogleClient(): Promise<void> {
  await loadGoogleScript();
  window.google.accounts.oauth2.initTokenClient({
    client_id: GOOGLE_CLIENT_ID,
    scope: [
      'https://www.googleapis.com/auth/calendar',
      'https://www.googleapis.com/auth/calendar.events',
      'https://www.googleapis.com/auth/calendar.readonly',
    ].join(' '),
    callback: async (response: any) => {
      if (response.error) {
        console.error('Google OAuth error:', response.error);
        return;
      }

      try {
        // Exchange the access token for our session token
        const res = await fetch('/api/calendar?action=callback', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ access_token: response.access_token }),
        });

        if (!res.ok) {
          throw new Error('Failed to exchange token');
        }

        // Redirect to home page on success
        window.location.href = '/';
      } catch (error) {
        console.error('Token exchange error:', error);
        window.location.href = '/auth?error=callback';
      }
    },
  });
} 