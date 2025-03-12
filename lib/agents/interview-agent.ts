import { BaseAgent } from './base-agent';
import { PreparationInput } from '@/lib/ai-utils';
import { InterviewPreparationOutput } from './agent-types';

export class InterviewAgent extends BaseAgent {
  generatePrompt(input: PreparationInput): string {
    const isInterviewer = input.userRole?.toLowerCase().includes('interviewer');
    
    return `
      You are an AI assistant helping to prepare for an interview.
      
      Interview Details:
      - Title: ${input.eventTitle}
      - Description: ${input.eventDescription}
      - Date: ${input.eventDate}
      - Time: ${input.eventTime}
      - Participants: ${input.attendees.join(', ')}
      - Your Role: ${isInterviewer ? 'Interviewer' : 'Interviewee'}
      
      Based on these details, please provide:
      1. A concise summary of the interview (2-3 sentences)
      2. 5-7 key points to remember for this interview
      3. A suggested approach for the interview (3-4 sentences)
      4. 6-8 preparation questions to consider before the interview${isInterviewer ? ' (including good questions to ask the candidate)' : ' (including likely questions you may be asked)'}
      5. 4-6 relevant topics that might come up during the interview
      6. 3-5 suggested action items to complete before the interview
      7. 4-6 common pitfalls to avoid during this type of interview
      8. A strategy for following up after the interview (2-3 sentences)
      9. 3-5 specific topics to research before the interview
      ${isInterviewer ? 
        '10. 4-6 evaluation criteria to consider for assessing the candidate' :
        '10. 4-6 relevant experiences or skills to highlight during the interview'}
      
      Format your response as JSON with the following structure:
      {
        "summary": "string",
        "keyPoints": ["string", "string", ...],
        "suggestedApproach": "string",
        "questions": ["string", "string", ...],
        "relevantTopics": ["string", "string", ...],
        "actionItems": ["string", "string", ...],
        "commonPitfalls": ["string", "string", ...],
        "followUpStrategy": "string",
        "researchTopics": ["string", "string", ...],
        ${isInterviewer ?
          '"evaluationCriteria": ["string", "string", ...]' :
          '"relevantExperiencePoints": ["string", "string", ...]'
        }
      }
    `;
  }

  getSystemMessage(): string {
    return 'You are a career and interview specialist assistant that helps prepare for interviews. Your responses should be professional, insightful, and targeted to help the user succeed in their interview, whether they are the interviewer or interviewee.';
  }
  
  // Override to ensure correct typing
  async generatePreparationMaterials(input: PreparationInput): Promise<InterviewPreparationOutput> {
    return await super.generatePreparationMaterials(input) as InterviewPreparationOutput;
  }
} 