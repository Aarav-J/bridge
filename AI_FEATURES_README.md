# AI-Powered Political Debate Platform

## New AI Features Added

This development branch includes advanced AI-powered features for political debates:

### 🤖 AI Capabilities

1. **Real-time Speech-to-Text Transcription**
   - Live transcription of speech during debates
   - Web Speech API integration
   - Cross-browser compatibility

2. **AI Fact-Checking**
   - OpenAI GPT-4 powered fact-checking
   - Analyzes political claims for accuracy
   - Provides confidence scores and evidence
   - Real-time fact-checking during debates

3. **Sentiment Analysis**
   - Monitors debate tone and respectfulness
   - Detects political bias in speech
   - Tracks emotional indicators
   - Promotes civil discourse

4. **Political Facts Generation**
   - Generate verified facts on any political topic
   - Source reliability scoring
   - Context-aware information
   - Useful for debate preparation

### 🛠️ Technical Implementation

#### Backend (Node.js + Express + Socket.IO)
- **AI Service**: `server/services/aiService.js`
  - OpenAI GPT-4 integration
  - Fact-checking algorithms
  - Sentiment analysis
  - Political facts generation

- **API Endpoints**:
  - `POST /api/fact-check` - Fact-check political claims
  - `POST /api/generate-facts` - Generate political facts
  - `POST /api/analyze-sentiment` - Analyze speech sentiment

- **Socket.IO Events**:
  - `transcription` - Real-time speech transcription
  - `fact-check-request` - Request fact-checking
  - `request-facts` - Request political facts
  - `sentiment-analysis` - Real-time sentiment analysis

#### Frontend (Next.js + React + TypeScript)
- **Speech Recognition**: `components/SpeechRecognition.tsx`
- **Fact Check Display**: `components/FactCheckDisplay.tsx`
- **Sentiment Analysis**: `components/SentimentAnalysis.tsx`
- **Political Facts**: `components/PoliticalFacts.tsx`
- **Enhanced Debate Page**: `app/debate/page.tsx`

### 🚀 Setup Instructions

#### 1. Environment Configuration
Create a `.env` file in the `server` directory:
```bash
# Copy the example file
cp server/env.example server/.env

# Edit the .env file and add your OpenAI API key
OPENAI_API_KEY=your_openai_api_key_here
PORT=3000
NODE_ENV=development
```

#### 2. Install Dependencies
```bash
# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client/my-app
npm install
```

#### 3. Start the Application
```bash
# Terminal 1: Start the server
cd server
npm start

# Terminal 2: Start the client
cd client/my-app
npm run dev
```

#### 4. Access the Application
- **Main Page**: http://localhost:3000
- **Quiz**: http://localhost:3000/quiz
- **AI-Enhanced Debate**: http://localhost:3000/debate

### 🔧 Configuration

#### OpenAI API Key
1. Get an API key from [OpenAI](https://platform.openai.com/api-keys)
2. Add it to `server/.env` file
3. Restart the server

#### Browser Requirements
- **Speech Recognition**: Chrome, Edge, or Safari (not supported in Firefox)
- **WebRTC**: All modern browsers
- **Microphone Access**: Required for speech recognition

### 📱 Features Overview

#### Debate Interface
- **Video Calling**: WebRTC peer-to-peer video
- **Live Transcription**: Real-time speech-to-text
- **AI Analysis**: Fact-checking and sentiment analysis
- **Tabbed Interface**: Easy navigation between features

#### AI Analysis
- **Accuracy Assessment**: Claims rated as accurate/inaccurate
- **Confidence Scoring**: AI confidence in analysis
- **Evidence Citation**: Sources and supporting information
- **Context Awareness**: Topic-specific analysis

#### Real-time Monitoring
- **Sentiment Tracking**: Positive/negative/neutral analysis
- **Tone Detection**: Respectful/aggressive/passionate
- **Bias Detection**: Left-leaning/right-leaning/centrist
- **Emotion Recognition**: Key emotional indicators

### 🔒 Privacy & Security

- **No Data Storage**: Transcripts and analysis not permanently stored
- **Real-time Processing**: All AI analysis happens in real-time
- **API Key Security**: OpenAI API key stored in environment variables
- **Local Processing**: Speech recognition happens in browser

### 🐛 Troubleshooting

#### Common Issues
1. **Speech Recognition Not Working**
   - Ensure microphone permissions are granted
   - Use Chrome, Edge, or Safari browser
   - Check browser console for errors

2. **AI Features Not Responding**
   - Verify OpenAI API key is correct
   - Check server console for errors
   - Ensure server is running on port 3000

3. **Video Not Working**
   - Grant camera permissions
   - Check WebRTC support in browser
   - Verify server is running

#### Debug Mode
- Check browser console for client-side errors
- Check server console for backend errors
- Verify Socket.IO connection status

### 🚧 Development Notes

- All changes are in the `development` branch
- Master branch remains untouched
- AI features are fully integrated with existing quiz system
- Ready for production deployment with proper API key management

### 📈 Future Enhancements

- **Database Integration**: Store debate history and analysis
- **User Authentication**: Secure user accounts
- **Advanced Matching**: AI-powered debate partner matching
- **Moderation Tools**: Enhanced content filtering
- **Analytics Dashboard**: Debate performance metrics
