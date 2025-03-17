"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Calendar, Globe, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/context/auth-context";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useSearchParams } from "next/navigation";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useTheme } from "next-themes";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";

type CalendarConnection = {
  provider: string;
  created_at: string;
};

type SyncPreferences = {
  syncPastEvents: number;
  syncFutureEvents: number;
  syncFrequency: number;
  includeDeclined: boolean;
  includeHolidays: boolean;
};

type AIPreferences = {
  prepTime: number; // hours before meeting
  generateSummary: boolean;
  generateAgenda: boolean;
  generateActionItems: boolean;
  maxTokens: number;
};

type NotificationPreferences = {
  emailNotifications: boolean;
  emailFrequency: 'instant' | 'daily' | 'weekly';
  emailDigestTime?: string;
  notifyBeforeMeeting: boolean;
  notifyBeforeTime: number; // minutes
};

export default function SettingsPage() {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [connections, setConnections] = useState<CalendarConnection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const searchParams = useSearchParams();
  const [syncPrefs, setSyncPrefs] = useState<SyncPreferences>({
    syncPastEvents: 6,
    syncFutureEvents: 12,
    syncFrequency: 5,
    includeDeclined: false,
    includeHolidays: true,
  });
  const [aiPrefs, setAIPrefs] = useState<AIPreferences>({
    prepTime: 24,
    generateSummary: true,
    generateAgenda: true,
    generateActionItems: true,
    maxTokens: 2000,
  });
  const [notifPrefs, setNotifPrefs] = useState<NotificationPreferences>({
    emailNotifications: true,
    emailFrequency: 'daily',
    emailDigestTime: '09:00',
    notifyBeforeMeeting: true,
    notifyBeforeTime: 30,
  });

  useEffect(() => {
    // Handle OAuth callback status
    const error = searchParams.get('error');
    const success = searchParams.get('success');

    if (error) {
      const errorMessages: Record<string, string> = {
        invalid_state: 'Invalid state parameter. Please try again.',
        oauth_failed: 'Failed to connect to Google Calendar.',
        token_exchange_failed: 'Failed to exchange authorization code.',
        token_storage_failed: 'Failed to store calendar connection.',
        unknown: 'An unknown error occurred.',
      };
      toast.error(errorMessages[error] || 'Failed to connect calendar');
    } else if (success) {
      toast.success('Successfully connected Google Calendar!');
    }
  }, [searchParams]);

  useEffect(() => {
    const fetchConnections = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/calendar/connections');
        
        if (!response.ok) {
          throw new Error('Failed to fetch calendar connections');
        }

        const data = await response.json();
        setConnections(data.connections || []);
      } catch (error) {
        console.error('Error fetching calendar connections:', error);
        toast.error('Failed to load calendar connections');
      } finally {
        setIsLoading(false);
      }
    };

    fetchConnections();
  }, []);

  const handleConnectGoogle = async () => {
    try {
      setIsConnecting(true);
      console.log('Initiating Google Calendar connection...');
      
      const response = await fetch('/api/calendar/connect/google');
      console.log('Response status:', response.status);
      
      const data = await response.json();
      console.log('Response data:', {
        hasUrl: !!data.url,
        debug: data.debug,
        error: data.error
      });
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to start Google Calendar connection');
      }

      if (!data.url) {
        throw new Error('No OAuth URL returned from server');
      }

      // Open popup window
      const width = 500;
      const height = 600;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;
      
      const popup = window.open(
        data.url,
        'Connect Google Calendar',
        `width=${width},height=${height},left=${left},top=${top}`
      );

      if (!popup) {
        throw new Error('Popup was blocked. Please allow popups for this site.');
      }

      // Handle postMessage events from the popup
      const messageHandler = (event: MessageEvent) => {
        if (event.data.type === 'oauth_success') {
          window.removeEventListener('message', messageHandler);
          toast.success('Successfully connected Google Calendar!');
          // Refresh connections list
          window.location.reload();
        } else if (event.data.type === 'oauth_error') {
          window.removeEventListener('message', messageHandler);
          const errorMessages: Record<string, string> = {
            auth_required: 'Authentication required. Please try again.',
            invalid_state: 'Invalid state parameter. Please try again.',
            oauth_failed: 'Failed to connect to Google Calendar.',
            no_code: 'No authorization code received.',
            token_exchange_failed: 'Failed to exchange authorization code.',
            user_info_failed: 'Failed to fetch user information.',
            token_storage_failed: 'Failed to store calendar connection.',
            unknown: 'An unknown error occurred.',
          };
          toast.error(errorMessages[event.data.error] || 'Failed to connect calendar');
        }
        setIsConnecting(false);
      };

      window.addEventListener('message', messageHandler);

      // Clean up if popup is closed
      const pollInterval = setInterval(() => {
        if (popup.closed) {
          clearInterval(pollInterval);
          window.removeEventListener('message', messageHandler);
          setIsConnecting(false);
        }
      }, 1000);

    } catch (error) {
      console.error('Error connecting to Google Calendar:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to connect to Google Calendar');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnectGoogle = async () => {
    try {
      setIsDisconnecting(true);
      const response = await fetch('/api/calendar/connect/google', {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to disconnect Google Calendar');
      }

      setConnections(connections.filter(conn => conn.provider !== 'google'));
      toast.success('Successfully disconnected Google Calendar');
    } catch (error) {
      console.error('Error disconnecting Google Calendar:', error);
      toast.error('Failed to disconnect Google Calendar');
    } finally {
      setIsDisconnecting(false);
    }
  };

  const handleSyncPrefsChange = async (key: keyof SyncPreferences, value: any) => {
    setSyncPrefs(prev => ({ ...prev, [key]: value }));
    // TODO: Save to backend
    toast.success('Sync preferences updated');
  };

  const handleAIPrefsChange = async (key: keyof AIPreferences, value: any) => {
    setAIPrefs(prev => ({ ...prev, [key]: value }));
    // TODO: Save to backend
    toast.success('AI preferences updated');
  };

  const handleNotifPrefsChange = async (key: keyof NotificationPreferences, value: any) => {
    setNotifPrefs(prev => ({ ...prev, [key]: value }));
    // TODO: Save to backend
    toast.success('Notification preferences updated');
  };

  const isGoogleConnected = connections.some(conn => conn.provider === 'google');

  return (
    <div className="container py-8">
      <Button variant="ghost" size="sm" className="mb-6" asChild>
        <Link href="/dashboard">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to home
        </Link>
      </Button>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground">Manage your account settings and preferences.</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Calendar Integration</CardTitle>
              <CardDescription>Manage your connected calendars</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoading ? (
                <div className="flex items-center justify-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
                </div>
              ) : connections.length > 0 ? (
                <>
                  {connections.map((connection) => (
                    <div key={connection.provider} className="flex items-center justify-between space-x-2">
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium leading-none">
                            {connection.provider === 'google' ? 'Google Calendar' : connection.provider}
                          </p>
                          <p className="text-xs text-muted-foreground">Connected on {new Date(connection.created_at).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={handleDisconnectGoogle}
                        disabled={isDisconnecting}
                      >
                        {isDisconnecting ? 'Disconnecting...' : 'Disconnect'}
                      </Button>
                    </div>
                  ))}
                  <Separator />
                  <Button 
                    className="w-full" 
                    onClick={handleConnectGoogle}
                    disabled={isConnecting}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {isConnecting ? 'Connecting...' : 'Connect another calendar'}
                  </Button>
                </>
              ) : (
                <div className="space-y-4">
                  <div className="text-center py-4 text-muted-foreground">
                    No calendars connected
                  </div>
                  <Button 
                    className="w-full" 
                    onClick={handleConnectGoogle}
                    disabled={isConnecting}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {isConnecting ? 'Connecting...' : 'Connect Google Calendar'}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Notifications</CardTitle>
              <CardDescription>Configure how you receive notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between space-x-2">
                <div className="space-y-0.5">
                  <Label htmlFor="event-reminders">Event reminders</Label>
                  <p className="text-xs text-muted-foreground">Receive reminders before your events</p>
                </div>
                <Switch id="event-reminders" defaultChecked />
              </div>
              <div className="flex items-center justify-between space-x-2">
                <div className="space-y-0.5">
                  <Label htmlFor="prep-materials">Preparation materials</Label>
                  <p className="text-xs text-muted-foreground">Get notified when new materials are generated</p>
                </div>
                <Switch id="prep-materials" defaultChecked />
              </div>
              <div className="flex items-center justify-between space-x-2">
                <div className="space-y-0.5">
                  <Label htmlFor="email-notifications">Email notifications</Label>
                  <p className="text-xs text-muted-foreground">Receive notifications via email</p>
                </div>
                <Switch id="email-notifications" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Appearance</CardTitle>
              <CardDescription>Customize the look and feel</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Theme</Label>
                <RadioGroup defaultValue="system" className="flex gap-4">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="light" id="light" />
                    <Label htmlFor="light" className="flex items-center gap-1 font-normal">
                      <Sun className="h-4 w-4" />
                      Light
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="dark" id="dark" />
                    <Label htmlFor="dark" className="flex items-center gap-1 font-normal">
                      <Moon className="h-4 w-4" />
                      Dark
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="system" id="system" />
                    <Label htmlFor="system" className="flex items-center gap-1 font-normal">
                      <Globe className="h-4 w-4" />
                      System
                    </Label>
                  </div>
                </RadioGroup>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>AI Preferences</CardTitle>
              <CardDescription>Configure how AI generates content</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between space-x-2">
                <div className="space-y-0.5">
                  <Label htmlFor="auto-generate">Auto-generate resources</Label>
                  <p className="text-xs text-muted-foreground">Automatically generate resources for new events</p>
                </div>
                <Switch id="auto-generate" defaultChecked />
              </div>
              <div className="flex items-center justify-between space-x-2">
                <div className="space-y-0.5">
                  <Label htmlFor="detailed-summaries">Detailed summaries</Label>
                  <p className="text-xs text-muted-foreground">Generate more comprehensive event summaries</p>
                </div>
                <Switch id="detailed-summaries" />
              </div>
              <div className="flex items-center justify-between space-x-2">
                <div className="space-y-0.5">
                  <Label htmlFor="notification-timing">Preparation timing</Label>
                  <p className="text-xs text-muted-foreground">When to send preparation materials</p>
                </div>
                <select
                  id="notification-timing"
                  className="h-8 w-28 rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  defaultValue="1"
                >
                  <option value="0.5">30 minutes</option>
                  <option value="1">1 hour</option>
                  <option value="2">2 hours</option>
                  <option value="24">1 day</option>
                </select>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

