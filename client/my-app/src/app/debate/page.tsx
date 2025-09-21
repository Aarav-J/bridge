"use client";

import { io, Socket } from "socket.io-client";
import { useRef, useEffect, useState, useMemo } from "react";
import Video from "../components/Video";
import ControlPanel from "../components/ControlPanel";
import { useRouter, useSearchParams } from "next/navigation";
import { factCall } from "@/utils/factCall";
import type { PoliticalSpectrumScores } from "@/store/useStore";

const configuration: RTCConfiguration = {
  iceServers: [
    {
      urls: ["stun:stun1.l.google.com:19302", "stun:stun2.l.google.com:19302"]
    },
  ],
  iceCandidatePoolSize: 10,
};

interface SocketMessage {
  type: string;
  sdp?: string;
  candidate?: string | undefined;
  sdpMid?: string | null;
  sdpMLineIndex?: number | null;
  userName?: string;
  userAffiliation?: string;
}


interface UserInfo {
  name: string;
  affiliation: string;
  username?: string | null;
  politicalScore?: number | null;
  spectrum?: PoliticalSpectrumScores | null;
}

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL?.trim() || "http://localhost:3000";

const createDefaultUser = (): UserInfo => ({
  name: "Anonymous",
  affiliation: "Unknown",
  username: null,
  politicalScore: null,
  spectrum: null
});

const parseUserInfo = (data: any): UserInfo | null => {
  if (!data) {
    return null;
  }

  return {
    name: data.name ?? "Anonymous",
    affiliation: data.affiliation ?? "Unknown",
    username: data.username ?? null,
    politicalScore: typeof data.politicalScore === "number" ? data.politicalScore : null,
    spectrum: data.spectrum ?? null
  };
};

const ensureUserInfo = (data: any): UserInfo => parseUserInfo(data) ?? createDefaultUser();

const formatUserLabel = (user: UserInfo | null, fallback = ""): string => {
  if (!user) {
    return fallback;
  }

  const parts: string[] = [];

  if (user.username) {
    parts.push(`@${user.username}`);
  }

  if (typeof user.politicalScore === "number") {
    parts.push(`Score: ${user.politicalScore}`);
  }

  if (user.affiliation) {
    parts.push(user.affiliation);
  }

  return parts.length > 0 ? parts.join(" • ") : fallback;
};

const isSameUser = (a?: UserInfo | null, b?: UserInfo | null): boolean => {
  if (!a || !b) {
    return false;
  }

  if (a.username && b.username) {
    return a.username === b.username;
  }

  if (typeof a.politicalScore === "number" && typeof b.politicalScore === "number") {
    if (a.politicalScore !== b.politicalScore) {
      return false;
    }
  }

  return a.name === b.name && a.affiliation === b.affiliation;
};

const socket: Socket = io(SOCKET_URL, { transports: ["websocket"] });

