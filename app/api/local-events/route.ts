import { NextRequest, NextResponse } from 'next/server';

interface LocalEventsRequest {
  eventType: string;
  location?: string;
  date?: string;
  radius?: number; // in meters
}

interface LocalEvent {
  name: string;
  description?: string;
  location: string;
  date?: string;
  time?: string;
  link?: string;
  source: string;
  distance?: string;
  rating?: number;
  attendees?: number;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as LocalEventsRequest;
    const { eventType, location = '', date, radius = 5000 } = body;

    if (!process.env.GOOGLE_PLACES_API_KEY) {
      throw new Error('Google Places API key not configured');
    }

    // First, geocode the location to get coordinates
    const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(location)}&key=${process.env.GOOGLE_PLACES_API_KEY}`;
    console.log('Attempting to geocode location...');
    const geocodeResponse = await fetch(geocodeUrl);
    const geocodeData = await geocodeResponse.json();
    
    console.log('Geocode response status:', geocodeData.status);
    if (geocodeData.error_message) {
      console.error('Geocoding error:', geocodeData.error_message);
      throw new Error(`Geocoding failed: ${geocodeData.error_message}`);
    }

    if (!geocodeData.results?.[0]?.geometry?.location) {
      console.error('No geocoding results:', geocodeData);
      throw new Error('Could not geocode location');
    }

    const { lat, lng } = geocodeData.results[0].geometry.location;
    console.log('Successfully geocoded to:', { lat, lng });

    // Search for places related to the event type
    const searchQuery = `${eventType} events ${date || ''}`.trim();
    const placesUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(searchQuery)}&location=${lat},${lng}&radius=${radius}&key=${process.env.GOOGLE_PLACES_API_KEY}`;
    
    console.log('Searching for places...');
    const placesResponse = await fetch(placesUrl);
    const placesData = await placesResponse.json();
    
    console.log('Places API response status:', placesData.status);
    if (placesData.error_message) {
      console.error('Places API error:', placesData.error_message);
      throw new Error(`Places API failed: ${placesData.error_message}`);
    }

    if (!placesData.results) {
      console.error('No places results:', placesData);
      throw new Error('No results found');
    }

    // Process and format the results
    const events: LocalEvent[] = await Promise.all(placesData.results.slice(0, 5).map(async (place: any) => {
      // Get place details for more information
      const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place.place_id}&fields=name,formatted_address,rating,website,formatted_phone_number,opening_hours,price_level&key=${process.env.GOOGLE_PLACES_API_KEY}`;
      const detailsResponse = await fetch(detailsUrl);
      const detailsData = await detailsResponse.json();
      const details = detailsData.result;

      return {
        name: place.name,
        description: place.formatted_address,
        location: details.formatted_address || place.formatted_address,
        source: 'Google Places',
        rating: details.rating || place.rating,
        link: details.website,
        distance: `${(place.distance / 1000).toFixed(1)} km`,
      };
    }));

    // Also fetch events from Eventbrite if API key is available
    if (process.env.EVENTBRITE_API_KEY) {
      try {
        const eventbriteUrl = `https://www.eventbriteapi.com/v3/events/search/?q=${encodeURIComponent(searchQuery)}&location.latitude=${lat}&location.longitude=${lng}&location.within=${radius}m&token=${process.env.EVENTBRITE_API_KEY}`;
        const eventbriteResponse = await fetch(eventbriteUrl);
        const eventbriteData = await eventbriteResponse.json();

        if (eventbriteData.events) {
          const eventbriteEvents: LocalEvent[] = eventbriteData.events.slice(0, 3).map((event: any) => ({
            name: event.name.text,
            description: event.description.text,
            location: event.venue?.address?.localized_address_display || 'Location TBA',
            date: event.start.local.split('T')[0],
            time: event.start.local.split('T')[1],
            link: event.url,
            source: 'Eventbrite',
            attendees: event.capacity,
          }));

          events.push(...eventbriteEvents);
        }
      } catch (error) {
        console.error('Error fetching Eventbrite events:', error);
      }
    }

    return NextResponse.json({ events });
  } catch (error) {
    console.error('Error in local events API:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch local events' },
      { status: 500 }
    );
  }
} 