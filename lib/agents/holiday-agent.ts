import { BaseAgent } from './base-agent';
import { PreparationInput } from '@/lib/ai-utils';

export class HolidayAgent extends BaseAgent {
  generatePrompt(input: PreparationInput): string {
    const isHost = input.userRole?.toLowerCase().includes('host') || 
                   input.userRole?.toLowerCase().includes('organizer');
    
    return `
      You are an AI assistant helping to prepare for a holiday event or celebration.
      
      Holiday Event Details:
      - Event: ${input.eventTitle}
      - Description: ${input.eventDescription}
      - Date: ${input.eventDate}
      - Time: ${input.eventTime}
      - Attendees: ${input.attendees.join(', ')}
      - Your Role: ${isHost ? 'Host/Organizer' : 'Guest/Participant'}
      
      Based on these details, please provide:
      1. A concise summary of the holiday event (2-3 sentences)
      2. 4-6 key things to remember for this holiday celebration
      3. A suggested approach for ${isHost ? 'hosting this event' : 'participating in this event'} (3-4 sentences)
      4. 4-6 preparation considerations ${isHost ? '(decor, food, activities, gifts, etc.)' : '(gifts, what to bring, appropriate attire, etc.)'}
      5. 3-5 relevant traditions or customs associated with this holiday or event
      6. ${isHost ? '4-6 suggested items for your hosting checklist' : '2-4 suggested ways to contribute to the event'}
      
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
    return 'You are a holiday and celebration expert that helps people prepare for festive occasions. Your suggestions should be festive, thoughtful, and culturally aware. Help the user create or participate in memorable holiday experiences while being mindful of traditions and customs associated with the specific holiday.';
  }
} 