"use client"

import { useState, useEffect, use } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, Calendar, Clock, FileText, HelpCircle, Link2, Users, MapPin, Car, Edit2, Check, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { EventSummary } from "@/components/event-summary"
import { EventResources } from "@/components/event-resources"
import { EventQuestions } from "@/components/event-questions"
import { EventPreparation } from "@/components/event-preparation"
import { useToast } from "@/components/ui/use-toast"
import { formatEventDescription } from "@/lib/utils"
import { cn } from "@/lib/utils"
import { calculateCommute, CommuteInfo } from "@/lib/utils/commute"
import { Input } from "@/components/ui/input"

// Import the Skeleton component directly
function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`animate-pulse rounded-md bg-muted ${className}`}
      {...props}
    />
  )
}

// Sample event data as fallback
const sampleEvent = {
  id: "2",
  title: "Client Presentation",
  date: "March 10, 2025",
  time: "2:00 PM - 3:00 PM",
  description: "Present the new product features to the client.",
  location: "Conference Room A",
  attendees: ["John Smith", "Sarah Johnson", "Michael Brown", "Emily Davis"],
  summary: `
    This is a critical presentation to showcase our new product features to the client. 
    The client is particularly interested in the dashboard improvements and reporting capabilities.
    They've expressed concerns about the user interface in the past, so we should focus on the UX improvements.
    The goal is to get their approval to move forward with the development phase.
  `,
  resources: [
    {
      title: "Product Roadmap Document",
      url: "#",
      type: "document",
    },
    {
      title: "Previous Meeting Notes",
      url: "#",
      type: "notes",
    },
    {
      title: "UI/UX Design Mockups",
      url: "#",
      type: "design",
    },
    {
      title: "Client Requirements Specification",
      url: "#",
      type: "document",
    },
  ],
  questions: [
    "What specific concerns did the client have about the previous UI design?",
    "How does the new reporting feature address their business needs?",
    "What is the timeline for implementation after approval?",
    "Are there any budget considerations we should be prepared to discuss?",
    "Which stakeholders will be making the final decision?",
  ],
}

// Event type color mapping
const EVENT_TYPE_STYLES = {
  meeting: "bg-blue-50 border-l-4 border-blue-500",
  presentation: "bg-purple-50 border-l-4 border-purple-500",
  interview: "bg-green-50 border-l-4 border-green-500",
  workshop: "bg-orange-50 border-l-4 border-orange-500",
  conference: "bg-indigo-50 border-l-4 border-indigo-500",
  client: "bg-red-50 border-l-4 border-red-500",
  team: "bg-teal-50 border-l-4 border-teal-500",
  "1on1": "bg-pink-50 border-l-4 border-pink-500",
  fitness: "bg-lime-50 border-l-4 border-lime-500",
} as const;

// Helper function to guess event type from title and description
const guessEventType = (title: string, description: string): keyof typeof EVENT_TYPE_STYLES => {
  const text = `${title} ${description}`.toLowerCase();
  
  if (text.includes('interview')) return 'interview';
  if (text.includes('workshop')) return 'workshop';
  if (text.includes('conference')) return 'conference';
  if (text.includes('client')) return 'client';
  if (text.includes('1:1') || text.includes('1on1')) return '1on1';
  if (text.includes('team')) return 'team';
  if (text.includes('presentation')) return 'presentation';
  
  return 'meeting'; // default
};

