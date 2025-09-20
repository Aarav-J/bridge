import Link from "next/link";

export default function MatchmakingButton() {
  return (
    <div className="bg-gray-800 rounded-lg p-8 shadow-xl max-w-md w-full text-center">
      <div className="mb-6">
        <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-blue-600 rounded-full mx-auto flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-white mb-2">Ready to Debate?</h2>
        <p className="text-gray-400 text-sm">
          Connect with someone who has different political views and engage in respectful dialogue
        </p>
      </div>

      <Link 
        href="/matchmaking"
        className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-8 rounded-lg text-lg transition-colors duration-200 flex items-center justify-center"
      >
        <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
        Enter Call Matchmaking
      </Link>

      <p className="text-gray-500 text-xs mt-4">
        We'll match you with someone based on your political spectrum and selected topics
      </p>
    </div>
  );
}
