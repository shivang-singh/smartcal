import { BaseAgent } from './base-agent';
import { PreparationInput } from '@/lib/ai-utils';
import { SocialPreparationOutput } from './agent-types';

export class SocialAgent extends BaseAgent {
  generatePrompt(input: PreparationInput): string {
    return `
      You are an AI assistant helping to prepare for a social event or gathering.
      
      Social Event Details:
      - Event: ${input.eventTitle}
      - Description: ${input.eventDescription}
      - Date: ${input.eventDate}
      - Time: ${input.eventTime}
      - Attendees: ${input.attendees.join(', ')}
      ${input.userRole ? `- Your Role: ${input.userRole}` : ''}
      
      Based on these details, please provide:
      1. A concise summary of the social event (2-3 sentences)
      2. 4-6 key things to remember for this event
      3. A suggested approach for the social gathering (3-4 sentences focusing on enjoyment and connection)
      4. 4-6 conversation starters or topics to discuss
      5. 3-5 relevant interests or topics you might share with other attendees
      6. 2-4 suggested items to bring or arrangements to make before the event
      7. 5-7 icebreakers or conversation starters specific to this event
      8. Appropriate dress code suggestions based on the event context
      9. Gift suggestions if applicable to this type of social gathering
      10. Any venue-specific information or tips that might be helpful
      
      Format your response as JSON with the following structure:
      {
        "summary": "string",
        "keyPoints": ["string", "string", ...],
        "suggestedApproach": "string",
        "questions": ["string", "string", ...],
        "relevantTopics": ["string", "string", ...],
        "actionItems": ["string", "string", ...],
        "icebreakers": ["string", "string", ...],
        "dressCode": "string", 
        "giftSuggestions": ["string", "string", ...],
        "venueInfo": "string"
      }
    `;
  }

  getSystemMessage(): string {
    return 'You are a social engagement expert who helps people prepare for social events. Your suggestions should be warm, friendly, and help the user build connections and enjoy their social experience. Focus on making the user feel comfortable and confident in social settings.';
  }
  
  // Override to ensure correct typing
  async generatePreparationMaterials(input: PreparationInput): Promise<SocialPreparationOutput> {
    return await super.generatePreparationMaterials(input) as SocialPreparationOutput;
  }
} 