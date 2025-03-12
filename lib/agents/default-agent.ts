import { BaseAgent } from './base-agent';
import { PreparationInput } from '@/lib/ai-utils';

export class DefaultAgent extends BaseAgent {
  generatePrompt(input: PreparationInput): string {
    return `
      You are an AI assistant helping to prepare for a meeting or event.
      
      Event Details:
      - Title: ${input.eventTitle}
      - Description: ${input.eventDescription}
      - Date: ${input.eventDate}
      - Time: ${input.eventTime}
      - Attendees: ${input.attendees.join(', ')}
      ${input.previousMeetingNotes ? `- Previous Meeting Notes: ${input.previousMeetingNotes}` : ''}
      ${input.userRole ? `- Your Role: ${input.userRole}` : ''}
      
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
  }

  getSystemMessage(): string {
    return 'You are a helpful assistant that generates meeting preparation materials. Your responses should be professional, concise, and actionable.';
  }
} 