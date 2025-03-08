"use client"

import { useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { 
  addDays, 
  format, 
  startOfWeek, 
  endOfWeek,
  startOfMonth,
  endOfMonth,
  addWeeks, 
  subWeeks,
  addMonths,
  subMonths,
  isSameDay,
  isSameMonth,
  getDay,
  getDaysInMonth,
  getDate,
  parseISO,
  getHours,
  getMinutes
} from "date-fns"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

// Sample events data as fallback if no events are provided
const sampleEvents = [
  {
    id: "1",
    title: "Weekly Team Meeting",
    date: new Date(2024, 2, 10, 10, 0),
    duration: 60,
  },
  {
    id: "2",
    title: "Client Presentation",
    date: new Date(2024, 2, 10, 14, 0),
    duration: 60,
  },
  {
    id: "3",
    title: "Product Review",
    date: new Date(2024, 2, 11, 11, 0),
    duration: 45,
  },
  {
    id: "4",
    title: "Marketing Strategy",
    date: new Date(2024, 2, 12, 13, 30),
    duration: 90,
  },
  {
    id: "5",
    title: "1:1 with Manager",
    date: new Date(2024, 2, 13, 15, 0),
    duration: 30,
  },
]

type CalendarView = "month" | "week" | "day"

type CalendarEventProps = {
  id?: string
  summary?: string
  title?: string
  description?: string
  start?: {
    dateTime: string
    timeZone?: string
  }
  end?: {
    dateTime: string
    timeZone?: string
  }
  date?: Date
  duration?: number
}

type CalendarViewProps = {
  events?: CalendarEventProps[]
}

// Helper to normalize events from different formats
const normalizeEvent = (event: CalendarEventProps) => {
  return {
    id: event.id || String(Math.random()),
    title: event.summary || event.title || "Untitled Event",
    date: event.start?.dateTime ? new Date(event.start.dateTime) : event.date || new Date(),
    duration: event.duration || 
      (event.end?.dateTime && event.start?.dateTime ? 
        (new Date(event.end.dateTime).getTime() - new Date(event.start.dateTime).getTime()) / (1000 * 60) : 60)
  }
}

export function CalendarView({ events = [] }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [view, setView] = useState<CalendarView>("week")

  const today = new Date()
  
  // Normalize events from Google Calendar API format
  const normalizedEvents = events.length > 0 ? 
    events.map(normalizeEvent) : 
    sampleEvents

  // Navigation functions
  const next = () => {
    if (view === "month") {
      setCurrentDate(addMonths(currentDate, 1))
    } else if (view === "week") {
      setCurrentDate(addWeeks(currentDate, 1))
    } else {
      setCurrentDate(addDays(currentDate, 1))
    }
  }

  const prev = () => {
    if (view === "month") {
      setCurrentDate(subMonths(currentDate, 1))
    } else if (view === "week") {
      setCurrentDate(subWeeks(currentDate, 1))
    } else {
      setCurrentDate(addDays(currentDate, -1))
    }
  }

  const goToToday = () => setCurrentDate(new Date())

  // Event helpers
  const getEventsForDay = (date: Date) => {
    return normalizedEvents.filter((event) => isSameDay(event.date, date))
  }

  // Render functions for different views
  const renderMonthView = () => {
    const monthStart = startOfMonth(currentDate)
    const monthEnd = endOfMonth(currentDate)
    const startDate = startOfWeek(monthStart, { weekStartsOn: 0 })
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 })
    
    const rows = []
    let days = []
    let day = startDate
    const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

    // Render week day headers
    const dayHeaders = (
      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekDays.map((dayName) => (
          <div key={dayName} className="text-center py-2 text-sm font-medium">
            {dayName}
          </div>
        ))}
      </div>
    )

    // Create calendar grid
    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        const cloneDay = day
        const dayEvents = getEventsForDay(cloneDay)
        
        days.push(
          <div 
            key={day.toString()} 
            className={`min-h-[100px] p-1 border border-muted ${
              !isSameMonth(day, monthStart)
                ? "bg-muted/30 text-muted-foreground"
                : isSameDay(day, today)
                ? "bg-primary/10 border-primary"
                : ""
            }`}
          >
            <div className="text-right">
              <span className={`inline-block rounded-full h-7 w-7 leading-7 text-center text-sm
                ${isSameDay(day, today) ? "bg-primary text-primary-foreground" : ""}
              `}>
                {getDate(day)}
              </span>
            </div>
            <div className="mt-1 space-y-1 max-h-[70px] overflow-y-auto">
              {dayEvents.slice(0, 3).map((event) => (
                <div 
                  key={event.id}
                  className="text-xs p-1 truncate rounded bg-primary/20 border-l-2 border-primary"
                >
                  {format(event.date, "h:mm a")} {event.title}
                </div>
              ))}
              {dayEvents.length > 3 && (
                <div className="text-xs text-muted-foreground text-center">
                  +{dayEvents.length - 3} more
                </div>
              )}
            </div>
          </div>
        )
        day = addDays(day, 1)
      }
      rows.push(
        <div key={day.toString()} className="grid grid-cols-7 gap-1">
          {days}
        </div>
      )
      days = []
    }

    return (
      <div>
        {dayHeaders}
        <div className="space-y-1">{rows}</div>
      </div>
    )
  }

  const renderWeekView = () => {
    const startDate = startOfWeek(currentDate, { weekStartsOn: 0 })
    const weekDays = Array.from({ length: 7 }).map((_, i) => addDays(startDate, i))

    return (
      <div>
        <div className="grid grid-cols-7 gap-1">
          {weekDays.map((day) => (
            <div key={day.toString()} className="text-center">
              <div className="mb-1 text-xs font-medium">{format(day, "EEE")}</div>
              <div
                className={`rounded-full h-8 w-8 flex items-center justify-center mx-auto text-sm ${
                  isSameDay(day, today) ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                }`}
              >
                {format(day, "d")}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 space-y-1">
          {weekDays.map((day) => {
            const dayEvents = getEventsForDay(day)
            if (dayEvents.length === 0) return null

            return (
              <div key={day.toString()} className="rounded-md p-2 hover:bg-muted">
                <div className="font-medium text-sm">{format(day, "EEEE, MMMM d")}</div>
                <div className="space-y-1 mt-1">
                  {dayEvents.map((event) => (
                    <div key={event.id} className="text-sm pl-2 border-l-2 border-primary">
                      <div className="flex justify-between">
                        <span>{event.title}</span>
                        <span className="text-muted-foreground">{format(event.date, "h:mm a")}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  const renderDayView = () => {
    const hours = Array.from({ length: 24 }).map((_, i) => i)
    const dayEvents = getEventsForDay(currentDate)
    
    const getEventPosition = (event: typeof normalizedEvents[0]) => {
      const hour = getHours(event.date)
      const minute = getMinutes(event.date)
      return {
        hour,
        minute,
        top: `${hour * 60 + minute}px`,
        height: `${event.duration}px`
      }
    }

    return (
      <div className="mt-2">
        <div className="font-medium">{format(currentDate, "EEEE, MMMM d, yyyy")}</div>
        <div className="mt-4 relative">
          {hours.map((hour) => (
            <div key={hour} className="flex border-t border-muted h-[60px]">
              <div className="w-16 text-xs text-muted-foreground -mt-2.5">
                {hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`}
              </div>
              <div className="flex-1"></div>
            </div>
          ))}
          
          {/* Events */}
          <div className="absolute inset-0 ml-16">
            {dayEvents.map((event) => {
              const { top, height } = getEventPosition(event)
              return (
                <div
                  key={event.id}
                  className="absolute left-0 right-2 bg-primary/15 border-l-2 border-primary rounded p-1 overflow-hidden"
                  style={{
                    top,
                    height,
                  }}
                >
                  <div className="text-xs font-medium">{event.title}</div>
                  <div className="text-xs text-muted-foreground">
                    {format(event.date, "h:mm a")} ({event.duration} min)
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  // Title formatting based on view
  const getHeaderTitle = () => {
    if (view === "month") {
      return format(currentDate, "MMMM yyyy")
    } else if (view === "week") {
      const start = startOfWeek(currentDate, { weekStartsOn: 0 })
      const end = endOfWeek(currentDate, { weekStartsOn: 0 })
      return `${format(start, "MMM d")} - ${format(end, "MMM d, yyyy")}`
    } else {
      return format(currentDate, "MMMM d, yyyy")
    }
  }

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle>Calendar</CardTitle>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={goToToday}>
            Today
          </Button>
          <Button variant="outline" size="icon" onClick={prev}>
            <ChevronLeft className="h-4 w-4" />
            <span className="sr-only">Previous</span>
          </Button>
          <span className="text-sm font-medium min-w-32 text-center">
            {getHeaderTitle()}
          </span>
          <Button variant="outline" size="icon" onClick={next}>
            <ChevronRight className="h-4 w-4" />
            <span className="sr-only">Next</span>
          </Button>
          <Tabs value={view} onValueChange={(v) => setView(v as CalendarView)}>
            <TabsList>
              <TabsTrigger value="month">Month</TabsTrigger>
              <TabsTrigger value="week">Week</TabsTrigger>
              <TabsTrigger value="day">Day</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent>
        {view === "month" && renderMonthView()}
        {view === "week" && renderWeekView()}
        {view === "day" && renderDayView()}
      </CardContent>
    </Card>
  )
}

