import Link from "next/link";

export default function UserProfile() {
  return (
    <div className="bg-gray-800 rounded-lg p-8 shadow-xl max-w-md w-full">
      <div className="text-center">
        {/* Profile Picture */}
        <div className="mb-6">
          <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mx-auto flex items-center justify-center">
            <span className="text-white text-2xl font-bold">JD</span>
          </div>
        </div>

        {/* User Info Preview */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-white mb-2">John Doe</h2>
          <p className="text-gray-400 text-sm">john.doe@email.com</p>
          <div className="mt-2">
            <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
              Moderate Liberal
            </span>
          </div>
        </div>

        {/* Account Details Button */}
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
