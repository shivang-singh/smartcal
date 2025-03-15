import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, RefreshCw } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { PreparationOutput } from "@/lib/ai-utils";
import { Input } from "@/components/ui/input";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { 
  SocialPreparationOutput, 
  InterviewPreparationOutput,
  HealthPreparationOutput,
  BusinessPreparationOutput,
  PresentationPreparationOutput,
  LearningPreparationOutput,
  HolidayPreparationOutput,
  FitnessPreparationOutput
} from '@/lib/agents/agent-types';

interface EventPreparationProps {
  event: {
    id: string;
    title: string;
    description: string;
    date: string;
    time: string;
    attendees: string[];
  };
  cachedClassification?: ClassificationResult | null;
  cachedPreparation?: PreparationOutput | null;
  onClassificationComplete?: (classification: ClassificationResult) => void;
  onPreparationComplete?: (preparation: PreparationOutput) => void;
}

interface ClassificationResult {
  eventType: string;
  userRole: string;
  confidence: number;
  error?: string;
  details?: string;
}

const EVENT_TYPES = [
  { value: "meeting", label: "Regular Meeting" },
  { value: "presentation", label: "Presentation" },
  { value: "interview", label: "Interview" },
  { value: "workshop", label: "Workshop or Training" },
  { value: "conference", label: "Conference" },
  { value: "client", label: "Client Meeting" },
  { value: "team", label: "Team Meeting" },
  { value: "1on1", label: "1:1 Meeting" },
  { value: "social", label: "Social Gathering" },
  { value: "holiday", label: "Holiday Celebration" },
  { value: "learning", label: "Learning Event" },
  { value: "business", label: "Business Meeting" },
  { value: "health", label: "Medical Appointment" },
  { value: "wellness", label: "Wellness Event" },
  { value: "fitness", label: "Sports & Fitness" },
];

const USER_ROLES = [
  { value: "host", label: "Host/Organizer" },
  { value: "presenter", label: "Presenter" },
  { value: "participant", label: "Participant" },
  { value: "manager", label: "Manager" },
  { value: "team_member", label: "Team Member" },
  { value: "client", label: "Client" },
  { value: "interviewer", label: "Interviewer" },
  { value: "interviewee", label: "Interviewee" },
];

// Type guard functions
const hasSocialFields = (data: PreparationOutput): data is SocialPreparationOutput => {
  return 'icebreakers' in data;
};

const hasFitnessFields = (data: PreparationOutput): data is FitnessPreparationOutput => {
  return 'equipmentNeeded' in data;
};

const hasInterviewFields = (data: PreparationOutput): data is InterviewPreparationOutput => {
  return 'commonPitfalls' in data && 'followUpStrategy' in data;
};

const hasHealthFields = (data: PreparationOutput): data is HealthPreparationOutput => {
  return 'medicalHistoryItems' in data;
};

const hasBusinessFields = (data: PreparationOutput): data is BusinessPreparationOutput => {
  return 'stakeholderInterests' in data;
};

const hasPresentationFields = (data: PreparationOutput): data is PresentationPreparationOutput => {
  return 'slideDeckTips' in data;
};

const hasLearningFields = (data: PreparationOutput): data is LearningPreparationOutput => {
  return 'prerequisites' in data;
};

const hasHolidayFields = (data: PreparationOutput): data is HolidayPreparationOutput => {
  console.log('Checking holiday fields:', {
    hasTraditionalSuggestions: 'traditionSuggestions' in data,
    hasLocalEvents: 'localEvents' in data,
    data: data
  });
  return 'traditionSuggestions' in data || 'localEvents' in data;
};

