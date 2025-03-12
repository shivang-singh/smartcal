import { BaseAgent } from './base-agent';
import { PreparationInput } from '@/lib/ai-utils';
import { LearningPreparationOutput } from './agent-types';

export class LearningAgent extends BaseAgent {
  generatePrompt(input: PreparationInput): string {
    const isInstructor = input.userRole?.toLowerCase().includes('instructor') || 
                        input.userRole?.toLowerCase().includes('teacher') || 
                        input.userRole?.toLowerCase().includes('presenter');
    
    return `
      You are an AI assistant helping to prepare for a learning event, such as a workshop, class, or training session.
      
      Learning Event Details:
      - Title: ${input.eventTitle}
      - Description: ${input.eventDescription}
      - Date: ${input.eventDate}
      - Time: ${input.eventTime}
      - Participants: ${input.attendees.join(', ')}
      - Your Role: ${isInstructor ? 'Instructor/Presenter' : 'Learner/Participant'}
      
      Based on these details, please provide:
      1. A concise summary of the learning event (2-3 sentences)
      2. 5-7 key concepts or skills likely to be covered
      3. A suggested approach for maximizing learning ${isInstructor ? 'and teaching effectiveness' : ''}(3-4 sentences)
      4. 5-7 preparation questions to consider before the event${isInstructor ? ' (focusing on teaching preparation)' : ' (focusing on pre-learning or questions to ask)'}
      5. 4-6 relevant topics that might be useful to explore before the event
      6. 3-5 suggested resources to review or materials to prepare before the event
      7. 3-5 prerequisites or foundational knowledge needed for this learning event
      8. 4-6 recommended resources (books, articles, videos, etc.) relevant to the topic
      9. ${isInstructor ? 'Effective teaching strategies for this subject matter' : 'A recommended note-taking strategy for this type of learning event'}
      10. 3-5 post-event practice activities or exercises to reinforce learning
      
      Format your response as JSON with the following structure:
      {
        "summary": "string",
        "keyPoints": ["string", "string", ...],
        "suggestedApproach": "string",
        "questions": ["string", "string", ...],
        "relevantTopics": ["string", "string", ...],
        "actionItems": ["string", "string", ...],
        "prerequisites": ["string", "string", ...],
        "recommendedResources": ["string", "string", ...],
        "noteTakingStrategy": "string",
        "postEventPractice": ["string", "string", ...]
      }
    `;
  }

  getSystemMessage(): string {
    return 'You are an education specialist that helps prepare for learning events such as workshops, classes, or training sessions. Your suggestions should be educational, practical, and focused on maximizing learning outcomes. Provide insights that help with effective knowledge acquisition or teaching, depending on the user\'s role.';
  }
  
  // Override to ensure correct typing
  async generatePreparationMaterials(input: PreparationInput): Promise<LearningPreparationOutput> {
    return await super.generatePreparationMaterials(input) as LearningPreparationOutput;
  }
} 