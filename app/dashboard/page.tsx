"use client"

import { useEffect, useState } from "react";
import { CalendarDays, Clock, ChevronRight, Settings, Video } from "lucide-react";
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
        {cleanDescription.split('\n').map((line, i) => (
          <p key={i} className="text-sm text-muted-foreground">
            {line}
          </p>
        ))}
      </div>
    );
  }

  // For non-Zoom descriptions, just return the cleaned text
  return cleanDescription.split('\n').map((line, i) => (
    <p key={i} className="text-sm text-muted-foreground">
      {line}
    </p>
  ));
};

export default function Dashboard() {
  const [events, setEvents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

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
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load calendar events. Please try again.",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchEvents();
  }, [toast]);

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
              <CardHeader>
                <CardTitle>Agenda</CardTitle>
                <CardDescription>Your upcoming events by date</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {isLoading ? (
                  <div className="py-6 text-center text-muted-foreground">
                    Loading your calendar events...
                  </div>
                ) : events.length === 0 ? (
                  <div className="py-6 text-center text-muted-foreground">
                    No upcoming events
                  </div>
                ) : (
                  (() => {
                    // Group events by date
                    const groupedEvents = events.reduce((groups, event) => {
                      const dateKey = new Date(event.start.dateTime).toLocaleDateString();
                      if (!groups[dateKey]) {
                        groups[dateKey] = [];
                      }
                      groups[dateKey].push(event);
                      return groups;
                    }, {} as Record<string, typeof events>);

                    // Sort dates
                    const sortedDates = Object.keys(groupedEvents).sort(
                      (a, b) => new Date(a).getTime() - new Date(b).getTime()
                    );

                    return sortedDates.map(dateKey => (
                      <div key={dateKey} className="mb-4">
                        <h3 className="text-sm font-medium text-muted-foreground mb-2 pb-1 border-b">
                          {new Date(dateKey).toLocaleDateString(undefined, {
                            weekday: 'long',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </h3>
                        <div className="space-y-3">
                          {groupedEvents[dateKey].map((event: any, index: number) => (
                            <div key={event.id || index} className="space-y-2">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <Clock className="h-4 w-4 text-muted-foreground" />
                                  <span className="text-sm font-medium">
                                    {new Date(event.start.dateTime).toLocaleTimeString([], {
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    })}
                                    {' - '}
                                    {new Date(event.end.dateTime).toLocaleTimeString([], {
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    })}
                                  </span>
                                </div>
                                <Button variant="ghost" size="sm" className="gap-1" asChild>
                                  <Link href={`/events/${event.id}`}>
                                    <span>Prepare</span>
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
                    ));
                  })()
                )}
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/events">View all events</Link>
                </Button>
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Calendar</CardTitle>
                <CardDescription>View and manage your schedule</CardDescription>
              </CardHeader>
              <CardContent>
                <CalendarView events={events} />
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
                        <span>Prepare</span>
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