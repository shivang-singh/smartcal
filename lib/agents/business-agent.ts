import { BaseAgent } from './base-agent';
import { PreparationInput } from '@/lib/ai-utils';

export class BusinessAgent extends BaseAgent {
  generatePrompt(input: PreparationInput): string {
    const isClientMeeting = input.eventType?.toLowerCase().includes('client');
    
    return `
      You are an AI assistant helping to prepare for a business meeting${isClientMeeting ? ' with a client' : ''}.
      
      Business Meeting Details:
      - Meeting: ${input.eventTitle}
      - Description: ${input.eventDescription}
      - Date: ${input.eventDate}
      - Time: ${input.eventTime}
      - Attendees: ${input.attendees.join(', ')}
      ${input.userRole ? `- Your Role: ${input.userRole}` : ''}
      ${input.previousMeetingNotes ? `- Previous Meeting Notes: ${input.previousMeetingNotes}` : ''}
      
      Based on these details, please provide:
      1. A concise summary of the business meeting (2-3 sentences)
      2. 5-7 key points to prepare for this meeting
      3. A suggested approach for ${isClientMeeting ? 'handling this client interaction' : 'conducting this business meeting'} (3-4 sentences)
      4. 6-8 preparation questions to consider before the meeting
      5. 4-6 relevant business topics or industry trends that might be valuable to discuss
      6. 3-5 suggested action items to complete before the meeting
      
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
    return 'You are a business strategy consultant that helps professionals prepare for important business meetings. Your suggestions should be strategic, professional, and focused on achieving business objectives. Help the user establish or maintain strong business relationships and drive successful outcomes.';
  }
} 