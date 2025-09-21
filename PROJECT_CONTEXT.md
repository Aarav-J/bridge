# Bridge - Political Debate Platform - Project Context

## Project Overview
Bridge is a sophisticated political debate platform where users create accounts, take a comprehensive political spectrum quiz, and engage in live, structured debates with other users. The platform features AI-powered fact-checking, real-time matchmaking, and structured debate formats with turn-based speaking. Users are matched based on debate topics and can participate in timed video debates with AI-assisted moderation and supporting facts.

## Tech Stack
- **Frontend**: Next.js 15.5.3 + React 19.1.0 + TypeScript + Tailwind CSS 4
- **Backend**: Node.js + Express 5.1.0 + Socket.IO 4.8.1
- **Database**: Supabase (auth + database) - **FULLY IMPLEMENTED**
- **Video**: WebRTC with advanced features (volume analysis, turn-based muting)
- **AI**: OpenAI GPT-4 integration for fact-checking and political facts
- **State Management**: Zustand for client-side state
- **Real-time**: Socket.IO for matchmaking, WebRTC signaling, and debate management

## Current Project Structure
```
bridge/
├── client/my-app/                    # Next.js frontend
│   ├── src/app/                     # App router structure
│   │   ├── page.tsx                 # Dynamic landing page with Socket.IO integration
│   │   ├── signup/
│   │   │   └── page.tsx             # User registration with Supabase integration
│   │   ├── quiz/
│   │   │   └── page.tsx             # Political spectrum quiz with conditional logic
│   │   ├── account/
│   │   │   └── page.tsx             # User profile and political spectrum display
│   │   ├── debate/
│   │   │   └── page.tsx             # Advanced video call interface with AI features
│   │   ├── login/
│   │   │   └── page.tsx             # User login page
│   │   └── components/              # React components
│   │       ├── QuizQuestion.tsx     # Quiz interface with scale/binary/multiple-choice
│   │       ├── PoliticalSpectrum.tsx # Results visualization
│   │       ├── UserProfile.tsx      # User profile component
│   │       ├── Video.tsx            # Video component with labels
│   │       ├── ControlPanel.tsx     # Video call controls
│   │       ├── SpeechRecognition.tsx # AI speech-to-text
│   │       ├── FactCheckDisplay.tsx # AI fact-checking results
│   │       ├── SentimentAnalysis.tsx # AI sentiment analysis
│   │       ├── PoliticalFacts.tsx   # AI-generated political facts
│   │       └── Topic.tsx            # Topic selection
│   ├── src/app/data/
│   │   ├── quizData.ts              # 20 quiz questions and scoring weights
│   │   └── topicData.ts             # Debate topics and questions
│   ├── src/store/
│   │   └── useStore.ts              # Zustand state management
│   └── src/utils/
│       ├── factCall.ts              # OpenAI API calls for facts
│       └── supabaseClient.ts        # Supabase client configuration
├── server/                          # Express + Socket.IO backend
│   ├── server.js                    # Main server with matchmaking and debate management
│   ├── services/
│   │   └── aiService.js             # OpenAI integration for AI features
│   ├── matchmaking.js               # User matching logic
│   ├── aiServer.js                  # AI service endpoints
│   └── package.json                 # Backend dependencies
├── AI_FEATURES_README.md            # Detailed AI features documentation
└── PROJECT_CONTEXT.md               # This file
```

## Current Implementation Status

### ✅ Completed Features

1. **User Authentication & Registration**
   - Complete signup flow with form validation and password strength checking
   - Full Supabase integration for user accounts and profiles
   - Zustand state management for client-side user data
   - Dynamic landing page based on user authentication state
   - Account profile page with political spectrum display
   - Login page with Supabase authentication

2. **Political Quiz System**
   - 20 questions matching Pew Research Political Typology format
   - Conditional logic (e.g., government size follow-up question)
   - 5 political spectrum categories: Economic, Social, Foreign Policy, Governance, Cultural
   - Liberal to Conservative scoring (-100 to +100 scale)
   - Beautiful results visualization with improved text contrast
   - Horizontal layout for thermometer questions (Democrat/Republican ratings)
   - Quiz protection: prevents re-taking once completed
   - Automatic redirect flow: signup → quiz → landing page
   - Results stored in Supabase database

