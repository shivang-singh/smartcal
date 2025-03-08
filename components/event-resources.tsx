import { ExternalLink, FileText, Image, Link2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

interface Resource {
  title: string
  url: string
  type: string
}

interface EventResourcesProps {
  resources: Resource[]
}

export function EventResources({ resources }: EventResourcesProps) {
  const getIcon = (type: string) => {
    switch (type) {
      case "document":
        return <FileText className="h-4 w-4" />
      case "design":
        return <Image className="h-4 w-4" />
      default:
        return <Link2 className="h-4 w-4" />
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Relevant Resources</CardTitle>
          <CardDescription>Documents and links to help you prepare</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            {resources.map((resource, index) => (
              <Card key={index} className="overflow-hidden">
                <CardHeader className="p-4">
                  <div className="flex items-start gap-2">
                    {getIcon(resource.type)}
                    <div>
                      <CardTitle className="text-base">{resource.title}</CardTitle>
                      <CardDescription className="text-xs capitalize">{resource.type}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardFooter className="p-4 pt-0">
                  <Button variant="outline" size="sm" className="w-full" asChild>
                    <a href={resource.url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="mr-2 h-3 w-3" />
                      Open
                    </a>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>AI-Generated Resources</CardTitle>
          <CardDescription>Additional materials created to help you prepare</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            <Card className="overflow-hidden">
              <CardHeader className="p-4">
                <div className="flex items-start gap-2">
                  <FileText className="h-4 w-4" />
                  <div>
                    <CardTitle className="text-base">Presentation Outline</CardTitle>
                    <CardDescription className="text-xs">Document</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardFooter className="p-4 pt-0">
                <Button variant="outline" size="sm" className="w-full">
                  <ExternalLink className="mr-2 h-3 w-3" />
                  Open
                </Button>
              </CardFooter>
            </Card>
            <Card className="overflow-hidden">
              <CardHeader className="p-4">
                <div className="flex items-start gap-2">
                  <FileText className="h-4 w-4" />
                  <div>
                    <CardTitle className="text-base">Client Profile Summary</CardTitle>
                    <CardDescription className="text-xs">Document</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardFooter className="p-4 pt-0">
                <Button variant="outline" size="sm" className="w-full">
                  <ExternalLink className="mr-2 h-3 w-3" />
                  Open
                </Button>
              </CardFooter>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

