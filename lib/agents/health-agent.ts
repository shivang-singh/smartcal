import { BaseAgent } from './base-agent';
import { PreparationInput } from '@/lib/ai-utils';
import { HealthPreparationOutput } from './agent-types';

export class HealthAgent extends BaseAgent {
  generatePrompt(input: PreparationInput): string {
    const isProvider = input.userRole?.toLowerCase().includes('doctor') || 
                      input.userRole?.toLowerCase().includes('provider') ||
                      input.userRole?.toLowerCase().includes('therapist') ||
                      input.userRole?.toLowerCase().includes('practitioner');
    
    return `
      You are an AI assistant helping to prepare for a health-related appointment or wellness event.
      
      Health Event Details:
      - Event: ${input.eventTitle}
      - Description: ${input.eventDescription}
      - Date: ${input.eventDate}
      - Time: ${input.eventTime}
      - Participants: ${input.attendees.join(', ')}
      - Your Role: ${isProvider ? 'Healthcare Provider' : 'Patient/Participant'}
      
      Based on these details, please provide:
      1. A concise summary of the health appointment/event (2-3 sentences)
      2. 4-6 key points to remember for this health interaction
      3. A suggested approach for ${isProvider ? 'conducting this health session' : 'getting the most out of this health appointment'} (3-4 sentences)
      4. ${isProvider ? '5-7 assessment questions to consider' : '5-7 questions to ask your healthcare provider'}
      5. 3-5 relevant health topics or considerations that might be valuable to review
      6. ${isProvider ? '3-5 preparation items to have ready' : '3-5 items to prepare or bring to your appointment'}
      7. ${isProvider ? '4-6 patient history items to review before the appointment' : '4-6 medical history items to bring or have ready'}
      8. ${isProvider ? 'Suggested documentation approach for this visit' : 'How to track symptoms or health metrics relevant to this appointment'}
      9. ${isProvider ? '3-5 evidence-based approaches to consider' : '3-5 health metrics to review before your appointment'}
      10. ${isProvider ? '4-6 potential follow-up recommendations' : '4-6 follow-up questions to consider if time permits'}
      
      Format your response as JSON with the following structure:
      {
        "summary": "string",
        "keyPoints": ["string", "string", ...],
        "suggestedApproach": "string",
        "questions": ["string", "string", ...],
        "relevantTopics": ["string", "string", ...],
        "actionItems": ["string", "string", ...],
        "medicalHistoryItems": ["string", "string", ...],
        "symptomTracking": "string",
        "healthMetricsToReview": ["string", "string", ...],
        "followUpQuestions": ["string", "string", ...]
      }
    `;
  }

  getSystemMessage(): string {
    return 'You are a health preparation specialist that helps people prepare for medical appointments and wellness events. Your guidance is supportive, practical, and focused on health outcomes. Provide suggestions that help the user have productive health-related interactions while being mindful of medical privacy and avoiding specific medical advice. Focus on preparation strategies rather than diagnosing or treating conditions.';
  }
  
  // Override to ensure correct typing
  async generatePreparationMaterials(input: PreparationInput): Promise<HealthPreparationOutput> {
    return await super.generatePreparationMaterials(input) as HealthPreparationOutput;
  }
} 