 import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-white mb-8">
          Bridge - Video Debate Platform
        </h1>
        <p className="text-xl text-gray-300 mb-8">
          Connect and debate with people across the political spectrum
        </p>
        <Link 
          href="/debate"
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-8 rounded-lg text-xl transition-colors duration-200"
        >
          Start Debate
        </Link>
      </div>
    </div>
  );
}