// Add CommuteEstimate component
function CommuteEstimate({ location, eventDate, eventTime }: { 
  location: string;
  eventDate: string;
  eventTime: string;
}) {
  const [commuteInfo, setCommuteInfo] = useState<CommuteInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [origin, setOrigin] = useState<string>('');
  const [isEditingOrigin, setIsEditingOrigin] = useState(false);
  const [tempOrigin, setTempOrigin] = useState<string>('');

  // Get user's location on component mount
  useEffect(() => {
    const getUserLocation = () => {
      // Try to get from localStorage first
      const savedOrigin = localStorage.getItem('userLocation');
      if (savedOrigin) {
        setOrigin(savedOrigin);
        return;
      }

      // If no saved location, try to get current location
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            try {
              const response = await fetch(
                `https://maps.googleapis.com/maps/api/geocode/json?latlng=${position.coords.latitude},${position.coords.longitude}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`
              );
              const data = await response.json();
              if (data.results?.[0]?.formatted_address) {
                const address = data.results[0].formatted_address;
                setOrigin(address);
                localStorage.setItem('userLocation', address);
              } else {
                setOrigin('San Francisco, CA'); // Fallback
                localStorage.setItem('userLocation', 'San Francisco, CA');
              }
            } catch (error) {
              console.error('Error getting location address:', error);
              setOrigin('San Francisco, CA'); // Fallback
              localStorage.setItem('userLocation', 'San Francisco, CA');
            }
          },
          (error) => {
            console.error('Error getting location:', error);
            setOrigin('San Francisco, CA'); // Fallback
            localStorage.setItem('userLocation', 'San Francisco, CA');
          }
        );
      } else {
        setOrigin('San Francisco, CA'); // Fallback
        localStorage.setItem('userLocation', 'San Francisco, CA');
      }
    };

    getUserLocation();
  }, []);

  useEffect(() => {
    let isMounted = true;

    const fetchCommuteInfo = async () => {
      console.log('Starting commute calculation for:', { location, eventDate, eventTime, origin });
      
      if (!location || !origin) {
        console.log('No location or origin provided, skipping commute calculation');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        // Ensure we're properly awaiting the calculation
        const info = await calculateCommute(
          location,
          origin,
          eventDate,
          eventTime
        );

        console.log('Commute calculation completed:', info);

        // Only update state if component is still mounted
        if (isMounted) {
          if (!info || Object.keys(info).length === 0) {
            console.log('No commute info returned, possibly missing API key or API not enabled');
            setError('Unable to calculate commute time. Please check API configuration.');
          } else {
            setCommuteInfo(info);
          }
        }
      } catch (err) {
        console.error('Detailed commute calculation error:', err);
        // Only update state if component is still mounted
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Failed to calculate commute time');
        }
      } finally {
        // Only update state if component is still mounted
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    if (origin) {
      fetchCommuteInfo();
    }

    // Cleanup function to prevent setting state on unmounted component
    return () => {
      isMounted = false;
    };
  }, [location, eventDate, eventTime, origin]);

  const handleEditOrigin = () => {
    setTempOrigin(origin);
    setIsEditingOrigin(true);
  };

  const handleSaveOrigin = () => {
    if (tempOrigin.trim()) {
      setOrigin(tempOrigin.trim());
      localStorage.setItem('userLocation', tempOrigin.trim());
      setIsEditingOrigin(false);
    }
  };

  const handleCancelEdit = () => {
    setTempOrigin(origin);
    setIsEditingOrigin(false);
  };

  // Early return if no location
  if (!location) {
    return null;
  }
  
  return (
    <div className="mt-2 space-y-1 border-t border-gray-100 pt-2">
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm text-muted-foreground flex items-center gap-2">
          Starting Location:
          {isEditingOrigin ? (
            <div className="flex items-center gap-2 flex-1">
              <Input
                value={tempOrigin}
                onChange={(e) => setTempOrigin(e.target.value)}
                placeholder="Enter your starting location"
                className="h-8 w-64"
              />
              <Button
                size="sm"
                variant="ghost"
                onClick={handleSaveOrigin}
                className="h-8 w-8 p-0"
              >
                <Check className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleCancelEdit}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <>
              <span>{origin}</span>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleEditOrigin}
                className="h-8 w-8 p-0"
              >
                <Edit2 className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="text-sm text-muted-foreground flex items-center gap-2">
          <Car className="h-4 w-4 animate-pulse" />
          <span>Calculating commute times...</span>
        </div>
      ) : error ? (
        <div className="text-sm text-red-500 flex items-center gap-2">
          <Car className="h-4 w-4" />
          <span>{error}</span>
        </div>
      ) : commuteInfo?.transitOptions ? (
        <div className="space-y-2">
          <div className="space-y-1">
            {commuteInfo.transitOptions.map((option, index) => (
              <div key={index} className="text-sm text-muted-foreground flex items-center gap-2 pl-1">
                <Car className="h-4 w-4 flex-shrink-0" />
                <span>{option}</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-sm text-muted-foreground">
          No commute information available
        </div>
      )}
    </div>
  );
}

export default function EventPage({ params }: { params: Promise<{ id: string }> }) {
  // Unwrap the params Promise
  const resolvedParams = use(params);
  const eventId = resolvedParams.id;
  
  const router = useRouter();
  const [event, setEvent] = useState<typeof sampleEvent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [usingSampleData, setUsingSampleData] = useState(false);
  const { toast } = useToast();

  // Function to handle going back
  const handleGoBack = () => {
    router.back();
  };

  // Fetch event data
  useEffect(() => {
    const fetchEvent = async () => {
      setIsLoading(true);
      try {
        // Try to fetch the real event data
        const response = await fetch(`/api/events/${eventId}`);
        
        if (response.ok) {
          const data = await response.json();
          
          // Add empty arrays for resources and questions if they don't exist
          if (!data.resources) data.resources = [];
          if (!data.questions) data.questions = [];
          
          // Log the event data
          console.log('Fetched event data:', {
            title: data.title,
            date: data.date,
            time: data.time,
            location: data.location
          });
          
          setEvent(data);
          setUsingSampleData(false);
        } else {
          // If there's an error, use sample data but show a toast
          console.error('Error fetching event, using sample data');
          console.log('Sample event data:', {
            title: sampleEvent.title,
            date: sampleEvent.date,
            time: sampleEvent.time,
            location: sampleEvent.location
          });
          
          setEvent(sampleEvent);
          setUsingSampleData(true);
          
          toast({
            title: "Using sample data",
            description: "Could not fetch the real event data. Using sample data instead.",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error('Error fetching event:', error);
        setEvent(sampleEvent);
        setUsingSampleData(true);
        
        toast({
          title: "Using sample data",
          description: "Could not fetch the real event data. Using sample data instead.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchEvent();
  }, [eventId, toast]);

  if (isLoading) {
    return (
      <div className="container py-8">
        <div className="mb-6">
          <Button variant="ghost" size="sm" className="mb-6" onClick={handleGoBack}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <Skeleton className="h-10 w-2/3" />
          <div className="mt-2 flex flex-wrap gap-4">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-6 w-32" />
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <div className="md:col-span-2">
            <Skeleton className="h-10 w-full mb-6" />
            <Skeleton className="h-64 w-full" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="container py-8">
        <div className="mb-6">
          <Button variant="ghost" size="sm" className="mb-6" onClick={handleGoBack}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <h1 className="text-3xl font-bold">Event not found</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8">
      {usingSampleData && (
        <div className="bg-yellow-100 border-l-4 border-yellow-500 p-4 mb-6">
          <p className="text-yellow-700">
            <strong>Note:</strong> Using sample data. The AI preparation will not be based on your actual event.
          </p>
        </div>
      )}
      
      <div className="mb-6">
        <Button variant="ghost" size="sm" className="mb-6" onClick={handleGoBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <h1 className="text-3xl font-bold">{event.title}</h1>
        <div className="mt-2 flex flex-wrap gap-4 text-muted-foreground">
          <div className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            <span>{event.date}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            <span>{event.time}</span>
          </div>
          <div className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            <span>{event.attendees.length} attendees</span>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2">
          <Tabs defaultValue="preparation">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="preparation">Preparation</TabsTrigger>
              <TabsTrigger value="summary">Summary</TabsTrigger>
              <TabsTrigger value="resources">Resources</TabsTrigger>
              <TabsTrigger value="questions">Questions</TabsTrigger>
            </TabsList>
            <TabsContent value="preparation" className="mt-6">
              <EventPreparation event={event} />
            </TabsContent>
            <TabsContent value="summary" className="mt-6">
              <EventSummary event={event} />
            </TabsContent>
            <TabsContent value="resources" className="mt-6">
              <EventResources resources={event.resources} />
            </TabsContent>
            <TabsContent value="questions" className="mt-6">
              <EventQuestions questions={event.questions} />
            </TabsContent>
          </Tabs>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Event Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-medium">Description</h3>
                <div className={cn(
                  "text-sm text-muted-foreground whitespace-pre-wrap space-y-1 rounded-md p-4",
                  EVENT_TYPE_STYLES[guessEventType(event.title, event.description)]
                )}>
                  {formatEventDescription(event.description)
                    .split('\n')
                    .map((line, i) => {
                      // Convert markdown-style links to clickable links
                      const parts = line.split(/(\[[^\]]*\]\([^)]*\))/g);
                      return (
                        <p key={i}>
                          {parts.map((part, j) => {
                            const linkMatch = part.match(/\[([^\]]*)\]\(([^)]*)\)/);
                            if (linkMatch) {
                              const [, text, url] = linkMatch;
                              return (
                                <a
                                  key={j}
                                  href={url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-primary hover:underline"
                                >
                                  {text}
                                </a>
                              );
                            }
                            return part;
                          })}
                        </p>
                      );
                    })}
                </div>
              </div>
              {event.location && (
                <div>
                  <h3 className="font-medium">Location</h3>
                  <div className="mt-1">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4 flex-shrink-0" />
                      <a 
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.location)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-primary hover:underline"
                      >
                        {event.location}
                      </a>
                    </div>
                    <CommuteEstimate 
                      location={event.location}
                      eventDate={event.date}
                      eventTime={event.time}
                    />
                  </div>
                </div>
              )}
              <div>
                <h3 className="font-medium">Attendees</h3>
                <ul className="mt-1 space-y-1">
                  {event.attendees.map((attendee) => (
                    <li key={attendee} className="text-sm text-muted-foreground">
                      {attendee}
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
              <CardDescription>Additional tools for this event</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button className="w-full justify-start" variant="outline">
                <FileText className="mr-2 h-4 w-4" />
                Generate meeting notes template
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <Link2 className="mr-2 h-4 w-4" />
                Add custom resource
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <HelpCircle className="mr-2 h-4 w-4" />
                Generate more questions
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

