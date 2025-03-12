import OpenAI from 'openai';
import { PreparationInput, PreparationOutput } from '@/lib/ai-utils';

export abstract class BaseAgent {
  protected openai: OpenAI;
  
  constructor() {
    // Initialize OpenAI client with OpenRouter base URL
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      baseURL: 'https://openrouter.ai/api/v1',
      defaultHeaders: {
        'HTTP-Referer': 'https://smartcal.app',
        'X-Title': 'SmartCal',
      },
    });
  }

  // Abstract method that each agent must implement
  abstract generatePrompt(input: PreparationInput): string;
  
  // The system message that defines the agent's personality and expertise
  abstract getSystemMessage(): string;

  // Common method to generate preparation materials using the agent-specific prompt
  async generatePreparationMaterials(input: PreparationInput): Promise<PreparationOutput> {
    const prompt = this.generatePrompt(input);
    
    try {
      const response = await this.openai.chat.completions.create({
        model: 'openai/gpt-4-turbo', // OpenRouter model format
        messages: [
          { role: 'system', content: this.getSystemMessage() },
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
} 