3. **Advanced WebRTC Video Calling & Debate System**
   - Local and remote video streams with volume analysis
   - Real-time audio/video controls (mute/unmute, video toggle)
   - Hang up functionality with proper cleanup
   - Socket.IO signaling for WebRTC connection
   - Server connection status indicator
   - User data integration with video calls
   - **Structured debate format with 6 phases and timers**
   - **Turn-based speaking with automatic audio muting**
   - **Real-time volume analysis and visualization**
   - **Debate timer management with phase transitions**

4. **AI-Powered Features**
   - **Real-time fact-checking using OpenAI GPT-4**
   - **Political facts generation for debate topics**
   - **Sentiment analysis of speech during debates**
   - **Supporting facts display during debates**
   - **AI service integration with proper error handling**

5. **Sophisticated Matchmaking System**
   - **Queue-based user matching algorithm**
   - **Room-based architecture supporting multiple concurrent debates**
   - **Real-time matchmaking status tracking**
   - **Automatic topic and question assignment**
   - **Waiting queue management with disconnect handling**

6. **Smart Landing Page**
   - Dynamic content based on user authentication state
   - Signup prompt for new users
   - Quiz completion prompt for incomplete users
   - Video call access for completed users
   - Real-time server connection status
   - **Active users display with real-time updates**
   - **Matchmaking status tracking and feedback**

7. **Database Integration**
   - **Full Supabase integration for user accounts**
   - **Persistent user profiles and political spectrum data**
   - **Quiz results storage in database**
   - **Political spectrum data persistence**
   - **Proper database schema with public and private data separation**

8. **UI/UX Improvements**
   - Professional responsive design with Tailwind CSS
   - Improved text contrast and readability
   - Loading states and error handling
   - Clean, modern interface with consistent styling
   - Mobile-friendly responsive layout
   - **Real-time status indicators and volume visualization**
   - **Advanced debate interface with timer and phase management**

### 🔄 In Progress
- Enhanced AI moderation features
- Advanced topic selection interface
- Political spectrum-based matching improvements

### ❌ Not Yet Implemented
1. **Enhanced AI Features**
   - Real-time content filtering during debates
   - Advanced toxic language detection
   - Debate performance analytics

2. **Advanced Matching**
   - Political spectrum-based matching algorithm
   - User preference-based matching
   - Historical debate performance matching

3. **Enhanced Video Features**
   - Screen sharing capabilities
   - Recording functionality
   - Integration with Twilio/Daily.co for enhanced video

4. **Analytics & Reporting**
   - Debate performance metrics
   - User engagement analytics
   - Political spectrum distribution analysis

## User Flow
1. **New User**: Landing page → Signup form (Supabase) → Political quiz → Landing page (with video call access)
2. **Returning User (Quiz Complete)**: Landing page → Matchmaking → Video debate
3. **Returning User (Quiz Incomplete)**: Landing page → Quiz prompt → Quiz → Landing page
4. **Account Management**: User profile → Account details page
5. **Debate Flow**: Matchmaking → Room assignment → Video call → Structured debate with AI features

## Quiz Details

### Question Categories
1. **Governance** (6 questions): Government size, expert opinions, political representation, criminal justice, party ratings
2. **Cultural** (4 questions): Immigration, language diversity, offense culture, religion
3. **Social** (4 questions): Racial equality, white privilege, transgender acceptance
4. **Economic** (2 questions): Corporate profits, environmental vs. economic priorities
5. **Foreign Policy** (3 questions): Trade, American exceptionalism, military superpower

### Special Features
- **Conditional Logic**: Question 2 only appears if user chooses "bigger government" in Question 1
- **Scale Questions**: Questions 10 & 11 (Democrat/Republican thermometer) display horizontally
- **Scoring Algorithm**: Each answer has a weight from -100 (very liberal) to +100 (very conservative)
- **Quiz Protection**: Users cannot retake quiz once completed
- **Access Control**: Quiz requires user signup and prevents direct access
- **Database Storage**: Results stored in Supabase with proper schema

## Debate System Details

