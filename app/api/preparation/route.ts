import { NextRequest, NextResponse } from 'next/server';
import { PreparationInput } from '@/lib/ai-utils';
import { agentManager, registerAgents } from '@/lib/agents';
import { calculateCommute } from '@/lib/utils/commute';
import { POST as perplexityEventsHandler } from '../perplexity-events/route';

// Initialize all agents when the API is first loaded
registerAgents();

// Extended preparation input type that includes location
interface ExtendedPreparationInput extends PreparationInput {
  location?: string;
}

export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const body = await request.json();
    
    // Validate the request body
    if (!body.eventTitle?.trim()) {
      console.error('Validation failed:', {
        hasEventTitle: !!body.eventTitle?.trim(),
        receivedBody: body
      });
      return NextResponse.json(
        { 
          error: 'Please provide Event Title',
          details: { missingFields: ['Event Title'] }
        },
        { status: 400 }
      );
    }
    
    // Prepare the input for the agent
    const preparationInput: ExtendedPreparationInput = {
      eventTitle: body.eventTitle.trim(),
      eventDescription: body.eventDescription?.trim() || '',
      eventDate: body.eventDate || '',
      eventTime: body.eventTime || '',
      attendees: body.attendees || [],
      previousMeetingNotes: body.previousMeetingNotes,
      userRole: body.userRole,
      eventType: body.eventType,
      location: body.location || 'San Francisco, CA', // Default location
    };
    
    console.log('Generating preparation materials for:', preparationInput.eventTitle);
    console.log('Using agent type:', preparationInput.eventType || 'default');
    
    // Generate preparation materials using the appropriate agent
    let preparationMaterials = await agentManager.generatePreparation(preparationInput);

    // If the preparation materials include location details, add commute information
    if ('locationDetails' in preparationMaterials && 
        preparationMaterials.locationDetails?.address) {
      try {
        const commuteInfo = await calculateCommute(
          preparationMaterials.locationDetails.address,
          preparationInput.location,
          preparationInput.eventDate,
          preparationInput.eventTime
        );
        
        preparationMaterials = {
          ...preparationMaterials,
          locationDetails: {
            ...preparationMaterials.locationDetails,
            commuteInfo
          }
        };
      } catch (error) {
        console.error('Error calculating commute:', error);
        // Continue without commute info if there's an error
      }
    }

    // If this is a holiday event, fetch local events
    if (preparationInput.eventType === 'holiday') {
      try {
        console.log('Fetching local events for holiday');
        const location = body.location || 'San Francisco, CA';
        console.log('Using location:', location);
        
        // Create a new request object with the local events data
        const eventsData = {
          eventType: preparationInput.eventTitle,
          date: preparationInput.eventDate,
          location: location
        };

        // Call the Perplexity events handler directly
        const eventsResponse = await perplexityEventsHandler(new NextRequest('http://localhost/api/perplexity-events', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(eventsData)
        }));
        
        if (eventsResponse.ok) {
          const responseData = await eventsResponse.json();
          console.log('Perplexity events API response:', responseData);
          
          if (responseData.events) {
            // Ensure preparationMaterials has the HolidayPreparationOutput structure
            if (!('traditionSuggestions' in preparationMaterials)) {
              preparationMaterials.traditionSuggestions = [];
            }
            preparationMaterials.localEvents = responseData.events;
            console.log('Successfully added local events to preparation:', {
              eventCount: responseData.events.length,
              firstEvent: responseData.events[0]
            });
          } else {
            console.log('No events found in Perplexity response');
          }
        } else {
          const errorText = await eventsResponse.text();
          console.error('Failed to fetch events from Perplexity:', errorText);
        }
      } catch (error) {
        console.error('Error fetching local events:', error);
      }
    }
    
    console.log('Final preparation materials:', {
      isHoliday: preparationInput.eventType === 'holiday',
      hasLocalEvents: 'localEvents' in preparationMaterials,
      localEventsCount: preparationMaterials.localEvents?.length
    });
    
    console.log('Preparation materials generated successfully');
    
    // Return the preparation materials
    return NextResponse.json(preparationMaterials);
  } catch (error) {
    let requestBody;
    try {
      requestBody = await request.clone().json();
    } catch {
      requestBody = {};
    }
    
    console.error('Error in preparation API:', error);
    console.error('Request details:', {
      eventType: requestBody?.eventType,
      userRole: requestBody?.userRole,
      title: requestBody?.eventTitle
    });
    
    const errorMessage = error instanceof Error ? error.message : 'Failed to generate preparation materials';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
} 