'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CalendarEvent } from '@/lib/google-calendar/types';
import CreateEventForm from './components/CreateEventForm';
import { CalendarView } from '@/components/calendar-view';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function CalendarPage() {
  const router = useRouter();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("calendar");

  useEffect(() => {
    const tokens = localStorage.getItem('calendar_tokens');
    if (!tokens) {
      initializeAuth();
      return;
    }
    fetchEvents();
  }, []);

  const initializeAuth = async () => {
    try {
      const response = await fetch('/api/calendar?action=auth');
      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      setError('Failed to initialize authentication');
      setIsLoading(false);
    }
  };

  const fetchEvents = async () => {
    try {
      const response = await fetch('/api/calendar?action=events');
      if (!response.ok) {
        throw new Error('Failed to fetch events');
      }
      const data = await response.json();
      setEvents(data);
      setIsLoading(false);
    } catch (error) {
      setError('Failed to fetch events');
      setIsLoading(false);
    }
  };

  const createEvent = async (event: CalendarEvent) => {
    try {
      const response = await fetch('/api/calendar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'create',
          event,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create event');
      }

      const newEvent = await response.json();
      setEvents([...events, newEvent]);
      setActiveTab("calendar");
    } catch (error) {
      setError('Failed to create event');
    }
  };

  const deleteEvent = async (eventId: string) => {
    try {
      const response = await fetch(`/api/calendar?eventId=${eventId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete event');
      }

      setEvents(events.filter(event => event.id !== eventId));
    } catch (error) {
      setError('Failed to delete event');
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Loading calendar events...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Your Calendar</h1>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
        <TabsList className="mb-4">
          <TabsTrigger value="calendar">Calendar View</TabsTrigger>
          <TabsTrigger value="list">List View</TabsTrigger>
          <TabsTrigger value="create">Create Event</TabsTrigger>
        </TabsList>
        
        <TabsContent value="calendar" className="space-y-4">
          <CalendarView events={events} />
        </TabsContent>
        
        <TabsContent value="list" className="space-y-4">
          <div className="grid gap-4">
            {events.map((event) => (
              <div
                key={event.id}
                className="border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow"
              >
                <h2 className="text-xl font-semibold mb-2">{event.summary}</h2>
                {event.description && (
                  <p className="text-gray-600 mb-2">{event.description}</p>
                )}
                <div className="flex justify-between items-center text-sm text-gray-500">
                  <div>
                    <p>Start: {new Date(event.start.dateTime).toLocaleString()}</p>
                    <p>End: {new Date(event.end.dateTime).toLocaleString()}</p>
                  </div>
                  <button
                    onClick={() => deleteEvent(event.id!)}
                    className="text-red-500 hover:text-red-700"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="create">
          <CreateEventForm onSubmit={createEvent} />
        </TabsContent>
      </Tabs>
    </div>
  );
} 