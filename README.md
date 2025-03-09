# SmartCal

SmartCal is an intelligent calendar application that helps you prepare for meetings with AI-generated resources and summaries.

## Features

- **Google Calendar Integration**: Connect your Google Calendar to view and manage your events.
- **AI-Powered Preparation**: Generate meeting summaries, key points, questions, and action items using LLM technology.
- **Smart Event Management**: Organize and prepare for your meetings efficiently.
- **Customizable Preparation**: Tailor the AI preparation based on your role and event type.

## AI Preparation Workflow

SmartCal uses LLM models (via OpenAI or OpenRouter) to generate intelligent preparation materials for your meetings:

1. **Event Analysis**: The AI analyzes your event details, including title, description, attendees, and more.
2. **Context-Aware Preparation**: Provides tailored preparation based on your role and the event type.
3. **Comprehensive Materials**: Generates summaries, key points, suggested approaches, preparation questions, relevant topics, and action items.

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Google Calendar API credentials
- OpenAI API key or OpenRouter API key

### Environment Setup

Create a `.env.local` file with the following variables:

```
# Google Calendar API Credentials
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id

# OpenAI API Key
OPENAI_API_KEY=your_openai_api_key

# OR use OpenRouter (compatible with OpenAI client)
# OPENAI_API_KEY=your_openrouter_api_key
```

### Installation

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Run the development server:
   ```
   npm run dev
   ```
4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage

1. Connect your Google Calendar account
2. Navigate to an event
3. Click on the "Preparation" tab
4. Select your role and the event type
5. Click "Generate Preparation Materials"
6. Review the AI-generated preparation materials

## Technologies Used

- Next.js 15
- React 19
- OpenAI API / OpenRouter API
- Google Calendar API
- Tailwind CSS
- Radix UI Components

## License

This project is licensed under the MIT License - see the LICENSE file for details.
