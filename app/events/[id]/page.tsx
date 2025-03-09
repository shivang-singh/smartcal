"use client"

import { useState, useEffect, use } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, Calendar, Clock, FileText, HelpCircle, Link2, Users } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { EventSummary } from "@/components/event-summary"
import { EventResources } from "@/components/event-resources"
import { EventQuestions } from "@/components/event-questions"
import { EventPreparation } from "@/components/event-preparation"
import { useToast } from "@/components/ui/use-toast"
import { formatEventDescription } from "@/lib/utils"

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
          
          setEvent(data);
          setUsingSampleData(false);
        } else {
          // If there's an error, use sample data but show a toast
          console.error('Error fetching event, using sample data');
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
        // Fallback to sample data
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
                <div className="text-sm text-muted-foreground whitespace-pre-wrap space-y-1">
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
              <div>
                <h3 className="font-medium">Location</h3>
                <p className="text-sm text-muted-foreground">{event.location}</p>
              </div>
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

