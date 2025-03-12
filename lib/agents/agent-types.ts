import { PreparationOutput } from '@/lib/ai-utils';

// For social events
export interface SocialPreparationOutput extends PreparationOutput {
  icebreakers: string[];
  dressCode?: string;
  giftSuggestions?: string[];
  venueInfo?: string;
}

// For interviews
export interface InterviewPreparationOutput extends PreparationOutput {
  commonPitfalls: string[];
  followUpStrategy: string;
  researchTopics: string[];
  relevantExperiencePoints?: string[];
}

// For learning events
export interface LearningPreparationOutput extends PreparationOutput {
  prerequisites: string[];
  recommendedResources: string[];
  noteTakingStrategy?: string;
  postEventPractice?: string[];
}

// For health appointments
export interface HealthPreparationOutput extends PreparationOutput {
  medicalHistoryItems: string[];
  symptomTracking?: string;
  healthMetricsToReview?: string[];
  followUpQuestions?: string[];
}

// For business meetings
export interface BusinessPreparationOutput extends PreparationOutput {
  stakeholderInterests: string[];
  negotiationPoints?: string[];
  marketInsights?: string[];
  competitiveAnalysis?: string;
}

// For presentations
export interface PresentationPreparationOutput extends PreparationOutput {
  slideDeckTips: string[];
  deliveryTechniques: string[];
  audienceEngagementStrategies: string[];
  visualAidSuggestions?: string[];
}

// For holiday events
export interface HolidayPreparationOutput extends PreparationOutput {
  traditionSuggestions: string[];
  culturalNotes?: string[];
  decorationIdeas?: string[];
  foodAndBeverages?: string[];
  musicPlaylist?: string[];
  giftExchangeRules?: string;
  localEvents?: {
    name: string;
    description?: string;
    location: string;
    date?: string;
    time?: string;
    link?: string;
    source: string;
    distance?: string;
    rating?: number;
    attendees?: number;
  }[];
  holidayHistory?: string;
  customTraditions?: string[];
  dietaryConsiderations?: string[];
  weatherConsiderations?: string;
  attireRecommendations?: string;
  photographyTips?: string[];
  budgetingTips?: string[];
} 