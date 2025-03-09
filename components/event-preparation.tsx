import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, RefreshCw } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { PreparationOutput } from "@/lib/ai-utils";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface EventPreparationProps {
  event: {
    id: string;
    title: string;
    description: string;
    date: string;
    time: string;
    attendees: string[];
  };
}

const EVENT_TYPES = [
  { value: "meeting", label: "Regular Meeting" },
  { value: "presentation", label: "Presentation" },
  { value: "interview", label: "Interview" },
  { value: "workshop", label: "Workshop" },
  { value: "conference", label: "Conference" },
  { value: "client", label: "Client Meeting" },
  { value: "team", label: "Team Meeting" },
  { value: "1on1", label: "1:1 Meeting" },
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

// Helper function to guess event type from title and description
const guessEventType = (title: string, description: string): string => {
  const text = `${title} ${description}`.toLowerCase();
  
  if (text.includes('interview')) return 'interview';
  if (text.includes('workshop')) return 'workshop';
  if (text.includes('conference')) return 'conference';
  if (text.includes('client')) return 'client';
  if (text.includes('1:1') || text.includes('1on1')) return '1on1';
  if (text.includes('team')) return 'team';
  if (text.includes('presentation')) return 'presentation';
  
  return 'meeting'; // default
};

export function EventPreparation({ event }: EventPreparationProps) {
  // Try to guess the event type from the title and description
  const initialEventType = guessEventType(event.title, event.description);
  
  const [isLoading, setIsLoading] = useState(false);
  const [preparationData, setPreparationData] = useState<PreparationOutput | null>(null);
  const [userRole, setUserRole] = useState<string>("host"); // Default to host
  const [eventType, setEventType] = useState<string>(initialEventType);
  const { toast } = useToast();

  const generatePreparation = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/preparation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          eventTitle: event.title,
          eventDescription: event.description,
          eventDate: event.date,
          eventTime: event.time,
          attendees: event.attendees,
          userRole,
          eventType,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate preparation materials');
      }

      const data = await response.json();
      setPreparationData(data);
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
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="event-type">Event Type</Label>
                <Select value={eventType} onValueChange={setEventType}>
                  <SelectTrigger id="event-type">
                    <SelectValue placeholder="Select event type" />
                  </SelectTrigger>
                  <SelectContent>
                    {EVENT_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="user-role">Your Role</Label>
                <Select value={userRole} onValueChange={setUserRole}>
                  <SelectTrigger id="user-role">
                    <SelectValue placeholder="Select your role" />
                  </SelectTrigger>
                  <SelectContent>
                    {USER_ROLES.map((role) => (
                      <SelectItem key={role.value} value={role.value}>
                        {role.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="bg-blue-50 p-4 rounded-md border border-blue-100 mt-4">
              <h4 className="text-sm font-medium text-blue-800">Event Details</h4>
              <p className="text-xs text-blue-600 mt-1">
                <strong>Title:</strong> {event.title}
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
            
            <Button 
              onClick={generatePreparation} 
              disabled={isLoading}
              className="w-full mt-4"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
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
                <p className="text-sm">{preparationData.summary}</p>
              </div>
            </CardContent>
          </Card>

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

          {preparationData.actionItems && preparationData.actionItems.length > 0 && (
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
        </>
      )}
    </div>
  );
} 