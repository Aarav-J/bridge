# Political Debate Platform - Project Context

## Project Overview
A web application where users can create accounts, take a political quiz, and engage in live, structured debates with other users. The app matches users based on selected debate topics and optionally their political spectrum. Each debate is a timed video call with moderated speaking turns, a final open discussion, and AI-assisted moderation to ensure respectful discourse.

## Tech Stack
- **Frontend**: Next.js 15.5.3 + React 19.1.0 + TypeScript + Tailwind CSS 4
- **Backend**: Node.js + Express 5.1.0 + Socket.IO 4.8.1
- **Video**: WebRTC (already implemented)
- **Planned**: Supabase (auth + database), Twilio/Daily.co (enhanced video)

## Current Project Structure
```
bridge-1/
├── client/my-app/          # Next.js frontend
│   ├── src/app/           # App router structure
│   │   ├── page.tsx       # Main landing page with video call
│   │   ├── quiz/
│   │   │   └── page.tsx   # Quiz interface
│   │   └── components/    # React components
│   │       ├── QuizQuestion.tsx
│   │       ├── PoliticalSpectrum.tsx
│   │       ├── Video.tsx
│   │       ├── ControlPanel.tsx
│   │       └── Topic.tsx
│   └── src/app/data/
│       └── quizData.ts    # Quiz questions and scoring
└── server/                # Express + Socket.IO backend
    ├── server.js          # Main server file
    └── package.json       # Backend dependencies
```

## Current Implementation Status

### ✅ Completed Features
1. **Basic WebRTC Video Calling**
   - Local and remote video streams
   - Audio controls (mute/unmute)
   - Hang up functionality
   - Socket.IO signaling for WebRTC connection

2. **Political Quiz System**
   - 20 questions matching Pew Research Political Typology format
   - Conditional logic (e.g., government size follow-up question)
   - 5 political spectrum categories: Economic, Social, Foreign Policy, Governance, Cultural
   - Liberal to Conservative scoring (-100 to +100 scale)
   - Beautiful results visualization with color-coded spectrum
   - Horizontal layout for thermometer questions (Democrat/Republican ratings)
   - Question selection state management with proper reset

3. **UI/UX**
   - Professional landing page with navigation cards
   - Responsive design with Tailwind CSS
   - Progress tracking for quiz
   - Clean, modern interface

### 🔄 In Progress
- Quiz frontend is fully functional
- Video calling works for basic peer-to-peer communication

### ❌ Not Yet Implemented
1. **Database & Authentication**
   - Supabase setup and integration
   - User accounts and profiles
   - Quiz results storage
   - Political spectrum data persistence

2. **Matching System**
   - Algorithm to pair debate partners
   - Topic selection interface
   - Political spectrum-based matching

3. **Enhanced Video Calling**
   - Structured debate format with timers
   - Turn-based speaking
   - Moderation controls
   - Integration with Twilio/Daily.co

4. **AI Moderation**
   - Real-time content filtering
   - Respectful discourse enforcement
   - Toxic language detection

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

## Current Branch
- **Active Branch**: `quiz-frontend`
- **Last Commit**: Updated quiz to match Pew Research format with horizontal layout for scale questions

## Development Environment
- **Local Server**: http://localhost:3000
- **Quiz Route**: http://localhost:3000/quiz
- **Development Command**: `cd client/my-app && npm run dev`

## Key Files to Know
- `client/my-app/src/app/data/quizData.ts` - All quiz questions and scoring weights
- `client/my-app/src/app/components/QuizQuestion.tsx` - Main quiz interface component
- `client/my-app/src/app/components/PoliticalSpectrum.tsx` - Results visualization
- `client/my-app/src/app/quiz/page.tsx` - Quiz page logic and navigation
- `client/my-app/src/app/page.tsx` - Main landing page with video call integration
- `server/server.js` - Socket.IO server for WebRTC signaling

## Next Development Priorities
1. Set up Supabase for authentication and database
2. Implement user matching algorithm
3. Add structured debate features to video calling
4. Integrate AI moderation
5. Create user dashboard and profile management

## Notes
- All quiz functionality is working and ready for testing
- Video calling works for basic peer-to-peer communication
- Project follows modern React/Next.js patterns with TypeScript
- No additional dependencies needed for current quiz functionality
- Ready to integrate with backend services when needed
