import { AgentManager } from './agent-registry';
import { DefaultAgent } from './default-agent';
import { InterviewAgent } from './interview-agent';
import { SocialAgent } from './social-agent';
import { LearningAgent } from './learning-agent';
import { HolidayAgent } from './holiday-agent';
import { BusinessAgent } from './business-agent';
import { PresentationAgent } from './presentation-agent';
import { HealthAgent } from './health-agent';
import { FitnessAgent } from './fitness-agent';

// Initialize the agent manager
const agentManager = AgentManager.getInstance();

// Register all agents
export function registerAgents() {
  // Default agent (fallback)
  agentManager.registerAgent('default', new DefaultAgent());
  
  // Specialized agents
  agentManager.registerAgent('interview', new InterviewAgent());
  agentManager.registerAgent('social', new SocialAgent());
  agentManager.registerAgent('workshop', new LearningAgent());
  agentManager.registerAgent('learning', new LearningAgent());
  agentManager.registerAgent('training', new LearningAgent());
  agentManager.registerAgent('holiday', new HolidayAgent());
  agentManager.registerAgent('celebration', new HolidayAgent());
  agentManager.registerAgent('business', new BusinessAgent());
  agentManager.registerAgent('client', new BusinessAgent());
  agentManager.registerAgent('meeting', new BusinessAgent());
  agentManager.registerAgent('presentation', new PresentationAgent());
  agentManager.registerAgent('speech', new PresentationAgent());
  agentManager.registerAgent('health', new HealthAgent());
  agentManager.registerAgent('medical', new HealthAgent());
  agentManager.registerAgent('wellness', new HealthAgent());
  agentManager.registerAgent('fitness', new FitnessAgent());
  agentManager.registerAgent('sports', new FitnessAgent());
  agentManager.registerAgent('game', new FitnessAgent());
  agentManager.registerAgent('match', new FitnessAgent());
}

// Export the agent manager for use in the application
export { agentManager };

// Export agent classes for direct use if needed
export * from './base-agent';
export * from './agent-registry';
export * from './default-agent';
export * from './interview-agent';
export * from './social-agent';
export * from './learning-agent';
export * from './holiday-agent';
export * from './business-agent';
export * from './presentation-agent';
export * from './health-agent'; 