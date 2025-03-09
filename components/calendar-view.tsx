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
  isSameDay as isSameDateFns,
  isSameMonth,
  startOfDay,
  parseISO
} from "date-fns"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { parseEventDate, isSameDay } from "@/lib/calendar-utils/date-fix"

// Types
type CalendarView = "month" | "week" | "day"
type EventType = 'default' | 'holiday' | 'birthday' | 'all-day'

interface NormalizedEvent {
  id: string
  title: string
  start: Date
  end: Date
  type: EventType
  color: string
  isAllDay: boolean
  calendarName: string
  timeZone: string
}

interface CalendarEventProps {
  id?: string
  summary?: string
  title?: string
  description?: string
  start?: {
    dateTime?: string
    date?: string
    timeZone?: string
  }
  end?: {
    dateTime?: string
    date?: string
    timeZone?: string
  }
  date?: Date
  duration?: number
  source?: string
  calendarColor?: string
  calendarSummary?: string
  isAllDay?: boolean
  allDay?: boolean
  eventType?: string
}

interface CalendarViewProps {
  events?: CalendarEventProps[]
}

// Helper functions
const formatEventTime = (date: Date, timeZone: string): string => {
  try {
    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone
    }).format(date);
  } catch (error) {
    console.error('Error formatting time:', error);
    return format(date, 'h:mm a');
  }
};

const getEventColor = (color?: string): string => {
  if (!color) return 'bg-primary/20 border-primary';
  try {
    return `bg-[${color}33] border-[${color}]`;
  } catch {
    return 'bg-primary/20 border-primary';
  }
};

const getEventType = (event: CalendarEventProps, isAllDay: boolean): EventType => {
  if (isAllDay) return 'all-day';
  if (event.source?.includes('#holiday')) return 'holiday';
  if (event.source?.includes('#contacts') || event.eventType === 'Birthday') return 'birthday';
  return 'default';
};

const parseEventDateTime = (dateTimeStr?: string, dateStr?: string): Date => {
  try {
    if (dateTimeStr) {
      // Parse ISO datetime string with timezone info
      return parseISO(dateTimeStr);
    }
    if (dateStr) {
      // Handle YYYY-MM-DD format for all-day events
      const [year, month, day] = dateStr.split('-').map(Number);
      const date = new Date(year, month - 1, day); // month is 0-indexed
      if (isNaN(date.getTime())) {
        console.error('Invalid date:', dateStr);
        return new Date();
      }
      return date;
    }
    return new Date();
  } catch (error) {
    console.error('Error parsing date:', error);
    return new Date();
  }
};

const normalizeEvent = (event: CalendarEventProps): NormalizedEvent | null => {
  // Handle invalid or empty events
  if (!event || typeof event !== 'object') {
    console.warn('Skipping invalid event:', event);
    return null;
  }

  // For events without start time, try to use the date field
  let startDate: Date, endDate: Date;
  let isAllDay = Boolean(event.isAllDay || event.allDay);

  try {
    if (event.start?.dateTime) {
      // Handle timed events
      startDate = new Date(event.start.dateTime);
      endDate = event.end?.dateTime ? new Date(event.end.dateTime) : new Date(startDate.getTime() + 3600000); // 1 hour default
      isAllDay = false;
    } else if (event.start?.date) {
      // Handle all-day events
      startDate = parseISO(event.start.date);
      if (event.end?.date) {
        const rawEndDate = parseISO(event.end.date);
        endDate = new Date(rawEndDate);
        endDate.setDate(endDate.getDate() - 1); // Make end date inclusive
      } else {
        endDate = new Date(startDate);
      }
      isAllDay = true;
    } else if (event.date) {
      // Handle simple date-only events
      startDate = new Date(event.date);
      endDate = new Date(startDate);
      isAllDay = true;
    } else {
      console.warn('Event missing date information:', event);
      return null;
    }

    // Validate parsed dates
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      console.warn('Invalid date values in event:', event);
      return null;
    }

    // Set proper time components for all-day events
    if (isAllDay) {
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
    }

    // Add debug logging
    console.log('Normalized event:', {
      title: event.title || event.summary,
      originalStart: event.start,
      originalEnd: event.end,
      normalizedStart: startDate.toISOString(),
      normalizedEnd: endDate.toISOString(),
      isAllDay
    });

    return {
      id: event.id || String(Math.random()),
      title: event.title || event.summary || "Untitled Event",
      start: startDate,
      end: endDate,
      type: event.eventType as EventType || 'default',
      color: getEventColor(event.calendarColor),
      isAllDay,
      calendarName: event.calendarSummary || 'Calendar',
      timeZone: event.start?.timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone
    };
  } catch (error) {
    console.warn('Error normalizing event:', error, event);
    return null;
  }
};

