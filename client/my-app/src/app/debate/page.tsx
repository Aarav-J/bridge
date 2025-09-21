"use client";

import { io, Socket } from "socket.io-client";
import { useRef, useEffect, useState, useMemo } from "react";
import Video from "../components/Video";
import ControlPanel from "../components/ControlPanel";
import { useRouter, useSearchParams } from "next/navigation";
import { factCall } from "@/utils/factCall";

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
}

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL?.trim() || "http://localhost:3000";

const socket: Socket = io(SOCKET_URL, { transports: ["websocket"] });

export default function DebatePage() {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [isCallActive, setIsCallActive] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [remoteUser, setRemoteUser] = useState<UserInfo | null>(null);
  const [localUser, setLocalUser] = useState<UserInfo>({ name: "Anonymous", affiliation: "Unknown" });
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
      if (!remoteUser && parsed?.opponent) {
        setRemoteUser(parsed.opponent);
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

      // Get user data from localStorage (set from main page)
      const storedUserData = localStorage.getItem('userData');
      if (storedUserData) {
        const userData = JSON.parse(storedUserData);
        console.log('Setting local user from localStorage:', userData);
        setLocalUser(userData);

        // Join the debate room
        console.log('Joining debate with user data:', userData, 'room:', roomIdRef.current);
        socket.emit("join-debate", {
          name: userData.name,
          affiliation: userData.affiliation,
          roomId: roomIdRef.current
        });
      } else {
        console.log('No user data found in localStorage');
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
      Object.keys(participants).forEach(pos => {
        if (pos !== data.position) {
          const participant = participants[pos];
          const info = {
            name: participant.name,
            affiliation: participant.affiliation
          };
          setRemoteUser(info);
          readySentRef.current = false;
        }
      });
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
      setRemoteUser(data.user);
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
    if (localStream) {
      const audioTracks = localStream.getAudioTracks();
      
      if (debateActive) {
        // During debate: follow the canSpeak rules
        console.log(`Setting audio tracks enabled to: ${canSpeak} (found ${audioTracks.length} tracks)`);
        audioTracks.forEach(track => {
          track.enabled = canSpeak;
          console.log(`Audio track ${track.id} enabled: ${track.enabled}`);
        });
        console.log(`Audio ${canSpeak ? 'enabled' : 'muted'} for debate`);
      } else {
        // Before/after debate: audio should be enabled for everyone
        console.log(`Debate not active - enabling audio for all users`);
        audioTracks.forEach(track => {
          track.enabled = true;
        });
      }
    }
  }, [canSpeak, localStream, debateActive]);

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
    if (stream) {
      const videoTrack = stream.getVideoTracks()[0]; 
      const audioTrack = stream.getAudioTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioOn(audioTrack.enabled);
        setIsVideoOn(videoTrack.enabled);

        // Don't touch audio when toggling video - audio is controlled by debate muting logic
        console.log(`Video toggled to: ${videoTrack.enabled}`);
        console.log(`Audio toggled to: ${audioTrack.enabled} (controlled by debate logic)`);
      }
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
    <div className="h-screen bg-gray-900 relative flex overflow-hidden">
      {/* Video panel - 50% of horizontal space */}
      <div className="w-1/2 h-full flex flex-col">
        {/* Top video - Local user - 50% of vertical space */}
        <div className="h-1/2 relative overflow-hidden">
          <Video 
            ref={localVideoRef}
            name={localUser.name === "Anonymous" ? "You" : localUser.name}
            label={localUser.affiliation === "Unknown" ? "Setting up..." : localUser.affiliation}
            muted={true}
          />
          {/* Local volume indicator */}
          <div className="absolute bottom-4 right-4 bg-black bg-opacity-60 rounded-lg p-2 min-w-20">
            <div className="text-white text-xs mb-1">Volume</div>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-8 bg-gray-600 rounded-sm relative overflow-hidden">
                <div 
                  className={`absolute bottom-0 w-full transition-all duration-100 rounded-sm ${
                    localVolume > 70 ? 'bg-red-500' : 
                    localVolume > 40 ? 'bg-yellow-500' : 'bg-green-500'
                  }`}
                  style={{ height: `${Math.min(localVolume, 100)}%` }}
                />
              </div>
              <div className="text-white text-xs font-mono">
                {localVolume}dB
              </div>
            </div>
          </div>
        </div>
        
        {/* Bottom video - Remote user - 50% of vertical space */}
        <div className="h-1/2 relative overflow-hidden">
          <Video 
            ref={remoteVideoRef}
            name={remoteUser?.name || "Waiting for participant..."}
            label={remoteUser?.affiliation || ""}
          />
          {/* Remote volume indicator */}
          <div className="absolute bottom-4 right-4 bg-black bg-opacity-60 rounded-lg p-2 min-w-20">
            <div className="text-white text-xs mb-1">Volume</div>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-8 bg-gray-600 rounded-sm relative overflow-hidden">
                <div 
                  className={`absolute bottom-0 w-full transition-all duration-100 rounded-sm ${
                    remoteVolume > 70 ? 'bg-red-500' : 
                    remoteVolume > 40 ? 'bg-yellow-500' : 'bg-green-500'
                  }`}
                  style={{ height: `${Math.min(remoteVolume, 100)}%` }}
                />
              </div>
              <div className="text-white text-xs font-mono">
                {remoteVolume}dB
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Right panel - 50% of horizontal space for debate timer */}
      <div className="w-1/2 h-full bg-gray-800 flex flex-col">
        
        <div className="bg-gray-900 p-4 m-4 rounded-lg border border-blue-900/40">
          <div className="text-white space-y-3">
            <div>
              <h2 className="text-xl font-bold mb-2 text-center text-blue-200">Debate Topic</h2>
              <p className="text-center text-sm text-blue-100">
                {debateTopic ? debateTopic : 'Topic will be assigned once both participants join.'}
              </p>
            </div>
            <div className="bg-gray-800 p-3 rounded-lg min-h-[90px] flex items-center justify-center">
              <p className="text-sm text-gray-200 text-center">
                {debateQuestion ? debateQuestion : 'Waiting for matchup...'}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gray-900 p-4 mx-4 mb-4 rounded-lg border border-emerald-900/40">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-emerald-200">Supporting Facts</h3>
            {factData?.last_updated && (
              <span className="text-xs text-gray-400">Updated {factData.last_updated}</span>
            )}
          </div>
          {factStatus === "loading" && (
            <div className="flex items-center justify-center text-emerald-300 text-sm py-6">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-emerald-400 mr-3" />
              Gathering contextual facts...
            </div>
          )}
          {factStatus === "error" && (
            <div className="text-sm text-red-300 bg-red-900/40 rounded-md p-3">
              Unable to fetch supporting facts right now.
            </div>
          )}
          {factStatus === "success" && factData?.facts?.length === 0 && (
            <div className="text-sm text-gray-300 bg-gray-800 rounded-md p-3">
              No additional facts available for this topic.
            </div>
          )}
          {factStatus === "success" && factData?.facts?.length ? (
            <ul className="space-y-3">
              {factData.facts.map((item, index) => (
                <li key={index} className="bg-gray-800 rounded-lg p-3">
                  <p className="text-sm text-gray-100 leading-snug mb-2">{item.fact}</p>
                  <div className="flex flex-wrap text-xs text-gray-400 gap-x-3 gap-y-1">
                    {item.source && <span className="text-blue-300">Source: {item.source}</span>}
                    {item.reliability && <span className="uppercase">Reliability: {item.reliability}</span>}
                    {item.context && <span className="text-gray-300">Context: {item.context}</span>}
                  </div>
                </li>
              ))}
            </ul>
          ) : null}
          {factStatus === "idle" && !debateQuestion && (
            <div className="text-sm text-gray-400 bg-gray-800 rounded-md p-3">
              Supporting facts will appear here once the debate begins.
            </div>
          )}
        </div>

        {/* Compact Timer Section */}
        {debateActive && (
          <div className="bg-gray-900 p-3 m-4 rounded-lg">
            <div className="text-center text-white">
              <div className="flex justify-between items-center mb-2">
                <div className="text-sm text-blue-300">
                  Phase {currentPhase + 1}/6
                </div>
                <div className="text-lg font-mono text-green-400">
                  {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}
                </div>
              </div>
              
              <div className="text-xs text-gray-300 mb-2">
                {phaseDescription}
              </div>
              
              <div className={`text-sm font-semibold mb-1 ${canSpeak ? 'text-green-400' : 'text-red-400'}`}>
                {canSpeak ? '🎤 YOUR TURN' : '🔇 LISTENING'}
              </div>
              
              <div className={`text-xs p-2 rounded ${canSpeak ? 'bg-green-800 text-green-200' : 'bg-red-800 text-red-200'}`}>
                {currentSpeaker === userPosition ? 'You are speaking' : `${remoteUser?.name || 'Opponent'} is speaking`}
              </div>
            </div>
          </div>
        )}
        
        {/* User Information Section */}
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="text-center">
            {localUser.name === "Anonymous" ? (
              <div className="text-white">
                <div className="text-xl mb-4">Setting up your session...</div>
                <div className="text-gray-400 mb-6">
                  Make sure you joined from the main page or wait for connection.
                </div>
                <button
                  onClick={() => router.push('/')}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition-colors duration-200"
                >
                  Go to Main Page
                </button>
              </div>
            ) : !remoteUser ? (
              <div className="text-white">
                <div className="text-xl mb-4">Welcome, {localUser.name}!</div>
                <div className="text-gray-400 mb-4">
                  Waiting for another participant to join the debate...
                </div>
                <div className="text-sm text-blue-300 mb-4">
                  The debate will start automatically when both participants are ready.
                </div>
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                </div>
              </div>
            ) : !debateActive ? (
              <div className="text-white">
                <div className="text-xl mb-4">Ready to Debate!</div>
                <div className="text-gray-400 mb-4">
                  You are connected with {remoteUser.name}
                </div>
                <div className="text-sm text-green-300 mb-4">
                  The debate will begin shortly...
                </div>
                <button
                  onClick={() => socket.emit('start-debate')}
                  className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-6 rounded-lg transition-colors duration-200"
                >
                  Start Debate
                </button>
              </div>
            ) : (
              <div className="text-white">
                <div className="text-xl mb-4">Debate in Progress</div>
                <div className="text-gray-400 mb-4">
                  Debating with {remoteUser.name}
                </div>
                <div className="text-sm text-blue-300">
                  Your position: {userPosition === 'user1' ? 'Opening' : 'Responding'}
                </div>
                <button onClick={handleGetFacts}>Get facts</button>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Control panel overlay */}
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
