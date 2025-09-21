"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { io, Socket } from "socket.io-client";
import useStore from "@/store/useStore";
import type { PoliticalSpectrumScores } from "@/store/useStore";
import { fetchUserProfile, getPoliticalLabel } from "@/utils/userProfile";
import { supabase } from "@/utils/supabaseClient";
import UserProfile from "@/app/components/UserProfile";

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL?.trim() || "http://localhost:3000";
const API_BASE = SOCKET_URL.replace(/\/+$/, "");

type DebateUserSummary = {
  name: string;
  affiliation: string;
  username: string | null;
  politicalScore: number | null;
  spectrum: PoliticalSpectrumScores | null;
};

export default function HomePage() {
  const userData = useStore((state) => state.userData);
  const userId = useStore((state) => state.userId);
  const setUserData = useStore((state) => state.setUserData);
  const setUserId = useStore((state) => state.setUserId);
  const clearSession = useStore((state) => state.clearSession);
  const [isLoading, setIsLoading] = useState(!userData);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [activeUsers, setActiveUsers] = useState<any[]>([]);
  const [debateStatus, setDebateStatus] = useState({ participants: 0, active: false, waiting: 0 });
  const [matchStatus, setMatchStatus] = useState<string | null>(null);
  const router = useRouter();
  const userDataRef = useRef(userData);

  useEffect(() => {
    userDataRef.current = userData;
  }, [userData]);

  const buildUserSummary = (data: typeof userData): DebateUserSummary | null => {
    if (!data) {
      return null;
    }

    const politicalScore = typeof data.overall_affiliation === "number" ? data.overall_affiliation : null;
    const affiliationLabel = data.politicalLean ?? (politicalScore !== null ? getPoliticalLabel(politicalScore) : "Undeclared");
    const spectrum: PoliticalSpectrumScores | null = data.quizResults?.spectrum ?? null;

    return {
      name: data.fullName,
      affiliation: affiliationLabel,
      username: data.username ?? null,
      politicalScore,
      spectrum
    };
  };

  useEffect(() => {
    let active = true;

    const hydrateSession = async () => {
      if (userData && userId) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      const { data: sessionData } = await supabase.auth.getSession();
      if (!active) return;

      const authUserId = sessionData.session?.user?.id ?? null;
      if (!authUserId) {
        clearSession();
        setIsLoading(false);
        return;
      }

      setUserId(authUserId);

      if (!userData) {
        const profile = await fetchUserProfile(authUserId);
        if (!active) return;
        if (profile) {
          setUserData(profile);
        }
      }

      setIsLoading(false);
    };

    hydrateSession();

    return () => {
      active = false;
    };
  }, [clearSession, setUserData, setUserId, userData, userId]);

  useEffect(() => {
    // Initialize Socket.IO connection
    const newSocket = io(SOCKET_URL, { 
      transports: ["websocket"] 
    });

    newSocket.on("connect", () => {
      console.log("Connected to server");
      setIsConnected(true);
      setMatchStatus(null);
      // Request current user list
      fetchActiveUsers();
    });

    newSocket.on("disconnect", () => {
      console.log("Disconnected from server");
      setIsConnected(false);
      setIsStarting(false);
      setMatchStatus("disconnected");
    });

    // Listen for user updates
    newSocket.on("users-update", (data) => {
      console.log("Users update received:", data);
      setActiveUsers(data.connectedUsers);
      setDebateStatus({
        participants: data.debateParticipants,
        active: data.debateActive || false,
        waiting: data.waitingCount || 0
      });
    });

    newSocket.on("matchmaking-status", (payload) => {
      console.log("Matchmaking status:", payload);
      setMatchStatus(payload?.status || null);
      if (payload?.status === "waiting") {
        setIsStarting(true);
      }
      if (payload?.status === "cancelled" || payload?.status === "matched") {
        setIsStarting(false);
      }
    });

    newSocket.on("match-found", (payload) => {
      console.log("Match found:", payload);
      setIsStarting(false);
      setMatchStatus("matched");

      try {
        const selfSummary = buildUserSummary(userDataRef.current);
        const matchRecord: Record<string, unknown> = {
          roomId: payload.roomId,
          position: payload.position,
          opponent: payload.match || null,
          topic: payload.topic ?? null,
          question: payload.question ?? null
        };

        if (selfSummary) {
          matchRecord.self = selfSummary;
        }

        sessionStorage.setItem("activeMatch", JSON.stringify(matchRecord));
      } catch (err) {
        console.warn("Unable to store activeMatch", err);
      }

      router.push(`/debate?room=${payload.roomId}`);
    });

    newSocket.on("match-disconnected", () => {
      console.log("Match disconnected by opponent");
      setIsStarting(false);
      setMatchStatus("opponent-disconnected");
    });

    setSocket(newSocket);

    return () => {
      if (newSocket.connected) {
        newSocket.emit("cancel-matchmaking");
      }
      newSocket.close();
    };
  }, []);

  const fetchActiveUsers = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/active-users`);
      const data = await response.json();
      setActiveUsers(data.users);
      setDebateStatus({
        participants: data.debateParticipants,
        active: data.debateActive,
        waiting: data.waitingCount || 0
      });
    } catch (error) {
      console.error("Failed to fetch active users:", error);
    }
  };

  const handleStartVideoCall = () => {
    if (!socket || !isConnected) {
      alert("Not connected to server. Please wait and try again.");
      return;
    }

    if (!userData) {
      alert("Please sign in before starting a call.");
      return;
    }

    const userSummary = buildUserSummary(userData);
    if (!userSummary) {
      alert("Unable to determine your profile details. Please refresh and try again.");
      return;
    }

    setIsStarting(true);
    console.log("Starting video call with user data:", userSummary);

    try {
      localStorage.setItem('userData', JSON.stringify(userSummary));
    } catch (err) {
      console.warn('Failed to persist user summary to localStorage', err);
    }

    // Send user info to server - this will be received by all connected clients
    socket.emit("message", {
      type: "userJoin",
      userName: userSummary.name,
      userAffiliation: userSummary.affiliation,
      username: userSummary.username,
      politicalScore: userSummary.politicalScore,
      spectrum: userSummary.spectrum
    });

    console.log("Sent user join message to server:", {
      type: "userJoin",
      userName: userSummary.name,
      userAffiliation: userSummary.affiliation,
      username: userSummary.username,
      politicalScore: userSummary.politicalScore
    });

    // Navigate directly to debate page without URL parameters
    socket.emit("join-matchmaking", {
      name: userSummary.name,
      affiliation: userSummary.affiliation,
      username: userSummary.username,
      politicalScore: userSummary.politicalScore,
      spectrum: userSummary.spectrum
    });

    try {
      sessionStorage.removeItem('activeMatch');
    } catch (err) {
      console.warn('Unable to clear existing activeMatch', err);
    }

    setMatchStatus("searching");
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
              <UserProfile user={userData} />
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
                    ? matchStatus === "waiting" || matchStatus === "searching"
                      ? "Searching..."
                      : "Starting..."
                    : isConnected 
                      ? "Start Video Call" 
                      : "Connecting..."
                  }
                </button>

                <p className="text-gray-500 text-xs mt-4">
                  {isStarting
                    ? matchStatus === "waiting" || matchStatus === "searching"
                      ? "Looking for a debate partner..."
                      : matchStatus === "matched"
                        ? "Match found! Launching debate room..."
                        : matchStatus === "opponent-disconnected"
                          ? "Previous opponent disconnected. Please wait while we find someone else."
                          : "Preparing your debate session..."
                    : "Connect with someone for a structured political debate"}
                </p>
                {!isStarting && matchStatus === "opponent-disconnected" && (
                  <p className="text-yellow-400 text-xs mt-2">
                    Your previous opponent left. Hit the button again to find a new match.
                  </p>
                )}
                {!isStarting && matchStatus === "disconnected" && (
                  <p className="text-red-400 text-xs mt-2">
                    Connection lost. Please wait for reconnection before starting a new debate.
                  </p>
                )}
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

        {/* Active Users Section */}
        {/* <div className="mt-12 max-w-6xl mx-auto">
          <div className="bg-gray-800 rounded-lg p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-white flex items-center">
                <div className={`w-3 h-3 rounded-full mr-3 ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                Active Users
              </h3>
              <div className="text-sm text-gray-400 text-right">
                {debateStatus.active ? (
                  <span className="bg-green-900 text-green-300 px-2 py-1 rounded">
                    Debate in Progress ({debateStatus.participants}/2)
                  </span>
                ) : debateStatus.participants > 0 ? (
                  <span className="bg-yellow-900 text-yellow-300 px-2 py-1 rounded">
                    Waiting for Participants ({debateStatus.participants}/2)
                  </span>
                ) : (
                  <span className="bg-gray-700 text-gray-300 px-2 py-1 rounded">
                    No Active Debate
                  </span>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  Users waiting for a match: {debateStatus.waiting ?? 0}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeUsers.length > 0 ? (
                activeUsers.map((user, index) => (
                  <div key={index} className="bg-gray-700 rounded-lg p-4 flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-semibold text-sm">
                        {user.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1">
                      <div className="text-white font-medium">{user.name}</div>
                      <div className="text-gray-400 text-xs">{user.affiliation}</div>
                      <div className="text-gray-500 text-xs">
                        Connected {new Date(user.connectedAt).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-full text-center text-gray-400 py-8">
                  <svg className="w-12 h-12 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <p>No users currently online</p>
                  <p className="text-xs mt-1">Be the first to start a debate!</p>
                </div>
              )}
            </div>

            {isConnected && (
              <div className="mt-4 pt-4 border-t border-gray-700">
                <div className="flex items-center justify-between text-sm text-gray-400">
                  <span>Total Online: {activeUsers.length}</span>
                  <button 
                    onClick={fetchActiveUsers}
                    className="text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    Refresh
                  </button>
                </div>
              </div>
            )}
          </div>
        </div> */}
      </div>
    </div>
  );
}
