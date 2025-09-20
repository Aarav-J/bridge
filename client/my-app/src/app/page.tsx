"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { io, Socket } from "socket.io-client";
import UserProfile from "@/app/components/UserProfile";

export default function HomePage() {
  const [userData, setUserData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const storedUserData = localStorage.getItem('userData');
    if (storedUserData) {
      setUserData(JSON.parse(storedUserData));
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    // Initialize Socket.IO connection
    const newSocket = io("http://10.186.63.83:3000", { 
      transports: ["websocket"] 
    });

    newSocket.on("connect", () => {
      console.log("Connected to server");
      setIsConnected(true);
    });

    newSocket.on("disconnect", () => {
      console.log("Disconnected from server");
      setIsConnected(false);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  const handleStartVideoCall = () => {
    if (!socket || !isConnected) {
      alert("Not connected to server. Please wait and try again.");
      return;
    }

    setIsStarting(true);
    console.log("Starting video call with user data:", userData);

    // Send user info to server - this will be received by all connected clients
    socket.emit("message", {
      type: "userJoin",
      userName: userData.fullName,
      userAffiliation: userData.politicalLean
    });

    console.log("Sent user join message to server:", {
      type: "userJoin",
      userName: userData.fullName,
      userAffiliation: userData.politicalLean
    });

    // Navigate directly to debate page without URL parameters
    console.log("Navigating to: /debate");
    router.push("/debate");
  };

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <h1 className="text-2xl font-bold text-white">
              Bridge
            </h1>
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <div className={`w-2 h-2 rounded-full mr-2 ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="text-gray-300 text-sm">
                  {isConnected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
              <p className="text-gray-300 text-sm">
                Video Debate Platform
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center min-h-[calc(100vh-200px)]">
          {/* Left Side - User Profile or Signup */}
          <div className="flex justify-center lg:justify-end">
            {isLoading ? (
              <div className="bg-gray-800 rounded-lg p-8 shadow-xl max-w-md w-full text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
                <p className="text-white">Loading...</p>
              </div>
            ) : userData ? (
              <UserProfile />
            ) : (
              <div className="bg-gray-800 rounded-lg p-8 shadow-xl max-w-md w-full text-center">
                <div className="mb-6">
                  <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mx-auto flex items-center justify-center mb-4">
                    <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                    </svg>
                  </div>
                  <h2 className="text-xl font-semibold text-white mb-2">Join the Debate</h2>
                  <p className="text-gray-400 text-sm">
                    Create an account and take our political spectrum quiz to get started
                  </p>
                </div>

                <Link 
                  href="/signup"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-8 rounded-lg text-lg transition-colors duration-200 flex items-center justify-center"
                >
                  <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                  Sign Up & Take Quiz
                </Link>

                <p className="text-gray-500 text-xs mt-4">
                  Already have an account?{" "}
                  <Link href="/login" className="text-blue-400 hover:text-blue-300">
                    Sign in
                  </Link>
                </p>
              </div>
            )}
          </div>

          {/* Right Side - Direct Call or Quiz Prompt */}
          <div className="flex justify-center lg:justify-start">
            {isLoading ? (
              <div className="bg-gray-800 rounded-lg p-8 shadow-xl max-w-md w-full text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto mb-4"></div>
                <p className="text-white">Loading...</p>
              </div>
            ) : userData && userData.quizCompleted ? (
              <div className="bg-gray-800 rounded-lg p-8 shadow-xl max-w-md w-full text-center">
                <div className="mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-blue-600 rounded-full mx-auto flex items-center justify-center mb-4">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h2 className="text-xl font-semibold text-white mb-2">Ready to Debate?</h2>
                  <p className="text-gray-400 text-sm">
                    Start a video call and engage in respectful political dialogue
                  </p>
                </div>

                <button 
                  onClick={handleStartVideoCall}
                  className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-800 disabled:cursor-not-allowed text-white font-bold py-4 px-8 rounded-lg text-lg transition-colors duration-200 flex items-center justify-center"
                  disabled={!isConnected || isStarting}
                >
                  <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  {isStarting 
                    ? "Starting..." 
                    : isConnected 
                      ? "Start Video Call" 
                      : "Connecting..."
                  }
                </button>

                <p className="text-gray-500 text-xs mt-4">
                  Connect with someone for a structured political debate
                </p>
              </div>
            ) : userData && !userData.quizCompleted ? (
              <div className="bg-gray-800 rounded-lg p-8 shadow-xl max-w-md w-full text-center">
                <div className="mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-full mx-auto flex items-center justify-center mb-4">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h2 className="text-xl font-semibold text-white mb-2">Complete Your Profile</h2>
                  <p className="text-gray-400 text-sm">
                    Take our political spectrum quiz to start debating
                  </p>
                </div>

                <Link 
                  href="/quiz"
                  className="w-full bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-4 px-8 rounded-lg text-lg transition-colors duration-200 flex items-center justify-center"
                >
                  <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Take Political Quiz
                </Link>

                <p className="text-gray-500 text-xs mt-4">
                  This helps us match you with compatible debate partners
                </p>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}