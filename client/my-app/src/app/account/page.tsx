"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

interface UserData {
  fullName: string;
  username: string;
  email: string;
  age: number;
  password: string;
  quizCompleted: boolean;
  quizResults?: {
    politicalLean: string;
    spectrum: {
      economic: number;
      social: number;
      foreignPolicy: number;
      governance: number;
      cultural: number;
    };
  };
  signupDate: string;
}

interface EditableUserData {
  fullName: string;
  username: string;
  email: string;
  age: string;
}

export default function AccountPage() {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState<EditableUserData>({
    fullName: "",
    username: "",
    email: "",
    age: ""
  });
  const [editErrors, setEditErrors] = useState<Partial<EditableUserData>>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const storedUserData = localStorage.getItem('userData');
    if (storedUserData) {
      const parsedData = JSON.parse(storedUserData);
      setUserData(parsedData);
      // Initialize edit form with current data
      setEditFormData({
        fullName: parsedData.fullName || "",
        username: parsedData.username || "",
        email: parsedData.email || "",
        age: parsedData.age?.toString() || ""
      });
    }
    setIsLoading(false);
  }, []);

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

  // Calculate overall political position
  const calculateOverallPosition = () => {
    if (!userData || !userData.quizResults?.spectrum) {
      return 0; // Default to moderate if no data
    }
    const scores = Object.values(userData.quizResults.spectrum);
    const averageScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    return averageScore;
  };

  const overallPosition = userData ? calculateOverallPosition() : 0;

  // Form validation
  const validateEditForm = (): boolean => {
    const newErrors: Partial<EditableUserData> = {};

    if (!editFormData.fullName.trim()) {
      newErrors.fullName = "Full name is required";
    }

    if (!editFormData.username.trim()) {
      newErrors.username = "Username is required";
    } else if (editFormData.username.length < 3) {
      newErrors.username = "Username must be at least 3 characters";
    }

    if (!editFormData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editFormData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!editFormData.age.trim()) {
      newErrors.age = "Age is required";
    } else {
      const age = parseInt(editFormData.age);
      if (isNaN(age) || age < 13 || age > 120) {
        newErrors.age = "Please enter a valid age (13-120)";
      }
    }

    setEditErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleEditInputChange = (field: keyof EditableUserData, value: string) => {
    setEditFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (editErrors[field]) {
      setEditErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSave = async () => {
    if (!validateEditForm() || !userData) {
      return;
    }

    setIsSaving(true);

    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Update user data
    const updatedUserData = {
      ...userData,
      fullName: editFormData.fullName,
      username: editFormData.username,
      email: editFormData.email,
      age: parseInt(editFormData.age)
    };

    // Save to localStorage
    localStorage.setItem('userData', JSON.stringify(updatedUserData));
    setUserData(updatedUserData);
    setIsEditing(false);
    setIsSaving(false);
  };

  const handleCancel = () => {
    // Reset form data to original values
    if (userData) {
      setEditFormData({
        fullName: userData.fullName || "",
        username: userData.username || "",
        email: userData.email || "",
        age: userData.age?.toString() || ""
      });
    }
    setEditErrors({});
    setIsEditing(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">No User Data Found</h1>
          <p className="text-gray-400 mb-6">Please sign up or log in to view your account.</p>
          <Link 
            href="/signup"
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200"
          >
            Sign Up
          </Link>
        </div>
      </div>
    );
  }

  // Get initials for profile picture
  const initials = userData.fullName
    .split(' ')
    .map(name => name.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);

  // Format join date
  const joinDate = new Date(userData.signupDate).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Get political spectrum data or use defaults
  const politicalSpectrum = userData.quizResults?.spectrum || {
    economic: 0,
    social: 0,
    foreignPolicy: 0,
    governance: 0,
    cultural: 0
  };

  const politicalLean = userData.quizResults?.politicalLean || 'Not determined';

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
                <span className="text-black text-2xl font-bold">JD</span>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">{userData.fullName}</h1>
                <p className="text-blue-100 text-lg">{userData.email}</p>
                <div className="mt-2">
                  <span className="inline-block bg-white bg-opacity-20 text-black text-sm px-3 py-1 rounded-full">
                    {userData.politicalLean}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Account Details */}
          <div className="p-8">
            {/* Basic Information */}
            <div className="max-w-2xl">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-white">Basic Information</h2>
                {!isEditing && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 flex items-center"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Edit Profile
                  </button>
                )}
              </div>

              {isEditing ? (
                /* Edit Form */
                <div className="space-y-6">
                  {/* Full Name */}
                  <div>
                    <label htmlFor="editFullName" className="block text-sm font-medium text-gray-300 mb-2">
                      Full Name
                    </label>
                    <input
                      type="text"
                      id="editFullName"
                      value={editFormData.fullName}
                      onChange={(e) => handleEditInputChange('fullName', e.target.value)}
                      className={`w-full px-4 py-3 bg-gray-700 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        editErrors.fullName ? 'border-red-500' : 'border-gray-600'
                      }`}
                      placeholder="Enter your full name"
                    />
                    {editErrors.fullName && (
                      <p className="mt-1 text-sm text-red-400">{editErrors.fullName}</p>
                    )}
                  </div>

                  {/* Username */}
                  <div>
                    <label htmlFor="editUsername" className="block text-sm font-medium text-gray-300 mb-2">
                      Username
                    </label>
                    <input
                      type="text"
                      id="editUsername"
                      value={editFormData.username}
                      onChange={(e) => handleEditInputChange('username', e.target.value)}
                      className={`w-full px-4 py-3 bg-gray-700 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        editErrors.username ? 'border-red-500' : 'border-gray-600'
                      }`}
                      placeholder="Choose a username"
                    />
                    {editErrors.username && (
                      <p className="mt-1 text-sm text-red-400">{editErrors.username}</p>
                    )}
                  </div>

                  {/* Email */}
                  <div>
                    <label htmlFor="editEmail" className="block text-sm font-medium text-gray-300 mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      id="editEmail"
                      value={editFormData.email}
                      onChange={(e) => handleEditInputChange('email', e.target.value)}
                      className={`w-full px-4 py-3 bg-gray-700 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        editErrors.email ? 'border-red-500' : 'border-gray-600'
                      }`}
                      placeholder="Enter your email"
                    />
                    {editErrors.email && (
                      <p className="mt-1 text-sm text-red-400">{editErrors.email}</p>
                    )}
                  </div>

                  {/* Age */}
                  <div>
                    <label htmlFor="editAge" className="block text-sm font-medium text-gray-300 mb-2">
                      Age
                    </label>
                    <input
                      type="number"
                      id="editAge"
                      value={editFormData.age}
                      onChange={(e) => handleEditInputChange('age', e.target.value)}
                      className={`w-full px-4 py-3 bg-gray-700 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        editErrors.age ? 'border-red-500' : 'border-gray-600'
                      }`}
                      placeholder="Enter your age"
                      min="13"
                      max="120"
                    />
                    {editErrors.age && (
                      <p className="mt-1 text-sm text-red-400">{editErrors.age}</p>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-4 pt-4">
                    <button
                      onClick={handleSave}
                      disabled={isSaving}
                      className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200 flex items-center"
                    >
                      {isSaving ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Saving...
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Save Changes
                        </>
                      )}
                    </button>
                    <button
                      onClick={handleCancel}
                      disabled={isSaving}
                      className="bg-gray-600 hover:bg-gray-700 disabled:bg-gray-500 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200 flex items-center"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                /* Display Mode */
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-3 border-b border-gray-700">
                    <span className="text-gray-300">Full Name</span>
                    <span className="text-white font-medium">{userData.fullName}</span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b border-gray-700">
                    <span className="text-gray-300">Username</span>
                    <span className="text-white font-medium">{userData.username}</span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b border-gray-700">
                    <span className="text-gray-300">Email</span>
                    <span className="text-white font-medium">{userData.email}</span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b border-gray-700">
                    <span className="text-gray-300">Age</span>
                    <span className="text-white font-medium">{userData.age} years old</span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b border-gray-700">
                    <span className="text-gray-300">Political Lean</span>
                    <span className="text-white font-medium">{politicalLean}</span>
                  </div>
                  <div className="flex justify-between items-center py-3">
                    <span className="text-gray-300">Member Since</span>
                    <span className="text-white font-medium">{joinDate}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Overall Political Spectrum Visualizer - Only show if quiz is completed */}
            {userData.quizCompleted && userData.quizResults?.spectrum && (
              <div className="mt-8">
                <h2 className="text-xl font-semibold text-white mb-6">Your Political Position</h2>
                <div className="bg-gray-700 rounded-lg p-6">
                  <div className="text-center mb-4">
                    <h3 className="text-lg font-medium text-white mb-2">Overall Political Spectrum</h3>
                    <p className="text-gray-400 text-sm">
                      Based on your quiz responses across all categories
                    </p>
                  </div>
                  
                  {/* Spectrum Bar */}
                  <div className="relative">
                    {/* Background gradient bar */}
                    <div className="w-full h-8 bg-gradient-to-r from-blue-500 via-gray-400 to-red-500 rounded-full relative overflow-hidden">
                      {/* Center line */}
                      <div className="absolute left-1/2 top-0 w-0.5 h-full bg-white transform -translate-x-1/2"></div>
                      
                      {/* User position indicator */}
                      <div 
                        className="absolute top-1/2 transform -translate-y-1/2 w-4 h-4 bg-white rounded-full border-2 border-gray-800 shadow-lg"
                        style={{ 
                          left: `${((overallPosition + 50) / 100) * 100}%`,
                          transform: 'translate(-50%, -50%)'
                        }}
                      >
                        <div className="w-full h-full bg-white rounded-full flex items-center justify-center">
                          <div className="w-2 h-2 bg-gray-800 rounded-full"></div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Labels */}
                    <div className="flex justify-between mt-3 text-sm">
                      <div className="text-center">
                        <div className="text-blue-400 font-medium">Liberal</div>
                        <div className="text-gray-500 text-xs">-50</div>
                      </div>
                      <div className="text-center">
                        <div className="text-gray-300 font-medium">Moderate</div>
                        <div className="text-gray-500 text-xs">0</div>
                      </div>
                      <div className="text-center">
                        <div className="text-red-400 font-medium">Conservative</div>
                        <div className="text-gray-500 text-xs">+50</div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Position Details */}
                  <div className="mt-6 text-center">
                    <div className="inline-block bg-gray-600 rounded-lg px-4 py-2">
                      <div className="text-white font-medium">
                        Your Position: {overallPosition > 0 ? '+' : ''}{overallPosition.toFixed(1)}
                      </div>
                      <div className={`text-sm font-medium ${
                        overallPosition < -10 ? 'text-blue-400' :
                        overallPosition < 10 ? 'text-gray-300' : 'text-red-400'
                      }`}>
                        {getPoliticalLabel(overallPosition)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Political Spectrum Breakdown - Only show if quiz is completed */}
            {userData.quizCompleted && userData.quizResults?.spectrum && (
              <div className="mt-8">
                <h2 className="text-xl font-semibold text-white mb-6">Political Spectrum Breakdown</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.entries(politicalSpectrum).map(([category, score]) => (
                    <div key={category} className="bg-gray-700 rounded-lg p-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-gray-200 capitalize">{category.replace(/([A-Z])/g, ' $1').trim()}</span>
                        <span className={`font-medium text-white`}>
                          {score > 0 ? '+' : ''}{score}
                        </span>
                      </div>
                      <div className="w-full bg-gray-600 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${score < 0 ? 'bg-blue-500' : 'bg-red-500'}`}
                          style={{ width: `${Math.abs(score)}%` }}
                        ></div>
                      </div>
                      <p className={`text-xs mt-1 text-gray-200`}>
                        {getPoliticalLabel(score)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quiz Prompt - Only show if quiz is not completed */}
            {!userData.quizCompleted && (
              <div className="mt-8">
                <div className="bg-yellow-900 border border-yellow-700 rounded-lg p-6">
                  <div className="flex items-center">
                    <svg className="w-8 h-8 text-yellow-400 mr-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    <div>
                      <h3 className="text-lg font-semibold text-yellow-300 mb-2">Complete Your Political Quiz</h3>
                      <p className="text-yellow-200 text-sm mb-4">
                        Take our political spectrum quiz to see your detailed breakdown and get matched with compatible debate partners.
                      </p>
                      <Link 
                        href="/quiz"
                        className="bg-yellow-600 hover:bg-yellow-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 inline-flex items-center"
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Take Quiz Now
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
