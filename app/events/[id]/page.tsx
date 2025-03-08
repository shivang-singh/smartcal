import Link from "next/link"
import { ArrowLeft, Calendar, Clock, FileText, HelpCircle, Link2, Users } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { EventSummary } from "@/components/event-summary"
import { EventResources } from "@/components/event-resources"
import { EventQuestions } from "@/components/event-questions"

// Sample event data - would be fetched from API based on ID
const event = {
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

export default function EventPage({ params }: { params: { id: string } }) {
  return (
    <div className="container py-8">
      <div className="mb-6">
        <Button variant="ghost" size="sm" className="mb-6" asChild>
          <Link href="/events">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to events
          </Link>
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
          <Tabs defaultValue="summary">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="summary">Summary</TabsTrigger>
              <TabsTrigger value="resources">Resources</TabsTrigger>
              <TabsTrigger value="questions">Questions</TabsTrigger>
            </TabsList>
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
                <p className="text-sm text-muted-foreground">{event.description}</p>
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
              <CardDescription>Prepare for this event</CardDescription>
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

