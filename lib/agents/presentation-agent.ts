import { BaseAgent } from './base-agent';
import { PreparationInput } from '@/lib/ai-utils';

export class PresentationAgent extends BaseAgent {
  generatePrompt(input: PreparationInput): string {
    const isPresenter = input.userRole?.toLowerCase().includes('presenter') || 
                         input.userRole?.toLowerCase().includes('speaker') ||
                         input.userRole?.toLowerCase().includes('host');
    
    return `
      You are an AI assistant helping to prepare for a presentation or public speaking event.
      
      Presentation Details:
      - Title: ${input.eventTitle}
      - Description: ${input.eventDescription}
      - Date: ${input.eventDate}
      - Time: ${input.eventTime}
      - Audience: ${input.attendees.join(', ')}
      - Your Role: ${isPresenter ? 'Presenter/Speaker' : 'Audience Member'}
      
      Based on these details, please provide:
      1. A concise summary of the presentation (2-3 sentences)
      2. ${isPresenter ? '5-7 key points to cover or emphasize in your presentation' : '4-6 key points to look for in this presentation'}
      3. ${isPresenter ? 'A suggested approach for delivering an engaging presentation (3-4 sentences)' : 'A suggested approach for getting the most value from this presentation (3-4 sentences)'}
      4. ${isPresenter ? '6-8 preparation questions to consider before presenting' : '4-6 questions you might want to ask the presenter'}
      5. 4-6 relevant topics that might enhance your understanding of the presentation subject
      6. ${isPresenter ? '3-5 suggested preparation tasks to complete before presenting' : '2-4 ways to prepare for attending this presentation'}
      
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
    return 'You are a public speaking and presentation expert. Your guidance helps people deliver or attend presentations effectively. Provide advice that is tailored to the user\'s role, focusing on engaging delivery techniques for presenters or effective learning strategies for audience members.';
  }
} 