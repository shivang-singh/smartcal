/**
 * This utility helps fix date parsing issues in calendar events
 */

/**
 * Creates a date object from various event date formats
 * @param event The calendar event to parse
 * @returns A properly formatted Date object
 */
export function parseEventDate(event: any): Date {
  try {
    // Determine if it's an all-day event
    const isAllDay = Boolean(event.isAllDay || event.allDay || event.start?.date);
    
    // For all-day events
    if (isAllDay) {
      if (event.start?.date) {
        // Convert YYYY-MM-DD to Date
        return new Date(event.start.date + 'T00:00:00');
      } else if (event.date instanceof Date) {
        // If we already have a Date object, clone it
        const eventDate = new Date(event.date);
        eventDate.setHours(0, 0, 0, 0);
        return eventDate;
      }
    } 
    
    // For timed events
    if (event.start?.dateTime) {
      // Google Calendar format: ISO string with timezone
      return new Date(event.start.dateTime);
    } else if (event.date instanceof Date) {
      // Already have a Date object
      return new Date(event.date);
    } else if (typeof event.start === 'object' && event.start instanceof Date) {
      // If start is a Date object
      return new Date(event.start);
    }
    
    // Last resort fallback
    console.warn("Could not determine date for event", event);
    return new Date();
  } catch (error) {
    console.error("Error parsing event date:", error);
    return new Date();
  }
}

/**
 * Checks if two date objects represent the same day
 * @param date1 First date to compare
 * @param date2 Second date to compare
 * @returns Boolean indicating if dates are the same day
 */
export function isSameDay(date1: Date, date2: Date): boolean {
  return date1.getFullYear() === date2.getFullYear() &&
         date1.getMonth() === date2.getMonth() &&
         date1.getDate() === date2.getDate();
}

/**
 * Filters events that occur on a specific day
 * @param date The date to check for
 * @param events Array of events to filter
 * @returns Events that occur on the specified date
 */
export function getEventsForDay(date: Date, events: any[]): any[] {
  return events.filter(event => {
    try {
      const eventDate = parseEventDate(event);
      return isSameDay(eventDate, date);
    } catch (err) {
      console.error("Error filtering events for day:", err);
      return false;
    }
  });
} 