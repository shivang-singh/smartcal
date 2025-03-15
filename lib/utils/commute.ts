/// <reference types="@types/google.maps" />

// Add type declarations for Google Maps
declare global {
  interface Window {
    google: typeof google;
  }
}

export interface CommuteInfo {
  distance?: string;
  duration?: string;
  trafficDuration?: string;
  transitOptions?: string[];
}

function parseEventTime(date: string, time: string): Date | undefined {
  try {
    // Handle various time formats (e.g., "2:00 PM", "14:00", "2:00 PM - 3:00 PM")
    const timeStr = time.split('-')[0].trim(); // Take start time if range is provided
    const [hourMin, period] = timeStr.split(' ');
    let [hours, minutes] = hourMin.split(':').map(Number);

    // Convert to 24-hour format if PM
    if (period?.toUpperCase() === 'PM' && hours !== 12) {
      hours += 12;
    }
    // Handle 12 AM
    if (period?.toUpperCase() === 'AM' && hours === 12) {
      hours = 0;
    }

    // Create a date object for the event
    const eventDate = new Date(date);
    eventDate.setHours(hours, minutes);

    return eventDate;
  } catch (error) {
    console.warn('Failed to parse event time:', error);
    return undefined;
  }
}

// Initialize Google Maps services
function initializeGoogleMaps(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window !== 'undefined' && !window.google) {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Google Maps JavaScript API'));
      document.head.appendChild(script);
    } else {
      resolve();
    }
  });
}

export async function calculateCommute(
  destination: string,
  origin: string = 'San Francisco, CA',
  eventDate?: string,
  eventTime?: string
): Promise<CommuteInfo> {
  console.log('Starting commute calculation with params:', {
    destination,
    origin,
    eventDate,
    eventTime,
    hasApiKey: !!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
  });

  if (!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) {
    console.warn('Google Maps API key not found, skipping commute calculation');
    throw new Error('Google Maps API key not configured');
  }

  try {
    // Initialize Google Maps if not already loaded
    await initializeGoogleMaps();

    // Parse event time if provided
    const departureTime = eventDate && eventTime 
      ? parseEventTime(eventDate, eventTime)
      : new Date(); // Default to current time

    console.log('Calculated departure time:', departureTime);

    // Create service instances
    const distanceMatrixService = new google.maps.DistanceMatrixService();

    // Get driving results
    console.log('Fetching driving distance matrix...');
    const drivingResults = await distanceMatrixService.getDistanceMatrix({
      origins: [origin],
      destinations: [destination],
      travelMode: google.maps.TravelMode.DRIVING,
      drivingOptions: {
        departureTime: departureTime,
        trafficModel: google.maps.TrafficModel.BEST_GUESS
      }
    });

    // Get transit results
    console.log('Fetching transit distance matrix...');
    const transitResults = await distanceMatrixService.getDistanceMatrix({
      origins: [origin],
      destinations: [destination],
      travelMode: google.maps.TravelMode.TRANSIT,
      transitOptions: {
        departureTime: departureTime
      }
    });

    console.log('Distance matrix responses received:', {
      driving: drivingResults.rows[0]?.elements[0]?.status,
      transit: transitResults.rows[0]?.elements[0]?.status
    });

    const drivingResult = drivingResults.rows[0]?.elements[0];
    const transitResult = transitResults.rows[0]?.elements[0];

    const transitOptions: string[] = [];
    if (transitResult?.status === 'OK') {
      transitOptions.push(`Transit: ${transitResult.duration.text}`);
    }
    if (drivingResult?.status === 'OK') {
      transitOptions.push(`Drive: ${drivingResult.duration.text}`);
      if (drivingResult.duration_in_traffic) {
        transitOptions.push(`Drive (with traffic): ${drivingResult.duration_in_traffic.text}`);
      }
    }

    // Add time context to the response
    const timeContext = departureTime && departureTime > new Date() 
      ? `at ${departureTime.toLocaleTimeString()} on ${departureTime.toLocaleDateString()}`
      : 'now';

    const result = {
      distance: drivingResult?.distance?.text,
      duration: drivingResult?.duration?.text,
      trafficDuration: drivingResult?.duration_in_traffic?.text,
      transitOptions: transitOptions.map(option => `${option} (${timeContext})`)
    };

    console.log('Commute calculation completed:', result);
    return result;
  } catch (error) {
    console.error('Error in commute calculation:', error);
    throw error;
  }
} 