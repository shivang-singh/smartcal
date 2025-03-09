"use client"

import { useEffect, useState } from "react";
import { CalendarDays, Clock, ChevronRight, Settings, List, Calendar, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { LogoutButton } from "@/components/logout-button";
import { useToast } from "@/components/ui/use-toast";
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
  const [events, setEvents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>("calendar");
  const { toast } = useToast();
  
  // Get user's timezone
  const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setIsLoading(true);
        const res = await fetch('/api/calendar/events');
        
        if (!res.ok) {
          const errorData = await res.json();
          console.error('Calendar API error:', errorData);
          throw new Error(errorData.error || 'Failed to fetch events');
        }
        
        const data = await res.json();
        console.log('Raw calendar events:', data);
        
        if (!data.events || !Array.isArray(data.events)) {
          console.error('Invalid events data:', data);
          throw new Error('Invalid events data received');
        }

        // Transform events to match CalendarEventProps format
        const transformedEvents = data.events.map((event: any) => {
          // Log the raw event for debugging
          console.log('Processing raw event:', {
            ...event,
            userTimeZone,
            originalTimeZone: event.timeZone
          });

          // For all-day events, use the date directly
          if (event.isAllDay) {
            return {
              id: event.id,
              summary: event.title,
              title: event.title,
              description: event.description || '',
              start: {
                dateTime: null,
                date: event.start,
                timeZone: userTimeZone
              },
              end: {
                dateTime: null,
                date: event.end,
                timeZone: userTimeZone
              },
              isAllDay: true,
              allDay: true,
              eventType: event.eventType || 'default',
              calendarColor: event.calendarColor || '#4285F4',
              calendarSummary: event.calendarSummary || 'Calendar',
              startDate: event.start // Used for grouping
            };
          }

          // For timed events, convert to user's timezone
          const eventStart = new Date(event.start);
          const eventEnd = new Date(event.end);

          // Convert to user's timezone and format as ISO string
          const userTzStart = new Date(eventStart.toLocaleString('en-US', { timeZone: userTimeZone }));
          const userTzEnd = new Date(eventEnd.toLocaleString('en-US', { timeZone: userTimeZone }));

          // Get the date key in user's timezone
          const dateKey = userTzStart.toLocaleDateString('en-CA');

          const transformedEvent = {
            id: event.id,
            summary: event.title,
            title: event.title,
            description: event.description || '',
            start: {
              dateTime: userTzStart.toISOString(),
              date: null,
              timeZone: userTimeZone
            },
            end: {
              dateTime: userTzEnd.toISOString(),
              date: null,
              timeZone: userTimeZone
            },
            isAllDay: false,
            allDay: false,
            eventType: event.eventType || 'default',
            calendarColor: event.calendarColor || '#4285F4',
            calendarSummary: event.calendarSummary || 'Calendar',
            startDate: dateKey, // Used for grouping
            originalTimeZone: event.timeZone // Keep original timezone for reference
          };

          // Log the transformed event for debugging
          console.log('Transformed event:', {
            ...transformedEvent,
            originalStart: event.start,
            convertedStart: userTzStart.toISOString()
          });

          return transformedEvent;
        });

        // Sort events by start time within each day
        const sortedEvents = transformedEvents.sort((a: any, b: any) => {
          if (a.startDate !== b.startDate) {
            return a.startDate.localeCompare(b.startDate);
          }
          if (a.isAllDay && !b.isAllDay) return -1;
          if (!a.isAllDay && b.isAllDay) return 1;
          return new Date(a.start.dateTime || a.start.date).getTime() - 
                 new Date(b.start.dateTime || b.start.date).getTime();
        });

        console.log('All transformed events:', sortedEvents);
        setEvents(sortedEvents);
      } catch (error) {
        console.error('Error fetching events:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to load calendar events. Please try again.",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchEvents();
  }, [toast, userTimeZone]);

  // Helper function to format event time
  const formatEventTime = (dateTimeStr: string | null, timeZone: string): string => {
    if (!dateTimeStr) return '';
    
    try {
      // Always format in user's timezone
      return new Date(dateTimeStr).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
        timeZone: userTimeZone
      });
    } catch (error) {
      console.error('Error formatting time:', error);
      return '';
    }
  };

  // Helper function to format date header
  const formatDateHeader = (dateKey: string): string => {
    const [year, month, day] = dateKey.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    
    return date.toLocaleDateString('en-US', {
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

    // Group events by date
    const groupedEvents = events.reduce((groups, event) => {
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
                      {formatEventTime(event.start.dateTime, event.start.timeZone)}
                      {' - '}
                      {formatEventTime(event.end.dateTime, event.end.timeZone)}
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
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between py-4">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-6 w-6" />
            <h1 className="text-xl font-bold">SmartCal</h1>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" asChild>
              <Link href="/settings">
                <Settings className="h-4 w-4" />
                <span className="sr-only">Settings</span>
              </Link>
            </Button>
            <LogoutButton />
          </div>
        </div>
      </header>
      <main className="flex-1">
        <section className="container py-8">
          <div className="space-y-6">
            <div>
              <h2 className="text-3xl font-bold tracking-tight">Your Calendar</h2>
              <p className="text-muted-foreground">
                View and prepare for your upcoming events
              </p>
            </div>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div>
                  <CardTitle>Schedule</CardTitle>
                  <CardDescription>Your upcoming events and calendar</CardDescription>
                </div>
                <div className="flex items-center space-x-2">
                  <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)} className="w-[400px]">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="agenda" className="flex items-center gap-2">
                        <List className="h-4 w-4" />
                        Agenda
                      </TabsTrigger>
                      <TabsTrigger value="calendar" className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Calendar
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                {viewMode === "agenda" ? (
                  <div className="space-y-4">
                    {renderAgenda()}
                  </div>
                ) : (
                  <CalendarView events={events} />
                )}
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/calendar">Full Calendar View</Link>
                </Button>
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Coming Up Next</CardTitle>
                <CardDescription>Your events for the upcoming days</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Tomorrow, 9:00 AM</span>
                    </div>
                    <Button variant="ghost" size="sm" className="gap-1" asChild>
                      <Link href="/events/3">
                        <span>AI Prepare</span>
                        <ChevronRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                  <h3 className="font-semibold">Product Strategy Review</h3>
                  <p className="text-sm text-muted-foreground">
                    Quarterly review of product roadmap and strategy.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>
      <footer className="border-t py-6">
        <div className="container flex flex-col items-center justify-between gap-4 md:flex-row">
          <p className="text-center text-sm text-muted-foreground md:text-left">
            &copy; {new Date().getFullYear()} SmartCal. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
} 