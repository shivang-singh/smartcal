import Link from "next/link"
import { format } from "date-fns"
import { ChevronRight } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

// Sample events data - would be fetched from Google Calendar API in production
const upcomingEvents = [
  {
    id: "3",
    title: "Product Review",
    date: new Date(2025, 2, 11, 11, 0),
    description: "Review the latest product features with the design team.",
    duration: 45,
  },
  {
    id: "4",
    title: "Marketing Strategy",
    date: new Date(2025, 2, 12, 13, 30),
    description: "Discuss Q2 marketing strategy and campaign planning.",
    duration: 90,
  },
  {
    id: "5",
    title: "1:1 with Manager",
    date: new Date(2025, 2, 13, 15, 0),
    description: "Weekly check-in to discuss progress and blockers.",
    duration: 30,
  },
]

export function UpcomingEvents() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Upcoming Events</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {upcomingEvents.map((event) => (
          <div key={event.id} className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                {format(event.date, "EEEE, MMMM d")} at {format(event.date, "h:mm a")}
              </div>
              <Button variant="ghost" size="sm" className="gap-1" asChild>
                <Link href={`/events/${event.id}`}>
                  <span>Prepare</span>
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
            <h3 className="font-semibold">{event.title}</h3>
            <p className="text-sm text-muted-foreground">{event.description}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

