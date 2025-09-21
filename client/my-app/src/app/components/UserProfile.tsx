import Link from "next/link";
import type { UserData } from "@/store/useStore";
import { getPoliticalLabel } from "@/utils/userProfile";

interface UserProfileProps {
  user: UserData;
}

export default function UserProfile({ user }: UserProfileProps) {
  const initials = (user.fullName || user.email || "User")
    .split(' ')
    .map((part) => part.charAt(0).toUpperCase())
    .join('')
    .slice(0, 2);

  const affiliationLabel = user.politicalLean
    ?? (typeof user.overall_affiliation === "number"
      ? getPoliticalLabel(user.overall_affiliation)
      : "Undeclared");

  return (
    <div className="bg-gray-800 rounded-lg p-8 shadow-xl max-w-md w-full">
      <div className="text-center space-y-6">
        <div>
          <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mx-auto flex items-center justify-center">
            <span className="text-white text-2xl font-bold">{initials}</span>
          </div>
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-white">{user.fullName || "Unnamed User"}</h2>
          <p className="text-gray-400 text-sm">{user.email || "No email on file"}</p>
          <div className="mt-2">
            <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
              {affiliationLabel}
            </span>
          </div>
          {user.quizCompleted ? (
            <p className="text-xs text-green-300">Quiz completed</p>
          ) : (
            <p className="text-xs text-yellow-300">Quiz not completed</p>
          )}
        </div>

        <Link
          href="/account"
          className="w-full bg-gray-700 hover:bg-gray-600 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          View Account Details
        </Link>
      </div>
    </div>
  );
}