export default function DebatePage() {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [isCallActive, setIsCallActive] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [remoteUser, setRemoteUser] = useState<UserInfo | null>(null);
  const [localUser, setLocalUser] = useState<UserInfo>(createDefaultUser());
  const [userPosition, setUserPosition] = useState<string | null>(null); // "user1" or "user2"
  const [debateTopic, setDebateTopic] = useState<string | null>(null);
  const [debateQuestion, setDebateQuestion] = useState<string | null>(null);
  const [factData, setFactData] = useState<{ facts: Array<{ fact: string; source?: string; reliability?: string; context?: string }>; topic: string | null; last_updated?: string } | null>(null);
  const [factStatus, setFactStatus] = useState<"idle" | "loading" | "error" | "success">("idle");
  
  // Debate timer states
  const [debateActive, setDebateActive] = useState(false);
  const [currentPhase, setCurrentPhase] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [currentSpeaker, setCurrentSpeaker] = useState<string | null>(null);
  const [phaseDescription, setPhaseDescription] = useState("");
  const [canSpeak, setCanSpeak] = useState(true);
  const [isAudioOn, setIsAudioOn] = useState(true);
  
  // Audio volume states
  const [localVolume, setLocalVolume] = useState(0);
  const [remoteVolume, setRemoteVolume] = useState(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const localAnalyserRef = useRef<AnalyserNode | null>(null);
  const remoteAnalyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const roomId = useMemo(() => searchParams.get("room")?.trim() || "default", [searchParams]);
  const roomIdRef = useRef(roomId);

  const persistFactsToSession = (facts: any[], lastUpdated?: string, topicOverride?: string | null) => {
    try {
      const stored = sessionStorage.getItem('activeMatch');
      if (!stored) return;
      const parsed = JSON.parse(stored);
      if (parsed?.roomId && parsed.roomId !== roomIdRef.current) return;
      parsed.facts = facts;
      if (lastUpdated) {
        parsed.last_updated = lastUpdated;
      }
      if (topicOverride) {
        parsed.topic = topicOverride;
      }
      sessionStorage.setItem('activeMatch', JSON.stringify(parsed));
    } catch (err) {
      console.warn('Unable to persist facts to sessionStorage', err);
    }
  };

  const startButtonRef = useRef<HTMLButtonElement>(null);
  const hangupButtonRef = useRef<HTMLButtonElement>(null);
  const videoButtonRef = useRef<HTMLButtonElement>(null);
  const timeButtonRef = useRef<HTMLButtonElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const userPositionRef = useRef<string | null>(null);
  const readySentRef = useRef(false);
  const factAbortRef = useRef<AbortController | null>(null);
  const fetchedQuestionRef = useRef<string | null>(null);
  const localUserRef = useRef<UserInfo>(localUser);

  useEffect(() => {
    localUserRef.current = localUser;
  }, [localUser]);

  useEffect(() => {
    roomIdRef.current = roomId;
    readySentRef.current = false;
    resetRemoteState();
  }, [roomId]);

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem('activeMatch');
      if (!stored) return;
      const parsed = JSON.parse(stored);
      if (parsed?.roomId && parsed.roomId !== roomId) {
        sessionStorage.removeItem('activeMatch');
        return;
      }
      if (parsed?.position && !userPositionRef.current) {
        userPositionRef.current = parsed.position;
        setUserPosition(parsed.position);
      }

      const storedSelf = parsed?.self ? ensureUserInfo(parsed.self) : null;
      const storedOpponent = parsed?.opponent ? ensureUserInfo(parsed.opponent) : null;

      if (storedSelf) {
        setLocalUser(storedSelf);
      }

      if (storedOpponent && !isSameUser(storedOpponent, storedSelf)) {
        setRemoteUser(storedOpponent);
      }
      if (parsed?.topic) {
        setDebateTopic(parsed.topic);
      }
      if (parsed?.question) {
        setDebateQuestion(parsed.question);
      }
      if (Array.isArray(parsed?.facts) && parsed.facts.length > 0) {
        setFactData({
          facts: parsed.facts,
          topic: parsed.topic ?? parsed.question ?? null,
          last_updated: parsed.last_updated
        });
        setFactStatus("success");
        fetchedQuestionRef.current = parsed.question ?? null;
      }
    } catch (err) {
      console.warn('Failed to parse activeMatch from sessionStorage', err);
    }
  }, [roomId, remoteUser]);

  useEffect(() => {
    if (!debateQuestion || !remoteUser) {
      if (factAbortRef.current) {
        factAbortRef.current.abort();
        factAbortRef.current = null;
      }
      if (factStatus !== "idle") {
        setFactStatus("idle");
        setFactData(null);
      }
      fetchedQuestionRef.current = null;
      return;
    }

    if (factStatus === "loading" && fetchedQuestionRef.current === debateQuestion) {
      return;
    }

    if (factStatus === "success" && fetchedQuestionRef.current === debateQuestion) {
      return;
    }

    const controller = new AbortController();
    factAbortRef.current = controller;
    setFactStatus("loading");

    (async () => {
      try {
        const result = await factCall({ question: debateQuestion });
        if (controller.signal.aborted) return;

        const factsArray = Array.isArray(result?.facts) ? result.facts : [];
        const data = {
          facts: factsArray,
          topic: result?.topic ?? debateTopic ?? debateQuestion,
          last_updated: result?.last_updated
        };
        setFactData(data);
        setFactStatus("success");
        fetchedQuestionRef.current = debateQuestion;
        persistFactsToSession(factsArray, result?.last_updated, data.topic ?? null);
      } catch (err) {
        if (controller.signal.aborted) return;
        console.error('Failed to fetch supporting facts', err);
        setFactData(null);
        setFactStatus("error");
        fetchedQuestionRef.current = null;
      } finally {
        if (!controller.signal.aborted && factAbortRef.current === controller) {
          factAbortRef.current = null;
        }
      }
    })();

    return () => {
      controller.abort();
      if (factAbortRef.current === controller) {
        factAbortRef.current = null;
      }
    };
  }, [debateQuestion, debateTopic, remoteUser]);
  useEffect(() => {
    let isMounted = true;

    const initialize = async () => {
      try {
        await startLocalStream();
      } catch (err) {
        console.error('Aborting initialization because local media failed', err);
        return;
      }

      if (!isMounted) {
        return;
      }

      let userInfo: UserInfo | null = null;

      try {
        const storedUserData = localStorage.getItem('userData');
        if (storedUserData) {
          userInfo = parseUserInfo(JSON.parse(storedUserData));
        }
      } catch (err) {
        console.warn('Failed to read user data from localStorage', err);
      }

      if (!userInfo) {
        try {
          const storedMatch = sessionStorage.getItem('activeMatch');
          if (storedMatch) {
            const parsed = JSON.parse(storedMatch);
            if (parsed?.self) {
              userInfo = parseUserInfo(parsed.self);
            }
          }
        } catch (err) {
          console.warn('Failed to read fallback user data from sessionStorage', err);
        }
      }

      if (userInfo) {
        console.log('Setting local user for debate:', userInfo);
        setLocalUser(userInfo);

        // Join the debate room
        console.log('Joining debate with user data:', userInfo, 'room:', roomIdRef.current);
        socket.emit("join-debate", {
          name: userInfo.name,
          affiliation: userInfo.affiliation,
          username: userInfo.username,
          politicalScore: userInfo.politicalScore,
          spectrum: userInfo.spectrum,
          roomId: roomIdRef.current
        });
      } else {
        console.log('No user data found for debate join');
      }
    };

    initialize();

    // Set up socket event listeners
    socket.on("joined-debate", (data) => {
      if (data?.roomId && data.roomId !== roomIdRef.current) {
        console.log('Ignoring joined-debate for room', data.roomId);
        return;
      }
      console.log("Successfully joined debate:", data);
      setUserPosition(data.position);
      userPositionRef.current = data.position;
      
      // Set remote user if there's another participant
      const participants = data.participants || {};
      const participantEntries = Object.entries(participants);
      const selfParticipant = participants?.[data.position];
      const normalizedSelf = selfParticipant ? ensureUserInfo(selfParticipant) : null;

      if (normalizedSelf) {
        setLocalUser(normalizedSelf);
      }

      for (const [pos, participant] of participantEntries) {
        if (pos === data.position) {
          continue;
        }
        const normalizedOpponent = ensureUserInfo(participant);
        if (!isSameUser(normalizedOpponent, normalizedSelf)) {
          setRemoteUser(normalizedOpponent);
          readySentRef.current = false;
        }
      }
      if (data.topic !== undefined) {
        setDebateTopic(data.topic ?? null);
      }
      if (data.question !== undefined) {
        setDebateQuestion(data.question ?? null);
      }
    });

    socket.on("user-joined", (data) => {
      if (data?.roomId && data.roomId !== roomIdRef.current) {
        return;
      }
      console.log("Another user joined:", data);
      const normalizedOpponent = ensureUserInfo(data.user);
      if (!isSameUser(normalizedOpponent, localUserRef.current)) {
        setRemoteUser(normalizedOpponent);
      }
      readySentRef.current = false;
    });

    socket.on("user-left", (data) => {
      if (data?.roomId && data.roomId !== roomIdRef.current) {
        return;
      }
      console.log("User left:", data);
      resetRemoteState();
    });

    socket.on("room-full", (payload) => {
      if (payload?.roomId && payload.roomId !== roomIdRef.current) {
        return;
      }
      console.log("Room is full", payload);
      alert("Debate room is full. Only 2 participants allowed at a time.");
      router.push('/');
    });

    socket.on("phase-start", (data) => {
      if (data?.roomId && data.roomId !== roomIdRef.current) {
        return;
      }
      console.log("Phase started:", data);
      setDebateActive(true);
      setCurrentPhase(data.phase);
      setCurrentSpeaker(data.speaker);
      setPhaseDescription(data.description);
      setTimeRemaining(data.duration);
    });

    socket.on("time-update", (data) => {
      if (data?.roomId && data.roomId !== roomIdRef.current) {
        return;
      }
      setTimeRemaining(data.timeRemaining);
    });

    socket.on("debate-finished", (payload) => {
      if (payload?.roomId && payload.roomId !== roomIdRef.current) {
        return;
      }
      console.log("Debate finished", payload);
      setDebateActive(false);
      setCurrentPhase(0);
      setTimeRemaining(0);
      setCurrentSpeaker(null);
      setPhaseDescription("");
      setCanSpeak(true);
      readySentRef.current = false;
    });

    socket.on("debate-aborted", (payload) => {
      if (payload?.roomId && payload.roomId !== roomIdRef.current) {
        return;
      }
      console.log("Debate aborted:", payload);
      setDebateActive(false);
      setCurrentPhase(0);
      setTimeRemaining(0);
      setCurrentSpeaker(null);
      setPhaseDescription("");
      setCanSpeak(true);
      readySentRef.current = false;
    });

    socket.on("force-hangup", (payload) => {
      if (payload?.roomId && payload.roomId !== roomIdRef.current) {
        return;
      }
      console.log("Force hangup received:", payload);
      cleanupCall({ notifyServer: false, redirect: true, reason: payload?.reason });
    });

    // Handle WebRTC signaling
    socket.on("webrtc-signal", (data) => {
      if (data?.roomId && data.roomId !== roomIdRef.current) {
        return;
      }
      console.log("Received WebRTC signal:", data.type);
      if (!localStreamRef.current) {
        console.log("Local stream not ready yet; ignoring signal", data.type);
        return;
      }
      
      switch (data.type) {
        case "offer":
          handleOffer(data);
          break;
        case "answer":
          handleAnswer(data);
          break;
        case "candidate":
          handleCandidate(data);
          break;
        case "ready":
          if (!pcRef.current && userPositionRef.current === "user1") {
            console.log("Received ready signal and acting as initiator");
            makeCall();
          }
          break;
        case "bye":
          resetRemoteState();
          break;
      }
    });

    // Cleanup function
    return () => {
      isMounted = false;
      socket.off("joined-debate");
      socket.off("user-joined");
      socket.off("user-left");
      socket.off("room-full");
      socket.off("phase-start");
      socket.off("time-update");
      socket.off("debate-finished");
      socket.off("debate-aborted");
      socket.off("force-hangup");
      socket.off("webrtc-signal");
      
      // Cleanup audio analysis
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
      closePeerConnection();
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
        localStreamRef.current = null;
      }
    };
  }, [roomId]);

  // Update canSpeak state when userPosition or currentSpeaker changes
  useEffect(() => {
    if (userPosition && currentSpeaker && debateActive) {
      const canUserSpeak = currentSpeaker === userPosition;
      console.log('Updating canSpeak:', canUserSpeak, 'because currentSpeaker:', currentSpeaker, 'userPosition:', userPosition);
      setCanSpeak(canUserSpeak);
    } else if (!debateActive) {
      // Outside of debate, everyone can speak
      setCanSpeak(true);
    }
  }, [userPosition, currentSpeaker, debateActive]);

  // Handle audio muting based on speaking turns
  useEffect(() => {
    if (!localStream) {
      return;
    }

    const audioTracks = localStream.getAudioTracks();
    if (audioTracks.length === 0) {
      return;
    }

    const shouldEnableAudio = debateActive ? (canSpeak && isVideoOn) : isVideoOn;

    if (debateActive) {
      console.log(`Setting audio tracks enabled to: ${shouldEnableAudio} (found ${audioTracks.length} tracks)`);
    } else {
      console.log(`Debate not active - syncing audio with video state (${shouldEnableAudio})`);
    }

    audioTracks.forEach(track => {
      track.enabled = shouldEnableAudio;
      console.log(`Audio track ${track.id} enabled: ${track.enabled}`);
    });

    setIsAudioOn(prev => (prev !== shouldEnableAudio ? shouldEnableAudio : prev));
  }, [canSpeak, localStream, debateActive, isVideoOn]);

  // Debug logging for UI state
  useEffect(() => {
    console.log('UI State changed:', {
      localUser: localUser.name,
      remoteUser: remoteUser?.name || 'None',
      userPosition,
      debateActive
    });
  }, [localUser, remoteUser, userPosition, debateActive]);

  // Audio volume analysis functions
  const analyzeAudio = (analyser: AnalyserNode, setVolume: (volume: number) => void) => {
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    
    const getVolume = () => {
      analyser.getByteFrequencyData(dataArray);
      
      let sum = 0;
      for (let i = 0; i < bufferLength; i++) {
        sum += dataArray[i];
      }
      
      const average = sum / bufferLength;
      const volume = Math.round((average / 255) * 100); // Convert to percentage
      setVolume(volume);
    };
    
    return getVolume;
  };

  const handleGetFacts = async () => { 
    const facts = await factCall({ question: debateQuestion || "General Politics" });
    console.log(facts); 
  }
  const startVolumeAnalysis = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }

    const analyzeLoop = () => {
      if (localAnalyserRef.current) {
        analyzeAudio(localAnalyserRef.current, setLocalVolume)();
      }
      if (remoteAnalyserRef.current) {
        analyzeAudio(remoteAnalyserRef.current, setRemoteVolume)();
      }
      animationFrameRef.current = requestAnimationFrame(analyzeLoop);
    };

    analyzeLoop();
  };

  const setupAudioAnalysis = (stream: MediaStream, isLocal: boolean) => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }

    const source = audioContextRef.current.createMediaStreamSource(stream);
    const analyser = audioContextRef.current.createAnalyser();
    analyser.fftSize = 256;
    analyser.smoothingTimeConstant = 0.8;
    source.connect(analyser);

    if (isLocal) {
      localAnalyserRef.current = analyser;
    } else {
      remoteAnalyserRef.current = analyser;
    }
  };

  // Set up audio analysis when streams are available
  useEffect(() => {
    if (localStream) {
      setupAudioAnalysis(localStream, true);
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current?.srcObject) {
      const remoteStream = remoteVideoRef.current.srcObject as MediaStream;
      if (remoteStream.getAudioTracks().length > 0) {
        setupAudioAnalysis(remoteStream, false);
      }
    }
  }, [remoteVideoRef.current?.srcObject]);

  // Start volume analysis when both analysers are ready
  useEffect(() => {
    if (localAnalyserRef.current || remoteAnalyserRef.current) {
      startVolumeAnalysis();
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [localAnalyserRef.current, remoteAnalyserRef.current]);

  // Send ready signal when both local stream and remote user are available
  useEffect(() => {
    if (localStreamRef.current && remoteUser && !readySentRef.current) {
      readySentRef.current = true;
      console.log("Both users detected, sending WebRTC ready signal for room", roomIdRef.current);
      setTimeout(() => {
        socket.emit("webrtc-signal", { type: "ready", roomId: roomIdRef.current });
      }, 500);
    }
  }, [remoteUser, roomId]);

  const startLocalStream = async (): Promise<MediaStream | undefined> => {
    if (localStreamRef.current) {
      console.log("Local stream already initialized");
      setLocalStream(localStreamRef.current);
      setIsCallActive(true);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = localStreamRef.current;
      }
      return localStreamRef.current;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });

      localStreamRef.current = stream;
      readySentRef.current = false;
      setLocalStream(stream);
      setIsCallActive(true);

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      if (startButtonRef.current) {
        startButtonRef.current.disabled = true;
      }
      if (hangupButtonRef.current) {
        hangupButtonRef.current.disabled = false;
      }
      if (videoButtonRef.current) {
        videoButtonRef.current.disabled = false;
      }
      if (timeButtonRef.current) {
        timeButtonRef.current.disabled = false;
      }

      // Ensure audio is enabled by default
      const audioTracks = stream.getAudioTracks();
      audioTracks.forEach(track => {
        track.enabled = true;
      });

      console.log("Local stream started successfully with audio enabled");
      setIsAudioOn(true);
      setIsVideoOn(true);
      return stream;
    } catch (error) {
      console.error("Error accessing media devices:", error);
      alert("Could not access camera/microphone. Please check permissions.");
      throw error;
    }
  };

  const toggleVideo = (): void => {
    const stream = localStreamRef.current;
    if (!stream) {
      return;
    }

    const [videoTrack] = stream.getVideoTracks();
    const [audioTrack] = stream.getAudioTracks();

    if (!videoTrack) {
      console.warn("No local video track available to toggle");
      return;
    }

    const nextVideoState = !videoTrack.enabled;
    const audioShouldBeOn = nextVideoState && (!debateActive || canSpeak);

    videoTrack.enabled = nextVideoState;

    if (audioTrack) {
      audioTrack.enabled = audioShouldBeOn;
    }

    setIsVideoOn(nextVideoState);
    setIsAudioOn(audioTrack ? audioTrack.enabled : audioShouldBeOn);

    console.log(`Video toggled to: ${nextVideoState}`);
    if (audioTrack) {
      console.log(`Audio synced to video state: ${audioTrack.enabled}`);
    }
  };

  const toggleAudio = (): void => {
    const stream = localStreamRef.current;
    if (stream) {
      const audioTracks = stream.getAudioTracks();
      const newAudioState = !isAudioOn;
      setIsAudioOn(newAudioState);
      audioTracks.forEach(track => {
        track.enabled = newAudioState;
        console.log(`Audio manually toggled to: ${track.enabled}`);
      });
    }
  };

  const addFiveMinutes = (): void => {
    // Placeholder for adding 5 minutes functionality
    console.log("Adding 5 minutes to call time");
    // You can implement actual timer logic here
  };

  const closePeerConnection = () => {
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }
  };

  const resetRemoteState = () => {
    setRemoteUser(null);
    setDebateActive(false);
    setCurrentPhase(0);
    setTimeRemaining(0);
    setCurrentSpeaker(null);
    setPhaseDescription("");
    setCanSpeak(true);
    setRemoteVolume(0);
    readySentRef.current = false;
    setUserPosition(null);
    userPositionRef.current = null;
    setDebateTopic(null);
    setDebateQuestion(null);
    setFactStatus("idle");
    setFactData(null);
    fetchedQuestionRef.current = null;
    closePeerConnection();
  };

  const cleanupCall = ({
    notifyServer,
    redirect,
    reason,
  }: {
    notifyServer: boolean;
    redirect: boolean;
    reason?: string;
  }) => {
    console.log("Cleaning up call", { notifyServer, redirect, reason });
    if (factAbortRef.current) {
      factAbortRef.current.abort();
      factAbortRef.current = null;
    }
    resetRemoteState();

    try {
      sessionStorage.removeItem('activeMatch');
    } catch (err) {
      console.warn('Unable to clear activeMatch from sessionStorage', err);
    }

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track: MediaStreamTrack) => track.stop());
      localStreamRef.current = null;
    }
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }

    setLocalStream(null);
    setLocalVolume(0);
    readySentRef.current = false;
    userPositionRef.current = null;
    setIsAudioOn(true);
    setIsVideoOn(true);
    setIsCallActive(false);

    if (startButtonRef.current) {
      startButtonRef.current.disabled = false;
    }
    if (hangupButtonRef.current) {
      hangupButtonRef.current.disabled = true;
    }
    if (videoButtonRef.current) {
      videoButtonRef.current.disabled = true;
    }
    if (timeButtonRef.current) {
      timeButtonRef.current.disabled = true;
    }

    if (notifyServer) {
      socket.emit("webrtc-signal", { type: "bye", roomId: roomIdRef.current });
      socket.emit("leave-debate", { roomId: roomIdRef.current });
    }

    if (redirect) {
      router.push('/');
    }
  };

  const makeCall = async (): Promise<void> => {
    try {
      if (pcRef.current) {
        console.log("Peer connection already exists, skipping new call");
        return;
      }

      const stream = localStreamRef.current;
      if (!stream) {
        console.warn("No local stream available, aborting makeCall");
        return;
      }

      console.log("Making call - creating peer connection");
      const newPc = new RTCPeerConnection(configuration);
      pcRef.current = newPc;
      
      newPc.onicecandidate = (e: RTCPeerConnectionIceEvent) => {
        const data = {
          type: "candidate",
          candidate: e.candidate?.candidate,
          sdpMid: e.candidate?.sdpMid || null,
          sdpMLineIndex: e.candidate?.sdpMLineIndex || null,
        };
        console.log("Sending ICE candidate");
        socket.emit("webrtc-signal", { ...data, roomId: roomIdRef.current });
      };
      
      newPc.ontrack = (e: RTCTrackEvent) => {
        console.log("Received remote track", e.streams[0]);
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = e.streams[0];
        }
      };
      
      console.log("Adding local tracks to peer connection");
      stream.getTracks().forEach((track: MediaStreamTrack) => {
        newPc.addTrack(track, stream);
      });

      console.log("Creating and sending offer");
      const offer = await newPc.createOffer();
      socket.emit("webrtc-signal", { type: "offer", sdp: offer.sdp, roomId: roomIdRef.current });
      await newPc.setLocalDescription(offer);
    } catch (e) {
      console.error("Error in makeCall:", e);
    }
  };

  const handleOffer = async (offer: SocketMessage): Promise<void> => {
    try {
      const stream = localStreamRef.current;
      if (!stream) {
        console.warn("Local stream not ready when handling offer; skipping");
        return;
      }

      if (pcRef.current) {
        console.warn("Existing peer connection found; closing before handling offer");
        pcRef.current.close();
      }

      console.log("Received offer, creating peer connection");
      const newPc = new RTCPeerConnection(configuration);
      pcRef.current = newPc;
      
      newPc.onicecandidate = (e: RTCPeerConnectionIceEvent) => {
        const data = {
          type: "candidate",
          candidate: e.candidate?.candidate,
          sdpMid: e.candidate?.sdpMid || null,
          sdpMLineIndex: e.candidate?.sdpMLineIndex || null,
        };
        console.log("Sending ICE candidate from answer side");
        socket.emit("webrtc-signal", { ...data, roomId: roomIdRef.current });
      };
      
      newPc.ontrack = (e: RTCTrackEvent) => {
        console.log("Received remote track on answer side", e.streams[0]);
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = e.streams[0];
        }
      };
      
      console.log("Adding local tracks on answer side");
      stream.getTracks().forEach((track: MediaStreamTrack) => {
        newPc.addTrack(track, stream);
      });
      
      console.log("Setting remote description and creating answer");
      await newPc.setRemoteDescription({ type: "offer", sdp: offer.sdp || "" });
      const answer = await newPc.createAnswer();
      socket.emit("webrtc-signal", { type: "answer", sdp: answer.sdp, roomId: roomIdRef.current });
      await newPc.setLocalDescription(answer);
    } catch (e) {
      console.error("Error in handleOffer:", e);
    }
  };

  const handleAnswer = async (answer: SocketMessage): Promise<void> => {
    const connection = pcRef.current;
    if (!connection) {
      console.error("no peerconnection");
      return;
    }
    try {
      await connection.setRemoteDescription({ type: "answer", sdp: answer.sdp || "" });
    } catch (e) {
      console.log(e);
    }
  };

  const handleCandidate = async (candidate: SocketMessage): Promise<void> => {
    try {
      const connection = pcRef.current;
      if (!connection) {
        console.error("no peerconnection");
        return;
      }
      if (!candidate.candidate) {
        await connection.addIceCandidate(null);
      } else {
        const iceCandidate = new RTCIceCandidate({
          candidate: candidate.candidate,
          sdpMid: candidate.sdpMid,
          sdpMLineIndex: candidate.sdpMLineIndex,
        });
        await connection.addIceCandidate(iceCandidate);
      }
    } catch (e) {
      console.log(e);
    }
  };

  const hangup = (): void => {
    cleanupCall({ notifyServer: true, redirect: true, reason: "local-hangup" });
  };

  return (
    <div className="relative h-screen bg-gray-900 overflow-hidden">
      <div className="flex h-full flex-col lg:flex-row">
        <div className="flex h-full w-full flex-col lg:w-2/3">
         
          <div className="flex-1 min-h-0 px-4 pb-4">
            <div className="grid h-full min-h-0 grid-rows-2 gap-4">
              <div className="relative h-full overflow-hidden rounded-xl border-2 border-solid border-green-500 bg-black shadow-lg">
                <Video
                  ref={localVideoRef}
                  name={localUser.name === "Anonymous" ? "You" : localUser.name}
                  label={formatUserLabel(
                    localUser,
                    localUser.affiliation === "Unknown" ? "Setting up..." : localUser.affiliation
                  )}
                  muted={true}
                />
                <div className="absolute bottom-4 right-4 min-w-24 rounded-lg bg-black/70 p-2 backdrop-blur-sm">
                  <div className="text-white text-xs mb-1">Your Volume</div>
                  <div className="flex items-center space-x-1">
                    <div className="relative h-8 w-2 overflow-hidden rounded-sm bg-gray-700">
                      <div
                        className={`absolute bottom-0 w-full transition-all duration-100 rounded-sm ${
                          localVolume > 70 ? 'bg-red-500' :
                          localVolume > 40 ? 'bg-yellow-500' : 'bg-green-500'
                        }`}
                        style={{ height: `${Math.min(localVolume, 100)}%` }}
                      />
                    </div>
                    <div className="text-white text-xs font-mono">{localVolume}dB</div>
                  </div>
                </div>
              </div>
              <div className="relative h-full overflow-hidden rounded-xl bg-black shadow-lg">
                <Video
                  ref={remoteVideoRef}
                  name={remoteUser?.name || "Waiting for participant..."}
                  label={formatUserLabel(
                    remoteUser,
                    remoteUser ? (remoteUser.affiliation || "") : "Awaiting opponent..."
                  )}
                />
                <div className="absolute bottom-4 right-4 min-w-24 rounded-lg bg-black/70 p-2 backdrop-blur-sm">
                  <div className="text-white text-xs mb-1">Opponent Volume</div>
                  <div className="flex items-center space-x-1">
                    <div className="relative h-8 w-2 overflow-hidden rounded-sm bg-gray-700">
                      <div
                        className={`absolute bottom-0 w-full transition-all duration-100 rounded-sm ${
                          remoteVolume > 70 ? 'bg-red-500' :
                          remoteVolume > 40 ? 'bg-yellow-500' : 'bg-green-500'
                        }`}
                        style={{ height: `${Math.min(remoteVolume, 100)}%` }}
                      />
                    </div>
                    <div className="text-white text-xs font-mono">{remoteVolume}dB</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="flex h-full w-full flex-col gap-4 overflow-y-auto bg-gray-900 p-4 lg:w-1/3">
         <div className="flex-none px-4 pt-4 pb-2">
            <div className="rounded-lg border border-blue-900/40 bg-gray-900 p-4 shadow-lg">
              <h2 className="text-center text-lg font-semibold uppercase tracking-wide text-blue-200">Debate Topic</h2>
              <p className="mt-2 text-center text-sm text-blue-100">
                {debateTopic ? debateTopic : 'Topic will be assigned once both participants join.'}
              </p>
              <div className="mt-3 flex min-h-[70px] items-center justify-center rounded-md bg-gray-800 p-3">
                <p className="text-center text-sm text-gray-200">
                  {debateQuestion ? debateQuestion : 'Waiting for matchup...'}
                </p>
              </div>
            </div>
          </div>
          <div className="rounded-lg border border-purple-900/40 bg-gray-900 p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-purple-200">Debate Status</h3>
              <span className={`text-xs px-2 py-1 rounded-full ${debateActive ? 'bg-green-900 text-green-200' : 'bg-gray-800 text-gray-300'}`}>
                {debateActive ? 'In Progress' : 'Waiting'}
              </span>
            </div>
            <div className="space-y-3 rounded-lg bg-gray-800 p-3">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-gray-300">Current Phase</span>
                <span className="text-blue-200">{debateActive ? `Phase ${currentPhase}` : 'Not started'}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-gray-300">Speaker</span>
                <span className={canSpeak ? 'text-green-300' : 'text-red-300'}>
                  {debateActive
                    ? currentSpeaker === userPosition
                      ? 'You'
                      : remoteUser?.name || 'Opponent'
                    : 'Waiting to start'}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-gray-300">Time Remaining</span>
                <span className="font-mono text-orange-200">
                  {debateActive
                    ? `${Math.floor(timeRemaining / 60)}:${(timeRemaining % 60).toString().padStart(2, '0')}`
                    : '--:--'}
                </span>
              </div>
              <div className="text-xs text-gray-400">
                {debateActive
                  ? phaseDescription || 'Follow prompts as they appear.'
                  : 'Debate will begin automatically once both participants are ready.'}
              </div>
            </div>
          </div>
          <div className="rounded-lg border border-emerald-900/40 bg-gray-900 p-4">
          
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-emerald-200">Supporting Facts</h3>
              {factData?.last_updated && (
                <span className="text-xs text-gray-400">Updated {factData.last_updated}</span>
              )}
            </div>
            {factStatus === "loading" && (
              <div className="flex items-center justify-center py-6 text-sm text-emerald-300">
                <div className="mr-3 h-4 w-4 animate-spin rounded-full border-b-2 border-emerald-400" />
                Gathering contextual facts...
              </div>
            )}
            {factStatus === "error" && (
              <div className="rounded-md bg-red-900/40 p-3 text-sm text-red-300">
                Unable to fetch supporting facts right now.
              </div>
            )}
            {factStatus === "success" && factData?.facts?.length === 0 && (
              <div className="rounded-md bg-gray-800 p-3 text-sm text-gray-300">
                No additional facts available for this topic.
              </div>
            )}
            {factStatus === "success" && factData?.facts?.length ? (
              <ul className="space-y-3">
                {factData.facts.map((item, index) => (
                  <li key={index} className="rounded-lg bg-gray-800 p-3">
                    <p className="text-sm text-gray-100 leading-snug mb-2">{item.fact}</p>
                    <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-400">
                      {item.source && <span className="text-blue-300">Source: {item.source}</span>}
                      {item.reliability && <span className="uppercase">Reliability: {item.reliability}</span>}
                      {item.context && <span className="text-gray-300">Context: {item.context}</span>}
                    </div>
                  </li>
                ))}
              </ul>
            ) : null}
            {factStatus === "idle" && !debateQuestion && (
              <div className="rounded-md bg-gray-800 p-3 text-sm text-gray-400">
                Supporting facts will appear here once the debate begins.
              </div>
            )}
          </div>
          
        </div>
      </div>
      <ControlPanel
        onHangup={hangup}
        onToggleVideo={toggleVideo}
        onAddTime={addFiveMinutes}
        isCallActive={isCallActive}
        isVideoOn={isVideoOn}
        hangupButtonRef={hangupButtonRef}
        videoButtonRef={videoButtonRef}
        timeButtonRef={timeButtonRef}
      />
    </div>
  );
}
