 import Link from "next/link";
import UserProfile from "@/app/components/UserProfile";
import MatchmakingButton from "@/app/components/MatchmakingButton";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <h1 className="text-2xl font-bold text-white">
              Bridge
            </h1>
            <p className="text-gray-300 text-sm">
              Video Debate Platform
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center min-h-[calc(100vh-200px)]">
          {/* Left Side - User Profile */}
          <div className="flex justify-center lg:justify-end">
            <UserProfile />
          </div>

          {/* Right Side - Matchmaking */}
          <div className="flex justify-center lg:justify-start">
            <MatchmakingButton />
          </div>
        </div>
      </div>
    </div>
  );
}