import { BaseAgent } from './base-agent';
import { PreparationInput, PreparationOutput } from '@/lib/ai-utils';

// Interface for the agent registry map
export interface AgentRegistry {
  [key: string]: BaseAgent;
}

// Class to manage all available agents
export class AgentManager {
  private static instance: AgentManager;
  private registry: AgentRegistry = {};

  // Private constructor for singleton pattern
  private constructor() {}

  // Get singleton instance
  public static getInstance(): AgentManager {
    if (!AgentManager.instance) {
      AgentManager.instance = new AgentManager();
    }
    return AgentManager.instance;
  }

  // Register a new agent
  public registerAgent(type: string, agent: BaseAgent): void {
    this.registry[type] = agent;
  }

  // Get an agent by type
  public getAgent(type: string): BaseAgent | undefined {
    return this.registry[type];
  }

  // Get all registered agent types
  public getAgentTypes(): string[] {
    return Object.keys(this.registry);
  }

  // Generate preparation materials using the appropriate agent
  public async generatePreparation(
    input: PreparationInput
  ): Promise<PreparationOutput> {
    const agentType = input.eventType || 'default';
    const agent = this.getAgent(agentType);
    
    if (!agent) {
      throw new Error(`No agent found for type: ${agentType}`);
    }
    
    return await agent.generatePreparationMaterials(input);
  }
} 