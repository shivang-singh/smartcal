import { CalendarDays, ChevronRight, Clock, Settings } from "lucide-react"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { CalendarView } from "@/components/calendar-view"
import { UpcomingEvents } from "@/components/upcoming-events"
import { GoogleSignInButton } from "@/components/google-sign-in-button"

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-3xl text-center">
        <h1 className="text-4xl font-extrabold tracking-tight mb-6">
          <span className="text-blue-600">Smart</span>Cal
        </h1>
        
        <h2 className="text-2xl font-semibold mb-4">
          Prepare for meetings with AI-powered resources
        </h2>
        
        <p className="text-xl mb-8 text-gray-600 max-w-2xl mx-auto">
          SmartCal syncs with your Google Calendar and uses AI to gather relevant resources before each meeting,
          helping you prepare efficiently and make the most of your time.
        </p>
        
        <div className="flex flex-col items-center justify-center space-y-4">
          <p className="text-gray-700">Sign in with your Google account to get started</p>
          <div className="w-64">
            <GoogleSignInButton />
          </div>
        </div>
        
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-2">Smart Preparation</h3>
            <p className="text-gray-600">AI summarizes key information about meeting participants and topics</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-2">Resource Gathering</h3>
            <p className="text-gray-600">Automatically collect relevant documents, emails, and resources</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-2">Meeting Insights</h3>
            <p className="text-gray-600">Get useful context and background information before each call</p>
          </div>
        </div>
      </div>
    </div>
  )
}

