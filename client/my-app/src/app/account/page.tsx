import Link from "next/link";

export default function AccountPage() {
  // Hardcoded user data - will be replaced with backend data later
  const userData = {
    fullName: "John Doe",
    email: "john.doe@email.com",
    age: 28,
    politicalLean: "Moderate Liberal",
    joinDate: "January 15, 2024",
    debatesCompleted: 12,
    averageRating: 4.7,
    politicalSpectrum: {
      economic: -25,
      social: -40,
      foreignPolicy: -15,
      governance: -30,
      cultural: -35
    }
  };

  const getPoliticalColor = (score: number) => {
    if (score < -30) return "text-blue-400";
    if (score < -10) return "text-blue-300";
    if (score < 10) return "text-gray-300";
    if (score < 30) return "text-red-300";
    return "text-red-400";
  };

  const getPoliticalLabel = (score: number) => {
    if (score < -30) return "Very Liberal";
    if (score < -10) return "Liberal";
    if (score < 10) return "Moderate";
    if (score < 30) return "Conservative";
    return "Very Conservative";
  };

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
        <div className="bg-gray-800 rounded-lg shadow-xl overflow-hidden">
          {/* Profile Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-12">
            <div className="flex items-center">
              <div className="w-20 h-20 bg-white bg-opacity-20 rounded-full flex items-center justify-center mr-6">
                <span className="text-white text-2xl font-bold">JD</span>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">{userData.fullName}</h1>
                <p className="text-blue-100 text-lg">{userData.email}</p>
                <div className="mt-2">
                  <span className="inline-block bg-white bg-opacity-20 text-white text-sm px-3 py-1 rounded-full">
                    {userData.politicalLean}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Account Details */}
          <div className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Basic Information */}
              <div>
                <h2 className="text-xl font-semibold text-white mb-6">Basic Information</h2>
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-3 border-b border-gray-700">
                    <span className="text-gray-400">Full Name</span>
                    <span className="text-white font-medium">{userData.fullName}</span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b border-gray-700">
                    <span className="text-gray-400">Email</span>
                    <span className="text-white font-medium">{userData.email}</span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b border-gray-700">
                    <span className="text-gray-400">Age</span>
                    <span className="text-white font-medium">{userData.age} years old</span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b border-gray-700">
                    <span className="text-gray-400">Political Lean</span>
                    <span className="text-white font-medium">{userData.politicalLean}</span>
                  </div>
                  <div className="flex justify-between items-center py-3">
                    <span className="text-gray-400">Member Since</span>
                    <span className="text-white font-medium">{userData.joinDate}</span>
                  </div>
                </div>
              </div>

              {/* Activity Stats */}
              <div>
                <h2 className="text-xl font-semibold text-white mb-6">Activity</h2>
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-3 border-b border-gray-700">
                    <span className="text-gray-400">Debates Completed</span>
                    <span className="text-white font-medium">{userData.debatesCompleted}</span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b border-gray-700">
                    <span className="text-gray-400">Average Rating</span>
                    <div className="flex items-center">
                      <span className="text-white font-medium mr-2">{userData.averageRating}</span>
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <svg
                            key={i}
                            className={`w-4 h-4 ${i < Math.floor(userData.averageRating) ? 'text-yellow-400' : 'text-gray-600'}`}
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Political Spectrum Breakdown */}
            <div className="mt-8">
              <h2 className="text-xl font-semibold text-white mb-6">Political Spectrum Breakdown</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(userData.politicalSpectrum).map(([category, score]) => (
                  <div key={category} className="bg-gray-700 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-300 capitalize">{category.replace(/([A-Z])/g, ' $1').trim()}</span>
                      <span className={`font-medium ${getPoliticalColor(score)}`}>
                        {score > 0 ? '+' : ''}{score}
                      </span>
                    </div>
                    <div className="w-full bg-gray-600 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${score < 0 ? 'bg-blue-500' : 'bg-red-500'}`}
                        style={{ width: `${Math.abs(score)}%` }}
                      ></div>
                    </div>
                    <p className={`text-xs mt-1 ${getPoliticalColor(score)}`}>
                      {getPoliticalLabel(score)}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-8 flex flex-col sm:flex-row gap-4">
              <Link 
                href="/quiz"
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200 text-center"
              >
                Retake Political Quiz
              </Link>
              <button className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200">
                Edit Profile
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
