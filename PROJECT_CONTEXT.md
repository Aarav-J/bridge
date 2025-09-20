# Political Debate Platform - Project Context

## Project Overview
A web application where users can create accounts, take a political quiz, and engage in live, structured debates with other users. The app matches users based on selected debate topics and optionally their political spectrum. Each debate is a timed video call with moderated speaking turns, a final open discussion, and AI-assisted moderation to ensure respectful discourse.

## Tech Stack
- **Frontend**: Next.js 15.5.3 + React 19.1.0 + TypeScript + Tailwind CSS 4
- **Backend**: Node.js + Express 5.1.0 + Socket.IO 4.8.1
- **Video**: WebRTC (already implemented)
- **Authentication**: Frontend-only (localStorage) - ready for Supabase integration
- **Planned**: Supabase (auth + database), Twilio/Daily.co (enhanced video)

## Current Project Structure
```
bridge-1/
├── client/my-app/          # Next.js frontend
│   ├── src/app/           # App router structure
│   │   ├── page.tsx       # Dynamic landing page with signup/video call
│   │   ├── signup/
│   │   │   └── page.tsx   # User registration form
│   │   ├── quiz/
│   │   │   └── page.tsx   # Political spectrum quiz with protection
│   │   ├── account/
│   │   │   └── page.tsx   # User profile and political spectrum display
│   │   ├── debate/
│   │   │   └── page.tsx   # Video call interface
│   │   └── components/    # React components
│   │       ├── QuizQuestion.tsx
│   │       ├── PoliticalSpectrum.tsx
│   │       ├── UserProfile.tsx
│   │       ├── Video.tsx
│   │       ├── ControlPanel.tsx
│   │       └── Topic.tsx
│   └── src/app/data/
│       └── quizData.ts    # Quiz questions and scoring
└── server/                # Express + Socket.IO backend
    ├── server.js          # Main server file with user join handling
    └── package.json       # Backend dependencies
```

## Current Implementation Status

### ✅ Completed Features
1. **User Authentication & Registration**
   - Complete signup flow with form validation
   - User data storage in localStorage (ready for backend integration)
   - Dynamic landing page based on user state
   - Account profile page with political spectrum display

2. **Political Quiz System**
   - 20 questions matching Pew Research Political Typology format
   - Conditional logic (e.g., government size follow-up question)
   - 5 political spectrum categories: Economic, Social, Foreign Policy, Governance, Cultural
   - Liberal to Conservative scoring (-100 to +100 scale)
   - Beautiful results visualization with improved text contrast
   - Horizontal layout for thermometer questions (Democrat/Republican ratings)
   - Quiz protection: prevents re-taking once completed
   - Automatic redirect flow: signup → quiz → landing page

3. **Enhanced WebRTC Video Calling**
   - Local and remote video streams
   - Audio controls (mute/unmute)
   - Hang up functionality
   - Socket.IO signaling for WebRTC connection
   - Server connection status indicator
   - User data integration with video calls

4. **Smart Landing Page**
   - Dynamic content based on user authentication state
   - Signup prompt for new users
   - Quiz completion prompt for incomplete users
   - Video call access for completed users
   - Real-time server connection status

5. **UI/UX Improvements**
   - Professional responsive design with Tailwind CSS
   - Improved text contrast and readability
   - Loading states and error handling
   - Clean, modern interface with consistent styling
   - Mobile-friendly responsive layout

### 🔄 In Progress
- Socket.IO server integration with user data
- Video call user identification and affiliation display

### ❌ Not Yet Implemented
1. **Database & Authentication**
   - Supabase setup and integration
   - Persistent user accounts and profiles
   - Quiz results storage in database
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

## User Flow
1. **New User**: Landing page → Signup form → Political quiz → Landing page (with video call access)
2. **Returning User (Quiz Complete)**: Landing page → Video call
3. **Returning User (Quiz Incomplete)**: Landing page → Quiz prompt → Quiz → Landing page
4. **Account Management**: User profile → Account details page

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

## Current Branch
- **Active Branch**: `master`
- **Last Commit**: Merge remote changes: integrate Socket.IO connection status with signup flow

## Development Environment
- **Frontend**: http://localhost:3000
- **Backend Server**: http://10.186.63.83:3000
- **Routes**:
  - `/` - Dynamic landing page
  - `/signup` - User registration
  - `/quiz` - Political spectrum quiz
  - `/account` - User profile and political spectrum
  - `/debate` - Video call interface
- **Development Command**: `cd client/my-app && npm run dev`

## Key Files to Know
- `client/my-app/src/app/page.tsx` - Dynamic landing page with Socket.IO integration
- `client/my-app/src/app/signup/page.tsx` - User registration form
- `client/my-app/src/app/quiz/page.tsx` - Quiz with protection and completion flow
- `client/my-app/src/app/account/page.tsx` - User profile and political spectrum display
- `client/my-app/src/app/data/quizData.ts` - All quiz questions and scoring weights
- `client/my-app/src/app/components/QuizQuestion.tsx` - Main quiz interface component
- `client/my-app/src/app/components/PoliticalSpectrum.tsx` - Results visualization with improved contrast
- `client/my-app/src/app/components/UserProfile.tsx` - User profile component
- `server/server.js` - Socket.IO server with user join handling

## Data Storage
- **Current**: localStorage for user data and quiz results
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
    signupDate: string
  }
  ```

## Next Development Priorities
1. Set up Supabase for authentication and database
2. Implement user matching algorithm
3. Add structured debate features to video calling
4. Integrate AI moderation
5. Create user dashboard and profile management
6. Add topic selection interface
7. Implement political spectrum-based matching

## Notes
- Complete user authentication flow implemented (frontend-only)
- Quiz system fully functional with protection mechanisms
- Video calling works with Socket.IO server integration
- All text contrast issues resolved for better readability
- Project follows modern React/Next.js patterns with TypeScript
- Ready for backend database integration
- Environment template created for Supabase configuration