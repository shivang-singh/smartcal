import OpenAI from 'openai';

// Types for preparation workflow
export interface PreparationInput {
  eventTitle: string;
  eventDescription: string;
  eventDate: string;
  eventTime: string;
  attendees: string[];
  previousMeetingNotes?: string;
  userRole?: string;
  eventType?: string;
}

export interface PreparationOutput {
  summary: string;
  keyPoints: string[];
  suggestedApproach: string;
  questions: string[];
  relevantTopics: string[];
  actionItems?: string[];
}

// Function to generate preparation materials using LLM
export async function generatePreparationMaterials(
  input: PreparationInput
): Promise<PreparationOutput> {
  // Initialize OpenAI client with OpenRouter base URL
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: 'https://openrouter.ai/api/v1',
    defaultHeaders: {
      'HTTP-Referer': 'https://smartcal.app', // Replace with your actual domain
      'X-Title': 'SmartCal',
    },
  });

  const prompt = `
    You are an AI assistant helping to prepare for a meeting or event.
    
    Event Details:
    - Title: ${input.eventTitle}
    - Description: ${input.eventDescription}
    - Date: ${input.eventDate}
    - Time: ${input.eventTime}
    - Attendees: ${input.attendees.join(', ')}
    ${input.previousMeetingNotes ? `- Previous Meeting Notes: ${input.previousMeetingNotes}` : ''}
    ${input.userRole ? `- Your Role: ${input.userRole}` : ''}
    ${input.eventType ? `- Event Type: ${input.eventType}` : ''}
    
    Based on these details, please provide:
    1. A concise summary of the event (2-3 sentences)
    2. 4-6 key points to remember for this event
    3. A suggested approach for the event (3-4 sentences)
    4. 4-6 preparation questions to consider before the event
    5. 3-5 relevant topics that might come up during the event
    6. 2-4 suggested action items to complete before the event
    
    Format your response as JSON with the following structure:
    {
      "summary": "string",
      "keyPoints": ["string", "string", ...],
      "suggestedApproach": "string",
      "questions": ["string", "string", ...],
      "relevantTopics": ["string", "string", ...],
      "actionItems": ["string", "string", ...]
    }
  `;

  try {
    const response = await openai.chat.completions.create({
      model: 'openai/gpt-4-turbo',  // OpenRouter model format
      messages: [
        { role: 'system', content: 'You are a helpful assistant that generates meeting preparation materials. Your responses should be professional, concise, and actionable.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      response_format: { type: "json_object" }
    });

    // Parse the response as JSON
    const responseText = response.choices[0]?.message.content || '';
    
    try {
      const parsedResponse = JSON.parse(responseText) as PreparationOutput;
      return parsedResponse;
    } catch (parseError) {
      console.error('Error parsing LLM response as JSON:', parseError);
      throw new Error('Failed to parse LLM response');
    }
  } catch (error) {
    console.error('Error generating preparation materials:', error);
    // Return fallback data if there's an error
    return {
      summary: "Failed to generate summary. Please try again later.",
      keyPoints: ["Error generating key points"],
      suggestedApproach: "Error generating approach",
      questions: ["Error generating questions"],
      relevantTopics: ["Error generating topics"],
      actionItems: ["Error generating action items"],
    };
  }
} 