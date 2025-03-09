import { NextRequest, NextResponse } from 'next/server';
import { generatePreparationMaterials, PreparationInput } from '@/lib/ai-utils';

export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const body = await request.json();
    
    // Validate the request body
    if (!body.eventTitle || !body.eventDescription) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Generate preparation materials
    const preparationInput: PreparationInput = {
      eventTitle: body.eventTitle,
      eventDescription: body.eventDescription,
      eventDate: body.eventDate || '',
      eventTime: body.eventTime || '',
      attendees: body.attendees || [],
      previousMeetingNotes: body.previousMeetingNotes,
      userRole: body.userRole,
      eventType: body.eventType,
    };
    
    console.log('Generating preparation materials for:', preparationInput.eventTitle);
    const preparationMaterials = await generatePreparationMaterials(preparationInput);
    console.log('Preparation materials generated successfully');
    
    // Return the preparation materials
    return NextResponse.json(preparationMaterials);
  } catch (error) {
    console.error('Error in preparation API:', error);
    return NextResponse.json(
      { error: 'Failed to generate preparation materials' },
      { status: 500 }
    );
  }
} 