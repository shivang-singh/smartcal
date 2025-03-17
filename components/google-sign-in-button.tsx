"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { initializeGoogleClient } from "@/lib/google-auth"
import { useToast } from "@/components/ui/use-toast"

export function GoogleSignInButton() {
  const [isLoading, setIsLoading] = useState(false)
  const [tokenClient, setTokenClient] = useState<any>(null)
  const { toast } = useToast()

  useEffect(() => {
    let mounted = true;
    let scriptLoadRetries = 0;
    const maxRetries = 3;

    const init = async () => {
      try {
        await initializeGoogleClient();
        if (mounted && (window as any).google) {
          setTokenClient((window as any).google.accounts.oauth2.initTokenClient({
            client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
            scope: [
              'https://www.googleapis.com/auth/calendar.readonly',
              'https://www.googleapis.com/auth/calendar.events.readonly',
              'openid',
              'profile',
              'email'
            ].join(' '),
            callback: handleOAuthCallback,
            prompt: 'consent',
            ux_mode: 'popup',
          }));
        } else if (mounted && scriptLoadRetries < maxRetries) {
          scriptLoadRetries++;
          console.log(`Google API not available yet, retrying... (${scriptLoadRetries}/${maxRetries})`);
          setTimeout(init, 1000);
        }
      } catch (error) {
        console.error('Failed to initialize Google client:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to initialize Google Sign-in. Please try again.",
        });
      }
    };

    init();

    return () => {
      mounted = false;
    };
  }, [toast]);

  const handleOAuthCallback = async (response: any) => {
    if (response.error) {
      console.error('Google OAuth error:', response.error);
      toast({
        variant: "destructive",
        title: "Authentication Error",
        description: "Failed to sign in with Google. Please try again.",
      });
      return;
    }

    console.log('Received OAuth response:', { 
      accessToken: response.access_token ? 'present' : 'missing',
      hasError: !!response.error
    });

    setIsLoading(true);

    try {
      console.log('Sending token to backend...');
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ 
          access_token: response.access_token,
          scope: response.scope
        }),
      });

      console.log('Response status:', res.status);
      console.log('Response headers:', Object.fromEntries([...res.headers.entries()]));
      
      // Get the text response first to handle HTML errors
      const textResponse = await res.text();
      console.log('Response text (first 100 chars):', textResponse.substring(0, 100));
      
      let data;
      
      try {
        // Try to parse as JSON
        data = JSON.parse(textResponse);
        console.log('Parsed JSON data:', data);
      } catch (err) {
        // If it's not valid JSON, it might be an HTML error page
        console.error('Response is not valid JSON:', textResponse.substring(0, 100) + '...');
        throw new Error('Server returned an invalid response. Please try again.');
      }

      if (!res.ok) {
        throw new Error(data.error || 'Failed to authenticate');
      }

      toast({
        title: "Success",
        description: "Successfully connected to Google Calendar!",
      });

      // Redirect to dashboard after successful login
      window.location.href = '/dashboard';
    } catch (error) {
      console.error('Authentication error:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to connect to Google Calendar. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    if (!tokenClient) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Google Sign-in is not ready. Please try again in a moment.",
      });
      return;
    }
    tokenClient.requestAccessToken();
  }

  return (
    <Button 
      variant="outline" 
      className="w-full" 
      onClick={handleGoogleSignIn}
      disabled={isLoading || !tokenClient}
    >
      <svg
        className="mr-2 h-4 w-4"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 48 48"
        width="48px"
        height="48px"
      >
        <path
          fill="#FFC107"
          d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"
        />
        <path
          fill="#FF3D00"
          d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"
        />
        <path
          fill="#4CAF50"
          d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"
        />
        <path
          fill="#1976D2"
          d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"
        />
      </svg>
      {isLoading ? "Signing in..." : "Sign in with Google"}
    </Button>
  )
} 