export function EventPreparation({ 
  event, 
  cachedClassification, 
  cachedPreparation,
  onClassificationComplete,
  onPreparationComplete 
}: EventPreparationProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isClassifying, setIsClassifying] = useState(!cachedClassification);
  const [preparationData, setPreparationData] = useState<PreparationOutput | null>(cachedPreparation || null);
  const [userRole, setUserRole] = useState<string | null>(cachedClassification?.userRole || null);
  const [eventType, setEventType] = useState<string | null>(cachedClassification?.eventType || null);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [classification, setClassification] = useState<ClassificationResult | null>(cachedClassification || null);
  const [location, setLocation] = useState<string>('San Francisco, CA');
  const { toast } = useToast();

  // Classify the event when component mounts or event details change, but only if not cached
  useEffect(() => {
    const classifyEvent = async () => {
      // Skip if we already have cached classification
      if (cachedClassification) {
        return;
      }

      setIsClassifying(true);
      try {
        const response = await fetch('/api/classify-event', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: event.title,
            description: event.description,
          }),
        });

        const result = await response.json();
        
        // If there's an error in the response, handle it
        if (result.error) {
          console.error('Classification error:', result);
          throw new Error(result.error);
        }

        // Validate the response has required fields
        if (!result.eventType || !result.userRole || typeof result.confidence !== 'number') {
          console.error('Invalid classification response:', result);
          throw new Error('Invalid response format from classification');
        }

        setClassification(result);
        setEventType(result.eventType);
        setUserRole(result.userRole);
        onClassificationComplete?.(result);
      } catch (error) {
        console.error('Error classifying event:', error);
        // Fallback to defaults if classification fails
        const fallback = {
          eventType: 'meeting',
          userRole: 'host',
          confidence: 0.5,
          error: error instanceof Error ? error.message : 'Unknown error'
        };
        setEventType(fallback.eventType);
        setUserRole(fallback.userRole);
        setClassification(fallback);
        onClassificationComplete?.(fallback);
      } finally {
        setIsClassifying(false);
      }
    };

    if (event.title && !cachedClassification) {
      classifyEvent();
    }
  }, [event.title, event.description, cachedClassification, onClassificationComplete]);

  const generatePreparation = async () => {
    // Use cached preparation if available
    if (cachedPreparation) {
      console.log('Using cached preparation:', cachedPreparation);
      setPreparationData(cachedPreparation);
      return;
    }

    setIsLoading(true);
    try {
      const requestPayload = {
        eventTitle: event.title,
        eventDescription: event.description,
        eventDate: event.date,
        eventTime: event.time,
        attendees: event.attendees,
        userRole,
        eventType,
        location: location || 'San Francisco, CA',
      };
      
      console.log('Sending preparation request with payload:', requestPayload);
      
      const response = await fetch('/api/preparation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestPayload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Preparation generation failed:', errorData);
        throw new Error(errorData.error || 'Failed to generate preparation materials');
      }

      const data = await response.json();
      console.log('Received preparation data:', data);
      
      // For holiday events, ensure we have the correct structure
      if (eventType === 'holiday') {
        console.log('Holiday event preparation:', {
          hasTraditionalSuggestions: 'traditionSuggestions' in data,
          hasLocalEvents: 'localEvents' in data,
          localEvents: data.localEvents
        });
      }

      setPreparationData(data);
      onPreparationComplete?.(data);
      toast({
        title: "Preparation materials generated",
        description: "AI has prepared materials for your event.",
      });
    } catch (error) {
      console.error('Error generating preparation:', error);
      toast({
        title: "Error",
        description: "Failed to generate preparation materials. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {!preparationData && (
        <Card>
          <CardHeader>
            <CardTitle>AI Preparation</CardTitle>
            <CardDescription>Generate AI-powered preparation materials for this event</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-md border border-blue-100">
              <h4 className="text-sm font-medium text-blue-800">Event Details</h4>
              <p className="text-xs text-blue-600 mt-1">
                <strong>Title:</strong> {event.title}
              </p>
              {event.description && (
                <p className="text-xs text-blue-600 mt-1">
                  <strong>Description:</strong> {event.description}
                </p>
              )}
              <p className="text-xs text-blue-600 mt-1">
                <strong>Type:</strong> {isClassifying ? (
                  <span className="text-muted-foreground">Classifying...</span>
                ) : (
                  <>
                    {EVENT_TYPES.find(t => t.value === eventType)?.label || eventType}
                    {classification?.confidence && classification.confidence < 0.7 && (
                      <span className="text-yellow-600 ml-2 text-xs">(best guess)</span>
                    )}
                  </>
                )}
              </p>
              <p className="text-xs text-blue-600 mt-1">
                <strong>Your Role:</strong> {isClassifying ? (
                  <span className="text-muted-foreground">Classifying...</span>
                ) : (
                  <>
                    {USER_ROLES.find(r => r.value === userRole)?.label || userRole}
                    {classification?.confidence && classification.confidence < 0.7 && (
                      <span className="text-yellow-600 ml-2 text-xs">(best guess)</span>
                    )}
                  </>
                )}
              </p>
              <p className="text-xs text-blue-600 mt-1">
                <strong>Date/Time:</strong> {event.date} at {event.time}
              </p>
              <p className="text-xs text-blue-600 mt-1">
                <strong>Attendees:</strong> {event.attendees.length > 0 
                  ? event.attendees.slice(0, 3).join(', ') + (event.attendees.length > 3 ? ` and ${event.attendees.length - 3} more` : '')
                  : 'None specified'}
              </p>
            </div>

            <div className="flex items-center justify-between space-x-2">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
                className="text-xs"
                disabled={isClassifying}
              >
                {showAdvancedOptions ? 'Hide Options' : 'Customize Type & Role'}
              </Button>
              {classification?.confidence && classification.confidence < 0.7 && (
                <p className="text-xs text-yellow-600">
                  AI is unsure about the event type/role. Please verify.
                </p>
              )}
            </div>

            {showAdvancedOptions && (
              <div className="grid grid-cols-2 gap-4 mt-2 border-t pt-4">
                <div className="space-y-2">
                  <Label htmlFor="event-type" className="flex items-center justify-between">
                    <span>Event Type</span>
                    {classification && eventType !== classification.eventType && (
                      <span className="text-xs text-muted-foreground">
                        AI suggested: {EVENT_TYPES.find(t => t.value === classification.eventType)?.label}
                      </span>
                    )}
                  </Label>
                  <Select 
                    value={eventType || undefined} 
                    onValueChange={(value) => {
                      setEventType(value);
                    }}
                    disabled={isClassifying}
                  >
                    <SelectTrigger id="event-type">
                      <SelectValue placeholder={isClassifying ? "Classifying..." : "Select event type"} />
                    </SelectTrigger>
                    <SelectContent>
                      {EVENT_TYPES.map((type) => (
                        <SelectItem 
                          key={type.value} 
                          value={type.value}
                          className={classification?.eventType === type.value ? 'font-medium' : ''}
                        >
                          {type.label}
                          {classification?.eventType === type.value && ' (AI suggested)'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="user-role" className="flex items-center justify-between">
                    <span>Your Role</span>
                    {classification && userRole !== classification.userRole && (
                      <span className="text-xs text-muted-foreground">
                        AI suggested: {USER_ROLES.find(r => r.value === classification.userRole)?.label}
                      </span>
                    )}
                  </Label>
                  <Select 
                    value={userRole || undefined} 
                    onValueChange={setUserRole}
                    disabled={isClassifying}
                  >
                    <SelectTrigger id="user-role">
                      <SelectValue placeholder={isClassifying ? "Classifying..." : "Select your role"} />
                    </SelectTrigger>
                    <SelectContent>
                      {USER_ROLES.map((role) => (
                        <SelectItem 
                          key={role.value} 
                          value={role.value}
                          className={classification?.userRole === role.value ? 'font-medium' : ''}
                        >
                          {role.label}
                          {classification?.userRole === role.value && ' (AI suggested)'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {eventType === 'holiday' && (
                  <div className="col-span-2 space-y-2">
                    <Label htmlFor="location" className="flex items-center justify-between">
                      <span>Location for Local Events</span>
                      <span className="text-xs text-muted-foreground">
                        Enter city or address
                      </span>
                    </Label>
                    <Input
                      id="location"
                      placeholder="Enter location (e.g., San Francisco, CA)"
                      value={location}
                      onChange={(e) => setLocation(e.target.value || 'San Francisco, CA')}
                      className="w-full"
                    />
                  </div>
                )}

                {classification?.confidence && (
                  <div className="col-span-2 mt-2">
                    <p className="text-xs text-muted-foreground">
                      AI Confidence: {(classification.confidence * 100).toFixed(0)}%
                      {classification.confidence < 0.7 && ' • Consider verifying these suggestions'}
                    </p>
                  </div>
                )}
              </div>
            )}
            
            <Button 
              onClick={generatePreparation} 
              disabled={isLoading || isClassifying || !event.title?.trim() || !eventType || !userRole}
              className="w-full mt-4"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : isClassifying ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Classifying Event...
                </>
              ) : !event.title?.trim() ? (
                "Please provide an event title"
              ) : !eventType || !userRole ? (
                "Waiting for classification..."
              ) : (
                "Generate Preparation Materials"
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {preparationData && (
        <>
          <div className="flex justify-end">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={generatePreparation} 
              disabled={isLoading}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Regenerate
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Event Summary</CardTitle>
              <CardDescription>AI-generated summary to help you prepare</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm">{preparationData?.summary}</p>
              </div>
            </CardContent>
          </Card>

          {preparationData?.keyPoints && preparationData.keyPoints.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Key Points</CardTitle>
                <CardDescription>Important aspects to remember</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="list-disc pl-5 space-y-2">
                  {preparationData.keyPoints.map((point, index) => (
                    <li key={index} className="text-sm">{point}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {preparationData?.suggestedApproach && (
            <Card>
              <CardHeader>
                <CardTitle>Suggested Approach</CardTitle>
                <CardDescription>Recommendations for this event</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-sm">{preparationData.suggestedApproach}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {preparationData?.questions && preparationData.questions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Preparation Questions</CardTitle>
                <CardDescription>Questions to consider before the event</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="list-disc pl-5 space-y-2">
                  {preparationData.questions.map((question, index) => (
                    <li key={index} className="text-sm">{question}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {preparationData?.relevantTopics && preparationData.relevantTopics.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Relevant Topics</CardTitle>
                <CardDescription>Topics that might come up during the event</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="list-disc pl-5 space-y-2">
                  {preparationData.relevantTopics.map((topic, index) => (
                    <li key={index} className="text-sm">{topic}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {preparationData?.actionItems && preparationData.actionItems.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Action Items</CardTitle>
                <CardDescription>Tasks to complete before the event</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="list-disc pl-5 space-y-2">
                  {preparationData.actionItems.map((item, index) => (
                    <li key={index} className="text-sm">{item}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {preparationData && hasSocialFields(preparationData) && preparationData.icebreakers && preparationData.icebreakers.length > 0 && (
            <>
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Social Preparation</CardTitle>
                  <CardDescription>Specialized tips for your social gathering</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="mb-4">
                    <h3 className="font-semibold mb-2">Icebreakers</h3>
                    <ul className="list-disc list-inside space-y-1">
                      {preparationData.icebreakers.map((item, index) => (
                        <li key={index}>{item}</li>
                      ))}
                    </ul>
                  </div>
                  
                  {preparationData.dressCode && (
                    <div className="mb-4">
                      <h3 className="font-semibold mb-2">Dress Code</h3>
                      <p>{preparationData.dressCode}</p>
                    </div>
                  )}
                  
                  {preparationData.giftSuggestions && preparationData.giftSuggestions.length > 0 && (
                    <div className="mb-4">
                      <h3 className="font-semibold mb-2">Gift Suggestions</h3>
                      <ul className="list-disc list-inside space-y-1">
                        {preparationData.giftSuggestions.map((item, index) => (
                          <li key={index}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {preparationData.venueInfo && (
                    <div>
                      <h3 className="font-semibold mb-2">Venue Information</h3>
                      <p>{preparationData.venueInfo}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}

          {preparationData && hasInterviewFields(preparationData) && preparationData.commonPitfalls && preparationData.commonPitfalls.length > 0 && (
            <>
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Interview Strategy</CardTitle>
                  <CardDescription>Specialized preparation for your interview</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="mb-4">
                    <h3 className="font-semibold mb-2">Common Pitfalls to Avoid</h3>
                    <ul className="list-disc list-inside space-y-1">
                      {preparationData.commonPitfalls.map((item, index) => (
                        <li key={index}>{item}</li>
                      ))}
                    </ul>
                  </div>
                  
                  {preparationData.followUpStrategy && (
                    <div className="mb-4">
                      <h3 className="font-semibold mb-2">Follow-up Strategy</h3>
                      <p>{preparationData.followUpStrategy}</p>
                    </div>
                  )}
                  
                  {preparationData.researchTopics && preparationData.researchTopics.length > 0 && (
                    <div className="mb-4">
                      <h3 className="font-semibold mb-2">Research Topics</h3>
                      <ul className="list-disc list-inside space-y-1">
                        {preparationData.researchTopics.map((item, index) => (
                          <li key={index}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {preparationData.relevantExperiencePoints && preparationData.relevantExperiencePoints.length > 0 && (
                    <div>
                      <h3 className="font-semibold mb-2">Relevant Experience to Highlight</h3>
                      <ul className="list-disc list-inside space-y-1">
                        {preparationData.relevantExperiencePoints.map((item, index) => (
                          <li key={index}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}

          {preparationData && hasHealthFields(preparationData) && preparationData.medicalHistoryItems && preparationData.medicalHistoryItems.length > 0 && (
            <>
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Health Appointment Preparation</CardTitle>
                  <CardDescription>Specialized preparation for your medical visit</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="mb-4">
                    <h3 className="font-semibold mb-2">Medical History Items</h3>
                    <ul className="list-disc list-inside space-y-1">
                      {preparationData.medicalHistoryItems.map((item, index) => (
                        <li key={index}>{item}</li>
                      ))}
                    </ul>
                  </div>
                  
                  {preparationData.symptomTracking && (
                    <div className="mb-4">
                      <h3 className="font-semibold mb-2">Symptom Tracking</h3>
                      <p>{preparationData.symptomTracking}</p>
                    </div>
                  )}
                  
                  {preparationData.healthMetricsToReview && preparationData.healthMetricsToReview.length > 0 && (
                    <div className="mb-4">
                      <h3 className="font-semibold mb-2">Health Metrics to Review</h3>
                      <ul className="list-disc list-inside space-y-1">
                        {preparationData.healthMetricsToReview.map((item, index) => (
                          <li key={index}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {preparationData.followUpQuestions && preparationData.followUpQuestions.length > 0 && (
                    <div>
                      <h3 className="font-semibold mb-2">Follow-up Questions</h3>
                      <ul className="list-disc list-inside space-y-1">
                        {preparationData.followUpQuestions.map((item, index) => (
                          <li key={index}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}

          {preparationData && hasLearningFields(preparationData) && preparationData.prerequisites && preparationData.prerequisites.length > 0 && (
            <>
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Learning Resources</CardTitle>
                  <CardDescription>Specialized materials for your learning event</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="mb-4">
                    <h3 className="font-semibold mb-2">Prerequisites</h3>
                    <ul className="list-disc list-inside space-y-1">
                      {preparationData.prerequisites.map((item, index) => (
                        <li key={index}>{item}</li>
                      ))}
                    </ul>
                  </div>
                  
                  {preparationData.recommendedResources && preparationData.recommendedResources.length > 0 && (
                    <div className="mb-4">
                      <h3 className="font-semibold mb-2">Recommended Resources</h3>
                      <ul className="list-disc list-inside space-y-1">
                        {preparationData.recommendedResources.map((item, index) => (
                          <li key={index}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {preparationData.noteTakingStrategy && (
                    <div className="mb-4">
                      <h3 className="font-semibold mb-2">Note-Taking Strategy</h3>
                      <p>{preparationData.noteTakingStrategy}</p>
                    </div>
                  )}
                  
                  {preparationData.postEventPractice && preparationData.postEventPractice.length > 0 && (
                    <div>
                      <h3 className="font-semibold mb-2">Post-Event Practice</h3>
                      <ul className="list-disc list-inside space-y-1">
                        {preparationData.postEventPractice.map((item, index) => (
                          <li key={index}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}

          {preparationData && hasHolidayFields(preparationData) && (
            <>
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Holiday Celebration Guide</CardTitle>
                  <CardDescription>Specialized preparation for your holiday event</CardDescription>
                </CardHeader>
                <CardContent>
                  {preparationData.traditionSuggestions && preparationData.traditionSuggestions.length > 0 && (
                    <div className="mb-6">
                      <h3 className="font-semibold mb-2">Traditional Activities</h3>
                      <ul className="list-disc list-inside space-y-1">
                        {preparationData.traditionSuggestions.map((item, index) => (
                          <li key={index} className="text-sm">{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {preparationData.localEvents && preparationData.localEvents.length > 0 ? (
                    <div className="mb-6">
                      <h3 className="font-semibold mb-2">Local Events & Celebrations ({preparationData.localEvents.length} events found)</h3>
                      <div className="grid gap-4">
                        {preparationData.localEvents.map((event, index) => (
                          <div key={index} className="bg-slate-50 p-4 rounded-lg">
                            <div className="flex justify-between items-start">
                              <h4 className="font-medium text-sm">{event.name}</h4>
                              {event.rating && (
                                <span className="text-yellow-600 text-xs">★ {event.rating}</span>
                              )}
                            </div>
                            {event.description && (
                              <p className="text-sm text-muted-foreground mt-1">{event.description}</p>
                            )}
                            <div className="mt-2 flex flex-wrap gap-2 text-xs">
                              {event.location && (
                                <span className="bg-slate-100 px-2 py-1 rounded">
                                  📍 {event.location}
                                </span>
                              )}
                              {event.distance && (
                                <span className="bg-slate-100 px-2 py-1 rounded">
                                  🚗 {event.distance}
                                </span>
                              )}
                              {event.date && (
                                <span className="bg-slate-100 px-2 py-1 rounded">
                                  📅 {event.date}
                                </span>
                              )}
                              {event.time && (
                                <span className="bg-slate-100 px-2 py-1 rounded">
                                  🕒 {event.time}
                                </span>
                              )}
                              {event.attendees && (
                                <span className="bg-slate-100 px-2 py-1 rounded">
                                  👥 {event.attendees} attendees
                                </span>
                              )}
                            </div>
                            {event.link && (
                              <a
                                href={event.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-blue-600 hover:text-blue-800 mt-2 inline-block"
                              >
                                View Details →
                              </a>
                            )}
                            <div className="text-xs text-muted-foreground mt-2">
                              Source: {event.source}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="mb-6 text-sm text-muted-foreground">
                      No local events found for this holiday.
                    </div>
                  )}

                  {preparationData.culturalNotes && preparationData.culturalNotes.length > 0 && (
                    <div className="mb-6">
                      <h3 className="font-semibold mb-2">Cultural Significance</h3>
                      <ul className="list-disc list-inside space-y-1">
                        {preparationData.culturalNotes.map((note, index) => (
                          <li key={index} className="text-sm">{note}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {preparationData.decorationIdeas && preparationData.decorationIdeas.length > 0 && (
                    <div className="mb-6">
                      <h3 className="font-semibold mb-2">Decoration Ideas</h3>
                      <ul className="list-disc list-inside space-y-1">
                        {preparationData.decorationIdeas.map((idea, index) => (
                          <li key={index} className="text-sm">{idea}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {preparationData.foodAndBeverages && preparationData.foodAndBeverages.length > 0 && (
                    <div className="mb-6">
                      <h3 className="font-semibold mb-2">Food & Beverages</h3>
                      <ul className="list-disc list-inside space-y-1">
                        {preparationData.foodAndBeverages.map((item, index) => (
                          <li key={index} className="text-sm">{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {preparationData.musicPlaylist && preparationData.musicPlaylist.length > 0 && (
                    <div className="mb-6">
                      <h3 className="font-semibold mb-2">Music Suggestions</h3>
                      <ul className="list-disc list-inside space-y-1">
                        {preparationData.musicPlaylist.map((song, index) => (
                          <li key={index} className="text-sm">{song}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {preparationData.giftExchangeRules && (
                    <div className="mb-6">
                      <h3 className="font-semibold mb-2">Gift Exchange Guidelines</h3>
                      <p className="text-sm">{preparationData.giftExchangeRules}</p>
                    </div>
                  )}

                  {preparationData.holidayHistory && (
                    <div className="mb-6">
                      <h3 className="font-semibold mb-2">Historical Background</h3>
                      <p className="text-sm">{preparationData.holidayHistory}</p>
                    </div>
                  )}

                  {preparationData.weatherConsiderations && (
                    <div className="mb-6">
                      <h3 className="font-semibold mb-2">Weather Considerations</h3>
                      <p className="text-sm">{preparationData.weatherConsiderations}</p>
                    </div>
                  )}

                  {preparationData.attireRecommendations && (
                    <div className="mb-6">
                      <h3 className="font-semibold mb-2">Recommended Attire</h3>
                      <p className="text-sm">{preparationData.attireRecommendations}</p>
                    </div>
                  )}

                  {preparationData.photographyTips && preparationData.photographyTips.length > 0 && (
                    <div className="mb-6">
                      <h3 className="font-semibold mb-2">Photography Tips</h3>
                      <ul className="list-disc list-inside space-y-1">
                        {preparationData.photographyTips.map((tip, index) => (
                          <li key={index} className="text-sm">{tip}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {preparationData.budgetingTips && preparationData.budgetingTips.length > 0 && (
                    <div className="mb-6">
                      <h3 className="font-semibold mb-2">Budgeting Tips</h3>
                      <ul className="list-disc list-inside space-y-1">
                        {preparationData.budgetingTips.map((tip, index) => (
                          <li key={index} className="text-sm">{tip}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}

          {preparationData && hasFitnessFields(preparationData) && (
            <>
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Fitness Event Preparation</CardTitle>
                  <CardDescription>Specialized preparation for your sports/fitness activity</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="mb-6">
                    <h3 className="font-semibold mb-2">Required Equipment</h3>
                    <ul className="list-disc list-inside space-y-1">
                      {preparationData.equipmentNeeded.map((item, index) => (
                        <li key={index} className="text-sm">{item}</li>
                      ))}
                    </ul>
                  </div>

                  {preparationData.warmupRoutine && preparationData.warmupRoutine.length > 0 && (
                    <div className="mb-6">
                      <h3 className="font-semibold mb-2">Warm-up Routine</h3>
                      <ul className="list-disc list-inside space-y-1">
                        {preparationData.warmupRoutine.map((item, index) => (
                          <li key={index} className="text-sm">{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {preparationData.teamInfo && (
                    <div className="mb-6">
                      <h3 className="font-semibold mb-2">Team Information</h3>
                      <div className="bg-slate-50 p-4 rounded-lg">
                        {preparationData.teamInfo.teamName && (
                          <p className="text-sm mb-2">
                            <strong>Team:</strong> {preparationData.teamInfo.teamName}
                          </p>
                        )}
                        {preparationData.teamInfo.opponents && (
                          <p className="text-sm mb-2">
                            <strong>Opponents:</strong> {preparationData.teamInfo.opponents}
                          </p>
                        )}
                        {preparationData.teamInfo.leagueInfo && (
                          <p className="text-sm mb-2">
                            <strong>League:</strong> {preparationData.teamInfo.leagueInfo}
                          </p>
                        )}
                        {preparationData.teamInfo.uniformRequirements && (
                          <p className="text-sm">
                            <strong>Uniform:</strong> {preparationData.teamInfo.uniformRequirements}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {preparationData.locationDetails && (
                    <div className="mb-6">
                      <h3 className="font-semibold mb-2">Location Details</h3>
                      <div className="bg-slate-50 p-4 rounded-lg">
                        <p className="text-sm mb-2">
                          <strong>Venue:</strong> {preparationData.locationDetails.name}
                        </p>
                        <p className="text-sm mb-2">
                          <strong>Address:</strong> {preparationData.locationDetails.address}
                        </p>
                        {preparationData.locationDetails.parkingInfo && (
                          <p className="text-sm mb-2">
                            <strong>Parking:</strong> {preparationData.locationDetails.parkingInfo}
                          </p>
                        )}
                        {preparationData.locationDetails.facilityAmenities && (
                          <div className="text-sm">
                            <strong>Amenities:</strong>
                            <ul className="list-disc list-inside mt-1">
                              {preparationData.locationDetails.facilityAmenities.map((amenity, index) => (
                                <li key={index}>{amenity}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {preparationData.nutritionTips && preparationData.nutritionTips.length > 0 && (
                    <div className="mb-6">
                      <h3 className="font-semibold mb-2">Nutrition Tips</h3>
                      <ul className="list-disc list-inside space-y-1">
                        {preparationData.nutritionTips.map((tip, index) => (
                          <li key={index} className="text-sm">{tip}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {preparationData.hydrationGuidelines && (
                    <div className="mb-6">
                      <h3 className="font-semibold mb-2">Hydration Guidelines</h3>
                      <p className="text-sm">{preparationData.hydrationGuidelines}</p>
                    </div>
                  )}

                  {preparationData.weatherConsiderations && (
                    <div className="mb-6">
                      <h3 className="font-semibold mb-2">Weather Considerations</h3>
                      <p className="text-sm">{preparationData.weatherConsiderations}</p>
                    </div>
                  )}

                  {preparationData.fitnessGoals && preparationData.fitnessGoals.length > 0 && (
                    <div className="mb-6">
                      <h3 className="font-semibold mb-2">Fitness Goals</h3>
                      <ul className="list-disc list-inside space-y-1">
                        {preparationData.fitnessGoals.map((goal, index) => (
                          <li key={index} className="text-sm">{goal}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {preparationData.safetyPrecautions && preparationData.safetyPrecautions.length > 0 && (
                    <div className="mb-6">
                      <h3 className="font-semibold mb-2">Safety Precautions</h3>
                      <ul className="list-disc list-inside space-y-1">
                        {preparationData.safetyPrecautions.map((precaution, index) => (
                          <li key={index} className="text-sm">{precaution}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {preparationData.recoveryTips && preparationData.recoveryTips.length > 0 && (
                    <div className="mb-6">
                      <h3 className="font-semibold mb-2">Recovery Tips</h3>
                      <ul className="list-disc list-inside space-y-1">
                        {preparationData.recoveryTips.map((tip, index) => (
                          <li key={index} className="text-sm">{tip}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {preparationData.performanceMetrics && preparationData.performanceMetrics.length > 0 && (
                    <div className="mb-6">
                      <h3 className="font-semibold mb-2">Performance Metrics</h3>
                      <ul className="list-disc list-inside space-y-1">
                        {preparationData.performanceMetrics.map((metric, index) => (
                          <li key={index} className="text-sm">{metric}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </>
      )}
    </div>
  );
} 