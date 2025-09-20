import Link from "next/link";

export default function MatchmakingPage() {
  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="text-2xl font-bold text-white hover:text-gray-300">
              Bridge
            </Link>
            <Link 
              href="/"
              className="text-gray-300 hover:text-white transition-colors"
            >
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <div className="mb-8">
            <div className="w-24 h-24 bg-gradient-to-br from-green-500 to-blue-600 rounded-full mx-auto flex items-center justify-center mb-6">
              <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-white mb-4">Finding Your Debate Partner</h1>
            <p className="text-gray-300 text-lg">
              We're matching you with someone who has different political views for a respectful debate
            </p>
          </div>

          {/* Matchmaking Status */}
          <div className="bg-gray-800 rounded-lg p-8 mb-8">
            <div className="flex items-center justify-center mb-6">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
              <span className="ml-3 text-white text-lg">Searching for matches...</span>
            </div>
            
            <div className="space-y-4 text-left max-w-md mx-auto">
              <div className="flex items-center text-gray-300">
                <svg className="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Analyzing your political spectrum
              </div>
              <div className="flex items-center text-gray-300">
                <svg className="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Finding compatible debate topics
              </div>
              <div className="flex items-center text-gray-400">
                <div className="w-5 h-5 border-2 border-gray-600 rounded-full mr-3 animate-pulse"></div>
                Matching with available users
              </div>
            </div>
          </div>

          {/* Topic Selection Preview */}
          <div className="bg-gray-800 rounded-lg p-6 mb-8">
            <h2 className="text-xl font-semibold text-white mb-4">Selected Debate Topics</h2>
            <div className="flex flex-wrap gap-2 justify-center">
              <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm">Healthcare</span>
              <span className="bg-red-600 text-white px-3 py-1 rounded-full text-sm">Climate Change</span>
              <span className="bg-green-600 text-white px-3 py-1 rounded-full text-sm">Immigration</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/debate"
              className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-lg transition-colors duration-200"
            >
              Start Debate Now (Demo)
            </Link>
            <Link 
              href="/"
              className="bg-gray-600 hover:bg-gray-700 text-white font-medium py-3 px-8 rounded-lg transition-colors duration-200"
            >
              Cancel Matchmaking
            </Link>
          </div>

          <p className="text-gray-500 text-sm mt-6">
            This is a demo. In the full version, you'll be matched with real users based on your political spectrum and selected topics.
          </p>
        </div>
      </div>
    </div>
  );
}
