"use client"

import { useEffect, useState } from "react";
import { CalendarDays, Clock, ChevronRight, Settings, List, Calendar, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useAuth } from "@/lib/context/auth-context";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CalendarView } from "@/components/calendar-view";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Helper function to format event descriptions
const formatEventDescription = (description: string) => {
  if (!description) return 'No description available';

  // Extract Zoom link if present
  const zoomInfo = {
    link: '',
    meetingId: '',
    passcode: '',
  };

  const zoomLinkMatch = description.match(/https:\/\/[^\s<>]+?zoom\.us\/j\/[^\s<>]+/);
  if (zoomLinkMatch) {
    zoomInfo.link = zoomLinkMatch[0];
    
    // Extract meeting ID
    const meetingIdMatch = description.match(/Meeting ID: (\d+)/);
    if (meetingIdMatch) {
      zoomInfo.meetingId = meetingIdMatch[1];
    }
    
    // Extract passcode
    const passcodeMatch = description.match(/Passcode: ([^\s<>]+)/);
    if (passcodeMatch) {
      zoomInfo.passcode = passcodeMatch[1];
    }
  }

  // Clean up HTML tags and convert to plain text
  let cleanDescription = description
    .replace(/<\/?[^>]+(>|$)/g, '') // Remove HTML tags
    .replace(/&nbsp;/g, ' ') // Replace &nbsp; with space
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .replace(/\n+/g, '\n') // Replace multiple newlines with single newline
    .trim();

  // Regular expression to find URLs in text
  const urlRegex = /(https?:\/\/[^\s<>]+)/g;
  
  // If we found a Zoom link, format it nicely
  if (zoomInfo.link) {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-primary">
          <Video className="h-4 w-4" />
          <a href={zoomInfo.link} target="_blank" rel="noopener noreferrer" className="text-sm hover:underline">
            Join Zoom Meeting
          </a>
        </div>
        {cleanDescription.split('\n').map((line, i) => {
          // Replace URLs with clickable links
          const parts = line.split(urlRegex);
          if (parts.length > 1) {
            return (
              <p key={i} className="text-sm text-muted-foreground">
                {parts.map((part, j) => {
                  if (part.match(urlRegex)) {
                    return (
                      <a 
                        key={j} 
                        href={part} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-primary hover:underline"
                      >
                        {part}
                      </a>
                    );
                  }
                  return part;
                })}
              </p>
            );
          }
          return <p key={i} className="text-sm text-muted-foreground">{line}</p>;
        })}
      </div>
    );
  }

  // For non-Zoom descriptions, process each line to make URLs clickable
  return cleanDescription.split('\n').map((line, i) => {
    // Replace URLs with clickable links
    const parts = line.split(urlRegex);
    if (parts.length > 1) {
      return (
        <p key={i} className="text-sm text-muted-foreground">
          {parts.map((part, j) => {
            if (part.match(urlRegex)) {
              return (
                <a 
                  key={j} 
                  href={part} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-primary hover:underline"
                >
                  {part}
                </a>
              );
            }
            return part;
          })}
        </p>
      );
    }
    return <p key={i} className="text-sm text-muted-foreground">{line}</p>;
  });
};