### Structured Debate Format
1. **Phase 1**: Opening statement - User 1 (30 seconds)
2. **Phase 2**: Opening statement - User 2 (30 seconds)
3. **Phase 3**: Main argument - User 1 (120 seconds)
4. **Phase 4**: Main argument - User 2 (120 seconds)
5. **Phase 5**: Closing statement - User 1 (60 seconds)
6. **Phase 6**: Closing statement - User 2 (60 seconds)

### AI Features During Debates
- **Real-time Fact-Checking**: OpenAI GPT-4 analyzes political claims
- **Supporting Facts**: Contextual political facts for debate topics
- **Sentiment Analysis**: Monitors debate tone and respectfulness
- **Volume Analysis**: Real-time audio level monitoring and visualization

### Matchmaking System
- **Queue-based matching**: Users join waiting queue for debates
- **Room management**: Multiple concurrent debates supported
- **Topic assignment**: Random topic and question selection
- **Disconnect handling**: Proper cleanup when users leave

## Current Branch
- **Active Branch**: `master`
- **Last Commit**: Full implementation with AI features and Supabase integration

## Development Environment
- **Frontend**: http://localhost:3000
- **Backend Server**: http://localhost:3000 (configurable via PORT env var)
- **Routes**:
  - `/` - Dynamic landing page with matchmaking
  - `/signup` - User registration with Supabase
  - `/login` - User login
  - `/quiz` - Political spectrum quiz
  - `/account` - User profile and political spectrum
  - `/debate` - Advanced video call interface with AI features
- **Development Commands**: 
  - Frontend: `cd client/my-app && npm run dev`
  - Backend: `cd server && npm start`

## Key Files to Know
- `client/my-app/src/app/page.tsx` - Dynamic landing page with Socket.IO integration and matchmaking
- `client/my-app/src/app/signup/page.tsx` - User registration with Supabase integration
- `client/my-app/src/app/quiz/page.tsx` - Quiz with Supabase storage and completion flow
- `client/my-app/src/app/debate/page.tsx` - Advanced video call interface with AI features
- `client/my-app/src/app/data/quizData.ts` - All quiz questions and scoring weights
- `client/my-app/src/app/components/QuizQuestion.tsx` - Main quiz interface component
- `client/my-app/src/utils/factCall.ts` - OpenAI API integration for political facts
- `client/my-app/src/utils/supabaseClient.ts` - Supabase client configuration
- `client/my-app/src/store/useStore.ts` - Zustand state management
- `server/server.js` - Socket.IO server with matchmaking and debate management
- `server/services/aiService.js` - OpenAI integration for AI features

## Data Storage
- **Database**: Supabase with proper schema
- **Client State**: Zustand for user data and session management
- **Session Storage**: Active match data and debate state
- **User Data Structure**:
  ```javascript
  {
    fullName: string,
    username: string,
    email: string,
    age: number,
    quizCompleted: boolean,
    quizResults: {
      answers: QuizAnswer[],
      spectrum: PoliticalSpectrum,
      completedAt: string
    },
    signupDate: string,
    overall_affiliation: number
  }
  ```

## Environment Configuration

### Server Environment (.env)
```bash
OPENAI_API_KEY=your_openai_api_key_here
PORT=3000
NODE_ENV=development
CORS_ORIGIN=*
```

### Client Environment (.env.local)
```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_SOCKET_URL=http://localhost:3000
NEXT_PUBLIC_OPENAI_API_KEY=your_openai_api_key_here
```

## Next Development Priorities
1. Enhanced AI moderation with real-time content filtering
2. Political spectrum-based matching algorithm
3. Advanced topic selection interface
4. Debate performance analytics and reporting
5. Screen sharing and recording capabilities
6. User preference-based matching
7. Historical debate performance tracking

## Technical Notes
- Complete user authentication flow with Supabase integration
- Quiz system fully functional with database storage
- Advanced video calling with structured debate format
- AI features fully integrated with OpenAI GPT-4
- Sophisticated matchmaking system with room management
- Real-time features using Socket.IO
- Professional UI/UX with Tailwind CSS
- Proper error handling and loading states
- Mobile-responsive design
- TypeScript throughout for type safety