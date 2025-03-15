import { BaseAgent } from './base-agent';
import { PreparationInput } from '@/lib/ai-utils';
import { FitnessPreparationOutput } from './agent-types';

export class FitnessAgent extends BaseAgent {
  generatePrompt(input: PreparationInput): string {
    const isTeamSport = input.eventTitle.toLowerCase().includes('game') || 
                       input.eventTitle.toLowerCase().includes('match') ||
                       input.eventTitle.toLowerCase().includes('league');
    
    return `
      You are an AI assistant helping to prepare for a sports or fitness activity.
      
      Fitness Event Details:
      - Event: ${input.eventTitle}
      - Description: ${input.eventDescription}
      - Date: ${input.eventDate}
      - Time: ${input.eventTime}
      - Participants: ${input.attendees.join(', ')}
      - Your Role: ${input.userRole || 'Participant'}
      
      Based on these details, please provide:
      1. A concise summary of the fitness event (2-3 sentences)
      2. 4-6 key points to remember for this activity
      3. A suggested approach for the event (3-4 sentences)
      4. 4-6 preparation questions to consider
      5. 3-5 relevant topics or skills to focus on
      6. 3-5 action items to complete before the event
      7. List of required equipment or gear
      8. Recommended warm-up routine
      9. Nutrition and hydration guidelines
      10. Weather considerations and appropriate precautions
      ${isTeamSport ? `
      11. Team information including:
          - Team name (if applicable)
          - Opponent details
          - League information
          - Uniform requirements
      ` : ''}
      12. Location details including:
          - Venue name
          - Address
          - Parking information
          - Available facilities/amenities
      13. 3-5 fitness goals for this activity
      14. Recovery tips and post-activity care
      15. Safety precautions and guidelines
      16. Key performance metrics to track
      
      Format your response as JSON with the following structure:
      {
        "summary": "string",
        "keyPoints": ["string", "string", ...],
        "suggestedApproach": "string",
        "questions": ["string", "string", ...],
        "relevantTopics": ["string", "string", ...],
        "actionItems": ["string", "string", ...],
        "equipmentNeeded": ["string", "string", ...],
        "warmupRoutine": ["string", "string", ...],
        "nutritionTips": ["string", "string", ...],
        "hydrationGuidelines": "string",
        "weatherConsiderations": "string",
        "locationDetails": {
          "name": "string",
          "address": "string",
          "parkingInfo": "string",
          "facilityAmenities": ["string", "string", ...]
        },
        ${isTeamSport ? `
        "teamInfo": {
          "teamName": "string",
          "opponents": "string",
          "leagueInfo": "string",
          "uniformRequirements": "string"
        },` : ''}
        "fitnessGoals": ["string", "string", ...],
        "recoveryTips": ["string", "string", ...],
        "safetyPrecautions": ["string", "string", ...],
        "performanceMetrics": ["string", "string", ...]
      }
    `;
  }

  getSystemMessage(): string {
    return 'You are a fitness and sports preparation specialist that helps people prepare for athletic activities and sporting events. Your guidance is practical, safety-focused, and aimed at optimizing performance while preventing injury. Provide specific, actionable advice tailored to the type of activity while maintaining a supportive and encouraging tone.';
  }
  
  // Override to ensure correct typing
  async generatePreparationMaterials(input: PreparationInput): Promise<FitnessPreparationOutput> {
    return await super.generatePreparationMaterials(input) as FitnessPreparationOutput;
  }
} 