type ViewMode = "agenda" | "calendar";

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const [events, setEvents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>("calendar");
  
  // Get user's timezone
  const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setIsLoading(true);
        const res = await fetch('/api/calendar/events');
        
        if (!res.ok) {
          throw new Error('Failed to fetch events');
        }
        
        const data = await res.json();
        setEvents(data.events || []);
      } catch (error) {
        console.error('Error fetching events:', error);
        toast.error('Failed to load calendar events');
      } finally {
        setIsLoading(false);
      }
    };

    fetchEvents();
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success('Signed out successfully');
    } catch (error) {
      console.error('Error signing out:', error);
      toast.error('Failed to sign out');
    }
  };

  const formatEventTime = (dateTimeStr: string | null): string => {
    if (!dateTimeStr) return '';
    
    try {
      return new Date(dateTimeStr).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
        timeZone: userTimeZone
      });
    } catch (error) {
      console.error('Error formatting event time:', error);
      return '';
    }
  };

  const formatDateHeader = (dateKey: string): string => {
    return new Date(dateKey).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      timeZone: userTimeZone
    });
  };

  // Render the agenda view
  const renderAgenda = () => {
    if (isLoading) {
      return (
        <div className="py-6 text-center text-muted-foreground">
          Loading your calendar events...
        </div>
      );
    }

    if (events.length === 0) {
      return (
        <div className="py-6 text-center text-muted-foreground">
          No upcoming events
        </div>
      );
    }

    // Filter out past events
    const now = new Date();
    const upcomingEvents = events.filter(event => {
      const eventEnd = event.end?.dateTime ? new Date(event.end.dateTime) : 
                      event.end?.date ? new Date(event.end.date) : null;
      return eventEnd ? eventEnd > now : true;
    });

    if (upcomingEvents.length === 0) {
      return (
        <div className="py-6 text-center text-muted-foreground">
          No upcoming events
        </div>
      );
    }

    // Group events by date
    const groupedEvents = upcomingEvents.reduce((groups, event) => {
      const dateKey = event.startDate;
      
      if (!groups[dateKey]) {
        groups[dateKey] = {
          allDay: [],
          timed: []
        };
      }
      
      if (event.isAllDay) {
        groups[dateKey].allDay.push(event);
      } else {
        groups[dateKey].timed.push(event);
      }
      
      return groups;
    }, {} as Record<string, { allDay: typeof events, timed: typeof events }>);

    // Sort dates
    const sortedDates = Object.keys(groupedEvents).sort((a, b) => a.localeCompare(b));

    return sortedDates.map(dateKey => {
      const dateGroup = groupedEvents[dateKey];
      
      return (
        <div key={dateKey} className="mb-4">
          <h3 className="text-sm font-medium text-muted-foreground mb-2 pb-1 border-b">
            {formatDateHeader(dateKey)}
          </h3>
          <div className="space-y-3">
            {/* Render all-day events first */}
            {dateGroup.allDay.map((event: any, index: number) => (
              <div key={`allday-${event.id || index}`} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">All day</span>
                  </div>
                  <Button variant="ghost" size="sm" className="gap-1" asChild>
                    <Link href={`/events/${event.id}`}>
                      <span>AI Prepare</span>
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
                <h3 className="font-semibold">{event.summary}</h3>
                <div className="text-sm text-muted-foreground">
                  {formatEventDescription(event.description)}
                </div>
              </div>
            ))}

            {/* Then render timed events */}
            {dateGroup.timed.map((event: any, index: number) => (
              <div key={`timed-${event.id || index}`} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">
                      {formatEventTime(event.start.dateTime)}
                      {' - '}
                      {formatEventTime(event.end.dateTime)}
                    </span>
                  </div>
                  <Button variant="ghost" size="sm" className="gap-1" asChild>
                    <Link href={`/events/${event.id}`}>
                      <span>AI Prepare</span>
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
                <h3 className="font-semibold">{event.summary}</h3>
                <div className="text-sm text-muted-foreground">
                  {formatEventDescription(event.description)}
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-6 w-6" />
            <h1 className="text-xl font-bold">SmartCal</h1>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/settings">
                <Settings className="h-5 w-5" />
              </Link>
            </Button>
            <Button variant="outline" onClick={handleSignOut}>
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="container py-8">
        {isLoading ? (
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)}>
                <TabsList>
                  <TabsTrigger value="calendar">Calendar</TabsTrigger>
                  <TabsTrigger value="agenda">Agenda</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {events.length === 0 && (
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Welcome to SmartCal!</CardTitle>
                  <CardDescription>
                    You haven't connected any calendars yet. Head over to the settings page to get started.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button asChild>
                    <Link href="/settings">
                      Connect Calendar
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            )}

            {viewMode === "calendar" ? (
              <CalendarView events={events} />
            ) : (
              <div className="space-y-4">
                {renderAgenda()}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
} 