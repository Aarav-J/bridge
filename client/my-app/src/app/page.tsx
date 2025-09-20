 import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="text-center max-w-4xl mx-auto px-4">
        <h1 className="text-4xl font-bold text-white mb-8">
          Bridge - AI-Powered Political Debate Platform
        </h1>
        <p className="text-xl text-gray-300 mb-8">
          Connect and debate with people across the political spectrum with real-time AI fact-checking and analysis
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-white mb-3">🎯 Take Political Quiz</h3>
            <p className="text-gray-300 mb-4">Discover your political spectrum across 5 key categories</p>
            <Link 
              href="/quiz"
              className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
            >
              Start Quiz
            </Link>
          </div>
          
          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-white mb-3">🤖 AI-Enhanced Debate</h3>
            <p className="text-gray-300 mb-4">Real-time fact-checking, transcription, and sentiment analysis</p>
            <Link 
              href="/debate"
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
            >
              Start Debate
            </Link>
          </div>
        </div>

        <div className="bg-gray-800 p-6 rounded-lg text-left">
          <h3 className="text-lg font-semibold text-white mb-4">✨ AI Features</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-300">
            <div className="flex items-center gap-2">
              <span className="text-green-400">✓</span>
              <span>Real-time speech-to-text transcription</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green-400">✓</span>
              <span>AI-powered fact-checking of political claims</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green-400">✓</span>
              <span>Sentiment analysis and tone monitoring</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green-400">✓</span>
              <span>Generate verified political facts on any topic</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}