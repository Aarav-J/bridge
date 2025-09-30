# Bridge - Political Debate Platform

<div align="center">
[![View on Devpost](https://img.shields.io/badge/View%20on-Devpost-blue?style=for-the-badge&logo=devpost)](https://devpost.com/software/bridge-8xjdwu)
*Breaking down political echo chambers through structured, AI-powered debates*

[![Next.js](https://img.shields.io/badge/Next.js-15.5.3-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.1.0-blue?style=flat-square&logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-4.8.1-green?style=flat-square&logo=socket.io)](https://socket.io/)
[![OpenAI](https://img.shields.io/badge/OpenAI-GPT--4-orange?style=flat-square)](https://openai.com/)

</div>

## 🌉 About Bridge

In an era of increasing political polarization, Bridge creates a space for meaningful dialogue across ideological divides. Our platform pairs users with opposing viewpoints for structured, video-based political debates enhanced by AI-powered features.

### The Problem
- Social media algorithms create echo chambers by showing only aligned content
- Controversial content dominates diverse perspectives
- No platforms exist for quick, structured political debates
- Users seeking genuine debate often encounter trolls or bad-faith actors

### Our Solution
Bridge provides a structured environment where:
- Users are matched with those holding opposing political views
- AI ensures fact-based discussions with real-time analysis
- Turn-based speaking prevents chaos and promotes respect
- Video requirements humanize interactions and reduce toxicity

## ✨ Key Features

### 🔐 User Authentication & Profiles
- **Secure Signup/Login**: Full Supabase integration with email verification
- **Comprehensive Profiles**: Username, email, age, full name with secure password requirements
- **Political Spectrum Analysis**: Detailed breakdown across 5 categories (Economic, Social, Foreign Policy, Governance, Cultural)

### 🧠 Intelligent Political Assessment
- **20-Question Quiz**: Based on Pew Research Political Typology methodology
- **Multi-Dimensional Scoring**: Liberal-Conservative scale (-100 to +100) across multiple domains
- **Persistent Data**: Quiz results stored securely in Supabase database
- **Smart Matching**: Results drive our matchmaking algorithm

### ⚡ Advanced Matchmaking System
- **Opposition-Based Pairing**: Matches users with opposing political views (minimum 45-point ideological gap)
- **Real-Time Queue**: Socket.IO-powered waiting system with live status updates
- **Topic Intelligence**: AI analyzes user differences to select optimal debate topics
- **Fallback Matching**: Long-waiting users get prioritized after timeout threshold

### 🎯 Structured Debate Format
**6-Phase Timed System:**
1. Opening Statement - User 1 (30s)
2. Opening Statement - User 2 (30s)
3. Main Argument - User 1 (120s)
4. Main Argument - User 2 (120s)
5. Closing Statement - User 1 (60s)
6. Closing Statement - User 2 (60s)

### 🤖 AI-Powered Features
- **Real-Time Fact-Checking**: OpenAI GPT-4 analyzes political claims during debates
- **Topic-Specific Facts**: AI generates relevant supporting information for debate topics
- **Sentiment Analysis**: Monitors debate tone and emotional indicators
- **Pre-Debate Briefing**: AI-generated fact sheets provide context before debates start

### 📹 Advanced Video System
- **WebRTC Peer-to-Peer**: High-quality video calling with Google STUN servers
- **Turn-Based Controls**: Automatic muting system enforces speaking order
- **Volume Analysis**: Real-time audio level monitoring and visualization
- **Camera Enforcement**: Video required during speaking turns to maintain civility

## 🏗️ Technical Architecture

### Frontend Stack
- **Framework**: Next.js 15.5.3 with App Router
- **UI Library**: React 19.1.0 with TypeScript
- **Styling**: Tailwind CSS 4 for responsive design
- **State Management**: Zustand for user data and session handling
- **Real-Time**: Socket.IO Client for live communication

### Backend Stack
- **Runtime**: Node.js with Express 5.1.0
- **WebSocket**: Socket.IO 4.8.1 for real-time features
- **AI Integration**: OpenAI GPT-4 for fact-checking and analysis
- **Database**: Supabase (PostgreSQL) for user data and authentication

### Communication Layer
- **Video**: WebRTC for peer-to-peer video calls
- **Signaling**: Socket.IO for WebRTC signaling and matchmaking
- **Real-Time Updates**: Live user counts, debate status, and queue management

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm
- Supabase account and project
- OpenAI API key

### Environment Setup

**Backend (.env)**
```bash
OPENAI_API_KEY=your_openai_api_key_here
PORT=3000
NODE_ENV=development
CORS_ORIGIN=*
```

**Frontend (.env.local)**
```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_SOCKET_URL=http://localhost:3000
NEXT_PUBLIC_OPENAI_API_KEY=your_openai_api_key_here
```

### Installation & Running

**Backend Server**
```bash
cd server
npm install
npm start
```

**Frontend Application**
```bash
cd client/my-app
npm install
npm run dev
```

### Application URLs
- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:3000 (configurable via PORT)
- **Health Check**: http://localhost:3000/health

## 🎮 User Flow

### For New Users
1. **Landing Page** → **Signup Form** (Supabase authentication)
2. **Political Quiz** → **Results & Spectrum Analysis**
3. **Main Dashboard** → **Matchmaking Queue**
4. **Debate Room** → **Structured Video Debate**

### For Returning Users
- **Quiz Complete**: Direct access to matchmaking and debates
- **Quiz Incomplete**: Prompted to complete political assessment
- **Account Management**: Profile viewing and spectrum analysis

## 📊 Project Structure

```
bridge/
├── client/my-app/                    # Next.js frontend
│   ├── src/app/                     # App router structure
│   │   ├── page.tsx                 # Dynamic landing page with matchmaking
│   │   ├── signup/page.tsx          # User registration
│   │   ├── quiz/page.tsx            # Political spectrum quiz
│   │   ├── account/page.tsx         # User profile
│   │   ├── debate/page.tsx          # Video debate interface
│   │   └── components/              # React components
│   │       ├── QuizQuestion.tsx     # Quiz interface
│   │       ├── Video.tsx            # Video components
│   │       ├── ControlPanel.tsx     # Debate controls
│   │       ├── SpeechRecognition.tsx # AI transcription
│   │       ├── FactCheckDisplay.tsx # AI fact-checking
│   │       ├── SentimentAnalysis.tsx # AI sentiment tracking
│   │       └── PoliticalFacts.tsx   # AI-generated facts
│   ├── src/utils/
│   │   ├── factCall.ts              # OpenAI API integration
│   │   └── supabaseClient.ts        # Database client
│   └── src/store/
│       └── useStore.ts              # Zustand state management
└── server/                          # Express + Socket.IO backend
    ├── server.js                    # Main server with matchmaking
    └── services/
        └── aiService.js             # AI service integration
```

## 🔧 Core Components

### Matchmaking Algorithm
- **Ideological Opposition**: Minimum 45-point gap on political spectrum
- **Queue Management**: Real-time waiting system with disconnect handling
- **Topic Selection**: AI analyzes user differences to choose debate subjects
- **Room Management**: Supports multiple concurrent debates

### Debate System
- **Phase Management**: Automated transitions through 6 debate phases
- **Speaker Control**: Turn-based audio with automatic muting
- **Timer System**: Real-time countdowns with phase progression
- **Emergency Handling**: Graceful disconnection and room cleanup

### AI Features
- **Fact-Checking**: Real-time analysis of political claims
- **Context Generation**: Topic-specific supporting information
- **Sentiment Monitoring**: Emotional tone analysis during debates
- **Pre-Debate Briefing**: AI-generated fact sheets for preparation

## 🛠️ Development Highlights

### Technical Achievements
- **Full-Stack Integration**: Seamless connection between React frontend and Node.js backend
- **Real-Time Architecture**: Socket.IO handling matchmaking, signaling, and live updates
- **WebRTC Implementation**: Peer-to-peer video calling with advanced controls
- **AI Integration**: OpenAI GPT-4 for fact-checking and political analysis
- **Database Design**: Comprehensive Supabase schema for user data and quiz results

### Challenges Overcome
- **Supabase Integration**: Complex authentication and database setup
- **P2P Networking**: WebRTC connection establishment across local networks
- **State Management**: User data persistence across route changes
- **Real-Time Synchronization**: Managing multiple concurrent debates and matchmaking

## 🎯 Future Roadmap

### Immediate Priorities
- **Enhanced AI Moderation**: Real-time content filtering and toxicity detection
- **Advanced Matching**: Historical performance and preference-based algorithms
- **Mobile Optimization**: Responsive design improvements for mobile devices

### Long-Term Vision
- **Scale-Up Features**: Support for large-scale debate events and tournaments
- **Advanced Analytics**: Debate performance metrics and user engagement insights
- **Platform Expansion**: Integration with external video services (Twilio, Daily.co)
- **Content Recording**: Debate archival and replay functionality

## 🏆 Built With

- **Frontend**: Next.js, React, TypeScript, Tailwind CSS, Zustand
- **Backend**: Node.js, Express, Socket.IO
- **Database**: Supabase, PostgreSQL  
- **AI**: OpenAI GPT-4
- **Communication**: WebRTC, Socket.IO
- **Authentication**: Supabase Auth

## 📄 License

This project is available under the MIT License. See the LICENSE file for more details.

---

<div align="center">

**Bridge** - *Connecting minds across the political divide*

</div>
