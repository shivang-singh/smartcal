import { HelpCircle, Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

interface EventQuestionsProps {
  questions: string[]
}

export function EventQuestions({ questions }: EventQuestionsProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Preparation Questions</CardTitle>
          <CardDescription>Questions to consider before the event</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-4">
            {questions.map((question, index) => (
              <li key={index} className="flex items-start gap-3">
                <HelpCircle className="mt-0.5 h-5 w-5 text-muted-foreground shrink-0" />
                <div>
                  <p className="font-medium">{question}</p>
                </div>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Your Questions</CardTitle>
          <CardDescription>Add your own questions to prepare</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-2">
              <Input placeholder="Add a question..." />
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Add
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">No custom questions added yet.</p>
          </div>
        </CardContent>
        <CardFooter>
          <Button variant="outline" className="w-full">
            Generate more questions
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}

