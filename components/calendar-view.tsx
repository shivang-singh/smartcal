"use client"

import { useState } from "react"
import { ChevronLeft, ChevronRight, Calendar, Clock, ChevronRight as ChevronRightIcon } from "lucide-react"
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
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card"
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
      // Then sort past events after future events
      const now = new Date();
      const aIsPast = a.end < now;
      const bIsPast = b.end < now;
      if (aIsPast && !bIsPast) return 1;
      if (!aIsPast && bIsPast) return -1;
      // Finally sort by start time
      return a.start.getTime() - b.start.getTime();
    });

    // Log events found for this day
    console.log('Events for day:', {
      date: dayStart.toISOString(),
      events: dayEvents.map(e => ({
        title: e.title,
        start: e.start.toISOString(),
        end: e.end.toISOString(),
        isAllDay: e.isAllDay,
        isPast: e.end < new Date()
      }))
    });

    return dayEvents;
  };

  const renderEventCell = (event: NormalizedEvent) => {
    const timeString = event.isAllDay 
      ? 'All day'
      : `${formatEventTime(event.start, event.timeZone)} - ${formatEventTime(event.end, event.timeZone)}`;

    const isPastEvent = event.end < new Date();
    const eventStyles = isPastEvent 
      ? 'opacity-60 bg-muted/30' // Past events are more muted
      : 'hover:bg-accent/50'; // Future events have normal hover effect

    return (
      <HoverCard>
        <HoverCardTrigger asChild>
          <div
            className={`text-xs p-1 truncate rounded border-l-2 ${event.color} group relative cursor-pointer transition-colors ${eventStyles}`}
          >
            {!event.isAllDay && formatEventTime(event.start, event.timeZone) + " "}{event.title}
            {isPastEvent && <span className="ml-1 text-[10px]">(Past)</span>}
          </div>
        </HoverCardTrigger>
        <HoverCardContent align="start" className="w-80">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold">{event.title}</h4>
              <Button variant="ghost" size="sm" className="gap-1 h-7" asChild>
                <Link href={`/events/${event.id}`}>
                  <span className="text-xs">AI Prepare</span>
                  <ChevronRightIcon className="h-3 w-3" />
                </Link>
              </Button>
            </div>
            <div className="text-xs space-y-1.5">
              <div className="flex items-center gap-2 text-muted-foreground">
                {event.isAllDay ? (
                  <Calendar className="h-3.5 w-3.5" />
                ) : (
                  <Clock className="h-3.5 w-3.5" />
                )}
                <span>{timeString}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-3.5 w-3.5" />
                <span>{event.calendarName}</span>
              </div>
              {event.type !== 'default' && (
                <div className="inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 text-foreground">
                  {event.type}
                </div>
              )}
            </div>
          </div>
        </HoverCardContent>
      </HoverCard>
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
              {dayEvents.slice(0, 3).map(event => (
                <div key={event.id}>
                  {renderEventCell(event)}
                </div>
              ))}
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

  const renderWeekView = () => {
    const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 });
    const weekEnd = endOfWeek(currentDate, { weekStartsOn: 0 });
    const days: Date[] = [];
    let day = weekStart;

    // Create array of days in the week
    while (day <= weekEnd) {
      days.push(day);
      day = addDays(day, 1);
    }

    // Render day headers
    const dayHeaders = (
      <div className="grid grid-cols-8 gap-1 mb-2 sticky top-0 bg-card z-10">
        <div className="text-center py-2"></div> {/* Empty cell for time column */}
        {days.map((day) => (
          <div key={day.toString()} className="text-center py-2">
            <div className="text-sm font-medium">{format(day, "EEE")}</div>
            <div className={`text-lg ${isSameDateFns(day, today) ? "text-primary font-bold" : ""}`}>
              {format(day, "d")}
            </div>
          </div>
        ))}
      </div>
    );

    // Get all timed events for the week
    const timedEvents = normalizedEvents.filter(event => !event.isAllDay);
    
    // Group all-day events by day
    const allDayEventsByDay = days.map(day => {
      return {
        day,
        events: normalizedEvents.filter(event => 
          event.isAllDay && 
          (isSameDay(event.start, day) || 
           (event.start <= day && event.end >= day))
        )
      };
    });

    // Render all-day events at the top
    const allDaySection = (
      <div className="grid grid-cols-8 gap-1 mb-2 border-b border-muted pb-2 sticky top-12 bg-card z-10">
        <div className="text-xs text-muted-foreground py-2 pr-2 text-right">
          All day
        </div>
        {allDayEventsByDay.map(({ day, events }) => (
          <div key={`allday-${day}`} className="border-l first:border-l-0 border-muted p-1 max-h-[100px] overflow-y-auto">
            {events.map(event => {
              const bgColor = event.type === 'default' ? 'bg-blue-100 border-blue-300' :
                              event.type === 'birthday' ? 'bg-orange-100 border-orange-300' :
                              event.type === 'holiday' ? 'bg-green-100 border-green-300' :
                              'bg-purple-100 border-purple-300';
              
              return (
                <HoverCard key={`allday-event-${event.id}`}>
                  <HoverCardTrigger asChild>
                    <div className={`text-xs p-1 mb-1 truncate rounded-sm border ${bgColor} shadow-sm cursor-pointer hover:bg-accent/50 transition-colors`}>
                      {event.title}
                    </div>
                  </HoverCardTrigger>
                  <HoverCardContent align="start" className="w-80">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-semibold">{event.title}</h4>
                        <Button variant="ghost" size="sm" className="gap-1 h-7" asChild>
                          <Link href={`/events/${event.id}`}>
                            <span className="text-xs">AI Prepare</span>
                            <ChevronRightIcon className="h-3 w-3" />
                          </Link>
                        </Button>
                      </div>
                      <div className="text-xs space-y-1.5">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Calendar className="h-3.5 w-3.5" />
                          <span>All day</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Calendar className="h-3.5 w-3.5" />
                          <span>{event.calendarName}</span>
                        </div>
                        {event.type !== 'default' && (
                          <div className="inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 text-foreground">
                            {event.type}
                          </div>
                        )}
                      </div>
                    </div>
                  </HoverCardContent>
                </HoverCard>
              );
            })}
          </div>
        ))}
      </div>
    );

    // Create time grid
    const hourSlots = [];
    for (let hour = 0; hour < 24; hour++) {
      // Add hour marker
      hourSlots.push(
        <div key={`hour-${hour}`} className="grid grid-cols-8 gap-1 border-t border-muted">
          <div className="text-xs text-muted-foreground py-2 pr-2 text-right -mt-2.5">
            {format(new Date().setHours(hour, 0, 0, 0), "h a")}
          </div>
          {days.map((day) => (
            <div 
              key={`slot-${day}-${hour}`} 
              className="relative min-h-[3rem] border-l first:border-l-0 border-muted"
              data-hour={hour}
            ></div>
          ))}
        </div>
      );
      
      // Add half-hour marker (lighter border)
      hourSlots.push(
        <div key={`hour-${hour}-30`} className="grid grid-cols-8 gap-1 border-t border-muted/30">
          <div className="text-xs text-muted-foreground py-2 pr-2 text-right -mt-2.5"></div>
          {days.map((day) => (
            <div 
              key={`slot-${day}-${hour}-30`} 
              className="relative min-h-[3rem] border-l first:border-l-0 border-muted"
              data-hour={`${hour}:30`}
            ></div>
          ))}
        </div>
      );
    }

    // Position events on the grid
    const eventElements = timedEvents.map(event => {
      // Find which day column this event belongs to
      const eventDay = startOfDay(event.start);
      const dayIndex = days.findIndex(day => isSameDateFns(day, eventDay));
      
      if (dayIndex === -1) return null; // Event not in this week
      
      // Calculate position and height
      const dayStart = new Date(days[dayIndex]);
      dayStart.setHours(0, 0, 0, 0);
      
      const startMinutes = (event.start.getHours() * 60) + event.start.getMinutes();
      const endMinutes = (event.end.getHours() * 60) + event.end.getMinutes();
      
      // For events that end on the next day
      let adjustedEndMinutes = endMinutes;
      if (endMinutes < startMinutes) {
        adjustedEndMinutes = 24 * 60; // End at midnight
      }
      
      const durationMinutes = adjustedEndMinutes - startMinutes;
      
      // Calculate top position in pixels (each hour is 6rem tall - 3rem per half hour slot)
      // Each hour slot is 6rem (3rem per half-hour)
      const hourHeight = 6; 
      
      // Adjust the calculation to account for the exact position in the time grid
      // We need to account for the border heights and any other spacing
      // Each hour has a border-top of 1px, so we need to add that to our calculation
      const borderOffset = Math.floor(startMinutes / 30) * 1; // 1px border for each half-hour slot
      // Add a small adjustment to align perfectly with time slots (-0.125rem = -2px)
      const topPosition = (startMinutes / 60) * hourHeight + (borderOffset / 16) - 0.25;
      
      // Calculate height in pixels
      const borderHeightInDuration = Math.floor(durationMinutes / 30) * 1 / 16; // Account for borders in the duration
      const height = (durationMinutes / 60) * hourHeight + borderHeightInDuration;
      
      // Minimum height for very short events (15 minutes)
      const minHeight = (15 / 60) * hourHeight;
      
      // Determine color based on event type
      const bgColor = event.type === 'default' ? 'bg-blue-100 border-blue-300' :
                      event.type === 'birthday' ? 'bg-orange-100 border-orange-300' :
                      event.type === 'holiday' ? 'bg-green-100 border-green-300' :
                      'bg-purple-100 border-purple-300';
      
      return (
        <HoverCard key={`event-${event.id}`}>
          <HoverCardTrigger asChild>
            <div
              className={`absolute rounded-md border px-2 py-1 text-xs ${bgColor} z-10 overflow-hidden shadow-sm hover:shadow-md hover:bg-accent/50 transition-all cursor-pointer`}
              style={{
                top: `${topPosition}rem`,
                height: `${Math.max(minHeight, height)}rem`,
                left: `calc(${(dayIndex + 1) * (100/8)}% + 4px)`,
                width: `calc(${100/8}% - 8px)`,
              }}
            >
              <div className="font-medium truncate">{event.title}</div>
              <div className="text-xs opacity-80 truncate">
                {formatEventTime(event.start, event.timeZone)}
              </div>
            </div>
          </HoverCardTrigger>
          <HoverCardContent align="start" className="w-80">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold">{event.title}</h4>
                <Button variant="ghost" size="sm" className="gap-1 h-7" asChild>
                  <Link href={`/events/${event.id}`}>
                    <span className="text-xs">AI Prepare</span>
                    <ChevronRightIcon className="h-3 w-3" />
                  </Link>
                </Button>
              </div>
              <div className="text-xs space-y-1.5">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="h-3.5 w-3.5" />
                  <span>{formatEventTime(event.start, event.timeZone)} - {formatEventTime(event.end, event.timeZone)}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>{event.calendarName}</span>
                </div>
                {event.type !== 'default' && (
                  <div className="inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 text-foreground">
                    {event.type}
                  </div>
                )}
              </div>
            </div>
          </HoverCardContent>
        </HoverCard>
      );
    }).filter(Boolean);

    return (
      <div className="flex flex-col h-[600px]">
        {/* Fixed header section */}
        {dayHeaders}
        {allDaySection}
        
        {/* Scrollable time grid */}
        <div className="overflow-auto flex-1 relative">
          <div className="relative">
            {hourSlots}
            {eventElements}
          </div>
        </div>
      </div>
    );
  };

  const renderDayView = () => {
    const dayStart = startOfDay(currentDate);
    const dayEnd = new Date(dayStart);
    dayEnd.setHours(23, 59, 59, 999);
    
    // Get all events for the day
    const dayEvents = getEventsForDay(currentDate);
    
    // Separate all-day events
    const allDayEvents = dayEvents.filter(event => event.isAllDay);
    const timedEvents = dayEvents.filter(event => !event.isAllDay);
    
    // Day header
    const dayHeader = (
      <div className="text-center py-2 sticky top-0 bg-card z-10">
        <div className={`text-lg font-medium ${isSameDateFns(currentDate, today) ? "text-primary" : ""}`}>
          {format(currentDate, "EEEE, MMMM d, yyyy")}
        </div>
      </div>
    );
    
    // All-day events section
    const allDaySection = allDayEvents.length > 0 && (
      <div className="mb-4 border-b border-muted pb-2 sticky top-10 bg-card z-10">
        <div className="flex items-center mb-2">
          <Calendar className="h-4 w-4 text-muted-foreground mr-2" />
          <span className="text-sm font-medium">All-day Events</span>
        </div>
        <div className="space-y-1">
          {allDayEvents.map(event => {
            const bgColor = event.type === 'default' ? 'bg-blue-100 border-blue-300' :
                            event.type === 'birthday' ? 'bg-orange-100 border-orange-300' :
                            event.type === 'holiday' ? 'bg-green-100 border-green-300' :
                            'bg-purple-100 border-purple-300';
            
            return (
              <HoverCard key={`allday-event-${event.id}`}>
                <HoverCardTrigger asChild>
                  <div className={`text-sm p-2 mb-1 rounded-md border ${bgColor} shadow-sm cursor-pointer hover:bg-accent/50 transition-colors`}>
                    {event.title}
                  </div>
                </HoverCardTrigger>
                <HoverCardContent align="start" className="w-80">
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold">{event.title}</h4>
                    <div className="text-xs space-y-1.5">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>All day</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>{event.calendarName}</span>
                      </div>
                      {event.type !== 'default' && (
                        <div className="inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 text-foreground">
                          {event.type}
                        </div>
                      )}
                    </div>
                  </div>
                </HoverCardContent>
              </HoverCard>
            );
          })}
        </div>
      </div>
    );
    
    // Create time grid
    const hourSlots = [];
    for (let hour = 0; hour < 24; hour++) {
      // Add hour marker
      hourSlots.push(
        <div key={`hour-${hour}`} className="flex border-t border-muted">
          <div className="text-xs text-muted-foreground py-2 pr-2 text-right w-20 -mt-2.5">
            {format(new Date().setHours(hour, 0, 0, 0), "h a")}
          </div>
          <div className="flex-1 min-h-[3rem]" data-hour={hour}></div>
        </div>
      );
      
      // Add half-hour marker (lighter border)
      hourSlots.push(
        <div key={`hour-${hour}-30`} className="flex border-t border-muted/30">
          <div className="text-xs text-muted-foreground py-2 pr-2 text-right w-20 -mt-2.5"></div>
          <div className="flex-1 min-h-[3rem]" data-hour={`${hour}:30`}></div>
        </div>
      );
    }
    
    // Position events on the grid
    const eventElements = timedEvents.map(event => {
      // Calculate position and height
      const startMinutes = (event.start.getHours() * 60) + event.start.getMinutes();
      const endMinutes = (event.end.getHours() * 60) + event.end.getMinutes();
      
      // For events that end on the next day
      let adjustedEndMinutes = endMinutes;
      if (endMinutes < startMinutes) {
        adjustedEndMinutes = 24 * 60; // End at midnight
      }
      
      const durationMinutes = adjustedEndMinutes - startMinutes;
      
      // Calculate top position in pixels (each hour is 6rem tall - 3rem per half hour slot)
      // Each hour slot is 6rem (3rem per half-hour)
      const hourHeight = 6; 
      
      // Adjust the calculation to account for the exact position in the time grid
      // We need to account for the border heights and any other spacing
      // Each hour has a border-top of 1px, so we need to add that to our calculation
      const borderOffset = Math.floor(startMinutes / 30) * 1; // 1px border for each half-hour slot
      // Add a small adjustment to align perfectly with time slots (-0.125rem = -2px)
      const topPosition = (startMinutes / 60) * hourHeight + (borderOffset / 16) - 0.25;
      
      // Calculate height in pixels
      const borderHeightInDuration = Math.floor(durationMinutes / 30) * 1 / 16; // Account for borders in the duration
      const height = (durationMinutes / 60) * hourHeight + borderHeightInDuration;
      
      // Minimum height for very short events (15 minutes)
      const minHeight = (15 / 60) * hourHeight;
      
      // Determine color based on event type
      const bgColor = event.type === 'default' ? 'bg-blue-100 border-blue-300' :
                      event.type === 'birthday' ? 'bg-orange-100 border-orange-300' :
                      event.type === 'holiday' ? 'bg-green-100 border-green-300' :
                      'bg-purple-100 border-purple-300';
      
      return (
        <HoverCard key={`event-${event.id}`}>
          <HoverCardTrigger asChild>
            <div
              className={`absolute rounded-md border ${bgColor} px-2 py-1 z-10 overflow-hidden shadow-sm hover:shadow-md transition-shadow`}
              style={{
                top: `${topPosition}rem`,
                height: `${Math.max(minHeight, height)}rem`, // Minimum height for visibility
                left: 'calc(5rem + 8px)', // Adjusted to match the new time column width (w-20 = 5rem)
                right: '8px',
              }}
              title={`${event.title} (${formatEventTime(event.start, event.timeZone)} - ${formatEventTime(event.end, event.timeZone)})`}
            >
              <div className="font-medium truncate">{event.title}</div>
              <div className="text-xs opacity-80 truncate">
                {formatEventTime(event.start, event.timeZone)} - {formatEventTime(event.end, event.timeZone)}
              </div>
            </div>
          </HoverCardTrigger>
          <HoverCardContent align="start" className="w-80">
            <div className="space-y-2">
              <h4 className="text-sm font-semibold">{event.title}</h4>
              <div className="text-xs space-y-1.5">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="h-3.5 w-3.5" />
                  <span>{formatEventTime(event.start, event.timeZone)} - {formatEventTime(event.end, event.timeZone)}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>{event.calendarName}</span>
                </div>
                {event.type !== 'default' && (
                  <div className="inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 text-foreground">
                    {event.type}
                  </div>
                )}
              </div>
            </div>
          </HoverCardContent>
        </HoverCard>
      );
    });
    
    return (
      <div className="flex flex-col h-[600px]">
        {/* Fixed header section */}
        {dayHeader}
        {allDaySection}
        
        {/* Scrollable time grid */}
        <div className="overflow-auto flex-1 relative">
          <div className="relative">
            {hourSlots}
            {eventElements}
          </div>
        </div>
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
        {view === "week" && renderWeekView()}
        {view === "day" && renderDayView()}
      </CardContent>
    </Card>
  );
} 