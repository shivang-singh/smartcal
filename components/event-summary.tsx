import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface EventSummaryProps {
  event: {
    title: string
    summary: string
  }
}

export function EventSummary({ event }: EventSummaryProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Event Summary</CardTitle>
          <CardDescription>AI-generated summary to help you prepare</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm">{event.summary}</p>
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
            <li className="text-sm">Focus on UX improvements in the presentation</li>
            <li className="text-sm">Highlight the new dashboard and reporting capabilities</li>
            <li className="text-sm">Address previous UI concerns</li>
            <li className="text-sm">Goal: Get approval for development phase</li>
            <li className="text-sm">Be prepared to discuss implementation timeline</li>
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
            <p className="text-sm">
              Begin with a brief recap of the previous meeting to establish context. Then move into demonstrating how
              the new features address the specific concerns raised previously. Use visual aids when discussing the UI
              improvements, and have concrete examples of how the reporting capabilities solve their business problems.
            </p>
            <p className="text-sm">
              Allow time for questions throughout rather than only at the end, as this will help ensure the client feels
              heard and that their concerns are being addressed. Be prepared with a clear timeline and next steps to
              propose at the conclusion.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