// Calendar component
export function CalendarView({ events = [] }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [view, setView] = useState<CalendarView>("month")
  const today = startOfDay(new Date())
  
  // Add debug logging for incoming events
  console.log('Raw events:', events);

  // Filter out null events after normalization
  const normalizedEvents = events
    .map(event => {
      const normalized = normalizeEvent(event);
      // Log each normalization result
      console.log('Normalizing event result:', { event, normalized });
      return normalized;
    })
    .filter((event): event is NormalizedEvent => event !== null);

  // Log final normalized events
  console.log('Final normalized events:', normalizedEvents);

  // Navigation functions
  const navigate = (direction: 'next' | 'prev') => {
    const modifier = direction === 'next' ? 1 : -1;
    switch (view) {
      case "month":
        setCurrentDate(addMonths(currentDate, modifier));
        break;
      case "week":
        setCurrentDate(addWeeks(currentDate, modifier));
        break;
      case "day":
        setCurrentDate(addDays(currentDate, modifier));
        break;
    }
  };

  const getEventsForDay = (date: Date) => {
    const dayStart = startOfDay(date);
    const dayEnd = new Date(dayStart);
    dayEnd.setHours(23, 59, 59, 999);

    const dayEvents = normalizedEvents.filter(event => {
      // For all-day events
      if (event.isAllDay) {
        const eventStartDay = startOfDay(event.start);
        const eventEndDay = startOfDay(event.end);
        // Check if the current day falls within the event's range (inclusive)
        const isInRange = dayStart >= eventStartDay && dayStart <= eventEndDay;
        console.log('All-day event check:', {
          event: event.title,
          date: dayStart.toISOString(),
          eventStart: eventStartDay.toISOString(),
          eventEnd: eventEndDay.toISOString(),
          isInRange
        });
        return isInRange;
      }
      
      // For timed events
      const eventStartDay = startOfDay(event.start);
      // Event starts on this day
      if (isSameDateFns(eventStartDay, dayStart)) {
        return true;
      }
      // Event spans over midnight and includes this day
      const spans = (event.start < dayEnd && event.end > dayStart);
      
      console.log('Timed event check:', {
        event: event.title,
        date: dayStart.toISOString(),
        eventStart: event.start.toISOString(),
        eventEnd: event.end.toISOString(),
        sameDay: isSameDateFns(eventStartDay, dayStart),
        spans
      });
      
      return spans;
    }).sort((a, b) => {
      // Sort all-day events first
      if (a.isAllDay && !b.isAllDay) return -1;
      if (!a.isAllDay && b.isAllDay) return 1;
      // Then sort by start time
      return a.start.getTime() - b.start.getTime();
    });

    // Log events found for this day
    console.log('Events for day:', {
      date: dayStart.toISOString(),
      events: dayEvents.map(e => ({
        title: e.title,
        start: e.start.toISOString(),
        end: e.end.toISOString(),
        isAllDay: e.isAllDay
      }))
    });

    return dayEvents;
  };

  const renderEventCell = (event: NormalizedEvent) => {
    const timeString = event.isAllDay 
      ? 'All day'
      : `${formatEventTime(event.start, event.timeZone)} - ${formatEventTime(event.end, event.timeZone)}`;

    return (
      <div
        key={event.id}
        className={`text-xs p-1 truncate rounded border-l-2 ${event.color} group relative`}
        title={`${event.title}${event.isAllDay ? ' (All day)' : ` (${timeString})`} - ${event.calendarName}`}
      >
        {!event.isAllDay && formatEventTime(event.start, event.timeZone) + " "}{event.title}
      </div>
    );
  };

  const renderDayCell = (day: Date, isCurrentMonth: boolean) => {
    const dayEvents = getEventsForDay(day);
    const isToday = isSameDateFns(day, today);
    
    // Log day cell rendering
    console.log('Rendering day cell:', {
      day: day.toISOString(),
      isCurrentMonth,
      isToday,
      eventCount: dayEvents.length
    });

    return (
      <div 
        key={day.toString()} 
        className={`min-h-[100px] p-1 border border-muted ${
          !isCurrentMonth
            ? "bg-muted/30 text-muted-foreground"
            : isToday
            ? "bg-primary/5 border-primary"
            : ""
        }`}
      >
        <div className="flex justify-between items-center">
          <span className={`text-sm font-medium ${isToday ? "text-primary" : ""}`}>
            {format(day, "d")}
          </span>
        </div>
        <div className="mt-1 space-y-1 max-h-[70px] overflow-y-auto">
          {dayEvents.length > 0 ? (
            <>
              {dayEvents.slice(0, 3).map(event => renderEventCell(event))}
              {dayEvents.length > 3 && (
                <div className="text-xs text-muted-foreground text-center">
                  +{dayEvents.length - 3} more
                </div>
              )}
            </>
          ) : null}
        </div>
      </div>
    );
  };

  const renderMonthView = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 0 });
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 });
    
    const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const dayHeaders = (
      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekDays.map((dayName) => (
          <div key={dayName} className="text-center py-2 text-sm font-medium">
            {dayName}
          </div>
        ))}
      </div>
    );

    const rows = [];
    let days = [];
    let day = startDate;

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        days.push(renderDayCell(day, isSameMonth(day, monthStart)));
        day = addDays(day, 1);
      }
      rows.push(
        <div key={day.toString()} className="grid grid-cols-7 gap-1">
          {days}
        </div>
      );
      days = [];
    }

    return (
      <div>
        {dayHeaders}
        <div className="space-y-1">{rows}</div>
      </div>
    );
  };

  const getHeaderTitle = () => {
    switch (view) {
      case "month":
        return format(currentDate, "MMMM yyyy");
      case "week":
        const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 });
        const weekEnd = endOfWeek(currentDate, { weekStartsOn: 0 });
        return `${format(weekStart, "MMM d")} - ${format(weekEnd, "MMM d, yyyy")}`;
      default:
        return format(currentDate, "MMMM d, yyyy");
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle>Calendar</CardTitle>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())}>
            Today
          </Button>
          <Button variant="outline" size="icon" onClick={() => navigate('prev')}>
            <ChevronLeft className="h-4 w-4" />
            <span className="sr-only">Previous</span>
          </Button>
          <span className="text-sm font-medium min-w-32 text-center">
            {getHeaderTitle()}
          </span>
          <Button variant="outline" size="icon" onClick={() => navigate('next')}>
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
        {/* Week and Day views can be implemented similarly */}
      </CardContent>
    </Card>
  );
} 